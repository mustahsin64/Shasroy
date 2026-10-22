import { ChevronRight, Banknote, PackageCheck, ArrowUpRight, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { ProductGallery } from "@/components/product-gallery";
import { ProductImage } from "@/components/product-card";
import { JsonLd } from "@/components/json-ld";
import { MAX_QUANTITY_PER_LINE } from "@/lib/cart";
import { getProductBySlug, listProducts } from "@/lib/catalog";
import { listDeliveryZones } from "@/lib/checkout";
import { formatDeliveryDays, formatTaka, stockLabel } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import { productImageUrl } from "@/lib/storage";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ variant?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "পণ্য পাওয়া যায়নি", robots: { index: false } };
  const image = product.images[0]?.storagePath ? productImageUrl(product.images[0].storagePath) : undefined;
  return {
    title: product.nameBn,
    description: product.descriptionBn ?? undefined,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.nameBn,
      description: product.descriptionBn ?? undefined,
      url: `/products/${product.slug}`,
      images: image ? [image] : undefined,
    },
  };
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
  const [relatedAll, zones] = await Promise.all([listProducts({ categorySlug: product.category.slug }), listDeliveryZones()]);
  const related = relatedAll.filter(item => item.id !== product.id).slice(0, 2);

  const prices = product.variants.map(v => v.pricePaisa);
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameBn,
    description: product.descriptionBn ?? undefined,
    category: product.category.nameBn,
    image: product.images[0]?.storagePath ? productImageUrl(product.images[0].storagePath) : undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BDT",
      lowPrice: (Math.min(...prices) / 100).toFixed(2),
      highPrice: (Math.max(...prices) / 100).toFixed(2),
      offerCount: product.variants.length,
      availability: variant.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/products/${product.slug}`),
    },
  };

  return <div className="shop-background product-page"><div className="container-shell"><JsonLd data={productLd} />
    <nav className="breadcrumb" aria-label="অবস্থান">
      <Link href="/">শুরুর পাতা</Link><ChevronRight size={13} />
      <Link href={`/?category=${product.category.slug}#products`}>{product.category.nameBn}</Link><ChevronRight size={13} />
      <span aria-current="page">{product.nameBn}</span>
    </nav>
    <div className="product-detail">
      <ProductGallery key={variant.id} images={product.images} fallbackAlt={product.nameBn} initialIndex={Math.max(variantImageIndex, 0)} />
      <div className="product-info">
        <p className="product-category">{product.category.nameBn}</p>
        <p className={`stock-badge stock-${stock.tone}`}>{stock.text}</p>
        <h1>{product.nameBn}</h1>
        <p className="detail-price">
          {formatTaka(variant.pricePaisa)}
          {variant.compareAtPricePaisa && <del>{formatTaka(variant.compareAtPricePaisa)}</del>}
        </p>

        {product.variants.length > 1 && <div className="variant-picker">
          <h2>ধরন বেছে নিন</h2>
          <div>{product.variants.map(v => <Link key={v.id} href={`/products/${product.slug}?variant=${encodeURIComponent(v.sku)}`} replace scroll={false} aria-current={v.id === variant.id ? "true" : undefined} className={v.stockQuantity <= 0 ? "variant-out" : undefined}>
            {v.nameBn}
          </Link>)}</div>
        </div>}

        {product.variants.length === 1 && <p className="single-variant">{variant.nameBn}</p>}

        <AddToCartForm key={variant.id} variantId={variant.id} maxQuantity={Math.min(variant.stockQuantity, MAX_QUANTITY_PER_LINE)} />
        <p className="purchase-hint">ক্যাশ অন ডেলিভারি · পণ্য হাতে পেয়ে টাকা দিন।</p>
        <Link className="product-browse-bag" href="/cart">শপিং ব্যাগ দেখুন <ArrowUpRight size={18} /></Link>
        {product.descriptionBn && <details className="product-disclosure product-description-disclosure"><summary>পণ্যের বিস্তারিত</summary><p>{product.descriptionBn}</p></details>}
        {related.length > 0 && <section className="product-related" aria-labelledby="related-title">
          <h2 id="related-title">সঙ্গে আরও দেখতে পারেন</h2>
          {related.map(item => <Link className="related-product" href={`/products/${item.slug}`} key={item.id}>
            <ProductImage path={item.imagePath} alt={item.nameBn} sizes="96px" />
            <div><h3>{item.nameBn}</h3><p>{formatTaka(item.minPricePaisa)}{item.minPricePaisa !== item.maxPricePaisa && " থেকে"}</p></div>
            <span className="related-arrow"><ArrowUpRight size={22} /></span>
          </Link>)}
        </section>}
        <div className="product-service-notes">
          <span><Banknote size={22} /> হাতে পেয়ে টাকা দিন</span>
          <span><PackageCheck size={22} /> দেখে নিয়ে টাকা দিন</span>
        </div>
        {zones.length > 0 && <section className="delivery-zones" aria-labelledby="delivery-title">
          <h2 id="delivery-title"><Truck size={20} /> ডেলিভারি খরচ ও সময়</h2>
          <ul>{zones.map(zone => <li key={zone.id}><span>{zone.nameBn}</span><strong>{formatTaka(zone.feePaisa)}</strong><small>{formatDeliveryDays(zone.minDays, zone.maxDays)}</small></li>)}</ul>
        </section>}
        <details className="product-disclosure"><summary>অর্ডার করবেন যেভাবে</summary><p>ধরন ও পরিমাণ বেছে “এখনই কিনুন” চাপুন, অথবা ব্যাগে যোগ করে পরে চেকআউটে যান। চেকআউটে নাম, ফোন ও ঠিকানা দিন। অর্ডার করার আগে ডেলিভারিসহ মোট খরচ দেখতে পাবেন।</p></details>
        <p className="sku-line">কোড: {variant.sku}</p>
      </div>
    </div>
  </div></div>;
}
