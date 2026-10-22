import type { Metadata, Viewport } from "next";

import { JsonLd } from "@/components/json-ld";
import { siteUrl } from "@/lib/site";

import "./globals.css";
import "./storefront.css";
import "@fontsource-variable/noto-serif-bengali";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
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
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "সাশ্রয়",
    url: siteUrl(),
    logo: `${siteUrl()}/brand/shasroy-logo.png`,
  };
  return (
    <html lang="bn">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <JsonLd data={organizationLd} />
      </body>
    </html>
  );
}
