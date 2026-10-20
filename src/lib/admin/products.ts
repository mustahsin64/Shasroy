import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, ne, sql } from "drizzle-orm";
import sharp from "sharp";
import { z } from "zod";
import { db, schema } from "@/db";
import { isUniqueViolation } from "@/lib/db-errors";
import { bnDigitsToLatin, takaToPaisa } from "@/lib/money";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { slugSchema } from "@/lib/validation";

const { categories, products, productVariants, productImages, inventoryMovements, orderItems } = schema;

// ---------- validation (form input, prices typed in taka) ----------

export const productFieldsSchema = z.object({
  nameBn: z.string().trim().min(1, "নাম লিখুন।").max(160),
  slug: slugSchema.or(z.string().transform((_, ctx) => {
    ctx.addIssue({ code: "custom", message: "শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন (যেমন leaf-mug)।" });
    return z.NEVER;
  })),
  descriptionBn: z.string().trim().max(5000).transform(v => v || null),
  categoryId: z.uuid("বিভাগ বেছে নিন।"),
  status: z.enum(schema.productStatus.enumValues),
  isFeatured: z.boolean(),
});
export type ProductFields = z.infer<typeof productFieldsSchema>;

export const variantFieldsSchema = z
  .object({
    nameBn: z.string().trim().min(1, "ধরনের নাম লিখুন (যেমন সাধারণ, লাল)।").max(120),
    sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,64}$/, "কোডে শুধু ইংরেজি অক্ষর, সংখ্যা ও হাইফেন।"),
    price: z.preprocess(bnDigitsToLatin, takaToPaisa.refine(v => v > 0, "দাম শূন্যের বেশি হতে হবে।")),
    compareAtPrice: z.preprocess(bnDigitsToLatin, z.union([z.literal("").transform(() => null), takaToPaisa])),
    isActive: z.boolean(),
    isDefault: z.boolean(),
  })
  .refine(v => v.compareAtPrice === null || v.compareAtPrice > v.price, { message: "আগের দাম বর্তমান দামের চেয়ে বেশি হতে হবে।", path: ["compareAtPrice"] });
export type VariantFields = z.infer<typeof variantFieldsSchema>;

export const stockSchema = z.object({
  stock: z.preprocess(bnDigitsToLatin, z.coerce.number().int("পূর্ণ সংখ্যা দিন।").min(0, "স্টক শূন্যের কম হতে পারে না।").max(100000)),
  note: z.string().trim().max(300).transform(v => v || null),
});

// ---------- queries ----------

export async function listCategoriesForAdmin() {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      nameBn: categories.nameBn,
      descriptionBn: categories.descriptionBn,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
      productCount: sql<number>`(select count(*) from ${products} where ${products.categoryId} = ${categories.id})`.mapWith(Number),
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.nameBn));
}

export async function listProductsForAdmin(filter: { status?: (typeof schema.productStatus.enumValues)[number]; query?: string }) {
  const conditions = [];
  if (filter.status) conditions.push(eq(products.status, filter.status));
  if (filter.query) conditions.push(sql`(${products.nameBn} ilike ${`%${filter.query}%`} or ${products.slug} ilike ${`%${filter.query}%`})`);
  return db
    .select({
      id: products.id,
      slug: products.slug,
      nameBn: products.nameBn,
      status: products.status,
      categoryNameBn: categories.nameBn,
      updatedAt: products.updatedAt,
      variantCount: sql<number>`(select count(*) from ${productVariants} v where v.product_id = ${products.id})`.mapWith(Number),
      stock: sql<number>`(select coalesce(sum(v.stock_quantity), 0) from ${productVariants} v where v.product_id = ${products.id} and v.is_active)`.mapWith(Number),
      minPrice: sql<number | null>`(select min(v.price_paisa) from ${productVariants} v where v.product_id = ${products.id} and v.is_active)`.mapWith(v => (v === null ? null : Number(v))),
      imagePath: sql<string | null>`(select i.storage_path from ${productImages} i where i.product_id = ${products.id} order by i.sort_order, i.created_at limit 1)`,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(products.updatedAt))
    .limit(200);
}

export async function getProductForAdmin(id: string) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      variants: { orderBy: [asc(productVariants.sortOrder), asc(productVariants.createdAt)] },
      images: { orderBy: [asc(productImages.sortOrder), asc(productImages.createdAt)] },
    },
  });
}

