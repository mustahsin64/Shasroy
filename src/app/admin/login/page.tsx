import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "অ্যাডমিন লগইন", robots: { index: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdmin()) redirect("/admin");
  const { error } = await searchParams;
  return <div className="admin-login">
    <h1>সাশ্রয় · অ্যাডমিন</h1>
    <p>নিবন্ধিত ইমেইল দিন। আমরা একটি লগইন লিংক পাঠাব; পাসওয়ার্ড লাগবে না।</p>
    {error && <p className="admin-error" role="alert">লিংকটি কাজ করেনি বা মেয়াদ শেষ। নতুন লিংক নিন।</p>}
    <LoginForm />
  </div>;
}
