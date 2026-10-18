import Link from "next/link";

export default function ProductNotFound() {
  return <div className="shop-background"><div className="container-shell">
    <div className="product-missing">
      <h1>পণ্যটি পাওয়া যায়নি</h1>
      <p>হয়তো পণ্যটি সরিয়ে নেওয়া হয়েছে, অথবা ঠিকানায় ভুল আছে।</p>
      <Link href="/#products">সব পণ্য দেখুন</Link>
    </div>
  </div></div>;
}
