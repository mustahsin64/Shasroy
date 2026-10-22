"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavLink = { href: string; label: string };

/** Marks the nav item that matches the current route/anchor, so the highlight follows the page. */
export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    // Next soft-navigations update the hash without a hashchange event and only after the route
    // commits, so resync a few times after any click until the new hash has settled.
    const onClick = () => [0, 60, 200, 450].forEach(ms => setTimeout(sync, ms));
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
      document.removeEventListener("click", onClick, true);
    };
  }, [pathname]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/" && hash === href.slice(1);
    if (href === "/") return pathname === "/" && !hash;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return <>{links.map(link => <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? "page" : undefined}>{link.label}</Link>)}</>;
}
