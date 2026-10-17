import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { href: "/#about", label: "সাশ্রয়ের কথা" },
  { href: "/#categories", label: "পণ্যের বিভাগ" },
];

export function SiteFooter() {
  return (
    <footer className="border-t-4 border-accent bg-brand-deep text-white">
      <div className="container-shell grid gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Link className="relative block h-24 w-52 overflow-hidden rounded-xl bg-[#fffdf5]" href="/">
            <Image
              alt="সাশ্রয়"
              className="object-cover object-[center_56%]"
              fill
              sizes="208px"
              src="/brand/shasroy-logo.png"
            />
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
            খাতা-কলম থেকে ঘরের টুকিটাকি।<br />আপনার পছন্দ, আপনার দামে।
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/70">
          {footerLinks.map((item) => (
            <Link className="hover:text-brand-gold" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="container-shell py-4 text-xs text-white/55">
          © {new Date().getFullYear().toLocaleString("bn-BD", { useGrouping: false })} সাশ্রয়। সর্বস্বত্ব সংরক্ষিত।
        </div>
      </div>
    </footer>
  );
}
