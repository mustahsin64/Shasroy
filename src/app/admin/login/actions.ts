"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; message: string };

const SENT = "এই ইমেইলটি অ্যাডমিন হিসেবে নিবন্ধিত থাকলে একটি লগইন লিংক পাঠানো হয়েছে। ইনবক্স (ও স্প্যাম) দেখুন।";

export async function sendLoginLinkAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { status: "error", message: "সঠিক ইমেইল দিন।" };
  const email = parsed.data;

  // Only registered, active admins get a link; the response is identical either way.
  const admin = await db.query.adminUsers.findFirst({
    where: and(eq(schema.adminUsers.email, email), eq(schema.adminUsers.isActive, true)),
    columns: { id: true },
  });
  if (!admin) return { status: "sent", message: SENT };

  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    console.error("signInWithOtp failed", error.status, error.code);
    return {
      status: "error",
      message: error.status === 429 ? "অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।" : "লিংক পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন।",
    };
  }
  return { status: "sent", message: SENT };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
