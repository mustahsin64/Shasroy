/**
 * Repeatable seed: safe to run any number of times. Rows are matched by slug
 * or SKU and updated in place. Stock is only set when a variant is first
 * created, so re-running never overwrites real inventory.
 *
 * Sample products are created as "draft" with placeholder prices; they are
 * not visible as real stock and must be replaced by the actual catalogue.
 *
 * Usage: npm run db:seed
 * Optional: ADMIN_SEED_EMAIL=you@example.com npm run db:seed (adds an owner record)
 */
import { loadEnvConfig } from "@next/env";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import * as schema from "../src/db/schema";
import {
  adminEmailSchema,
  categoryInputSchema,
  deliveryZoneInputSchema,
  productInputSchema,
} from "../src/lib/validation";

loadEnvConfig(process.cwd());

const taka = (amount: number) => amount * 100;

const categories = z.array(categoryInputSchema).parse([
  { slug: "stationery", nameBn: "খাতা-কলম ও স্টেশনারি", sortOrder: 10 },
  { slug: "kids", nameBn: "ছোটদের উপহার", sortOrder: 20 },
  { slug: "women", nameBn: "নারীদের উপহার", sortOrder: 30 },
  { slug: "home", nameBn: "ঘরের প্রয়োজন", sortOrder: 40 },
  { slug: "decor", nameBn: "শোপিস ও ঘর সাজানো", sortOrder: 50 },
  { slug: "gifts", nameBn: "জন্মদিনের উপহার", sortOrder: 60 },
]);

// Placeholder fees; confirm with the shop owner before launch.
const deliveryZones = z.array(deliveryZoneInputSchema).parse([
  { slug: "inside-dhaka", nameBn: "ঢাকা সিটির ভেতরে", feePaisa: taka(60), minDays: 1, maxDays: 2, sortOrder: 10 },
  { slug: "dhaka-suburbs", nameBn: "ঢাকার আশেপাশে", feePaisa: taka(100), minDays: 2, maxDays: 3, sortOrder: 20 },
  { slug: "outside-dhaka", nameBn: "ঢাকার বাইরে", feePaisa: taka(120), minDays: 3, maxDays: 5, sortOrder: 30 },
]);

const single = (sku: string, price: number, stock: number) => [
  { sku, nameBn: "সাধারণ", pricePaisa: taka(price), stockQuantity: stock, isDefault: true },
];

// Sample catalogue mirroring the current storefront concepts. Prices are placeholders.
const products = z.array(productInputSchema).parse([
  { slug: "soft-teddy-bear", nameBn: "নরম টেডি বিয়ার", categorySlug: "kids", descriptionBn: "ছোটদের জন্মদিনে দেওয়ার মতো নরম খেলনা।", variants: single("SAMPLE-TEDDY", 450, 10) },
  { slug: "notebook-pen-set", nameBn: "নোটবুক ও কলম সেট", categorySlug: "stationery", descriptionBn: "ক্লাসের নোট আর নিজের টুকিটাকি লেখার জন্য।", variants: single("SAMPLE-NOTEBOOK-SET", 220, 25) },
  { slug: "ceramic-vase", nameBn: "সিরামিক ফুলদানি", categorySlug: "decor", descriptionBn: "পড়ার টেবিল বা তাকের এক কোণে মানিয়ে যাবে।", variants: single("SAMPLE-VASE", 380, 8) },
  { slug: "desk-organizer", nameBn: "ডেস্ক অর্গানাইজার", categorySlug: "home", descriptionBn: "কলম, পেন্সিল আর ছোট জিনিস গুছিয়ে রাখুন।", variants: single("SAMPLE-ORGANIZER", 290, 15) },
  {
    slug: "leaf-pattern-mug",
    nameBn: "পাতার নকশার মগ",
    categorySlug: "gifts",
    descriptionBn: "চা-পছন্দ করা মানুষটির জন্য ছোট্ট উপহার।",
    variants: [
      { sku: "SAMPLE-MUG-GREEN", nameBn: "সবুজ", options: { "রং": "সবুজ" }, pricePaisa: taka(260), stockQuantity: 12, isDefault: true },
      { sku: "SAMPLE-MUG-CREAM", nameBn: "ক্রিম", options: { "রং": "ক্রিম" }, pricePaisa: taka(260), stockQuantity: 6 },
    ],
  },
  { slug: "flower-earrings", nameBn: "ফুলের নকশার দুল", categorySlug: "women", descriptionBn: "সোনালি রঙের ছোট ফুলের নকশা।", variants: single("SAMPLE-EARRINGS", 180, 20) },
  { slug: "wooden-mini-house", nameBn: "কাঠের ছোট্ট বাড়ি", categorySlug: "decor", descriptionBn: "ঘর সাজানোর জন্য ছোট আকারের শোপিস।", variants: single("SAMPLE-WOOD-HOUSE", 350, 5) },
  { slug: "colour-pencil-set", nameBn: "রঙ পেন্সিলের সেট", categorySlug: "stationery", descriptionBn: "ছোটদের আঁকিবুঁকির খাতায় রঙ যোগ করতে।", variants: single("SAMPLE-COLOUR-PENCILS", 150, 30) },
]);

