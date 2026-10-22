"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("storefront error", error.digest ?? error.message); }, [error]);
  return <div className="shop-background"><div className="container-shell status-page">
    <h1>কিছু একটা সমস্যা হয়েছে</h1>
    <p>একটু পরে আবার চেষ্টা করুন।</p>
    <div className="status-actions">
      <button type="button" className="status-link" onClick={reset}>আবার চেষ্টা করুন</button>
      <Link className="status-link status-link-ghost" href="/">শুরুর পাতা</Link>
    </div>
  </div></div>;
}
