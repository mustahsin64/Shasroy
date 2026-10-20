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
