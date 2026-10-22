import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/** Static opening banner: one message, one primary action. */
export function HomeHero() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-copy">
        <h1 id="home-hero-title">আপনার পছন্দ আপনার দামে।</h1>
        <p>উপহার, স্টেশনারি আর ঘরের প্রয়োজন—আপনার পছন্দ, আপনার দামে।</p>
        <div className="home-hero-actions">
          <Link className="btn-primary" href="/products">পণ্য দেখুন <ArrowRight size={18} aria-hidden="true" /></Link>
          <Link className="btn-link" href="#categories">বিভাগ দেখুন</Link>
        </div>
      </div>
      <div className="home-hero-media">
        <Image src="/images/gift-hero.png" alt="সবুজ ও সোনালি ফিতায় মোড়ানো উপহার" fill preload sizes="(max-width: 760px) 100vw, 50vw" />
      </div>
    </section>
  );
}
