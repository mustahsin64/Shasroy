import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/admin-auth";
import { formatTaka } from "@/lib/format";
import { getShopSettings } from "@/lib/shop-settings";
import { updateGiftWrapAction } from "./actions";

export const metadata: Metadata = { title: "সেটিংস" };

export default async function AdminSettingsPage() {
  await requireAdmin("manager");
  const settings = await getShopSettings();
  return <>
    <h1>দোকানের সেটিংস</h1>
    <section className="admin-card">
      <h2>গিফট র‍্যাপ</h2>
      <p className="admin-muted">চালু থাকলে চেকআউটে “গিফট র‍্যাপ করে দিন” অপশন ও উপহার বার্তা দেখাবে। চার্জ প্রতি অর্ডারে একবার। বদলালে শুধু নতুন অর্ডারে প্রযোজ্য হবে।</p>
      {settings.updatedAt === null
        ? <p className="admin-error">সেটিংস পাওয়া যায়নি। `npm run db:migrate` চালানো হয়েছে কি না দেখুন।</p>
        : <ActionForm action={updateGiftWrapAction} submitLabel="সংরক্ষণ করুন">
          <input type="hidden" name="expectedUpdatedAt" value={settings.updatedAt.getTime()} />
          <div className="admin-grid">
            <label>চার্জ (টাকা) *<input name="fee" required inputMode="decimal" defaultValue={String(settings.giftWrapFeePaisa / 100)} /><small>এখন: {formatTaka(settings.giftWrapFeePaisa)}। বিনামূল্যে হলে ০ লিখুন</small></label>
            <label className="checkbox"><input type="checkbox" name="giftWrapEnabled" defaultChecked={settings.giftWrapEnabled} /> চেকআউটে দেখান</label>
          </div>
        </ActionForm>}
    </section>
  </>;
}
