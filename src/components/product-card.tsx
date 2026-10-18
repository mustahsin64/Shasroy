import { Gift } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ProductSummary } from "@/lib/catalog";
import { formatTaka, stockLabel } from "@/lib/format";
import { productImageUrl } from "@/lib/storage";

export function ProductImage({ path, alt, sizes, priority }: { path: string | null; alt: string; sizes: string; priority?: boolean }) {
  if (!path) return <div className="product-photo product-photo-empty" role="img" aria-label={alt}><Gift size={42} strokeWidth={1} /></div>;
  return <div className="product-photo"><Image src={productImageUrl(path)} alt={alt} fill sizes={sizes} preload={priority} /></div>;
}

export function ProductCard({ product }: { product: ProductSummary }) {
  const stock = stockLabel(product.stockQuantity);
  const price = formatTaka(product.minPricePaisa);
  return <article className="product-card">
    <Link href={`/products/${product.slug}`} className="product-card-link">
      <ProductImage path={product.imagePath} alt={product.nameBn} sizes="(max-width: 650px) 50vw, (max-width: 1100px) 30vw, 230px" />
      <p className="product-category">{product.categoryNameBn}</p>
      <h3>{product.nameBn}</h3>
      <p className="product-price">{product.minPricePaisa === product.maxPricePaisa ? price : <>{price} <small>থেকে</small></>}</p>
      <p className={`stock-badge stock-${stock.tone}`}>{stock.text}</p>
    </Link>
  </article>;
}
