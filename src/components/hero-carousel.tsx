"use client";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
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

// One slide per storefront category; slugs must match `categories.slug`.
const allSlides: Slide[] = [
  { slug: "gifts", tab: "জন্মদিনের উপহার", eyebrow: "✦ পছন্দের উপহার ✦", title: <>উপহার ছোট হোক,<br /><em>আনন্দটা বড়।</em></>, lines: ["প্রিয় মানুষটির জন্য কিছু খুঁজছেন?", "সাশ্রয়ের দোকানটা ঘুরে দেখুন।"], cta: "উপহার বেছে নিন", image: { src: "/images/gift-hero.png", alt: "সবুজ ও সোনালি ফিতায় মোড়ানো উপহার" }, theme: "photo" },
  { slug: "kids", tab: "ছোটদের উপহার", eyebrow: "✦ ছোটদের জন্য ✦", title: <>ছোট্ট হাতে<br /><em>বড় আনন্দ।</em></>, lines: ["খেলনা, রঙ পেন্সিল আর", "মজার সব জিনিস।"], cta: "দেখে নিন", image: { src: "/images/kids-hero.png", alt: "ছোটদের খেলনা ও রঙিন জিনিস" }, theme: "photo" },
  { slug: "stationery", tab: "খাতা-কলম ও স্টেশনারি", eyebrow: "✦ নতুন শুরু ✦", title: <>খাতা-কলম থেকে<br /><em>গুছানো টেবিল।</em></>, lines: ["পড়ার টেবিলে একটু নতুনত্ব,", "রোজকার দরকারি জিনিস।"], cta: "স্টেশনারি দেখুন", image: { src: "/images/stationery-hero.png", alt: "খাতা, কলম ও স্টেশনারি" }, theme: "photo" },
  { slug: "women", tab: "নারীদের উপহার", eyebrow: "✦ নিজের জন্য ✦", title: <>একটু সাজ,<br /><em>একটু ভালো লাগা।</em></>, lines: ["নিজের পছন্দে, নিজের মতো—", "প্রতিদিনের ছোট ছোঁয়া।"], cta: "সংগ্রহ দেখুন", image: { src: "/images/women-hero.png", alt: "স্কার্ফ, দুল ও ছোট গয়না" }, theme: "photo" },
  { slug: "home", tab: "ঘরের প্রয়োজন", eyebrow: "✦ ঘরের প্রয়োজন ✦", title: <>রোজকার কাজে<br /><em>গুছানো ঘর।</em></>, lines: ["প্লাস্টিকের দরকারি জিনিস থেকে", "রান্নাঘরের ছোট সঙ্গী।"], cta: "দেখে নিন", image: { src: "/images/kitchen-hero.png", alt: "বাটি, কৌটা ও রান্নাঘরের দরকারি জিনিস" }, theme: "photo" },
  { slug: "decor", tab: "শোপিস ও ঘর সাজানো", eyebrow: "✦ ঘর সাজানো ✦", title: <>ঘরের এক কোণে<br /><em>যত্নের ছোঁয়া।</em></>, lines: ["শোপিস, ফুলদানি আর", "ছোট ছোট সাজের জিনিস।"], cta: "ঘর সাজান", image: { src: "/images/decor-hero.png", alt: "ফুলদানি, মোমবাতি ও ছোট শোপিস" }, theme: "photo" },
];

/** Shows only slides whose category is active, so a tab never leads to an unfiltered list. */
export function HeroCarousel({ categorySlugs }: { categorySlugs: string[] }) {
  const slides = allSlides.filter(slide => categorySlugs.includes(slide.slug));
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const count = slides.length;
  const go = (n: number) => setIndex((prev) => (prev + n + count) % count);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (count < 2 || userPaused || interactionPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((p) => (p + 1) % count), 6000);
    return () => clearInterval(timer);
  }, [count, interactionPaused, userPaused]);

  const selectTab = (next: number, focus = false) => {
    const target = (next + count) % count;
    setIndex(target);
    if (focus) tabRefs.current[target]?.focus();
  };

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, tabIndex: number) => {
    const next = event.key === "ArrowRight" ? tabIndex + 1
      : event.key === "ArrowLeft" ? tabIndex - 1
      : event.key === "Home" ? 0
      : event.key === "End" ? count - 1
      : null;
    if (next === null) return;
    event.preventDefault();
    selectTab(next, true);
  };

  if (count === 0) return null;

  return (
    <div className="hero-carousel" onMouseEnter={() => setInteractionPaused(true)} onMouseLeave={() => setInteractionPaused(false)} onFocusCapture={() => setInteractionPaused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false); }} aria-roledescription="স্লাইডশো" aria-label="পণ্যের বিভাগ">
      <div className="hero-tabs" role="tablist" aria-label="পণ্যের বিভাগ">
        {slides.map((slide, i) => (
          <button ref={node => { tabRefs.current[i] = node; }} key={slide.slug} id={`hero-tab-${slide.slug}`} type="button" role="tab" aria-controls={`hero-panel-${slide.slug}`} aria-selected={i === index} tabIndex={i === index ? 0 : -1} className={i === index ? "on" : ""} onKeyDown={event => onTabKeyDown(event, i)} onClick={() => setIndex(i)}>{slide.tab}</button>
        ))}
      </div>
      <div className="hero-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((slide, i) => (
          <article key={slide.slug} id={`hero-panel-${slide.slug}`} className={`hero-slide hero-${slide.theme}`} aria-hidden={i !== index} aria-labelledby={`hero-tab-${slide.slug}`} role="tabpanel" inert={i !== index}>
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
      <button type="button" className="hero-pause" onClick={() => setUserPaused(value => !value)} aria-pressed={userPaused} aria-label={userPaused ? "স্লাইডশো চালু করুন" : "স্লাইডশো থামান"}>{userPaused ? <Play size={18} /> : <Pause size={18} />}</button>
      <div className="hero-dots" aria-hidden="true">
        {slides.map((slide, i) => <span key={slide.slug} className={i === index ? "on" : ""} />)}
      </div>
    </div>
  );
}
