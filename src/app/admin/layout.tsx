import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = { title: { default: "অ্যাডমিন", template: "%s | সাশ্রয় অ্যাডমিন" }, robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-shell">{children}</div>;
}
