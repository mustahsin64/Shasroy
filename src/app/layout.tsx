import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";
import "./storefront.css";
import "@fontsource-variable/noto-serif-bengali";

export const metadata: Metadata = {
  title: {
    default: "সাশ্রয় — আপনার পছন্দ আপনার দামে",
    template: "%s | সাশ্রয়",
  },
  description:
    "খাতা-কলম, ছোটদের উপহার, নারীদের উপহার, প্লাস্টিকের জিনিস ও শোপিস—প্রয়োজনের কেনাকাটা পছন্দের দামে, সাশ্রয়ে।",
};

export const viewport: Viewport = {
  themeColor: "#214c35",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
