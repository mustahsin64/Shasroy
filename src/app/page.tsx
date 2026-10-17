import { ArrowRight, Gift, HeartHandshake, Leaf, PencilRuler, Shapes, Flower2, House, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const categories = [
  { id: "stationery", title: "খাতা-কলম ও স্টেশনারি", icon: PencilRuler },
  { id: "kids", title: "ছোটদের উপহার", icon: Shapes },
  { id: "women", title: "নারীদের উপহার", icon: Flower2 },
  { id: "home", title: "ঘরের প্রয়োজন", icon: House },
  { id: "decor", title: "শোপিস ও ঘর সাজানো", icon: Leaf },
  { id: "gifts", title: "জন্মদিনের উপহার", icon: Gift },
];
const products = [
  { name: "নরম টেডি বিয়ার", category: "kids", cell: 0, description: "ছোটদের জন্মদিনে দেওয়ার মতো নরম খেলনা।" },
  { name: "নোটবুক ও কলম সেট", category: "stationery", cell: 1, description: "ক্লাসের নোট আর নিজের টুকিটাকি লেখার জন্য।" },
  { name: "সিরামিক ফুলদানি", category: "decor", cell: 2, description: "পড়ার টেবিল বা তাকের এক কোণে মানিয়ে যাবে।" },
  { name: "ডেস্ক অর্গানাইজার", category: "home", cell: 3, description: "কলম, পেন্সিল আর ছোট জিনিস গুছিয়ে রাখুন।" },
  { name: "পাতার নকশার মগ", category: "gifts", cell: 4, description: "চা-পছন্দ করা মানুষটির জন্য ছোট্ট উপহার।" },
  { name: "ফুলের নকশার দুল", category: "women", cell: 5, description: "সোনালি রঙের ছোট ফুলের নকশা।" },
  { name: "কাঠের ছোট্ট বাড়ি", category: "decor", cell: 6, description: "ঘর সাজানোর জন্য ছোট আকারের শোপিস।" },
  { name: "রঙ পেন্সিলের সেট", category: "stationery", cell: 7, description: "ছোটদের আঁকিবুঁকির খাতায় রঙ যোগ করতে।" },
];

function ProductArt({ cell, label }: { cell: number; label: string }) {
  return <div role="img" aria-label={label} className="product-art" style={{ backgroundPosition: `${(cell % 4) * 100 / 3}% ${cell < 4 ? 0 : 100}%` }} />;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const selected = categories.find(c => c.id === params.category);
  const shown = products.filter(p => (!selected || p.category === selected.id) && (!query || `${p.name} ${p.description}`.includes(query)));
  return <div className="shop-background"><div className="container-shell shop-columns">
    <aside className="shop-sidebar" id="categories">
      <nav className="category-menu" aria-label="পণ্যের বিভাগ"><h2>কী খুঁজছেন?</h2>{categories.map(({ id, title, icon: Icon }) => <Link aria-current={selected?.id === id ? "true" : undefined} key={id} href={`/?category=${id}#products`}><Icon size={19} strokeWidth={1.4} /><span>{title}</span><ChevronRight size={14} /></Link>)}<Link href="/#products"><Gift size={19} strokeWidth={1.4} /><span>সব পণ্য দেখুন</span><ChevronRight size={14} /></Link></nav>
      <div className="sidebar-values">{[{ icon: Gift, title: "উপহার হোক মনের মতো", text: "বয়স আর পছন্দ মিলিয়ে বেছে নিন।" }, { icon: Leaf, title: "ঘরের ছোট প্রয়োজন", text: "কাজে লাগে, রাখতেও ভালো লাগে।" }, { icon: HeartHandshake, title: "সাধ্যের মধ্যে কেনাকাটা", text: "নিজের বাজেট বুঝে নিজের পছন্দে।" }].map(({ icon: Icon, title, text }) => <div key={title}><span className="value-icon"><Icon size={31} strokeWidth={1.2} /></span><h3>{title}</h3><p>{text}</p></div>)}</div>
      <div className="sidebar-gift"><Gift size={62} strokeWidth={1} /><p>জন্মদিন আসছে?</p><h2>ছোট্ট কিছু,<br />অনেকটা ভালোবাসা।</h2><Link href="/?category=gifts#products">উপহার দেখুন <ArrowRight size={14} /></Link></div>
      <section className="sidebar-articles" id="ideas"><h2>উপহারের ভাবনা</h2><article><span>০১ / ছোটদের জন্য</span><h3>শুধু খেলনা নয়, রঙ পেন্সিলও হতে পারে উপহার</h3><p>সঙ্গে একটা আঁকার খাতা দিলে, নতুন ছবি আঁকার শুরুটা হয়ে যায়।</p></article><article><span>০২ / নিজের ঘর</span><h3>পড়ার টেবিলে একটু নতুনত্ব</h3><p>একটা ফুলদানি, কলম রাখার জায়গা আর গুছানো খাতা—ব্যস।</p></article></section>
      <div className="sidebar-quote"><span>“</span><p>উপহারের দাম নয়,<br />মনে রাখাটাই আসল।</p><small>— সাশ্রয়ের কথা</small></div>
    </aside>

    <div className="shop-main">
      <section className="gift-hero"><Image src="/images/gift-hero.png" alt="সবুজ ও সোনালি ফিতায় মোড়ানো উপহার" fill preload sizes="(max-width: 900px) 100vw, 950px" className="hero-photo" /><div className="hero-copy"><p className="eyebrow">✦ পছন্দের উপহার ✦</p><h1>উপহার ছোট হোক,<br /><em>আনন্দটা বড়।</em></h1><p>প্রিয় মানুষটির জন্য কিছু খুঁজছেন?<br />সাশ্রয়ের দোকানটা ঘুরে দেখুন।</p><Link className="shop-link" href="/?category=gifts#products">উপহার বেছে নিন <ArrowRight size={16} /></Link></div><div className="hero-footnote">আপনার পছন্দ · আপনার দামে</div></section>
      <div className="promo-pair"><Link className="promo promo-green" href="/?category=women#products"><div><p>নিজের জন্য, প্রিয়জনের জন্য</p><h2>একটু সাজ,<br />একটু ভালো লাগা।</h2><span className="text-link">দেখে নিন <ArrowRight size={14} /></span></div><ProductArt cell={5} label="সোনালি ফুলের দুল" /></Link><Link className="promo promo-gold" href="/?category=stationery#products"><div className="promo-inset"><p>নতুন খাতার গন্ধে</p><h2>নতুন শুরুর গল্প</h2><span className="text-link">স্টেশনারি দেখুন</span></div></Link></div>
      <section className="product-section" id="products"><div className="section-title"><span>✧</span><h2>{selected?.title || "আমাদের পছন্দের কিছু"}</h2><div className="dotted-rule" /></div><p className="sample-note">নমুনা সংগ্রহ · ছবি ধারণামূলক; আসল পণ্য ও দাম শিগগিরই যোগ হবে।</p>{query && <p className="search-result">“{query}” খুঁজে পাওয়া গেছে {shown.length.toLocaleString("bn-BD")}টি নমুনা। <Link href="/#products">সব দেখুন</Link></p>}<div className="product-grid">{shown.map(product => <article className="product-card" key={product.name}><ProductArt cell={product.cell} label={product.name} /><p className="product-category">{categories.find(c => c.id === product.category)?.title}</p><h3>{product.name}</h3><details><summary>একটু বিস্তারিত <span>+</span></summary><p>{product.description}</p><small>এটি নমুনা। এখনই অর্ডার করা যাবে না।</small></details></article>)}</div>{shown.length === 0 && <div className="empty-results">এই নামে কোনো নমুনা নেই। <Link href="/#products">সব পণ্য দেখুন</Link></div>}</section>
      <div className="promo-pair lower-promos"><Link className="promo promo-cream" href="/?category=kids#products"><div><p>ছোটদের বড় আনন্দ</p><h2>ওদের জন্য<br />আলাদা কিছু</h2><span className="text-link">দেখে নিন <ArrowRight size={14} /></span></div><ProductArt cell={0} label="নরম টেডি বিয়ার" /></Link><Link className="promo promo-sage" href="/?category=decor#products"><div><p>ঘরের এক কোণে</p><h2>একটু যত্নের<br />ছোঁয়া</h2><span className="text-link">ঘর সাজান <ArrowRight size={14} /></span></div><ProductArt cell={2} label="সিরামিক ফুলদানি" /></Link></div>
      <section className="occasion-section"><div className="section-title"><h2>কার জন্য খুঁজছেন?</h2><div className="dotted-rule" /></div><div className="occasion-grid">{[{ cell: 1, title: "পড়ুয়াদের জন্য", category: "stationery" }, { cell: 0, title: "ছোটদের জন্য", category: "kids" }, { cell: 4, title: "প্রিয়জনের জন্য", category: "gifts" }, { cell: 5, title: "নিজের জন্য", category: "women" }].map(item => <Link href={`/?category=${item.category}#products`} key={item.title}><ProductArt cell={item.cell} label={item.title} /><h3>{item.title}</h3><span>সংগ্রহ দেখুন</span></Link>)}</div></section>
      <section id="questions" className="questions"><h2>কেনাকাটার আগে</h2><details><summary>এখন কি অর্ডার করা যাবে?</summary><p>দোকান সাজানোর কাজ চলছে। পণ্যের আসল ছবি, দাম ও অর্ডারের সুবিধা যোগ হলে এখানেই পাবেন।</p></details><details><summary>কী কী পাওয়া যাবে?</summary><p>স্টেশনারি, ছোটদের ও নারীদের উপহার, প্লাস্টিকের প্রয়োজনীয় জিনিস এবং ঘর সাজানোর শোপিস।</p></details></section>
    </div>
  </div></div>;
}
