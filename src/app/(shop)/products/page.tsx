import Link from "next/link";
import { CatalogScrollTop } from "@/components/catalog-scroll-top";
import { ProductCard } from "@/components/product-card";
import { ShopFaq } from "@/components/shop-faq";
import { SortSelect } from "@/components/sort-select";
import { listCategories, listProducts, parseSort, type ProductSort } from "@/lib/catalog";
import { listDeliveryZones } from "@/lib/checkout";
import { formatNumberBn } from "@/lib/format";
import { getShopSettings } from "@/lib/shop-settings";
import { Gift } from "lucide-react";
import Image from "next/image";

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "নতুন আগে" },
  { value: "price-asc", label: "দাম: কম থেকে বেশি" },
  { value: "price-desc", label: "দাম: বেশি থেকে কম" },
];

const categoryImages: Record<string, string> = {
  gifts: "/images/gift-hero.png",
  kids: "/images/kids-hero.png",
  stationery: "/images/stationery-hero.png",
  women: "/images/women-hero.png",
  home: "/images/kitchen-hero.png",
  decor: "/images/decor-hero.png",
};

/** Links back into this listing, preserving query, category and sort. */
function listingHref(params: { q?: string; category?: string; sort?: ProductSort }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  const qs = search.toString();
  return `/products${qs ? `?${qs}` : ""}`;
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; category?: string | string[]; sort?: string | string[] }> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const sort = parseSort(params.sort);
  const categories = (await listCategories()).map(c => ({ id: c.slug, title: c.nameBn }));
  const selected = categories.find(c => c.id === params.category);
  const shown = await listProducts({ query, categorySlug: selected?.id, sort });
  const [zones, settings] = await Promise.all([listDeliveryZones(), getShopSettings()]);

  const categoryNav = <section className="category-section desktop-only" aria-labelledby="categories-title">
    <div className="section-title"><h2 id="categories-title">কী খুঁজছেন?</h2><div className="dotted-rule" /></div>
    <ul className="category-grid" role="list">
      <li><Link scroll={false} href={listingHref({ q: query })} aria-current={!selected ? "true" : undefined}><span className="category-thumb"><Gift size={26} strokeWidth={1.2} aria-hidden="true" /></span><span className="category-name">সব পণ্য</span></Link></li>
      {categories.map(c => <li key={c.id}><Link scroll={false} href={listingHref({ q: query, category: c.id, sort })} aria-current={selected?.id === c.id ? "true" : undefined}>
        <span className="category-thumb">{categoryImages[c.id] ? <Image src={categoryImages[c.id]} alt="" fill sizes="(max-width: 650px) 45vw, 180px" /> : <Gift size={34} strokeWidth={1.2} aria-hidden="true" />}</span>
        <span className="category-name">{c.title}</span>
      </Link></li>)}
    </ul>
  </section>;

  const products = <section className="product-section" id="products" aria-labelledby="products-title">
    <div className="products-head"><h2 id="products-title">{selected?.title || (query ? "খোঁজার ফল" : "সব পণ্য")}</h2><SortSelect current={sort} options={sortOptions.map(o => ({ ...o, href: listingHref({ q: query, category: selected?.id, sort: o.value }) }))} /></div>
    <nav className="category-chips mobile-only" aria-label="বিভাগ"><Link scroll={false} href={listingHref({ q: query })} aria-current={!selected ? "true" : undefined}>সব</Link>{categories.map(c => <Link scroll={false} key={c.id} href={listingHref({ q: query, category: c.id, sort })} aria-current={selected?.id === c.id ? "true" : undefined}>{c.title}</Link>)}</nav>
    {query && <p className="search-result">“{query}” খুঁজে পাওয়া গেছে {formatNumberBn(shown.length)}টি পণ্য। <Link scroll={false} href="/products">সব দেখুন</Link></p>}
    <div className="product-grid">{shown.map(product => <ProductCard key={product.id} product={product} />)}</div>
    {shown.length === 0 && <div className="empty-results">{query ? "এই নামে কোনো পণ্য নেই।" : "এই বিভাগে এখনো কোনো পণ্য নেই।"} <Link scroll={false} href="/products">সব পণ্য দেখুন</Link></div>}
  </section>;

  return <div className="shop-background"><div className="container-shell shop-flow">
    <CatalogScrollTop />
    <div className="catalog-layout">{categoryNav}{products}</div>
    <ShopFaq zones={zones} settings={settings} />
  </div></div>;
}
