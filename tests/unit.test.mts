// Pure logic only: no database, no network. Run with `npm test`.
import assert from "node:assert/strict";
import { describe, it } from "node:test";

// The service modules create a (lazy) database client on import. These tests never
// run a query, so a dummy URL keeps them independent of real credentials.
process.env.DATABASE_URL ??= "postgresql://unit:test@localhost:5432/unit";

const { takaStringToPaisa } = await import("@/lib/money");
const { buildShopContact, parseFacebookUrl, parsePhone, parseWhatsapp } = await import("@/lib/shop-contact");
const { deliveryZoneInputSchema, deliveryZoneUpdateSchema, normalizeBdPhone } = await import("@/lib/validation");
const { buildOrderSearch, collectionState } = await import("@/lib/admin/orders");
const { noteBodySchema } = await import("@/lib/admin/order-notes");
const { hasRole } = await import("@/lib/roles");
const { classifyWeather, seasonalWeather, dhakaMonthHour, localMonthHour } = await import("@/lib/weather");
const { formatBanglaClock } = await import("@/lib/bangla-clock");
const { locationFromHeaders, FALLBACK_LOCATION } = await import("@/lib/visitor-location");

describe("takaStringToPaisa", () => {
  it("is exact, with no float rounding", () => {
    assert.equal(takaStringToPaisa("250"), 25000);
    assert.equal(takaStringToPaisa("250.5"), 25050);
    assert.equal(takaStringToPaisa("0.29"), 29);
    assert.equal(takaStringToPaisa("19.99"), 1999);
    assert.equal(takaStringToPaisa("0"), 0);
  });
  it("rejects excess precision, negatives, exponents and junk", () => {
    for (const bad of ["1.234", "-5", "1e3", "", "abc", "1,000", "12345678"]) assert.equal(takaStringToPaisa(bad), null, bad);
  });
});

describe("phone normalisation", () => {
  it("handles +880, 880, Bangla digits and separators", () => {
    for (const input of ["01712345678", "+8801712345678", "8801712345678", "০১৭১২৩৪৫৬৭৮", " 017-1234 5678 "]) assert.equal(normalizeBdPhone(input), "01712345678", input);
  });
});

describe("order search builder", () => {
  it("returns null for blank input and bounds length", () => {
    assert.equal(buildOrderSearch("   "), null);
    assert.ok(buildOrderSearch("a".repeat(500))!.text.length <= 82);
  });
  it("escapes LIKE wildcards so % and _ are literal", () => {
    assert.equal(buildOrderSearch("50%_")!.text, "%50\\%\\_%");
  });
  it("derives a partial phone pattern from 3+ digits, incl. Bangla digits and +880", () => {
    assert.equal(buildOrderSearch("১৭১২")!.phone, "%1712%");
    assert.equal(buildOrderSearch("+88017")!.phone, "%017%");
    assert.equal(buildOrderSearch("SH-1003")!.phone, null);
    assert.equal(buildOrderSearch("12")!.phone, null);
  });
});

describe("order notes validation", () => {
  it("trims, rejects empty and oversized", () => {
    assert.equal(noteBodySchema.parse("  hello\r\nworld \n"), "hello\nworld");
    assert.equal(noteBodySchema.safeParse("   ").success, false);
    assert.equal(noteBodySchema.safeParse("x".repeat(2001)).success, false);
    assert.equal(noteBodySchema.safeParse("x".repeat(2000)).success, true);
  });
});

describe("collectionState (what the courier collects)", () => {
  const base = { status: "confirmed", paymentMethod: "cod", paymentStatus: "unpaid", totalPaisa: 152000 } as const;
  it("collects only for unpaid COD that is not cancelled", () => {
    assert.deepEqual(collectionState(base), { kind: "collect", amountPaisa: 152000 });
    assert.equal(collectionState({ ...base, paymentStatus: "paid" }).kind, "paid");
    assert.equal(collectionState({ ...base, status: "cancelled" }).kind, "cancelled");
    assert.equal(collectionState({ ...base, paymentStatus: "refunded" }).kind, "refunded");
    assert.equal(collectionState({ ...base, paymentMethod: "sslcommerz" }).kind, "none");
  });
});

