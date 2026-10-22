"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/action-form";
import { assertAdmin } from "@/lib/admin-auth";
import { updateGiftWrapSettings } from "@/lib/admin/settings";
import { bnDigitsToLatin, takaToPaisa } from "@/lib/money";

export async function updateGiftWrapAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await assertAdmin("manager");
  const expected = z.coerce.number().int().positive().safeParse(fd.get("expectedUpdatedAt"));
  if (!expected.success) return { errors: ["তথ্য ঠিক নেই। পাতা রিফ্রেশ করুন।"] };
  const fee = takaToPaisa.safeParse(bnDigitsToLatin(String(fd.get("fee") ?? "")));
  if (!fee.success) return { errors: [...new Set(fee.error.issues.map(i => i.message))] };
  const result = await updateGiftWrapSettings({ giftWrapEnabled: fd.get("giftWrapEnabled") === "on", giftWrapFeePaisa: fee.data }, expected.data, admin.id);
  if (!result.ok) return { errors: [result.error] };
  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return { ok: true, message: "সংরক্ষণ হয়েছে।" };
}