export async function lowStockVariants(threshold = 5) {
  return db
    .select({ productId: products.id, productNameBn: products.nameBn, variantNameBn: productVariants.nameBn, sku: productVariants.sku, stock: productVariants.stockQuantity })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(and(eq(products.status, "active"), eq(productVariants.isActive, true), sql`${productVariants.stockQuantity} <= ${threshold}`))
    .orderBy(asc(productVariants.stockQuantity))
    .limit(20);
}

// ---------- mutations ----------

type Result<T = object> = ({ ok: true } & T) | { ok: false; field?: string; error: string };


export async function createProduct(fields: ProductFields, variant: VariantFields & { stock: number }, adminId: string): Promise<Result<{ id: string }>> {
  try {
    return await db.transaction(async tx => {
      const [product] = await tx.insert(products).values(fields).returning({ id: products.id });
      const [created] = await tx
        .insert(productVariants)
        .values({ productId: product.id, nameBn: variant.nameBn, sku: variant.sku, pricePaisa: variant.price, compareAtPricePaisa: variant.compareAtPrice, stockQuantity: variant.stock, isActive: true, isDefault: true })
        .returning({ id: productVariants.id });
      if (variant.stock > 0) {
        await tx.insert(inventoryMovements).values({ variantId: created.id, change: variant.stock, reason: "initial", createdBy: adminId });
      }
      return { ok: true, id: product.id } as const;
    });
  } catch (error) {
    if (isUniqueViolation(error, "products_slug_unique")) return { ok: false, field: "slug", error: "এই স্লাগ আগে থেকেই আছে।" };
    if (isUniqueViolation(error, "product_variants_sku_unique")) return { ok: false, field: "sku", error: "এই কোড আগে থেকেই আছে।" };
    throw error;
  }
}

export async function updateProduct(id: string, fields: ProductFields): Promise<Result> {
  try {
    if (fields.status === "active") {
      const [{ n }] = await db.select({ n: count() }).from(productVariants).where(and(eq(productVariants.productId, id), eq(productVariants.isActive, true)));
      if (n === 0) return { ok: false, field: "status", error: "চালু করতে অন্তত একটি সক্রিয় ধরন লাগবে।" };
    }
    await db.update(products).set(fields).where(eq(products.id, id));
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error, "products_slug_unique")) return { ok: false, field: "slug", error: "এই স্লাগ আগে থেকেই আছে।" };
    throw error;
  }
}

export async function saveVariant(productId: string, variantId: string | null, fields: VariantFields, adminId: string, initialStock = 0): Promise<Result> {
  try {
    await db.transaction(async tx => {
      if (fields.isDefault) {
        await tx.update(productVariants).set({ isDefault: false }).where(and(eq(productVariants.productId, productId), variantId ? ne(productVariants.id, variantId) : undefined));
      }
      const values = { nameBn: fields.nameBn, sku: fields.sku, pricePaisa: fields.price, compareAtPricePaisa: fields.compareAtPrice, isActive: fields.isActive, isDefault: fields.isDefault };
      if (variantId) {
        await tx.update(productVariants).set(values).where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)));
      } else {
        const [{ n }] = await tx.select({ n: count() }).from(productVariants).where(eq(productVariants.productId, productId));
        const [created] = await tx
          .insert(productVariants)
          .values({ ...values, productId, stockQuantity: initialStock, sortOrder: n, isDefault: fields.isDefault || n === 0 })
          .returning({ id: productVariants.id });
        if (initialStock > 0) await tx.insert(inventoryMovements).values({ variantId: created.id, change: initialStock, reason: "initial", createdBy: adminId });
      }
      // Keep exactly one default variant.
      const [{ defaults }] = await tx.select({ defaults: count() }).from(productVariants).where(and(eq(productVariants.productId, productId), eq(productVariants.isDefault, true)));
      if (defaults === 0) {
        await tx.execute(sql`update product_variants set is_default = true where id = (select id from product_variants where product_id = ${productId} order by sort_order, created_at limit 1)`);
      }
    });
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error, "product_variants_sku_unique")) return { ok: false, field: "sku", error: "এই কোড আগে থেকেই আছে।" };
    throw error;
  }
}

