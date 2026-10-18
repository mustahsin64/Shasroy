"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/action-form";
import { assertAdmin } from "@/lib/admin-auth";
import { categoryFieldsSchema, deleteCategory, saveCategory } from "@/lib/admin/categories";

export async function saveCategoryAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin("manager");
  const id = fd.get("categoryId") ? z.uuid().safeParse(fd.get("categoryId")) : null;
  if (id && !id.success) return { errors: ["তথ্য ঠিক নেই।"] };
  const parsed = categoryFieldsSchema.safeParse({
    nameBn: String(fd.get("nameBn") ?? ""),
    slug: String(fd.get("slug") ?? ""),
    descriptionBn: String(fd.get("descriptionBn") ?? ""),
    sortOrder: String(fd.get("sortOrder") || "0"),
    isActive: fd.get("isActive") === "on",
  });
  if (!parsed.success) return { errors: [...new Set(parsed.error.issues.map(i => i.message))] };
  const result = await saveCategory(id?.data ?? null, parsed.data);
  if (!result.ok) return { errors: [result.error] };
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true, message: id ? "সংরক্ষণ হয়েছে।" : "নতুন বিভাগ যোগ হয়েছে।" };
}

export async function deleteCategoryAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin("manager");
  const id = z.uuid().safeParse(fd.get("categoryId"));
  if (!id.success) return { errors: ["তথ্য ঠিক নেই।"] };
  const result = await deleteCategory(id.data);
  if (!result.ok) return { errors: [result.error] };
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true, message: "মুছে ফেলা হয়েছে।" };
}
