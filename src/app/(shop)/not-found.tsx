import Link from "next/link";

export default function NotFound() {
  return <div className="shop-background"><div className="container-shell status-page">
    <h1>পাতাটি পাওয়া যায়নি</h1>
    <p>আপনি যে পাতাটি খুঁজছেন সেটি নেই বা সরে গেছে।</p>
    <Link className="status-link" href="/">শুরুর পাতায় ফিরুন</Link>
  </div></div>;
}
