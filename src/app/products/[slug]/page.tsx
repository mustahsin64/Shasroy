import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product-gallery";
import { getProductBySlug } from "@/lib/catalog";
import { formatTaka, stockLabel } from "@/lib/format";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ variant?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "পণ্য পাওয়া যায়নি" };
  return { title: product.nameBn, description: product.descriptionBn ?? undefined };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ slug }, { variant: variantParam }] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const variant =
    product.variants.find(v => v.sku === variantParam) ??
    product.variants.find(v => v.isDefault) ??
    product.variants[0];
  const stock = stockLabel(variant.stockQuantity);
  const variantImageIndex = product.images.findIndex(image => image.variantId === variant.id);

  return <div className="shop-background"><div className="container-shell">
    <nav className="breadcrumb" aria-label="অবস্থান">
      <Link href="/">শুরুর পাতা</Link><ChevronRight size={13} />
      <Link href={`/?category=${product.category.slug}#products`}>{product.category.nameBn}</Link><ChevronRight size={13} />
      <span aria-current="page">{product.nameBn}</span>
    </nav>
    <div className="product-detail">
      <ProductGallery key={variant.id} images={product.images} fallbackAlt={product.nameBn} initialIndex={Math.max(variantImageIndex, 0)} />
      <div className="product-info">
        <p className="product-category">{product.category.nameBn}</p>
        <h1>{product.nameBn}</h1>
        <p className="detail-price">
          {formatTaka(variant.pricePaisa)}
          {variant.compareAtPricePaisa && <del>{formatTaka(variant.compareAtPricePaisa)}</del>}
        </p>
        <p className={`stock-badge stock-${stock.tone}`}>{stock.text}</p>

        {product.variants.length > 1 && <div className="variant-picker">
          <h2>ধরন বেছে নিন</h2>
          <div>{product.variants.map(v => <Link key={v.id} href={`/products/${product.slug}?variant=${encodeURIComponent(v.sku)}`} replace scroll={false} aria-current={v.id === variant.id ? "true" : undefined} className={v.stockQuantity <= 0 ? "variant-out" : undefined}>
            {v.nameBn}
          </Link>)}</div>
        </div>}

        {product.descriptionBn && <div className="product-description"><h2>বিস্তারিত</h2><p>{product.descriptionBn}</p></div>}

        <div className="purchase-note">
          <button type="button" disabled>ব্যাগে যোগ করুন</button>
          <p>নমুনা পণ্য · অর্ডারের সুবিধা শিগগিরই চালু হবে।</p>
        </div>
        <p className="sku-line">কোড: {variant.sku}</p>
      </div>
    </div>
  </div></div>;
}
