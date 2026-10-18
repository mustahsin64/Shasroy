import "server-only";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { slugSchema } from "@/lib/validation";

const { categories, products } = schema;

export const categoryFieldsSchema = z.object({
  nameBn: z.string().trim().min(1, "নাম লিখুন।").max(120),
  slug: z.string().trim().toLowerCase().pipe(slugSchema.or(z.string().transform((_, ctx) => {
    ctx.addIssue({ code: "custom", message: "স্লাগে শুধু ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন।" });
    return z.NEVER;
  }))),
  descriptionBn: z.string().trim().max(1000).transform(v => v || null),
  sortOrder: z.coerce.number().int().min(0).max(10000),
  isActive: z.boolean(),
});
export type CategoryFields = z.infer<typeof categoryFieldsSchema>;

function isSlugTaken(error: unknown) {
  for (let e = error as { code?: string; constraint_name?: string; cause?: unknown } | undefined, d = 0; e && d < 5; e = e.cause as typeof e, d++) {
    if (e.code === "23505" && e.constraint_name === "categories_slug_unique") return true;
  }
  return false;
}

export async function saveCategory(id: string | null, fields: CategoryFields): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (id) await db.update(categories).set(fields).where(eq(categories.id, id));
    else await db.insert(categories).values(fields);
    return { ok: true };
  } catch (error) {
    if (isSlugTaken(error)) return { ok: false, error: "এই স্লাগ আগে থেকেই আছে।" };
    throw error;
  }
}

export async function deleteCategory(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const [{ n }] = await db.select({ n: count() }).from(products).where(eq(products.categoryId, id));
  if (n > 0) return { ok: false, error: "এই বিভাগে পণ্য আছে; আগে পণ্যগুলো অন্য বিভাগে সরান, অথবা বিভাগটি বন্ধ করুন।" };
  await db.delete(categories).where(eq(categories.id, id));
  return { ok: true };
}
