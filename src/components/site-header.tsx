import { Menu, Search, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ContactLinks } from "@/components/contact-links";
import { getCartCount } from "@/lib/cart";
import { formatNumberBn } from "@/lib/format";

const links = [{ href: "/", label: "শুরুর পাতা" }, { href: "/#products", label: "আমাদের পণ্য" }, { href: "/#categories", label: "বিভাগসমূহ" }, { href: "/#about", label: "আমাদের গল্প" }, { href: "/#ideas", label: "উপহারের ভাবনা" }, { href: "/#questions", label: "সাধারণ প্রশ্ন" }];

export async function SiteHeader() {
  const cartCount = await getCartCount();
  return <header className="store-header">
    <div className="announce-bar">ছোট ছোট আনন্দ, সাধ্যের মধ্যে</div>
    <div className="container-shell cp-main">
      <div className="cp-left">
        <details className="mobile-menu"><summary aria-label="মেনু খুলুন"><Menu size={24} strokeWidth={1.5} /></summary><nav>{links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav></details>
        <ContactLinks variant="inline" />
      </div>
      <Link href="/" aria-label="সাশ্রয় — শুরুর পাতা" className="store-logo"><Image src="/brand/shasroy-logo.png" alt="সাশ্রয়" fill sizes="180px" preload className="object-cover object-[center_52%] mix-blend-multiply" /></Link>
      <div className="cp-right">
        <details className="search-pop"><summary aria-label="পণ্য খুঁজুন"><Search size={24} strokeWidth={1.5} /></summary>
          <form action="/#products" role="search"><input name="q" aria-label="পণ্য খুঁজুন" placeholder="কী খুঁজছেন?" /><button type="submit">খুঁজুন</button></form>
        </details>
        <Link href="/cart" className="cp-bag" aria-label={`আমার ব্যাগ, ${formatNumberBn(cartCount)}টি পণ্য`}><span className="cart-icon"><ShoppingBag size={24} strokeWidth={1.5} />{cartCount > 0 && <b>{formatNumberBn(cartCount)}</b>}</span></Link>
      </div>
    </div>
    <nav className="cp-nav" aria-label="প্রধান মেনু"><div className="container-shell">{links.map((link, i) => <Link aria-current={i === 0 ? "page" : undefined} key={link.href} href={link.href}>{link.label}</Link>)}</div></nav>
  </header>;
}
