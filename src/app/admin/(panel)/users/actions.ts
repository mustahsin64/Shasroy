"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/action-form";
import { assertAdmin } from "@/lib/admin-auth";
import { managedRoles, registerAdmin, setAdminActive, setAdminRole } from "@/lib/admin/users";
import { adminEmailSchema } from "@/lib/validation";

const roleSchema = z.enum(["staff", "manager"], "ভূমিকা বেছে নিন।");
const expectedSchema = z.object({ role: z.enum(["owner", "manager", "staff"]), isActive: z.enum(["true", "false"]).transform(v => v === "true") });

export async function registerAdminAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await assertAdmin("owner");
  const email = adminEmailSchema.safeParse(String(fd.get("email") ?? ""));
  const role = roleSchema.safeParse(fd.get("role"));
  const displayName = z.string().trim().max(80, "নাম ৮০ অক্ষরের মধ্যে রাখুন।").transform(v => v || null).safeParse(String(fd.get("displayName") ?? ""));
  const errors: string[] = [];
  if (!email.success) errors.push("সঠিক ইমেইল দিন।");
  if (!role.success) errors.push("ভূমিকা বেছে নিন।");
  if (!displayName.success) errors.push("নাম ৮০ অক্ষরের মধ্যে রাখুন।");
  if (!email.success || !role.success || !displayName.success) return { errors };
  const result = await registerAdmin({ email: email.data, role: role.data, displayName: displayName.data }, admin.id);
  if (!result.ok) return { errors: [result.error] };
  revalidatePath("/admin/users");
  return { ok: true, message: "নিবন্ধিত হয়েছে। তাঁকে /admin/login থেকে ইমেইল দিয়ে লগইন লিংক নিতে বলুন।" };
}

function target(fd: FormData) {
  const id = z.uuid().safeParse(fd.get("userId"));
  const expected = expectedSchema.safeParse({ role: fd.get("expectedRole"), isActive: fd.get("expectedActive") });
  return id.success && expected.success ? { id: id.data, expected: expected.data } : null;
}

export async function setAdminActiveAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await assertAdmin("owner");
  const t = target(fd);
  if (!t) return { errors: ["তথ্য ঠিক নেই।"] };
  const result = await setAdminActive(t.id, fd.get("active") === "true", t.expected, admin.id);
  if (!result.ok) return { errors: [result.error] };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setAdminRoleAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await assertAdmin("owner");
  const t = target(fd);
  const role = roleSchema.safeParse(fd.get("role"));
  if (!t || !role.success || !managedRoles.includes(role.data)) return { errors: ["তথ্য ঠিক নেই।"] };
  const result = await setAdminRole(t.id, role.data, t.expected, admin.id);
  if (!result.ok) return { errors: [result.error] };
  revalidatePath("/admin/users");
  return { ok: true };
}
