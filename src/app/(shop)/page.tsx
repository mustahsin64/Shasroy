import { ArrowRight, Gift, HeartHandshake, Leaf, PencilRuler, Shapes, Flower2, House, ChevronRight, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { listCategories, listProducts, parseSort, type ProductSort } from "@/lib/catalog";
import { formatNumberBn } from "@/lib/format";

const categoryIcons: Record<string, LucideIcon> = { stationery: PencilRuler, kids: Shapes, women: Flower2, home: House, decor: Leaf, gifts: Gift };
const sortOptions: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "নতুন আগে" },
  { value: "price-asc", label: "দাম: কম থেকে বেশি" },
  { value: "price-desc", label: "দাম: বেশি থেকে কম" },
];

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
  const categories = (await listCategories()).map(c => ({ id: c.slug, title: c.nameBn, icon: categoryIcons[c.slug] ?? Gift }));
  const selected = categories.find(c => c.id === params.category);
  const shown = await listProducts({ query, categorySlug: selected?.id, sort });
  return <div className="shop-background"><div className="container-shell shop-columns">
    <aside className="shop-sidebar" id="categories">
      <nav className="category-menu" aria-label="পণ্যের বিভাগ"><h2>কী খুঁজছেন?</h2>{categories.map(({ id, title, icon: Icon }) => <Link aria-current={selected?.id === id ? "true" : undefined} key={id} href={shopHref({ category: id, sort })}><Icon size={19} strokeWidth={1.4} /><span>{title}</span><ChevronRight size={14} /></Link>)}<Link href="/#products"><Gift size={19} strokeWidth={1.4} /><span>সব পণ্য দেখুন</span><ChevronRight size={14} /></Link></nav>
      <div className="sidebar-values">{[{ icon: Gift, title: "উপহার হোক মনের মতো", text: "বয়স আর পছন্দ মিলিয়ে বেছে নিন।" }, { icon: Leaf, title: "ঘরের ছোট প্রয়োজন", text: "কাজে লাগে, রাখতেও ভালো লাগে।" }, { icon: HeartHandshake, title: "সাধ্যের মধ্যে কেনাকাটা", text: "নিজের বাজেট বুঝে নিজের পছন্দে।" }].map(({ icon: Icon, title, text }) => <div key={title}><span className="value-icon"><Icon size={31} strokeWidth={1.2} /></span><h3>{title}</h3><p>{text}</p></div>)}</div>
      <div className="sidebar-gift"><Gift size={62} strokeWidth={1} /><p>জন্মদিন আসছে?</p><h2>ছোট্ট কিছু,<br />অনেকটা ভালোবাসা।</h2><Link href="/?category=gifts#products">উপহার দেখুন <ArrowRight size={14} /></Link></div>
      <section className="sidebar-articles" id="ideas"><h2>উপহারের ভাবনা</h2><article><span>০১ / ছোটদের জন্য</span><h3>শুধু খেলনা নয়, রঙ পেন্সিলও হতে পারে উপহার</h3><p>সঙ্গে একটা আঁকার খাতা দিলে, নতুন ছবি আঁকার শুরুটা হয়ে যায়।</p></article><article><span>০২ / নিজের ঘর</span><h3>পড়ার টেবিলে একটু নতুনত্ব</h3><p>একটা ফুলদানি, কলম রাখার জায়গা আর গুছানো খাতা—ব্যস।</p></article></section>
      <div className="sidebar-quote"><span>“</span><p>উপহারের দাম নয়,<br />মনে রাখাটাই আসল।</p><small>— সাশ্রয়ের কথা</small></div>
    </aside>

    <div className="shop-main">
      <section className="gift-hero"><Image src="/images/gift-hero.png" alt="সবুজ ও সোনালি ফিতায় মোড়ানো উপহার" fill preload sizes="(max-width: 900px) 100vw, 950px" className="hero-photo" /><div className="hero-copy"><p className="eyebrow">✦ পছন্দের উপহার ✦</p><h1>উপহার ছোট হোক,<br /><em>আনন্দটা বড়।</em></h1><p>প্রিয় মানুষটির জন্য কিছু খুঁজছেন?<br />সাশ্রয়ের দোকানটা ঘুরে দেখুন।</p><Link className="shop-link" href="/?category=gifts#products">উপহার বেছে নিন <ArrowRight size={16} /></Link></div><div className="hero-footnote">আপনার পছন্দ · আপনার দামে</div></section>
      <div className="promo-pair"><Link className="promo promo-green" href="/?category=women#products"><div><p>নিজের জন্য, প্রিয়জনের জন্য</p><h2>একটু সাজ,<br />একটু ভালো লাগা।</h2><span className="text-link">দেখে নিন <ArrowRight size={14} /></span></div><ProductArt cell={5} label="সোনালি ফুলের দুল" /></Link><Link className="promo promo-gold" href="/?category=stationery#products"><div className="promo-inset"><p>নতুন খাতার গন্ধে</p><h2>নতুন শুরুর গল্প</h2><span className="text-link">স্টেশনারি দেখুন</span></div></Link></div>
      <section className="product-section" id="products"><div className="section-title"><span>✧</span><h2>{selected?.title || "আমাদের পছন্দের কিছু"}</h2><div className="dotted-rule" /></div><p className="sample-note">নমুনা সংগ্রহ · ছবি ও দাম ধারণামূলক; আসল পণ্য ও দাম শিগগিরই যোগ হবে।</p><nav className="sort-links" aria-label="সাজানোর ধরন">{sortOptions.map(option => <Link key={option.value} aria-current={sort === option.value ? "true" : undefined} href={shopHref({ q: query, category: selected?.id, sort: option.value })}>{option.label}</Link>)}</nav>{query && <p className="search-result">“{query}” খুঁজে পাওয়া গেছে {formatNumberBn(shown.length)}টি পণ্য। <Link href="/#products">সব দেখুন</Link></p>}<div className="product-grid">{shown.map(product => <ProductCard key={product.id} product={product} />)}</div>{shown.length === 0 && <div className="empty-results">{query ? "এই নামে কোনো পণ্য নেই।" : "এই বিভাগে এখনো কোনো পণ্য নেই।"} <Link href="/#products">সব পণ্য দেখুন</Link></div>}</section>
      <div className="promo-pair lower-promos"><Link className="promo promo-cream" href="/?category=kids#products"><div><p>ছোটদের বড় আনন্দ</p><h2>ওদের জন্য<br />আলাদা কিছু</h2><span className="text-link">দেখে নিন <ArrowRight size={14} /></span></div><ProductArt cell={0} label="নরম টেডি বিয়ার" /></Link><Link className="promo promo-sage" href="/?category=decor#products"><div><p>ঘরের এক কোণে</p><h2>একটু যত্নের<br />ছোঁয়া</h2><span className="text-link">ঘর সাজান <ArrowRight size={14} /></span></div><ProductArt cell={2} label="সিরামিক ফুলদানি" /></Link></div>
      <section className="occasion-section"><div className="section-title"><h2>কার জন্য খুঁজছেন?</h2><div className="dotted-rule" /></div><div className="occasion-grid">{[{ cell: 1, title: "পড়ুয়াদের জন্য", category: "stationery" }, { cell: 0, title: "ছোটদের জন্য", category: "kids" }, { cell: 4, title: "প্রিয়জনের জন্য", category: "gifts" }, { cell: 5, title: "নিজের জন্য", category: "women" }].map(item => <Link href={`/?category=${item.category}#products`} key={item.title}><ProductArt cell={item.cell} label={item.title} /><h3>{item.title}</h3><span>সংগ্রহ দেখুন</span></Link>)}</div></section>
      <section id="questions" className="questions"><h2>কেনাকাটার আগে</h2><details><summary>এখন কি অর্ডার করা যাবে?</summary><p>দোকান সাজানোর কাজ চলছে। পণ্যের আসল ছবি, দাম ও অর্ডারের সুবিধা যোগ হলে এখানেই পাবেন।</p></details><details><summary>কী কী পাওয়া যাবে?</summary><p>স্টেশনারি, ছোটদের ও নারীদের উপহার, প্লাস্টিকের প্রয়োজনীয় জিনিস এবং ঘর সাজানোর শোপিস।</p></details></section>
    </div>
  </div></div>;
}
