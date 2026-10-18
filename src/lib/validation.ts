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

/** Accepts 01XXXXXXXXX, +8801XXXXXXXXX or 8801XXXXXXXXX and normalises to 01XXXXXXXXX. */
export const bdPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, "").replace(/^\+?880/, "0"))
  .pipe(z.string().regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number."));

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

export const deliveryZoneInputSchema = z
  .object({
    slug: slugSchema,
    nameBn: z.string().trim().min(1).max(120),
    feePaisa: paisaSchema,
    minDays: z.number().int().nonnegative(),
    maxDays: z.number().int().nonnegative(),
    sortOrder: z.number().int().default(0),
  })
  .refine((zone) => zone.maxDays >= zone.minDays, { message: "maxDays must be at least minDays.", path: ["maxDays"] });

export const adminEmailSchema = z.email().transform((value) => value.trim().toLowerCase());
