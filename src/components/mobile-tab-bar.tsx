"use client";
import { Gift, House, LayoutGrid, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatNumberBn } from "@/lib/format";

const GIFT_HASHES = ["#occasions", "#budget"];

/** Phone-only bottom navigation: the four places shoppers go most. */
export function MobileTabBar({ cartCount }: { cartCount: number }) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    // Soft navigations change the hash without a hashchange event; resync after taps.
    const onClick = () => [0, 80, 300].forEach(ms => setTimeout(sync, ms));
    window.addEventListener("hashchange", sync);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("hashchange", sync);
      document.removeEventListener("click", onClick, true);
    };
  }, [pathname]);

  const onGift = pathname === "/" && GIFT_HASHES.includes(hash);
  const tabs = [
    { href: "/", label: "শুরু", icon: House, active: pathname === "/" && !onGift },
    { href: "/products", label: "পণ্য", icon: LayoutGrid, active: pathname.startsWith("/products") },
    { href: "/#occasions", label: "উপহার", icon: Gift, active: onGift },
    { href: "/cart", label: "ব্যাগ", icon: ShoppingBag, active: pathname.startsWith("/cart") || pathname.startsWith("/checkout") },
  ];

  return <nav className="tab-bar" aria-label="প্রধান মেনু">
    {tabs.map(({ href, label, icon: Icon, active }) => <Link key={href} href={href} aria-current={active ? "page" : undefined}>
      <span className="tab-icon">
        <Icon size={22} strokeWidth={active ? 2.1 : 1.7} aria-hidden="true" />
        {href === "/cart" && cartCount > 0 && <b aria-label={`${formatNumberBn(cartCount)}টি পণ্য`}>{formatNumberBn(cartCount)}</b>}
      </span>
      {label}
    </Link>)}
  </nav>;
}
