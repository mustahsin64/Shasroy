import { ArrowRight, Banknote, Gift, MessageCircle, PackageCheck, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BestSellers } from "@/components/best-sellers";
import { HomeHero } from "@/components/home-hero";
import { NewArrivals } from "@/components/new-arrivals";
import { ProductCard, ProductImage } from "@/components/product-card";
import { currentCampaign } from "@/lib/campaign";
import { listBestSellerIds, listCategories, listProducts, priceBands, type ProductSummary } from "@/lib/catalog";
import { listDeliveryZones } from "@/lib/checkout";
import { formatDeliveryDays, formatNumberBn, formatTaka } from "@/lib/format";
import { shopContact } from "@/lib/shop-contact";
import { getShopSettings } from "@/lib/shop-settings";
import { getVisitorWeather } from "@/lib/visitor-weather";

const MIN_PRODUCTS_FOR_ARRIVALS = 6;
const GRID_SIZE = 8;

/** Who-and-why labels and photos for the category tiles. Unlisted categories use their own name. */
const occasions: Record<string, { label: string; image: string }> = {
  gifts: { label: "জন্মদিন", image: "/images/gift-hero.png" },
  kids: { label: "ছোটদের জন্য", image: "/images/kids-hero.png" },
  women: { label: "মা ও বোনের জন্য", image: "/images/women-hero.png" },
  stationery: { label: "পড়ার টেবিল", image: "/images/stationery-hero.png" },
  home: { label: "নতুন সংসার", image: "/images/kitchen-hero.png" },
  decor: { label: "ঘর সাজাতে", image: "/images/decor-hero.png" },
};

function rankProducts(products: ProductSummary[], bestIds: string[]) {
  const rank = new Map(bestIds.map((id, index) => [id, index]));
  // Stable: best sellers first in sales order, then everything else newest first.
  return [...products].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity));
}