describe("delivery zone validation", () => {
  const ok = { slug: "dhaka", nameBn: "ঢাকা", feePaisa: 0, minDays: 1, maxDays: 2, sortOrder: 0, isActive: true };
  it("allows a zero fee, rejects negative fee/days and reversed ranges", () => {
    assert.equal(deliveryZoneInputSchema.safeParse(ok).success, true);
    assert.equal(deliveryZoneInputSchema.safeParse({ ...ok, feePaisa: -1 }).success, false);
    assert.equal(deliveryZoneInputSchema.safeParse({ ...ok, minDays: -1 }).success, false);
    assert.equal(deliveryZoneInputSchema.safeParse({ ...ok, minDays: 5, maxDays: 2 }).success, false);
  });
  it("update schema never accepts a slug change", () => {
    const parsed = deliveryZoneUpdateSchema.parse({ ...ok, slug: "hacked" });
    assert.equal("slug" in parsed, false);
  });
});

describe("shop contact", () => {
  it("omits everything that is empty or invalid and never invents values", () => {
    const c = buildShopContact({ phone: "123", whatsapp: "", facebookUrl: "javascript:alert(1)", email: "not-an-email", pickupAddress: "  " });
    assert.equal(c.hasAny, false);
  });
  it("builds tel:, wa.me (digits only, no message text) and mailto links", () => {
    assert.equal(parsePhone("01712345678")!.href, "tel:+8801712345678");
    assert.equal(parseWhatsapp("+8801712345678")!.href, "https://wa.me/8801712345678");
    assert.equal(parseWhatsapp("01712345678")!.href, "https://wa.me/8801712345678");
    assert.equal(parseWhatsapp("+14155550123")!.href, "https://wa.me/14155550123");
    assert.equal(buildShopContact({ email: "hi@example.com" }).email!.href, "mailto:hi@example.com");
  });
  it("accepts only https Facebook URLs", () => {
    assert.equal(parseFacebookUrl("https://www.facebook.com/shasroy")!.href, "https://www.facebook.com/shasroy");
    for (const bad of ["http://facebook.com/x", "https://evil.com/facebook.com", "https://facebook.com.evil.com/x", "javascript:alert(1)", "https://facebook.com/", ""]) {
      assert.equal(parseFacebookUrl(bad), null, bad);
    }
  });
});

describe("role ranking", () => {
  const admin = (role: "staff" | "manager" | "owner") => ({ id: "x", email: "x@example.com", displayName: null, role });
  it("staff < manager < owner", () => {
    assert.equal(hasRole(admin("staff"), "manager"), false);
    assert.equal(hasRole(admin("manager"), "manager"), true);
    assert.equal(hasRole(admin("manager"), "owner"), false);
    assert.equal(hasRole(admin("owner"), "staff"), true);
  });
});

describe("weather classification", () => {
  const base = { temperatureC: 28, apparentC: 30, weatherCode: 1, precipitationMm: 0, month: 11 };
  it("rain wins over everything else", () => {
    assert.equal(classifyWeather({ ...base, weatherCode: 63 }), "rain");
    assert.equal(classifyWeather({ ...base, temperatureC: 36, weatherCode: 95 }), "rain");
    assert.equal(classifyWeather({ ...base, precipitationMm: 0.4 }), "rain");
  });
  it("hot on the reading or a humid feels-like", () => {
    assert.equal(classifyWeather({ ...base, temperatureC: 34 }), "hot");
    assert.equal(classifyWeather({ ...base, temperatureC: 31, apparentC: 37 }), "hot");
  });
  it("winter when cold, or cool in Dec-Feb, or foggy and cool", () => {
    assert.equal(classifyWeather({ ...base, temperatureC: 16 }), "winter");
    assert.equal(classifyWeather({ ...base, temperatureC: 23, month: 1 }), "winter");
    assert.equal(classifyWeather({ ...base, temperatureC: 23, weatherCode: 45 }), "winter");
  });
  it("normal otherwise", () => {
    assert.equal(classifyWeather(base), "normal");
    assert.equal(classifyWeather({ ...base, temperatureC: 23, month: 11 }), "normal");
  });
  it("falls back to Bangladesh seasons", () => {
    assert.deepEqual([1, 4, 7, 10, 12].map(seasonalWeather), ["winter", "hot", "rain", "normal", "winter"]);
  });
  it("reads month and hour in Bangladesh time (UTC+6)", () => {
    // 2026-12-31 20:30 UTC is 2027-01-01 02:30 in Dhaka.
    assert.deepEqual(dhakaMonthHour(Date.UTC(2026, 11, 31, 20, 30)), { month: 1, hour: 2 });
  });
  it("reads month and hour in the visitor's zone, Bangladesh when unknown", () => {
    const ms = Date.UTC(2026, 6, 1, 12, 0);
    assert.deepEqual(localMonthHour(ms, "Europe/London"), { month: 7, hour: 13 });
    assert.deepEqual(localMonthHour(ms, null), { month: 7, hour: 18 });
    assert.deepEqual(localMonthHour(ms, "Not/AZone"), { month: 7, hour: 18 });
  });
});

