import { ArrowRight, Gift } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HomeHero } from "@/components/home-hero";
import { NewArrivals } from "@/components/new-arrivals";
import { ShopFaq } from "@/components/shop-faq";
import { listCategories, listProducts } from "@/lib/catalog";
import { listDeliveryZones } from "@/lib/checkout";
import { getShopSettings } from "@/lib/shop-settings";

const MIN_PRODUCTS_FOR_ARRIVALS = 8;

/** Existing storefront imagery per category slug; categories without one get an icon tile. */
const categoryImages: Record<string, string> = {
  gifts: "/images/gift-hero.png",
  kids: "/images/kids-hero.png",
  stationery: "/images/stationery-hero.png",
  women: "/images/women-hero.png",
  home: "/images/kitchen-hero.png",
  decor: "/images/decor-hero.png",
};

export default async function Home() {
  const categories = (await listCategories()).map(c => ({ id: c.slug, title: c.nameBn }));
  const newest = await listProducts({ sort: "newest" });
  const arrivals = newest.length >= MIN_PRODUCTS_FOR_ARRIVALS ? newest.slice(0, 8) : [];
  const [zones, settings] = await Promise.all([listDeliveryZones(), getShopSettings()]);
  return <div className="shop-background"><div className="container-shell shop-flow">
    <HomeHero />
    <section className="category-section" id="categories" aria-labelledby="categories-title">
      <div className="section-title"><h2 id="categories-title">কী খুঁজছেন?</h2><div className="dotted-rule" /></div>
      <ul className="category-grid" role="list">{categories.map(c => <li key={c.id}><Link href={`/products?category=${c.id}`}>
        <span className="category-thumb">{categoryImages[c.id] ? <Image src={categoryImages[c.id]} alt="" fill sizes="(max-width: 650px) 45vw, 180px" /> : <Gift size={34} strokeWidth={1.2} aria-hidden="true" />}</span>
        <span className="category-name">{c.title}</span>
      </Link></li>)}</ul>
      <div className="category-cta"><Link className="btn-primary" href="/products">সব পণ্য দেখুন <ArrowRight size={18} aria-hidden="true" /></Link></div>
    </section>
    <NewArrivals products={arrivals} />
    <section className="ideas-section" id="ideas" aria-labelledby="ideas-title">
      <div className="ideas-lead"><Gift size={44} strokeWidth={1.1} aria-hidden="true" /><p>জন্মদিন আসছে?</p><h2 id="ideas-title">ছোট্ট কিছু, অনেকটা ভালোবাসা।</h2><p className="ideas-note">উপহারের দাম নয়, মনে রাখাটাই আসল।</p><Link className="btn-link" href="/products?category=gifts">উপহার দেখুন <ArrowRight size={16} aria-hidden="true" /></Link></div>
      <article><span>০১ / ছোটদের জন্য</span><h3>শুধু খেলনা নয়, রঙ পেন্সিলও হতে পারে উপহার</h3><p>সঙ্গে একটা আঁকার খাতা দিলে, নতুন ছবি আঁকার শুরুটা হয়ে যায়।</p><Link href="/products?category=kids">ছোটদের জিনিস দেখুন</Link></article>
      <article><span>০২ / নিজের ঘর</span><h3>পড়ার টেবিলে একটু নতুনত্ব</h3><p>একটা ফুলদানি, কলম রাখার জায়গা আর গুছানো খাতা—ব্যস।</p><Link href="/products?category=stationery">স্টেশনারি দেখুন</Link></article>
    </section>
    <ShopFaq zones={zones} settings={settings} />
  </div></div>;
}
