import { Gift, Menu, Search, ShoppingBag, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ContactLinks } from "@/components/contact-links";
import { getCartCount } from "@/lib/cart";
import { formatNumberBn } from "@/lib/format";

const links = [{ href: "/", label: "শুরুর পাতা" }, { href: "/#products", label: "আমাদের পণ্য" }, { href: "/#categories", label: "বিভাগসমূহ" }, { href: "/#about", label: "আমাদের গল্প" }, { href: "/#ideas", label: "উপহারের ভাবনা" }];

export async function SiteHeader() {
  const cartCount = await getCartCount();
  return <header className="store-header">
    <div className="utility-bar"><div className="container-shell utility-inner"><span>ছোট ছোট আনন্দ, সাধ্যের মধ্যে</span><div><ContactLinks variant="inline" /><span>বাংলা</span><Link href="/#about">সাশ্রয়ের কথা</Link><Link href="/#questions">সাধারণ প্রশ্ন</Link></div></div></div>
    <div className="container-shell masthead">
      <Link href="/" aria-label="সাশ্রয় — শুরুর পাতা" className="store-logo"><Image src="/brand/shasroy-logo.png" alt="সাশ্রয়" fill sizes="180px" preload className="object-cover object-[center_52%] mix-blend-multiply" /></Link>
      <div className="header-note"><Gift strokeWidth={1.3} /><div><span>যাঁকে দিতে চান</span><strong>তাঁর পছন্দের উপহার</strong></div></div>
      <div className="header-note"><Sparkles strokeWidth={1.3} /><div><span>খাতা-কলম থেকে ঘরের জিনিস</span><strong>সবই এক দোকানে</strong></div></div>
      <Link href="/cart" className="header-shop" aria-label={`আমার ব্যাগ, ${formatNumberBn(cartCount)}টি পণ্য`}><span className="cart-icon"><ShoppingBag strokeWidth={1.3} />{cartCount > 0 && <b>{formatNumberBn(cartCount)}</b>}</span><span>আমার<br /><strong>ব্যাগ</strong></span></Link>
    </div>
    <div className="container-shell navigation-row">
      <details className="mobile-menu"><summary aria-label="মেনু খুলুন"><Menu size={23} /> মেনু</summary><nav>{links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav></details>
      <nav className="desktop-nav" aria-label="প্রধান মেনু">{links.map((link, i) => <Link className={i === 0 ? "ribbon-active" : ""} key={link.href} href={link.href}>{link.label}</Link>)}</nav>
      <form action="/#products" className="store-search" role="search"><Search size={18} /><input name="q" aria-label="পণ্য খুঁজুন" placeholder="কী খুঁজছেন?" /><button type="submit" aria-label="খুঁজুন">খুঁজুন</button></form>
    </div>
  </header>;
}
