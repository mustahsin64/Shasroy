import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/components/product-card";
import type { ProductSummary } from "@/lib/catalog";
import { formatTaka } from "@/lib/format";

/** Newest products in a sideways row: touch, trackpad and keyboard (focus the row, then arrow keys). */
export function NewArrivals({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null;
  return <section className="band-section" id="new" aria-labelledby="arrivals-title">
    <div className="container-shell">
      <div className="section-head"><div><h2 id="arrivals-title">নতুন এসেছে</h2><p>পাশে সরিয়ে দেখুন</p></div><Link href="/products">সব দেখুন <ArrowRight size={16} aria-hidden="true" /></Link></div>
      <ul className="arrivals-row" role="list" tabIndex={0} aria-label="নতুন পণ্য, পাশে স্ক্রল করুন">
        {products.map(p => <li key={p.id}>
          <Link href={`/products/${p.slug}`}>
            <ProductImage path={p.imagePath} alt="" sizes="(max-width: 650px) 42vw, 200px" />
            <h3>{p.nameBn}</h3>
            <span>{formatTaka(p.minPricePaisa)}</span>
          </Link>
        </li>)}
      </ul>
    </div>
  </section>;
}