/** Sets stock to an absolute number and records the difference as an adjustment. */
export async function setVariantStock(variantId: string, stock: number, note: string | null, adminId: string): Promise<Result> {
  return db.transaction(async tx => {
    const [variant] = await tx.select({ stock: productVariants.stockQuantity }).from(productVariants).where(eq(productVariants.id, variantId)).for("update");
    if (!variant) return { ok: false, error: "ধরন পাওয়া যায়নি।" } as const;
    const change = stock - variant.stock;
    if (change === 0) return { ok: true } as const;
    await tx.update(productVariants).set({ stockQuantity: stock }).where(eq(productVariants.id, variantId));
    await tx.insert(inventoryMovements).values({ variantId, change, reason: change > 0 ? "restock" : "adjustment", note, createdBy: adminId });
    return { ok: true } as const;
  });
}

/** Variants that were ever ordered cannot be deleted (history), only deactivated. */
export async function deleteVariant(productId: string, variantId: string): Promise<Result> {
  const [{ n }] = await db.select({ n: count() }).from(orderItems).where(eq(orderItems.variantId, variantId));
  if (n > 0) return { ok: false, error: "এই ধরনে অর্ডার আছে; মুছে না দিয়ে বন্ধ করুন।" };
  const [{ total }] = await db.select({ total: count() }).from(productVariants).where(eq(productVariants.productId, productId));
  if (total <= 1) return { ok: false, error: "পণ্যে অন্তত একটি ধরন থাকতে হবে।" };
  await db.transaction(async tx => {
    await tx.delete(productVariants).where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)));
    await tx.execute(sql`update product_variants set is_default = true where id = (select id from product_variants where product_id = ${productId} order by is_default desc, sort_order limit 1)`);
  });
  return { ok: true };
}

// ---------- images ----------

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"];

/** Resizes to at most 1200px, converts to WebP and stores it; returns a storage error message on failure. */
export async function addProductImage(productId: string, file: File, altBn: string): Promise<Result> {
  if (!ACCEPTED_TYPES.includes(file.type)) return { ok: false, error: "শুধু JPG, PNG, WebP বা AVIF ছবি দিন।" };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "ছবি ৪ MB-এর বেশি হতে পারবে না। ছোট করে আবার দিন।" };

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return { ok: false, error: "ছবিটি পড়া যায়নি। অন্য ছবি দিন।" };
  }

  const path = `products/${productId}/${randomUUID()}.webp`;
  const { error } = await createSupabaseAdminClient()
    .storage.from(PRODUCT_IMAGE_BUCKET)
    .upload(path, webp, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("image upload failed", error.message);
    return { ok: false, error: "ছবি আপলোড করা যায়নি।" };
  }
  const [{ n }] = await db.select({ n: count() }).from(productImages).where(eq(productImages.productId, productId));
  await db.insert(productImages).values({ productId, storagePath: path, altBn, sortOrder: n });
  return { ok: true };
}

export async function deleteProductImage(productId: string, imageId: string): Promise<Result> {
  const [image] = await db
    .delete(productImages)
    .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)))
    .returning({ storagePath: productImages.storagePath });
  if (!image) return { ok: false, error: "ছবি পাওয়া যায়নি।" };
  // Shared sample images are reused by the seed; only remove uploaded ones.
  if (image.storagePath.startsWith("products/")) {
    await createSupabaseAdminClient().storage.from(PRODUCT_IMAGE_BUCKET).remove([image.storagePath]);
  }
  return { ok: true };
}

export async function makePrimaryImage(productId: string, imageId: string) {
  await db.transaction(async tx => {
    await tx.update(productImages).set({ sortOrder: sql`${productImages.sortOrder} + 1` }).where(eq(productImages.productId, productId));
    await tx.update(productImages).set({ sortOrder: 0 }).where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)));
  });
}
