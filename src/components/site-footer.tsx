import Link from "next/link";
import { ContactLinks } from "@/components/contact-links";
import { listCategories } from "@/lib/catalog";
import { shopContact } from "@/lib/shop-contact";

export async function SiteFooter() {
  const categories = await listCategories();
  return <footer className="store-footer" id="about"><div className="container-shell footer-columns">
    <div className="footer-about"><h2>সাশ্রয়</h2><p>স্কুলের খাতা-কলম, জন্মদিনের উপহার কিংবা ঘর সাজানোর ছোট্ট শোপিস। প্রয়োজন আর পছন্দের এই জিনিসগুলো নিয়েই আমাদের দোকান।</p><p className="footer-signature">উপহার মানে একটু মনে রাখা। দামটা যতই ছোট হোক, যত্নটা যেন বোঝা যায়।</p></div>
    <nav aria-labelledby="footer-shop"><h2 id="footer-shop">দোকান</h2><ul role="list">{categories.map(c => <li key={c.slug}><Link href={`/products?category=${c.slug}`}>{c.nameBn}</Link></li>)}</ul></nav>
    <nav aria-labelledby="footer-help"><h2 id="footer-help">সাহায্য</h2><ul role="list"><li><Link href="/faq">সাধারণ প্রশ্ন</Link></li><li><Link href="/products">সব পণ্য</Link></li><li><Link href="/#budget">বাজেটে উপহার</Link></li><li><Link href="/cart">আমার ব্যাগ</Link></li></ul></nav>
    {shopContact.hasAny && <div><h2>যোগাযোগ</h2><ContactLinks /></div>}
  </div><div className="container-shell footer-bottom"><span>© {new Date().getFullYear().toLocaleString("bn-BD", { useGrouping: false })} সাশ্রয়। সর্বস্বত্ব সংরক্ষিত।</span><span>আপনার পছন্দ, আপনার দামে।</span></div></footer>;
}
