import { ArrowRight, Gift, HeartHandshake, Leaf } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ContactLinks } from "@/components/contact-links";
import { HeroCarousel } from "@/components/hero-carousel";
import { NewArrivals } from "@/components/new-arrivals";
import { ProductCard } from "@/components/product-card";
import { listCategories, listProducts, parseSort, type ProductSort } from "@/lib/catalog";
import { listDeliveryZones } from "@/lib/checkout";
import { formatDeliveryDays, formatNumberBn, formatTaka } from "@/lib/format";
import { shopContact } from "@/lib/shop-contact";
import { getShopSettings } from "@/lib/shop-settings";

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "নতুন আগে" },
  { value: "price-asc", label: "দাম: কম থেকে বেশি" },
  { value: "price-desc", label: "দাম: বেশি থেকে কম" },
];

const MIN_PRODUCTS_FOR_BELT = 8;

function shopHref(params: { q?: string; category?: string; sort?: ProductSort }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  const qs = search.toString();
  return `/${qs ? `?${qs}` : ""}#products`;
}

function ProductArt({ cell, label }: { cell: number; label: string }) {
  return <div role="img" aria-label={label} className="product-art" style={{ backgroundPosition: `${(cell % 4) * 100 / 3}% ${cell < 4 ? 0 : 100}%` }} />;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string | string[]; category?: string | string[]; sort?: string | string[] }> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const sort = parseSort(params.sort);
  const categories = (await listCategories()).map(c => ({ id: c.slug, title: c.nameBn }));
  const selected = categories.find(c => c.id === params.category);
  const shown = await listProducts({ query, categorySlug: selected?.id, sort });
  // The belt repeats the grid while the catalog is small, so it only appears once there is enough to show.
  const newest = query || selected ? [] : await listProducts({ sort: "newest" });
  const arrivals = newest.length >= MIN_PRODUCTS_FOR_BELT ? newest.slice(0, 8) : [];
  const [zones, settings] = await Promise.all([listDeliveryZones(), getShopSettings()]);
  return <><NewArrivals products={arrivals} /><div className="shop-background"><div className="container-shell hero-wrap"><section className="hero-split"><HeroCarousel categorySlugs={categories.map(c => c.id)} /></section></div><div className="container-shell shop-columns">
    <aside className="shop-sidebar">
      <div className="sidebar-values">{[{ icon: Gift, title: "উপহার হোক মনের মতো", text: "বয়স আর পছন্দ মিলিয়ে বেছে নিন।" }, { icon: Leaf, title: "ঘরের ছোট প্রয়োজন", text: "কাজে লাগে, রাখতেও ভালো লাগে।" }, { icon: HeartHandshake, title: "সাধ্যের মধ্যে কেনাকাটা", text: "নিজের বাজেট বুঝে নিজের পছন্দে।" }].map(({ icon: Icon, title, text }) => <div key={title}><span className="value-icon"><Icon size={31} strokeWidth={1.2} /></span><h3>{title}</h3><p>{text}</p></div>)}</div>
      <div className="sidebar-gift"><Gift size={62} strokeWidth={1} /><p>জন্মদিন আসছে?</p><h2>ছোট্ট কিছু,<br />অনেকটা ভালোবাসা।</h2><Link href="/?category=gifts#products">উপহার দেখুন <ArrowRight size={14} /></Link></div>
      <section className="sidebar-articles" id="ideas"><h2>উপহারের ভাবনা</h2><article><span>০১ / ছোটদের জন্য</span><h3>শুধু খেলনা নয়, রঙ পেন্সিলও হতে পারে উপহার</h3><p>সঙ্গে একটা আঁকার খাতা দিলে, নতুন ছবি আঁকার শুরুটা হয়ে যায়।</p></article><article><span>০২ / নিজের ঘর</span><h3>পড়ার টেবিলে একটু নতুনত্ব</h3><p>একটা ফুলদানি, কলম রাখার জায়গা আর গুছানো খাতা—ব্যস।</p></article></section>
      <div className="sidebar-quote"><span>“</span><p>উপহারের দাম নয়,<br />মনে রাখাটাই আসল।</p><small>— সাশ্রয়ের কথা</small></div>
    </aside>

    <div className="shop-main">
      <div className="promo-pair"><Link className="promo promo-green" href="/?category=women#products"><div><p>নিজের জন্য, প্রিয়জনের জন্য</p><h2>একটু সাজ,<br />একটু ভালো লাগা।</h2><span className="text-link">দেখে নিন <ArrowRight size={14} /></span></div><ProductArt cell={5} label="সোনালি ফুলের দুল" /></Link><Link className="promo promo-photo" href="/?category=stationery#products"><Image src="/images/stationery-hero.png" alt="" fill sizes="(max-width: 900px) 100vw, 420px" className="promo-photo-img" /><div><p>নতুন খাতার গন্ধে</p><h2>নতুন শুরুর<br />গল্প</h2><span className="text-link">স্টেশনারি দেখুন <ArrowRight size={14} /></span></div></Link></div>
      <section className="product-section" id="products"><div className="section-title"><span>✧</span><h2>{selected?.title || "আমাদের পছন্দের কিছু"}</h2><div className="dotted-rule" /></div><nav className="sort-links" aria-label="সাজানোর ধরন">{sortOptions.map(option => <Link key={option.value} aria-current={sort === option.value ? "true" : undefined} href={shopHref({ q: query, category: selected?.id, sort: option.value })}>{option.label}</Link>)}</nav>{query && <p className="search-result">“{query}” খুঁজে পাওয়া গেছে {formatNumberBn(shown.length)}টি পণ্য। <Link href="/#products">সব দেখুন</Link></p>}<div className="product-grid">{shown.map(product => <ProductCard key={product.id} product={product} />)}</div>{shown.length === 0 && <div className="empty-results">{query ? "এই নামে কোনো পণ্য নেই।" : "এই বিভাগে এখনো কোনো পণ্য নেই।"} <Link href="/#products">সব পণ্য দেখুন</Link></div>}</section>
      <div className="promo-pair lower-promos"><Link className="promo promo-cream" href="/?category=kids#products"><div><p>ছোটদের বড় আনন্দ</p><h2>ওদের জন্য<br />আলাদা কিছু</h2><span className="text-link">দেখে নিন <ArrowRight size={14} /></span></div><ProductArt cell={0} label="নরম টেডি বিয়ার" /></Link><Link className="promo promo-sage" href="/?category=decor#products"><div><p>ঘরের এক কোণে</p><h2>একটু যত্নের<br />ছোঁয়া</h2><span className="text-link">ঘর সাজান <ArrowRight size={14} /></span></div><ProductArt cell={2} label="সিরামিক ফুলদানি" /></Link></div>
      <section className="occasion-section" id="categories"><div className="section-title"><h2>কার জন্য খুঁজছেন?</h2><div className="dotted-rule" /></div><div className="occasion-grid">{[{ cell: 1, title: "পড়ুয়াদের জন্য", category: "stationery" }, { cell: 0, title: "ছোটদের জন্য", category: "kids" }, { cell: 4, title: "প্রিয়জনের জন্য", category: "gifts" }, { cell: 5, title: "নিজের জন্য", category: "women" }].map(item => <Link href={`/?category=${item.category}#products`} key={item.title}><ProductArt cell={item.cell} label={item.title} /><h3>{item.title}</h3><span>সংগ্রহ দেখুন</span></Link>)}</div></section>
      <section id="questions" className="questions"><h2>কেনাকাটার আগে</h2>
        <details><summary>কীভাবে অর্ডার করব?</summary><p>পণ্য বেছে “এখনই কিনুন” বা “ব্যাগে যোগ” চাপুন। চেকআউটে নাম, মোবাইল নম্বর ও ঠিকানা দিন। ডেলিভারির আগে ওই নম্বরে ফোন করে অর্ডার নিশ্চিত করা হবে।</p></details>
        {zones.length > 0 && <details><summary>ডেলিভারিতে কত দিন লাগে, খরচ কত?</summary><ul className="faq-zones">{zones.map(zone => <li key={zone.id}>{zone.nameBn}: {formatTaka(zone.feePaisa)}, {formatDeliveryDays(zone.minDays, zone.maxDays)}</li>)}</ul></details>}
        <details><summary>টাকা কীভাবে দেব?</summary><p>ক্যাশ অন ডেলিভারি: পণ্য হাতে পেয়ে টাকা দিন। অর্ডার করতে অগ্রিম টাকা লাগে না।</p></details>
        <details><summary>পণ্য দেখে নিতে পারব?</summary><p>হ্যাঁ। ডেলিভারির সময় পণ্য দেখে নিন, তারপর টাকা দিন।</p></details>
        {settings.giftWrapEnabled && <details><summary>গিফট র‍্যাপ করে দেওয়া যাবে?</summary><p>হ্যাঁ। চেকআউটে “গিফট র‍্যাপ করে দিন” বেছে নিন; প্রতি অর্ডারে {formatTaka(settings.giftWrapFeePaisa)} যোগ হবে। চাইলে ছোট একটি উপহার বার্তাও লিখে দিতে পারেন। উপহারের প্যাকেটে দামের কাগজ দেওয়া হয় না।</p></details>}
        <details><summary>কী কী পাওয়া যাবে?</summary><p>স্টেশনারি, ছোটদের ও নারীদের উপহার, প্লাস্টিকের প্রয়োজনীয় জিনিস এবং ঘর সাজানোর শোপিস।</p></details>
        {shopContact.hasAny && <details><summary>কীভাবে যোগাযোগ করব?</summary><div><ContactLinks /></div></details>}
      </section>
    </div>
  </div></div></>;
}
