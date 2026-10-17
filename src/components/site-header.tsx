import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";


const navigation = [
  { href: "/", label: "শুরুর পাতা" },
  { href: "/#categories", label: "পণ্যের বিভাগ" },
  { href: "/#about", label: "সাশ্রয়ের কথা" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 shadow-[0_1px_14px_rgb(0_92_39/0.05)] backdrop-blur">
      <div className="bg-brand-deep px-4 py-2 text-center text-xs font-medium text-primary-foreground sm:text-sm">
        আপনার পছন্দ <span className="mx-2 text-brand-gold">✦</span> আপনার দামে
      </div>
      <div className="container-shell flex h-[4.5rem] items-center gap-3 sm:gap-4">
        <details className="group relative md:hidden">
          <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full hover:bg-muted [&::-webkit-details-marker]:hidden">
            <Menu aria-hidden="true" className="size-5" />
            <span className="sr-only">মেনু খুলুন</span>
          </summary>
          <nav className="absolute left-0 top-12 w-56 rounded-2xl border border-border bg-background p-2 shadow-xl">
            {navigation.map((item) => (
              <Link
                key={item.href}
                className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-muted"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </details>

        <Link
          aria-label="সাশ্রয় — শুরুর পাতা"
          className="relative h-12 w-32 shrink-0 overflow-hidden rounded-lg sm:w-36"
          href="/"
        >
          <Image
            alt="সাশ্রয়"
            className="object-cover object-[center_48%] mix-blend-multiply"
            fill
            priority
            sizes="144px"
            src="/brand/shasroy-logo.png"
          />
        </Link>

        <nav className="ml-6 hidden items-center gap-7 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/#categories" className="ml-auto whitespace-nowrap border-b-2 border-accent pb-1 text-sm font-semibold text-primary">দোকান ঘুরে দেখুন</Link>
      </div>
    </header>
  );
}
