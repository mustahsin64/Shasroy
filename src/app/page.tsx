import { ArrowDown, Flower2, Gift, LampDesk, PencilRuler, Shapes, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const categories = [
  { id: "stationery", number: "০১", title: "খাতা-কলম ও স্টেশনারি", text: "স্কুলের ব্যাগ থেকে নিজের পড়ার টেবিল।", icon: PencilRuler, color: "bg-[#e9eedc]" },
  { id: "kids", number: "০২", title: "ছোটদের উপহার", text: "জন্মদিনে কিংবা এমনিই, ওদের জন্য।", icon: Shapes, color: "bg-[#f5e8bc]" },
  { id: "gifts", number: "০৩", title: "নারীদের উপহার", text: "নিজের পছন্দে, প্রিয়জনের জন্য।", icon: Flower2, color: "bg-[#efdfd1]" },
  { id: "home", number: "০৪", title: "ঘরের প্রয়োজন", text: "প্লাস্টিকের জিনিস আর ঘর গোছানোর টুকিটাকি।", icon: ShoppingBasket, color: "bg-[#e1e9df]" },
  { id: "decor", number: "০৫", title: "শোপিস ও ঘর সাজানো", text: "ছোট্ট একটা জিনিসে ঘরের নতুন চেহারা।", icon: LampDesk, color: "bg-[#eee7d7]" },
];

export default function Home() {
  return (
    <>
      <section className="border-b border-border bg-[#f3efdf]">
        <div className="container-shell grid items-center gap-12 py-12 md:grid-cols-[1.15fr_1fr] md:py-20">
          <div>
            <p className="mb-6 flex items-center gap-3 text-sm text-primary"><span className="h-px w-9 bg-primary" /> আপনার চেনা দোকান, এখন অনলাইনে</p>
            <h1 className="text-[2.75rem] font-bold leading-[1.4] sm:text-6xl">প্রয়োজনের কেনাকাটা,<br /><span className="text-primary">পছন্দের দামেই।</span></h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-muted-foreground">বাচ্চার খাতা-কলম, কারও জন্মদিনের উপহার, কিংবা ঘরের টুকিটাকি—সবই পাবেন সাশ্রয়ে।</p>
            <Button asChild size="lg" className="mt-8 rounded-lg"><Link href="#categories">কী খুঁজছেন, দেখে নিন <ArrowDown className="size-4" /></Link></Button>
            <p className="mt-5 text-sm text-muted-foreground">স্টেশনারি · উপহার · ঘরের জিনিস</p>
          </div>
          <div className="shop-display" aria-hidden="true">
            <div className="display-label">সাশ্রয়ের তাক থেকে</div>
            <div className="display-shelf">
              <div className="notebook"><span>আমার<br />খাতা</span><PencilRuler size={44} strokeWidth={1} /></div>
              <div className="gift-box"><Gift size={76} strokeWidth={1} /><span>তোমার জন্য</span></div>
            </div>
            <div className="display-caption"><span>ছোট ছোট প্রয়োজন।</span><span>এক জায়গায়।</span></div>
          </div>
        </div>
      </section>

      <section id="categories" className="container-shell scroll-mt-32 py-12 md:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-sm text-muted-foreground">আমাদের দোকানে</p><h2 className="text-3xl font-bold">কোনটা লাগবে আপনার?</h2></div><span className="text-sm text-muted-foreground">প্রতিদিনের কাজে, ছোটখাটো আনন্দে</span></div>
        <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map(({ id, number, title, text, icon: Icon, color }) => (
            <article key={id}>
              <div className={`${color} relative mb-4 flex h-40 items-center justify-center rounded-sm border-b-4 border-primary/15`}><span className="absolute left-4 top-3 text-xs text-primary/70">{number}</span><Icon className="size-16 text-primary" strokeWidth={1} /></div>
              <h3 className="text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="border-t border-border bg-[#e8eddf]">
        <div className="container-shell grid gap-5 py-10 md:grid-cols-2 md:items-center">
          <h2 className="text-2xl font-bold leading-relaxed">সব কেনাকাটার জন্য<br />বড় বাজেট লাগে না।</h2>
          <p className="max-w-xl leading-8 text-muted-foreground">সাশ্রয়ে আমরা রাখছি দৈনন্দিন কাজে লাগে এমন জিনিস আর সাধ্যের মধ্যে উপহার। নিজের জন্য হোক বা কাউকে দিতে—পছন্দ করে কিনুন, হিসাব করে খরচ করুন।</p>
        </div>
      </section>
    </>
  );
}
