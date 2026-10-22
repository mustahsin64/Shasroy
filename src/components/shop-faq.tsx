import { ContactLinks } from "@/components/contact-links";
import type { listDeliveryZones } from "@/lib/checkout";
import { formatDeliveryDays, formatTaka } from "@/lib/format";
import { shopContact } from "@/lib/shop-contact";
import type { getShopSettings } from "@/lib/shop-settings";

type Zones = Awaited<ReturnType<typeof listDeliveryZones>>;
type Settings = Awaited<ReturnType<typeof getShopSettings>>;

/** Pre-purchase questions; shown on the landing page and the products page. */
export function ShopFaq({ zones, settings }: { zones: Zones; settings: Settings }) {
  return (
    <section id="questions" className="questions"><h2>কেনাকাটার আগে</h2>
      <details><summary>কীভাবে অর্ডার করব?</summary><p>পণ্য বেছে “এখনই কিনুন” বা “ব্যাগে যোগ” চাপুন। চেকআউটে নাম, মোবাইল নম্বর ও ঠিকানা দিন। ডেলিভারির আগে ওই নম্বরে ফোন করে অর্ডার নিশ্চিত করা হবে।</p></details>
      {zones.length > 0 && <details><summary>ডেলিভারিতে কত দিন লাগে, খরচ কত?</summary><ul className="faq-zones">{zones.map(zone => <li key={zone.id}>{zone.nameBn}: {formatTaka(zone.feePaisa)}, {formatDeliveryDays(zone.minDays, zone.maxDays)}</li>)}</ul></details>}
      <details><summary>টাকা কীভাবে দেব?</summary><p>ক্যাশ অন ডেলিভারি: পণ্য হাতে পেয়ে টাকা দিন। অর্ডার করতে অগ্রিম টাকা লাগে না।</p></details>
      <details><summary>পণ্য দেখে নিতে পারব?</summary><p>হ্যাঁ। ডেলিভারির সময় পণ্য দেখে নিন, তারপর টাকা দিন।</p></details>
      {settings.giftWrapEnabled && <details><summary>গিফট র‍্যাপ করে দেওয়া যাবে?</summary><p>হ্যাঁ। চেকআউটে “গিফট র‍্যাপ করে দিন” বেছে নিন; প্রতি অর্ডারে {formatTaka(settings.giftWrapFeePaisa)} যোগ হবে। চাইলে ছোট একটি উপহার বার্তাও লিখে দিতে পারেন। উপহারের প্যাকেটে দামের কাগজ দেওয়া হয় না।</p></details>}
      <details><summary>কী কী পাওয়া যাবে?</summary><p>স্টেশনারি, ছোটদের ও নারীদের উপহার, প্লাস্টিকের প্রয়োজনীয় জিনিস এবং ঘর সাজানোর শোপিস।</p></details>
      {shopContact.hasAny && <details><summary>কীভাবে যোগাযোগ করব?</summary><div><ContactLinks /></div></details>}
    </section>
  );
}
