import { Banknote, Clock, Search, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { NavLinks } from "@/components/nav-links";
import { ShopClock } from "@/components/shop-clock";
import { WeatherIcon } from "@/components/weather-icon";
import { formatBanglaClock } from "@/lib/bangla-clock";
import { getCartCount } from "@/lib/cart";
import { formatNumberBn } from "@/lib/format";
import { getVisitorWeather } from "@/lib/visitor-weather";
import { WEATHER_LABEL_BN } from "@/lib/weather";

// Fills #shop-clock while the HTML is parsed, before first paint (no flash, no hydration error).
const clockScript = `(function(){var e=document.getElementById("shop-clock");if(e)e.textContent=(${formatBanglaClock.toString()})(Date.now(),-new Date().getTimezoneOffset())})()`;

const links = [
  { href: "/", label: "শুরুর পাতা" },
  { href: "/products", label: "সব পণ্য" },
  { href: "/#budget", label: "বাজেটে উপহার" },
  { href: "/#occasions", label: "উপলক্ষ" },
  { href: "/#new", label: "নতুন এসেছে" },
  { href: "/faq", label: "সাধারণ প্রশ্ন" },
];

export async function SiteHeader() {
  const [cartCount, weather] = await Promise.all([getCartCount(), getVisitorWeather()]);
  return <>
    <div className="top-bar">
      <div className="container-shell top-bar-row">
        <span className="top-bar-promise"><Banknote size={16} strokeWidth={1.8} aria-hidden="true" />হাতে পেয়ে টাকা দিন · সারা দেশে ডেলিভারি</span>
        <span className="top-bar-live">
          <span className="top-bar-weather"><WeatherIcon weather={weather} />{weather.cityName}{weather.temperatureC !== null && ` ${formatNumberBn(weather.temperatureC)}°`} · {WEATHER_LABEL_BN[weather.kind]}</span>
          <span className="top-bar-clock"><Clock size={15} strokeWidth={1.8} aria-hidden="true" /><ShopClock /></span>
          <script dangerouslySetInnerHTML={{ __html: clockScript }} />
        </span>
      </div>
    </div>
    <header className="store-header">
      <div className="container-shell header-row">
        <Link href="/" aria-label="সাশ্রয় — শুরুর পাতা" className="store-logo"><Image src="/brand/shasroy-logo.png" alt="সাশ্রয়" fill sizes="150px" preload className="object-cover object-[center_52%] mix-blend-multiply" /></Link>
        <form action="/products" role="search" className="header-search">
          <Search size={18} strokeWidth={1.8} aria-hidden="true" />
          <input name="q" type="search" aria-label="পণ্য খুঁজুন" placeholder="উপহার, খাতা, মগ… খুঁজুন" />
          <button type="submit">খুঁজুন</button>
        </form>
        <Link href="/cart" className="header-bag" aria-label={`আমার ব্যাগ, ${formatNumberBn(cartCount)}টি পণ্য`}><span className="cart-icon"><ShoppingBag size={24} strokeWidth={1.6} />{cartCount > 0 && <b>{formatNumberBn(cartCount)}</b>}</span><span className="header-bag-label">ব্যাগ</span></Link>
      </div>
    </header>
    {/* Outside the header so it stays sticky after the logo row scrolls away. */}
    <nav className="main-nav" aria-label="প্রধান মেনু"><div className="container-shell"><NavLinks links={links} /></div></nav>
    <MobileTabBar cartCount={cartCount} />
  </>;
}
