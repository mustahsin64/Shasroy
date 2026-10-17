import Link from "next/link";
import { Flower2 } from "lucide-react";

export function SiteFooter() {
  return <footer className="store-footer" id="about"><div className="container-shell footer-columns">
    <div><h2>আমাদের সাশ্রয়</h2><p>স্কুলের খাতা-কলম, জন্মদিনের উপহার কিংবা ঘর সাজানোর ছোট্ট শোপিস। প্রয়োজন আর পছন্দের এই জিনিসগুলো নিয়েই আমাদের দোকান।</p><span className="footer-signature">আপনার পছন্দ, আপনার দামে।</span></div>
    <div><h2>দোকান ঘুরে দেখুন</h2><Link href="/?category=stationery#products">খাতা-কলম ও স্টেশনারি</Link><Link href="/?category=kids#products">ছোটদের উপহার</Link><Link href="/?category=women#products">নারীদের উপহার</Link><Link href="/?category=home#products">ঘরের প্রয়োজন</Link></div>
    <div><h2>আরও জানুন</h2><Link href="/#ideas">উপহারের ভাবনা</Link><Link href="/#questions">সাধারণ প্রশ্ন</Link><Link href="/#products">পণ্যের নমুনা</Link><Link href="/#categories">সব বিভাগ</Link></div>
    <div className="footer-message"><Flower2 size={32} strokeWidth={1} /><h2>উপহার মানে একটু মনে রাখা।</h2><p>দামটা যতই ছোট হোক,<br />যত্নটা যেন বোঝা যায়।</p></div>
  </div><div className="container-shell footer-bottom"><span>© {new Date().getFullYear().toLocaleString("bn-BD", { useGrouping: false })} সাশ্রয়। সর্বস্বত্ব সংরক্ষিত।</span><span>স্টেশনারি · উপহার · ঘরের জিনিস</span></div></footer>;
}
