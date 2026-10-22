import Link from "next/link";
import { ProductImage } from "@/components/product-card";
import type { ProductSummary } from "@/lib/catalog";
import { formatTaka } from "@/lib/format";

/** Conveyor-belt strip of the newest products. Pure CSS motion; pauses on hover and for reduced motion. */
export function NewArrivals({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null;
  const copies = Math.max(1, Math.ceil(8 / products.length));
  const group = Array.from({ length: copies }, () => products).flat();
  const render = (hidden: boolean) => <ul className="belt-group" aria-hidden={hidden || undefined}>
    {group.map((p, i) => <li key={`${p.id}-${i}`} style={{ animationDelay: `${(i % 5) * -0.6}s` }}>
      <Link href={`/products/${p.slug}`} tabIndex={hidden ? -1 : undefined}>
        <ProductImage path={p.imagePath} alt={hidden ? "" : p.nameBn} sizes="170px" />
        <h3>{p.nameBn}</h3>
        <span>{formatTaka(p.minPricePaisa)}</span>
      </Link>
    </li>)}
  </ul>;
  return <section className="belt" aria-label="নতুন পণ্য">
    <input className="visually-hidden belt-motion-toggle" type="checkbox" id="belt-motion-toggle" />
    <div className="container-shell"><div className="belt-head"><div><span>✧</span><h2>নতুন এসেছে</h2></div><label className="belt-motion-control" htmlFor="belt-motion-toggle"><span className="belt-pause-text">থামান</span><span className="belt-play-text">চালান</span></label></div></div>
    <div className="belt-window"><div className="belt-track">{render(false)}{render(true)}</div><div className="belt-rail" /></div>
  </section>;
}
