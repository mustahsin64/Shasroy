import "server-only";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";

const { categories, products, productVariants, productImages } = schema;

export const productSorts = ["newest", "price-asc", "price-desc"] as const;
export type ProductSort = (typeof productSorts)[number];

export function parseSort(value: unknown): ProductSort {
  return productSorts.includes(value as ProductSort) ? (value as ProductSort) : "newest";
}

export async function listCategories() {
  return db
    .select({ id: categories.id, slug: categories.slug, nameBn: categories.nameBn })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.nameBn));
}

export type ProductSummary = Awaited<ReturnType<typeof listProducts>>[number];

/** Active products that have at least one active variant. */
export async function listProducts(filters: { query?: string; categorySlug?: string; sort?: ProductSort } = {}) {
  const minPrice = sql<number>`min(${productVariants.pricePaisa})`.mapWith(Number);
  const maxPrice = sql<number>`max(${productVariants.pricePaisa})`.mapWith(Number);
  const stock = sql<number>`sum(${productVariants.stockQuantity})`.mapWith(Number);
  const imagePath = sql<string | null>`(
    select ${productImages.storagePath} from ${productImages}
    where ${productImages.productId} = ${products.id}
    order by ${productImages.sortOrder}, ${productImages.createdAt}
    limit 1
  )`;

  const conditions: SQL[] = [eq(products.status, "active"), eq(productVariants.isActive, true), eq(categories.isActive, true)];
  if (filters.categorySlug) conditions.push(eq(categories.slug, filters.categorySlug));
  const query = filters.query?.trim().slice(0, 100);
  if (query) {
    const pattern = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conditions.push(or(ilike(products.nameBn, pattern), ilike(products.descriptionBn, pattern), ilike(categories.nameBn, pattern))!);
  }

  const order = {
    newest: [desc(products.createdAt), asc(products.nameBn)],
    "price-asc": [asc(minPrice), asc(products.nameBn)],
    "price-desc": [desc(minPrice), asc(products.nameBn)],
  }[filters.sort ?? "newest"];

  return db
    .select({
      id: products.id,
      slug: products.slug,
      nameBn: products.nameBn,
      categorySlug: categories.slug,
      categoryNameBn: categories.nameBn,
      minPricePaisa: minPrice,
      maxPricePaisa: maxPrice,
      stockQuantity: stock,
      imagePath,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .innerJoin(productVariants, eq(productVariants.productId, products.id))
    .where(and(...conditions))
    .groupBy(products.id, categories.id)
    .orderBy(...order)
    .limit(60);
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getProductBySlug(slug: string) {
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.status, "active")),
    columns: { id: true, slug: true, nameBn: true, descriptionBn: true },
    with: {
      category: { columns: { slug: true, nameBn: true, isActive: true } },
      variants: {
        where: eq(productVariants.isActive, true),
        orderBy: [asc(productVariants.sortOrder)],
        columns: {
          id: true,
          sku: true,
          nameBn: true,
          options: true,
          pricePaisa: true,
          compareAtPricePaisa: true,
          stockQuantity: true,
          isDefault: true,
        },
      },
      images: {
        orderBy: [asc(productImages.sortOrder), asc(productImages.createdAt)],
        columns: { id: true, storagePath: true, altBn: true, variantId: true },
      },
    },
  });
  if (!product || !product.category.isActive || product.variants.length === 0) return null;
  return product;
}
