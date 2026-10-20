import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllDeliveryZones } from "@/lib/admin/delivery";
import { formatNumberBn, formatTaka } from "@/lib/format";
import { createZoneAction, updateZoneAction } from "./actions";

export const metadata: Metadata = { title: "ডেলিভারি" };

type Values = { nameBn?: string; feePaisa?: number; minDays?: number; maxDays?: number; sortOrder?: number; isActive?: boolean };

function ZoneFields({ values = {} }: { values?: Values }) {
  return <div className="admin-grid">
    <label>এলাকার নাম *<input name="nameBn" required maxLength={120} defaultValue={values.nameBn} /></label>
    <label>ডেলিভারি চার্জ (টাকা) *<input name="fee" required inputMode="decimal" defaultValue={values.feePaisa === undefined ? "" : String(values.feePaisa / 100)} /><small>বিনামূল্যে হলে ০ লিখুন</small></label>
    <label>সর্বনিম্ন দিন *<input name="minDays" required inputMode="numeric" defaultValue={values.minDays ?? 1} /></label>
    <label>সর্বোচ্চ দিন *<input name="maxDays" required inputMode="numeric" defaultValue={values.maxDays ?? 3} /></label>
    <label>ক্রম<input name="sortOrder" inputMode="numeric" defaultValue={values.sortOrder ?? 0} /><small>ছোট সংখ্যা আগে দেখাবে</small></label>
    <label className="checkbox"><input type="checkbox" name="isActive" defaultChecked={values.isActive ?? true} /> চেকআউটে দেখান</label>
  </div>;
}

export default async function AdminDeliveryPage() {
  await requireAdmin("manager");
  const zones = await listAllDeliveryZones();
  return <>
    <h1>ডেলিভারি এলাকা ও চার্জ</h1>
    <p className="admin-muted">বদলালে শুধু নতুন অর্ডারে প্রযোজ্য হবে; আগের অর্ডারের চার্জ ও এলাকার নাম অপরিবর্তিত থাকে। চেকআউটে চার্জ বদলে গেলে গ্রাহক নতুন মোট দেখে আবার নিশ্চিত করেন।</p>
    {zones.length === 0 && <p className="admin-error">কোনো এলাকা নেই; গ্রাহক এখন অর্ডার করতে পারবেন না।</p>}
    {zones.length > 0 && zones.every(z => !z.isActive) && <p className="admin-error">সব এলাকা বন্ধ আছে; গ্রাহক এখন অর্ডার করতে পারবেন না।</p>}
    {zones.map(z => <details key={z.id} className="admin-card admin-collapsible">
      <summary><strong>{z.nameBn}</strong> <small>{formatTaka(z.feePaisa)} · {formatNumberBn(z.minDays)}–{formatNumberBn(z.maxDays)} দিন · {z.slug}{!z.isActive && " · বন্ধ"}</small></summary>
      <ActionForm action={updateZoneAction} submitLabel="সংরক্ষণ করুন">
        <input type="hidden" name="zoneId" value={z.id} />
        <input type="hidden" name="expectedUpdatedAt" value={z.updatedAt.getTime()} />
        <ZoneFields values={z} />
      </ActionForm>
    </details>)}
    <section className="admin-card">
      <h2>নতুন এলাকা</h2>
      <ActionForm action={createZoneAction} submitLabel="এলাকা যোগ করুন">
        <label>স্লাগ * (বদলানো যাবে না)<input name="slug" required maxLength={80} placeholder="chattogram" pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
        <ZoneFields />
      </ActionForm>
    </section>
  </>;
}
