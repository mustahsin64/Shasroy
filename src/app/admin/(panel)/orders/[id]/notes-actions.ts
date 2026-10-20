"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/action-form";
import { assertAdmin } from "@/lib/admin-auth";
import { addOrderNote, noteBodySchema } from "@/lib/admin/order-notes";

export async function addOrderNoteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await assertAdmin("staff");
  const orderId = z.uuid().safeParse(formData.get("orderId"));
  if (!orderId.success) return { errors: ["অর্ডার পাওয়া যায়নি।"] };
  const body = noteBodySchema.safeParse(String(formData.get("body") ?? ""));
  if (!body.success) return { errors: [...new Set(body.error.issues.map(i => i.message))] };

  const result = await addOrderNote(orderId.data, admin.id, body.data);
  if (!result.ok) return { errors: [result.error] };
  revalidatePath(`/admin/orders/${orderId.data}`);
  return { ok: true, message: "নোট যোগ হয়েছে।" };
}
