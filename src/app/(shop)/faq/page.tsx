import type { Metadata } from "next";
import { ShopFaq } from "@/components/shop-faq";
import { listDeliveryZones } from "@/lib/checkout";
import { getShopSettings } from "@/lib/shop-settings";

export const metadata: Metadata = {
  title: "সাধারণ প্রশ্ন",
  description: "অর্ডার, ডেলিভারি, টাকা দেওয়া আর গিফট র‍্যাপ নিয়ে সাধারণ প্রশ্নের উত্তর।",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const [zones, settings] = await Promise.all([listDeliveryZones(), getShopSettings()]);
  return <div className="shop-background"><div className="container-shell faq-page">
    <ShopFaq zones={zones} settings={settings} />
  </div></div>;
}