async function main() {
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_URL_DIRECT or DATABASE_URL in .env.local.");
  const adminEmail = process.env.ADMIN_SEED_EMAIL ? adminEmailSchema.parse(process.env.ADMIN_SEED_EMAIL) : undefined;

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  try {
    await db.transaction(async (tx) => {
      const categoryIds = new Map<string, string>();
      for (const c of categories) {
        const [row] = await tx
          .insert(schema.categories)
          .values(c)
          .onConflictDoUpdate({
            target: schema.categories.slug,
            set: { nameBn: c.nameBn, descriptionBn: c.descriptionBn ?? null, sortOrder: c.sortOrder },
          })
          .returning({ id: schema.categories.id });
        categoryIds.set(c.slug, row.id);
      }

      for (const zone of deliveryZones) {
        await tx
          .insert(schema.deliveryZones)
          .values(zone)
          .onConflictDoUpdate({
            target: schema.deliveryZones.slug,
            set: { nameBn: zone.nameBn, feePaisa: zone.feePaisa, minDays: zone.minDays, maxDays: zone.maxDays, sortOrder: zone.sortOrder },
          });
      }

      let newVariants = 0;
      for (const { variants, categorySlug, ...product } of products) {
        const categoryId = categoryIds.get(categorySlug);
        if (!categoryId) throw new Error(`Unknown category "${categorySlug}" for ${product.slug}`);
        const [productRow] = await tx
          .insert(schema.products)
          .values({ ...product, categoryId })
          .onConflictDoUpdate({
            target: schema.products.slug,
            set: { nameBn: product.nameBn, descriptionBn: product.descriptionBn ?? null, categoryId },
          })
          .returning({ id: schema.products.id });

        for (const [index, variant] of variants.entries()) {
          const existing = await tx.query.productVariants.findFirst({
            where: eq(schema.productVariants.sku, variant.sku),
            columns: { id: true },
          });
          const fields = {
            productId: productRow.id,
            nameBn: variant.nameBn,
            options: variant.options,
            pricePaisa: variant.pricePaisa,
            compareAtPricePaisa: variant.compareAtPricePaisa ?? null,
            isDefault: variant.isDefault,
            sortOrder: index,
          };
          if (existing) {
            await tx.update(schema.productVariants).set(fields).where(eq(schema.productVariants.id, existing.id));
            continue;
          }
          const [created] = await tx
            .insert(schema.productVariants)
            .values({ ...fields, sku: variant.sku, stockQuantity: variant.stockQuantity })
            .returning({ id: schema.productVariants.id });
          if (variant.stockQuantity > 0) {
            await tx.insert(schema.inventoryMovements).values({
              variantId: created.id,
              change: variant.stockQuantity,
              reason: "initial",
              note: "Seed sample stock",
            });
          }
          newVariants++;
        }
      }

      if (adminEmail) {
        await tx
          .insert(schema.adminUsers)
          .values({ email: adminEmail, role: "owner" })
          .onConflictDoNothing({ target: schema.adminUsers.email });
      }

      const [counts] = await tx.execute<{ categories: number; products: number; variants: number; zones: number; admins: number }>(sql`
        select
          (select count(*) from categories)::int as categories,
          (select count(*) from products)::int as products,
          (select count(*) from product_variants)::int as variants,
          (select count(*) from delivery_zones)::int as zones,
          (select count(*) from admin_users)::int as admins
      `);
      console.log(`Seed complete. New variants this run: ${newVariants}.`, counts);
    });
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
