"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/admin/action-form";
import { assertAdmin } from "@/lib/admin-auth";
import {
  addProductImage,
  createProduct,
  deleteProductImage,
  deleteVariant,
  makePrimaryImage,
  productFieldsSchema,
  saveVariant,
  setVariantStock,
  stockSchema,
  updateProduct,
  variantFieldsSchema,
} from "@/lib/admin/products";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "");
const errorsOf = (error: z.ZodError) => [...new Set(error.issues.map(i => i.message))];

function productFields(fd: FormData) {
  return productFieldsSchema.safeParse({
    nameBn: str(fd, "nameBn"),
    slug: str(fd, "slug").trim().toLowerCase(),
    descriptionBn: str(fd, "descriptionBn"),
    categoryId: str(fd, "categoryId"),
    status: str(fd, "status") || "draft",
    isFeatured: fd.get("isFeatured") === "on",
  });
}

function variantFields(fd: FormData) {
  return variantFieldsSchema.safeParse({
    nameBn: str(fd, "variantNameBn"),
    sku: str(fd, "sku"),
    price: str(fd, "price"),
    compareAtPrice: str(fd, "compareAtPrice"),
    isActive: fd.get("isActive") === "on",
    isDefault: fd.get("isDefault") === "on",
  });
}

function refresh(productId: string, slug?: string) {
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/");
  if (slug) revalidatePath(`/products/${slug}`);
}

export async function createProductAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await assertAdmin("manager");
  const product = productFields(fd);
  const variant = variantFields(fd);
  const stock = stockSchema.safeParse({ stock: str(fd, "stock") || "0", note: "" });
  const errors = [product, variant, stock].flatMap(r => (r.success ? [] : errorsOf(r.error)));
  if (errors.length || !product.success || !variant.success || !stock.success) return { errors };

  const result = await createProduct(product.data, { ...variant.data, isDefault: true, stock: stock.data.stock }, admin.id);
  if (!result.ok) return { errors: [result.error] };
  revalidatePath("/admin/products");
  redirect(`/admin/products/${result.id}?created=1`);
}

export async function updateProductAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin("manager");
  const id = z.uuid().safeParse(fd.get("productId"));
  const product = productFields(fd);
  if (!id.success) return { errors: ["পণ্য পাওয়া যায়নি।"] };
  if (!product.success) return { errors: errorsOf(product.error) };
  const result = await updateProduct(id.data, product.data);
  if (!result.ok) return { errors: [result.error] };
  refresh(id.data, product.data.slug);
  return { ok: true, message: "সংরক্ষণ হয়েছে।" };
}

export async function saveVariantAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await assertAdmin("manager");
  const productId = z.uuid().safeParse(fd.get("productId"));
  const variantId = fd.get("variantId") ? z.uuid().safeParse(fd.get("variantId")) : null;
  const fields = variantFields(fd);
  const stock = stockSchema.safeParse({ stock: str(fd, "stock") || "0", note: "" });
  if (!productId.success || (variantId && !variantId.success)) return { errors: ["তথ্য ঠিক নেই।"] };
  if (!fields.success) return { errors: errorsOf(fields.error) };
  if (!stock.success) return { errors: errorsOf(stock.error) };
  const result = await saveVariant(productId.data, variantId?.data ?? null, fields.data, admin.id, variantId ? 0 : stock.data.stock);
  if (!result.ok) return { errors: [result.error] };
  refresh(productId.data);
  return { ok: true, message: variantId ? "ধরন সংরক্ষণ হয়েছে।" : "নতুন ধরন যোগ হয়েছে।" };
}

export async function setStockAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await assertAdmin("manager");
  const productId = z.uuid().safeParse(fd.get("productId"));
  const variantId = z.uuid().safeParse(fd.get("variantId"));
  const stock = stockSchema.safeParse({ stock: str(fd, "stock"), note: str(fd, "note") });
  if (!productId.success || !variantId.success) return { errors: ["তথ্য ঠিক নেই।"] };
  if (!stock.success) return { errors: errorsOf(stock.error) };
  const result = await setVariantStock(variantId.data, stock.data.stock, stock.data.note, admin.id);
  if (!result.ok) return { errors: [result.error] };
  refresh(productId.data);
  return { ok: true, message: "স্টক হালনাগাদ হয়েছে।" };
}

export async function deleteVariantAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin("manager");
  const productId = z.uuid().safeParse(fd.get("productId"));
  const variantId = z.uuid().safeParse(fd.get("variantId"));
  if (!productId.success || !variantId.success) return { errors: ["তথ্য ঠিক নেই।"] };
  const result = await deleteVariant(productId.data, variantId.data);
  if (!result.ok) return { errors: [result.error] };
  refresh(productId.data);
  return { ok: true, message: "মুছে ফেলা হয়েছে।" };
}

export async function uploadImageAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin("manager");
  const productId = z.uuid().safeParse(fd.get("productId"));
  const file = fd.get("image");
  if (!productId.success) return { errors: ["তথ্য ঠিক নেই।"] };
  if (!(file instanceof File) || file.size === 0) return { errors: ["একটি ছবি বেছে নিন।"] };
  const alt = str(fd, "altBn").trim().slice(0, 160) || str(fd, "productName");
  const result = await addProductImage(productId.data, file, alt);
  if (!result.ok) return { errors: [result.error] };
  refresh(productId.data);
  return { ok: true, message: "ছবি যোগ হয়েছে।" };
}

export async function deleteImageAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin("manager");
  const productId = z.uuid().safeParse(fd.get("productId"));
  const imageId = z.uuid().safeParse(fd.get("imageId"));
  if (!productId.success || !imageId.success) return { errors: ["তথ্য ঠিক নেই।"] };
  const result = await deleteProductImage(productId.data, imageId.data);
  if (!result.ok) return { errors: [result.error] };
  refresh(productId.data);
  return { ok: true };
}

export async function makePrimaryImageAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin("manager");
  const productId = z.uuid().safeParse(fd.get("productId"));
  const imageId = z.uuid().safeParse(fd.get("imageId"));
  if (!productId.success || !imageId.success) return { errors: ["তথ্য ঠিক নেই।"] };
  await makePrimaryImage(productId.data, imageId.data);
  refresh(productId.data);
  return { ok: true };
}
