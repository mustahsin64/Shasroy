"use client";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Slide = {
  slug: string;
  tab: string;
  eyebrow: string;
  title: React.ReactNode;
  lines: string[];
  cta: string;
  image?: { src: string; alt: string };
  theme: "photo" | "green" | "gold" | "sand";
};

const slides: Slide[] = [
  { slug: "gifts", tab: "উপহার সামগ্রী", eyebrow: "✦ পছন্দের উপহার ✦", title: <>উপহার ছোট হোক,<br /><em>আনন্দটা বড়।</em></>, lines: ["প্রিয় মানুষটির জন্য কিছু খুঁজছেন?", "সাশ্রয়ের দোকানটা ঘুরে দেখুন।"], cta: "উপহার বেছে নিন", image: { src: "/images/gift-hero.png", alt: "সবুজ ও সোনালি ফিতায় মোড়ানো উপহার" }, theme: "photo" },
  { slug: "kids", tab: "ছোটদের জন্য", eyebrow: "✦ ছোটদের জন্য ✦", title: <>ছোট্ট হাতে<br /><em>বড় আনন্দ।</em></>, lines: ["খেলনা, রঙ পেন্সিল আর", "মজার সব জিনিস।"], cta: "দেখে নিন", image: { src: "/images/kids-hero.png", alt: "ছোটদের খেলনা ও রঙিন জিনিস" }, theme: "photo" },
  { slug: "stationery", tab: "স্টেশনারি", eyebrow: "✦ নতুন শুরু ✦", title: <>খাতা-কলম থেকে<br /><em>গুছানো টেবিল।</em></>, lines: ["পড়ার টেবিলে একটু নতুনত্ব,", "রোজকার দরকারি জিনিস।"], cta: "স্টেশনারি দেখুন", image: { src: "/images/stationery-hero.png", alt: "খাতা, কলম ও স্টেশনারি" }, theme: "photo" },
  { slug: "women", tab: "নারীদের ফ্যাশন", eyebrow: "✦ নিজের জন্য ✦", title: <>একটু সাজ,<br /><em>একটু ভালো লাগা।</em></>, lines: ["নিজের পছন্দে, নিজের মতো—", "প্রতিদিনের ছোট ছোঁয়া।"], cta: "সংগ্রহ দেখুন", image: { src: "/images/women-hero.png", alt: "নারীদের ফ্যাশন ও গয়না" }, theme: "photo" },
  { slug: "kitchen", tab: "রান্নাঘরের জিনিস", eyebrow: "✦ ঘরের প্রয়োজন ✦", title: <>রান্নাঘরের<br /><em>দরকারি সঙ্গী।</em></>, lines: ["কাজে লাগে, গুছিয়ে রাখা সহজ—", "রোজকার রান্নার সঙ্গী।"], cta: "দেখে নিন", image: { src: "/images/kitchen-hero.png", alt: "রান্নাঘরের দরকারি জিনিস" }, theme: "photo" },
  { slug: "travel", tab: "ভ্রমণের জিনিস", eyebrow: "✦ পথ চলায় ✦", title: <>পথ চলায়<br /><em>সঙ্গে দরকারিটা।</em></>, lines: ["ব্যাগ থেকে ছোট প্রয়োজন,", "ভ্রমণ হোক ঝামেলাহীন।"], cta: "দেখে নিন", image: { src: "/images/travel-hero.png", alt: "ভ্রমণের ব্যাগ ও দরকারি জিনিস" }, theme: "photo" },
  { slug: "wearable", tab: "পরিধানযোগ্য", eyebrow: "✦ আরামের সঙ্গী ✦", title: <>আরামের পোশাক,<br /><em>রোজের সঙ্গী।</em></>, lines: ["সহজ, আরামদায়ক আর", "পছন্দের মতো।"], cta: "দেখে নিন", image: { src: "/images/wearable-hero.png", alt: "আরামের পোশাক ও পরিধানযোগ্য" }, theme: "photo" },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const go = (n: number) => setIndex((prev) => (prev + n + count) % count);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = setInterval(() => setIndex((p) => (p + 1) % count), 6000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [count]);

  const pause = () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };

  return (
    <div className="hero-carousel" onMouseEnter={pause} onFocusCapture={pause} aria-roledescription="স্লাইডশো">
      <div className="hero-tabs" role="tablist" aria-label="পণ্যের বিভাগ">
        {slides.map((slide, i) => (
          <button key={slide.slug} type="button" role="tab" aria-selected={i === index} className={i === index ? "on" : ""} onClick={() => setIndex(i)}>{slide.tab}</button>
        ))}
      </div>
      <div className="hero-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((slide, i) => (
          <article key={slide.slug} className={`hero-slide hero-${slide.theme}`} aria-hidden={i !== index} role="group" aria-roledescription="স্লাইড" aria-label={`${i + 1} / ${count}`}>
            {slide.image && <Image src={slide.image.src} alt={slide.image.alt} fill preload={i === 0} sizes="100vw" className="hero-photo" />}
            <div className="hero-copy">
              <p className="eyebrow">{slide.eyebrow}</p>
              <h1>{slide.title}</h1>
              <p>{slide.lines.map((line, j) => <span key={j}>{line}<br /></span>)}</p>
              <Link className="shop-link" href={`/?category=${slide.slug}#products`} tabIndex={i === index ? undefined : -1}>{slide.cta} <ArrowRight size={16} /></Link>
            </div>
          </article>
        ))}
      </div>
      <button type="button" className="hero-arrow hero-prev" onClick={() => go(-1)} aria-label="আগের স্লাইড"><ChevronLeft size={22} /></button>
      <button type="button" className="hero-arrow hero-next" onClick={() => go(1)} aria-label="পরের স্লাইড"><ChevronRight size={22} /></button>
      <div className="hero-dots" aria-hidden="true">
        {slides.map((slide, i) => <span key={slide.slug} className={i === index ? "on" : ""} />)}
      </div>
    </div>
  );
}
