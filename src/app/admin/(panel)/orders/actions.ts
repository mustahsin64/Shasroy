"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { schema } from "@/db";
import { assertAdmin } from "@/lib/admin-auth";
import { changeOrderStatus } from "@/lib/admin/orders";

export type StatusActionState = { error?: string; ok?: boolean };

const input = z.object({
  orderId: z.uuid(),
  status: z.enum(schema.orderStatus.enumValues),
  note: z.string().trim().max(500).transform(v => v || null),
});

export async function changeOrderStatusAction(_prev: StatusActionState, formData: FormData): Promise<StatusActionState> {
  const admin = await assertAdmin("staff");
  const parsed = input.safeParse({ orderId: formData.get("orderId"), status: formData.get("status"), note: formData.get("note") ?? "" });
  if (!parsed.success) return { error: "তথ্য ঠিক নেই।" };
  const result = await changeOrderStatus(parsed.data.orderId, parsed.data.status, admin.id, parsed.data.note);
  if (!result.ok) return { error: result.error === "not-found" ? "অর্ডার পাওয়া যায়নি।" : "এই ধাপে যাওয়া যাবে না; অন্য কেউ হয়তো আগেই বদলেছেন। পাতা রিফ্রেশ করুন।" };
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}
