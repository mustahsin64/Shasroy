import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminUsers, managedRoles, roleLabels } from "@/lib/admin/users";
import { formatDateTimeBn } from "@/lib/format";
import { registerAdminAction, setAdminActiveAction, setAdminRoleAction } from "./actions";

export const metadata: Metadata = { title: "অ্যাডমিন ব্যবহারকারী" };

export default async function AdminUsersPage() {
  const me = await requireAdmin("owner");
  const users = await listAdminUsers();
  return <>
    <h1>অ্যাডমিন ব্যবহারকারী</h1>
    <p className="admin-muted">এখানে নিবন্ধন করলে কোনো ইমেইল যায় না। নিবন্ধিত ব্যক্তি <strong>/admin/login</strong> থেকে নিজের ইমেইল দিয়ে লগইন লিংক নেবেন; প্রথমবার ঢুকলে অ্যাকাউন্ট যুক্ত হবে। বন্ধ করলে তাঁর ইতিহাস ও নোট থেকে যায়, শুধু প্রবেশ বন্ধ হয়।</p>
    <div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th>ইমেইল</th><th>নাম</th><th>ভূমিকা</th><th>অবস্থা</th><th>লগইন</th><th></th></tr></thead>
      <tbody>{users.map(u => {
        const own = u.id === me.id;
        const hidden = <>
          <input type="hidden" name="userId" value={u.id} />
          <input type="hidden" name="expectedRole" value={u.role} />
          <input type="hidden" name="expectedActive" value={String(u.isActive)} />
        </>;
        return <tr key={u.id}>
          <td>{u.email}{own && <small> (আপনি)</small>}</td>
          <td>{u.displayName ?? "—"}</td>
          <td>{u.role === "owner" || own ? <span className={`status-pill ${u.role === "owner" ? "status-confirmed" : ""}`}>{roleLabels[u.role]}</span> :
            <ActionForm action={setAdminRoleAction} submitLabel="বদলান" className="inline role-form">
              {hidden}
              <select name="role" defaultValue={u.role} aria-label="ভূমিকা">{managedRoles.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}</select>
            </ActionForm>}</td>
          <td><span className={`status-pill ${u.isActive ? "product-active" : "status-cancelled"}`}>{u.isActive ? "সক্রিয়" : "বন্ধ"}</span></td>
          <td><small>{u.linked ? "যুক্ত হয়েছে" : "প্রথম লগইন বাকি"}<br />{formatDateTimeBn(u.createdAt)}</small></td>
          <td>{u.role !== "owner" && !own && <ActionForm action={setAdminActiveAction} submitLabel={u.isActive ? "বন্ধ করুন" : "চালু করুন"} className="inline" danger={u.isActive}
            confirmText={u.isActive ? "এই ব্যবহারকারীর প্রবেশ বন্ধ করবেন?" : undefined}>
            {hidden}<input type="hidden" name="active" value={String(!u.isActive)} />
          </ActionForm>}</td>
        </tr>;
      })}</tbody>
    </table></div>
    <section className="admin-card" style={{ marginTop: 18 }}>
      <h2>নতুন ব্যবহারকারী নিবন্ধন</h2>
      <ActionForm action={registerAdminAction} submitLabel="নিবন্ধন করুন">
        <div className="admin-grid">
          <label>ইমেইল *<input name="email" type="email" required maxLength={254} autoComplete="off" /></label>
          <label>নাম (ঐচ্ছিক)<input name="displayName" maxLength={80} /></label>
          <label>ভূমিকা *<select name="role" defaultValue="staff">{managedRoles.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}</select>
            <small>স্টাফ: শুধু অর্ডার। ম্যানেজার: অর্ডার, পণ্য, বিভাগ, ডেলিভারি, স্টক ইতিহাস।</small></label>
        </div>
      </ActionForm>
    </section>
  </>;
}
