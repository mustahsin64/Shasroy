// Approximate visitor location from the IP-geolocation headers Vercel adds to
// every request (no browser permission prompt). Requests without them — local
// dev, or a host that does not send them — fall back to Dhaka.

export type VisitorLocation = {
  /** Rounded to ~11 km so nearby visitors share one cached weather response. */
  latitude: number;
  longitude: number;
  /** Bangla name for known Bangladesh cities, otherwise the name as sent. */
  cityName: string;
  /** IANA zone such as "Asia/Dhaka", when known. */
  timeZone: string | null;
  isFallback: boolean;
};

export const FALLBACK_LOCATION: VisitorLocation = {
  latitude: 23.8,
  longitude: 90.4,
  cityName: "ঢাকা",
  timeZone: "Asia/Dhaka",
  isFallback: true,
};

const CITY_BN: Record<string, string> = {
  dhaka: "ঢাকা", chittagong: "চট্টগ্রাম", chattogram: "চট্টগ্রাম", khulna: "খুলনা", rajshahi: "রাজশাহী",
  sylhet: "সিলেট", barisal: "বরিশাল", barishal: "বরিশাল", rangpur: "রংপুর", mymensingh: "ময়মনসিংহ",
  comilla: "কুমিল্লা", cumilla: "কুমিল্লা", narayanganj: "নারায়ণগঞ্জ", gazipur: "গাজীপুর", tongi: "টঙ্গী",
  savar: "সাভার", bogra: "বগুড়া", bogura: "বগুড়া", jessore: "যশোর", jashore: "যশোর",
  "cox's bazar": "কক্সবাজার", "cox’s bazar": "কক্সবাজার", dinajpur: "দিনাজপুর", tangail: "টাঙ্গাইল",
  narsingdi: "নরসিংদী", feni: "ফেনী", pabna: "পাবনা", kushtia: "কুষ্টিয়া", noakhali: "নোয়াখালী",
  "brahmanbaria": "ব্রাহ্মণবাড়িয়া", faridpur: "ফরিদপুর", sirajganj: "সিরাজগঞ্জ", jamalpur: "জামালপুর",
  kishoreganj: "কিশোরগঞ্জ", habiganj: "হবিগঞ্জ", moulvibazar: "মৌলভীবাজার", chandpur: "চাঁদপুর",
  sunamganj: "সুনামগঞ্জ", natore: "নাটোর", naogaon: "নওগাঁ", bhola: "ভোলা", patuakhali: "পটুয়াখালী",
};

export function cityNameBn(city: string): string {
  return CITY_BN[city.trim().toLowerCase()] ?? city.trim();
}

function coordinate(raw: string | null, limit: number): number | null {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || Math.abs(value) > limit) return null;
  return Math.round(value * 10) / 10;
}

function decodeHeader(raw: string | null): string {
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Reads Vercel's x-vercel-ip-* headers; anything missing or malformed means Dhaka. */
export function locationFromHeaders(headers: Pick<Headers, "get">): VisitorLocation {
  const latitude = coordinate(headers.get("x-vercel-ip-latitude"), 90);
  const longitude = coordinate(headers.get("x-vercel-ip-longitude"), 180);
  if (latitude === null || longitude === null) return FALLBACK_LOCATION;
  const city = decodeHeader(headers.get("x-vercel-ip-city")).slice(0, 60);
  const timeZone = headers.get("x-vercel-ip-timezone");
  return {
    latitude,
    longitude,
    cityName: city ? cityNameBn(city) : "আপনার এলাকা",
    timeZone: timeZone && /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(timeZone) ? timeZone : null,
    isFallback: false,
  };
}
