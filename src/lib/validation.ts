import { z } from "zod";

// Shared input rules. Server code must validate with these before writing.

export const slugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, digits and single hyphens.");

/** Whole paisa; 1 taka = 100 paisa. */
export const paisaSchema = z.number().int().nonnegative().max(100_000_000);
export const positivePaisaSchema = paisaSchema.positive();

/** Accepts 01XXXXXXXXX, +8801XXXXXXXXX or 8801XXXXXXXXX (Bangla or Latin digits) and normalises to 01XXXXXXXXX. */
export function normalizeBdPhone(value: string) {
  return value
    .trim()
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/[\s-]/g, "")
    .replace(/^\+?880/, "0");
}
export const BD_MOBILE_PATTERN = /^01[3-9]\d{8}$/;

export const bdPhoneSchema = z
  .string()
  .transform(normalizeBdPhone)
  .pipe(z.string().regex(BD_MOBILE_PATTERN, "Enter a valid Bangladeshi mobile number."));

export const variantOptionsSchema = z.record(z.string().min(1).max(40), z.string().min(1).max(80));

export const categoryInputSchema = z.object({
  slug: slugSchema,
  nameBn: z.string().trim().min(1).max(120),
  descriptionBn: z.string().trim().max(1000).optional(),
  sortOrder: z.number().int().default(0),
});

export const variantInputSchema = z
  .object({
    sku: z.string().trim().min(1).max(64).regex(/^[A-Z0-9-]+$/, "Use uppercase letters, digits and hyphens."),
    nameBn: z.string().trim().min(1).max(120),
    options: variantOptionsSchema.default({}),
    pricePaisa: positivePaisaSchema,
    compareAtPricePaisa: positivePaisaSchema.optional(),
    stockQuantity: z.number().int().nonnegative(),
    isDefault: z.boolean().default(false),
  })
  .refine((v) => v.compareAtPricePaisa === undefined || v.compareAtPricePaisa > v.pricePaisa, {
    message: "Compare-at price must be higher than the price.",
    path: ["compareAtPricePaisa"],
  });

export const productInputSchema = z.object({
  slug: slugSchema,
  nameBn: z.string().trim().min(1).max(160),
  descriptionBn: z.string().trim().max(5000).optional(),
  categorySlug: slugSchema,
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  isFeatured: z.boolean().default(false),
  variants: z
    .array(variantInputSchema)
    .min(1)
    .refine((vs) => vs.filter((v) => v.isDefault).length === 1, "Exactly one variant must be the default."),
});

export const deliveryZoneFields = z.object({
  slug: slugSchema,
  nameBn: z.string().trim().min(1, "নাম লিখুন।").max(120),
  feePaisa: paisaSchema,
  minDays: z.number().int().min(0).max(60),
  maxDays: z.number().int().min(0).max(60),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  isActive: z.boolean().default(true),
});

const daysRange = { message: "সর্বোচ্চ দিন সর্বনিম্ন দিনের কম হতে পারে না।", path: ["maxDays"] };
export const deliveryZoneInputSchema = deliveryZoneFields.refine((zone) => zone.maxDays >= zone.minDays, daysRange);
/** Slugs stay stable after creation, so updates never accept one. */
export const deliveryZoneUpdateSchema = deliveryZoneFields.omit({ slug: true }).refine((zone) => zone.maxDays >= zone.minDays, daysRange);

export const adminEmailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));
