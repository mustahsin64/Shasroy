/**
 * The homepage hero follows the season, so the shop feels current without
 * anyone editing it. Edit the copy here; months are Bangladesh time.
 */
export type Campaign = {
  kicker: string;
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
};

const CAMPAIGNS: { months: number[]; campaign: Campaign }[] = [
  {
    months: [11, 12, 1],
    campaign: {
      kicker: "শীতের উপহার",
      title: "শীতের সকালে ছোট্ট একটা উষ্ণতা",
      subtitle: "মগ, খাতা আর নরম টেডি—৳৫০০-এর মধ্যে বাছাই করা উপহার।",
      cta: { label: "উপহার বেছে নিন", href: "/products?max=500" },
    },
  },
  {
    months: [2],
    campaign: {
      kicker: "ভালোবাসার মাস",
      title: "প্রিয় মানুষের জন্য ছোট্ট ভালোবাসা",
      subtitle: "দুল, ফুলদানি আর মনে রাখার মতো ছোট্ট উপহার।",
      cta: { label: "উপহার দেখুন", href: "/products?category=women" },
    },
  },
  {
    months: [3, 4],
    campaign: {
      kicker: "নতুন বছর",
      title: "নতুন বছরে পড়ার টেবিলে নতুন কিছু",
      subtitle: "নতুন খাতা, রঙ পেন্সিল আর গুছানো ডেস্ক।",
      cta: { label: "খাতা-কলম দেখুন", href: "/products?category=stationery" },
    },
  },
  {
    months: [5, 6],
    campaign: {
      kicker: "ছুটির দিনের উপহার",
      title: "ছোটদের ছুটিটা হোক রঙিন",
      subtitle: "খেলনা, রঙ পেন্সিল আর আঁকার খাতা।",
      cta: { label: "ছোটদের জিনিস দেখুন", href: "/products?category=kids" },
    },
  },
  {
    months: [7, 8],
    campaign: {
      kicker: "বর্ষার দিন",
      title: "বৃষ্টির দিনে ঘরে বসেই কেনাকাটা",
      subtitle: "ঘরের প্রয়োজন আর ছোট্ট শোপিস, দরজায় পৌঁছে দিই।",
      cta: { label: "ঘরের জিনিস দেখুন", href: "/products?category=home" },
    },
  },
  {
    months: [9, 10],
    campaign: {
      kicker: "উৎসবের উপহার",
      title: "উৎসবের দিনে আপনজনের জন্য",
      subtitle: "সাজিয়ে পাঠানো উপহার, সঙ্গে আপনার লেখা চিরকুট।",
      cta: { label: "উপহার বেছে নিন", href: "/products?category=gifts" },
    },
  },
];

/** Campaign for the current month in Bangladesh time (UTC+6). */
export function currentCampaign(now = Date.now()): Campaign {
  return campaignForMonth(new Date(now + 6 * 3_600_000).getUTCMonth() + 1);
}

export function campaignForMonth(month: number): Campaign {
  return (CAMPAIGNS.find((c) => c.months.includes(month)) ?? CAMPAIGNS[0]).campaign;
}