describe("visitor location", () => {
  const h = (entries: Record<string, string>) => new Headers(entries);
  it("falls back to Dhaka without geolocation headers", () => {
    assert.deepEqual(locationFromHeaders(h({})), FALLBACK_LOCATION);
    assert.deepEqual(locationFromHeaders(h({ "x-vercel-ip-latitude": "abc", "x-vercel-ip-longitude": "90" })), FALLBACK_LOCATION);
    assert.deepEqual(locationFromHeaders(h({ "x-vercel-ip-latitude": "95", "x-vercel-ip-longitude": "90" })), FALLBACK_LOCATION);
  });
  it("rounds coordinates and names Bangladesh cities in Bangla", () => {
    const loc = locationFromHeaders(h({ "x-vercel-ip-latitude": "22.3569", "x-vercel-ip-longitude": "91.7832", "x-vercel-ip-city": "Chittagong", "x-vercel-ip-timezone": "Asia/Dhaka" }));
    assert.deepEqual(loc, { latitude: 22.4, longitude: 91.8, cityName: "চট্টগ্রাম", timeZone: "Asia/Dhaka", isFallback: false });
  });
  it("keeps other city names as sent and drops a malformed zone", () => {
    const loc = locationFromHeaders(h({ "x-vercel-ip-latitude": "51.5", "x-vercel-ip-longitude": "-0.12", "x-vercel-ip-city": "S%C3%A3o%20Paulo", "x-vercel-ip-timezone": "<x>" }));
    assert.equal(loc.cityName, "São Paulo");
    assert.equal(loc.timeZone, null);
    assert.equal(locationFromHeaders(h({ "x-vercel-ip-latitude": "51.5", "x-vercel-ip-longitude": "-0.12" })).cityName, "আপনার এলাকা");
  });
});

describe("Bangla clock", () => {
  const at = (h: number, m: number) => Date.UTC(2026, 10, 12, h, m) - 6 * 3_600_000; // Dhaka wall time
  it("uses the Bangla time of day, 12-hour Bangla digits and a padded minute", () => {
    assert.equal(formatBanglaClock(at(16, 25)), "বিকেল ৪:২৫");
    assert.equal(formatBanglaClock(at(9, 5)), "সকাল ৯:০৫");
    assert.equal(formatBanglaClock(at(12, 0)), "দুপুর ১২:০০");
    assert.equal(formatBanglaClock(at(0, 30)), "রাত ১২:৩০");
    assert.equal(formatBanglaClock(at(5, 10)), "ভোর ৫:১০");
    assert.equal(formatBanglaClock(at(18, 45)), "সন্ধ্যা ৬:৪৫");
    assert.equal(formatBanglaClock(at(21, 0)), "রাত ৯:০০");
  });
  it("shows another zone's wall time from its UTC offset", () => {
    // 16:25 in Dhaka is 10:25 UTC and 15:55 in Kolkata (+330).
    assert.equal(formatBanglaClock(at(16, 25), 0), "সকাল ১০:২৫");
    assert.equal(formatBanglaClock(at(16, 25), 330), "বিকেল ৩:৫৫");
  });
});
