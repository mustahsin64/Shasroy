import { ChevronRight, Banknote, Package, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { ProductGallery } from "@/components/product-gallery";
import { ProductImage } from "@/components/product-card";
import { MAX_QUANTITY_PER_LINE } from "@/lib/cart";
import { getProductBySlug, listProducts } from "@/lib/catalog";
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
  const related = (await listProducts({ categorySlug: product.category.slug })).filter(item => item.id !== product.id).slice(0, 2);

  return <div className="shop-background product-page"><div className="container-shell">
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
          <span><Package size={22} /> ডেলিভারি খরচ চেকআউটে</span>
        </div>
        <details className="product-disclosure"><summary>অর্ডার করবেন যেভাবে</summary><p>ধরন ও পরিমাণ বেছে ব্যাগে যোগ করুন। এরপর ব্যাগ থেকে চেকআউটে গিয়ে নাম, ফোন ও ঠিকানা দিন। অর্ডার করার আগে ডেলিভারিসহ মোট খরচ দেখতে পাবেন।</p></details>
        <p className="sku-line">কোড: {variant.sku}</p>
      </div>
    </div>
  </div></div>;
}