export default async function Home() {
  const [categories, newest, bestIds, zones, settings, weather] = await Promise.all([
    listCategories(),
    listProducts({ sort: "newest" }),
    listBestSellerIds(),
    listDeliveryZones(),
    getShopSettings(),
    getVisitorWeather(),
  ]);
  const campaign = currentCampaign();
  const ranked = rankProducts(newest, bestIds);
  const hasSales = bestIds.some(id => newest.some(p => p.id === id));

  const bands = priceBands
    .map(taka => ({ taka, items: ranked.filter(p => p.minPricePaisa <= taka * 100) }))
    .filter(band => band.items.length > 0);

  const tabs = [{ id: "all", label: "সব" }, ...categories
    .filter(c => ranked.filter(p => p.categorySlug === c.slug).length >= 2)
    .slice(0, 4)
    .map(c => ({ id: c.slug, label: c.nameBn }))];
  const panels = Object.fromEntries(tabs.map(tab => {
    const items = (tab.id === "all" ? ranked : ranked.filter(p => p.categorySlug === tab.id)).slice(0, GRID_SIZE);
    return [tab.id, <div className="product-grid" key={tab.id}>{items.map(p => <ProductCard key={p.id} product={p} />)}</div>];
  }));

  const arrivals = newest.length >= MIN_PRODUCTS_FOR_ARRIVALS ? newest.slice(0, 10) : [];
  const days = zones.length > 0 ? formatDeliveryDays(Math.min(...zones.map(z => z.minDays)), Math.max(...zones.map(z => z.maxDays))) : null;
  const chat = shopContact.whatsapp ?? shopContact.phone;

  return <div className="home">
    <HomeHero campaign={campaign} weather={weather} />

    {bands.length > 0 && <section className="band-section" id="budget" aria-labelledby="budget-title">
      <div className="container-shell">
        <div className="section-head"><div><h2 id="budget-title">আপনার বাজেটে উপহার</h2><p>দাম আগে ঠিক করুন, তারপর পছন্দ।</p></div><Link href="/products?sort=price-asc">সব দাম <ArrowRight size={16} aria-hidden="true" /></Link></div>
        <ul className="budget-grid" role="list">
          {bands.map((band, index) => <li key={band.taka}><Link href={`/products?max=${band.taka}`} className={index === 0 ? "budget-card budget-card-gold" : "budget-card"}>
            <span className="budget-amount"><small>নিচে</small>{formatTaka(band.taka * 100)}</span>
            <span className="budget-thumbs" aria-hidden="true">{band.items.slice(0, 3).map(p => <ProductImage key={p.id} path={p.imagePath} alt="" sizes="48px" />)}</span>
            <span className="budget-count">{formatNumberBn(band.items.length)}টি পণ্য</span>
          </Link></li>)}
          <li><Link href="/products" className="budget-card">
            <span className="budget-amount"><small>সব দামের</small>সব পণ্য</span>
            <span className="budget-thumbs" aria-hidden="true">{ranked.slice(3, 6).map(p => <ProductImage key={p.id} path={p.imagePath} alt="" sizes="48px" />)}</span>
            <span className="budget-count">{formatNumberBn(newest.length)}টি পণ্য</span>
          </Link></li>
        </ul>
      </div>
    </section>}

    {categories.length > 0 && <section className="band-section band-white" id="occasions" aria-labelledby="occasions-title">
      <div className="container-shell">
        <div className="section-head"><div><h2 id="occasions-title">কার জন্য, কোন উপলক্ষে?</h2><p>যাঁকে দেবেন, তাঁর কথা ভেবে বেছে নিন।</p></div></div>
        <ul className="occasion-grid" role="list">
          {categories.map(c => {
            const occasion = occasions[c.slug];
            return <li key={c.slug}><Link href={`/products?category=${c.slug}`} className="occasion-tile">
              {occasion ? <Image src={occasion.image} alt="" fill sizes="(max-width: 650px) 33vw, 200px" /> : <span className="occasion-empty"><Gift size={40} strokeWidth={1.1} aria-hidden="true" /></span>}
              <span className="occasion-label">{occasion?.label ?? c.nameBn}{occasion && <small>{c.nameBn}</small>}</span>
            </Link></li>;
          })}
        </ul>
      </div>
    </section>}

    {ranked.length > 0 && <section className="band-section" id="popular" aria-labelledby="popular-title">
      <div className="container-shell">
        <div className="section-head"><div><h2 id="popular-title">{hasSales ? "সবচেয়ে বেশি বিক্রি" : "আমাদের বাছাই"}</h2><p>{hasSales ? "গত ৩০ দিনে যা সবচেয়ে বেশি গেছে।" : "দোকানের পছন্দের কিছু জিনিস।"}</p></div><Link href="/products">সব দেখুন <ArrowRight size={16} aria-hidden="true" /></Link></div>
        <BestSellers tabs={tabs} panels={panels} />
      </div>
    </section>}

    {settings.giftWrapEnabled && <section className="gift-band" aria-labelledby="gift-title">
      <div className="container-shell gift-band-inner">
        <div>
          <h2 id="gift-title">উপহার সাজিয়ে পাঠাই</h2>
          <p>র‍্যাপিং পেপার, ফিতা আর আপনার কথায় লেখা একটা ছোট্ট চিরকুট। প্যাকেটে দামের কাগজ থাকে না। প্রতি অর্ডারে {formatTaka(settings.giftWrapFeePaisa)}।</p>
          <Link className="btn-gold" href="/products?category=gifts">উপহার বেছে নিন <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
        <ol className="gift-steps">
          <li><b>১</b>পণ্য বেছে ব্যাগে রাখুন</li>
          <li><b>২</b>চেকআউটে “গিফট র‍্যাপ” বেছে চিরকুট লিখুন</li>
          <li><b>৩</b>আমরা সাজিয়ে পৌঁছে দিই</li>
        </ol>
      </div>
    </section>}

    <NewArrivals products={arrivals} />

    <section className="band-section band-white trust-section" aria-label="কেন সাশ্রয়">
      <ul className="container-shell trust-strip" role="list">
        <li><Banknote size={26} strokeWidth={1.6} aria-hidden="true" /><span>হাতে পেয়ে টাকা দিন<small>ক্যাশ অন ডেলিভারি, অগ্রিম লাগে না</small></span></li>
        <li><PackageCheck size={26} strokeWidth={1.6} aria-hidden="true" /><span>দেখে নিয়ে টাকা দিন<small>ডেলিভারির সময় পণ্য দেখে নিন</small></span></li>
        <li><Truck size={26} strokeWidth={1.6} aria-hidden="true" /><span>সারা দেশে ডেলিভারি<small>{days ?? "ঠিকানা অনুযায়ী সময়"}</small></span></li>
        {chat && <li><MessageCircle size={26} strokeWidth={1.6} aria-hidden="true" /><span>প্রশ্ন থাকলে জিজ্ঞেস করুন<small><a href={chat.href} {...(shopContact.whatsapp ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{shopContact.whatsapp ? "হোয়াটসঅ্যাপে মেসেজ করুন" : chat.display}</a></small></span></li>}
      </ul>
    </section>
  </div>;
}
