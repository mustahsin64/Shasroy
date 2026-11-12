import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { WeatherIcon } from "@/components/weather-icon";
import { WeatherScene } from "@/components/weather-scene";
import type { Campaign } from "@/lib/campaign";
import { formatNumberBn } from "@/lib/format";
import { WEATHER_LABEL_BN, type ShopWeather } from "@/lib/weather";

/** Seasonal campaign over a landscape that follows the visitor's weather. */
export function HomeHero({ campaign, weather }: { campaign: Campaign; weather: ShopWeather }) {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <WeatherScene kind={weather.kind} isDay={weather.isDay} />
      <div className="container-shell home-hero-inner">
        <div className="home-hero-copy">
          <span className="hero-kicker">{campaign.kicker}</span>
          <h1 id="home-hero-title">{campaign.title}</h1>
          <p>{campaign.subtitle}</p>
          <div className="home-hero-actions">
            <Link className="btn-primary" href={campaign.cta.href}>{campaign.cta.label} <ArrowRight size={18} aria-hidden="true" /></Link>
            <Link className="btn-secondary" href="#budget">বাজেট অনুযায়ী দেখুন</Link>
          </div>
          <p className="hero-weather"><WeatherIcon weather={weather} size={16} />{weather.cityName}{weather.temperatureC !== null && ` ${formatNumberBn(weather.temperatureC)}°`} · {WEATHER_LABEL_BN[weather.kind]}</p>
        </div>
        <div className="home-hero-media">
          <Image src="/images/gift-hero.png" alt="সবুজ ও সোনালি কাগজে মোড়ানো উপহার আর একটি টেডি বিয়ার" fill preload sizes="(max-width: 760px) 100vw, 46vw" />
        </div>
      </div>
    </section>
  );
}
