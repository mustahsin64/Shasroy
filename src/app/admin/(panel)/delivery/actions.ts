"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/action-form";
import { assertAdmin } from "@/lib/admin-auth";
import { createDeliveryZone, updateDeliveryZone } from "@/lib/admin/delivery";
import { bnDigitsToLatin, takaToPaisa } from "@/lib/money";
import { deliveryZoneInputSchema, deliveryZoneUpdateSchema } from "@/lib/validation";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "");
const int = z.preprocess(bnDigitsToLatin, z.coerce.number().int("পূর্ণ সংখ্যা দিন।"));

const formFields = z.object({
  nameBn: z.string(),
  fee: takaToPaisa,
  minDays: int,
  maxDays: int,
  sortOrder: int,
});

function parseFields(fd: FormData) {
  const base = formFields.safeParse({ nameBn: str(fd, "nameBn"), fee: bnDigitsToLatin(str(fd, "fee")), minDays: str(fd, "minDays"), maxDays: str(fd, "maxDays"), sortOrder: str(fd, "sortOrder") || "0" });
  return base.success ? { ok: true as const, value: { nameBn: base.data.nameBn, feePaisa: base.data.fee, minDays: base.data.minDays, maxDays: base.data.maxDays, sortOrder: base.data.sortOrder, isActive: fd.get("isActive") === "on" } } : { ok: false as const, errors: [...new Set(base.error.issues.map(i => i.message))] };
}

const messages = (error: z.ZodError) => [...new Set(error.issues.map(i => i.message))];

export async function createZoneAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await assertAdmin("manager");
  const fields = parseFields(fd);
  if (!fields.ok) return { errors: fields.errors };
  const parsed = deliveryZoneInputSchema.safeParse({ ...fields.value, slug: str(fd, "slug").trim().toLowerCase() });
  if (!parsed.success) return { errors: messages(parsed.error) };
  const result = await createDeliveryZone(parsed.data, admin.id);
  if (!result.ok) return { errors: [result.error] };
  revalidatePath("/admin/delivery");
  revalidatePath("/checkout");
  return { ok: true, message: "নতুন এলাকা যোগ হয়েছে।" };
}

export async function updateZoneAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await assertAdmin("manager");
  const id = z.uuid().safeParse(fd.get("zoneId"));
  const expected = z.coerce.number().int().positive().safeParse(fd.get("expectedUpdatedAt"));
  if (!id.success || !expected.success) return { errors: ["তথ্য ঠিক নেই। পাতা রিফ্রেশ করুন।"] };
  const fields = parseFields(fd);
  if (!fields.ok) return { errors: fields.errors };
  const parsed = deliveryZoneUpdateSchema.safeParse(fields.value);
  if (!parsed.success) return { errors: messages(parsed.error) };
  const result = await updateDeliveryZone(id.data, parsed.data, expected.data, admin.id);
  if (!result.ok) return { errors: [result.error] };
  revalidatePath("/admin/delivery");
  revalidatePath("/checkout");
  return { ok: true, message: "সংরক্ষণ হয়েছে।" };
}
