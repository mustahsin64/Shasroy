import Link from "next/link";
import { hasRole, requireAdmin } from "@/lib/admin-auth";
import { signOutAction } from "../login/actions";

export default async function AdminPanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();
  const canManageCatalog = hasRole(admin, "manager");
  return <div className="admin-frame">
    <header className="admin-top">
      <Link href="/admin" className="admin-brand">সাশ্রয় · অ্যাডমিন</Link>
      <nav aria-label="অ্যাডমিন মেনু">
        <Link href="/admin/orders">অর্ডার</Link>
        {canManageCatalog && <Link href="/admin/products">পণ্য</Link>}
        {canManageCatalog && <Link href="/admin/categories">বিভাগ</Link>}
        {canManageCatalog && <Link href="/admin/delivery">ডেলিভারি</Link>}
        {canManageCatalog && <Link href="/admin/settings">সেটিংস</Link>}
        {hasRole(admin, "owner") && <Link href="/admin/users">ব্যবহারকারী</Link>}
        <Link href="/" target="_blank">দোকান দেখুন ↗</Link>
      </nav>
      <form action={signOutAction} className="admin-user">
        <span>{admin.displayName ?? admin.email}</span>
        <button type="submit">লগআউট</button>
      </form>
    </header>
    <main className="admin-main">{children}</main>
  </div>;
}
