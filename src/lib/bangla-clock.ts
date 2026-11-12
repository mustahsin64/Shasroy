/**
 * "বিকেল ৪:২৫" for a timestamp at a UTC offset in minutes (Bangladesh, +360, by default).
 * In the browser pass `-new Date().getTimezoneOffset()` for the visitor's local time.
 *
 * Self-contained on purpose: SiteHeader inlines this function's source as a
 * <script> so the clock is correct before first paint. Keep every helper and
 * constant inside the function body.
 */
export function formatBanglaClock(ms: number, offsetMinutes = 360): string {
  const d = new Date(ms + offsetMinutes * 60000);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const period = h < 4 ? "রাত" : h < 6 ? "ভোর" : h < 12 ? "সকাল" : h < 15 ? "দুপুর" : h < 18 ? "বিকেল" : h < 20 ? "সন্ধ্যা" : "রাত";
  const digits = "০১২৩৪৫৬৭৮৯";
  const bn = (n: number) => String(n).replace(/\d/g, (x) => digits[Number(x)]);
  return period + " " + bn(h % 12 || 12) + ":" + bn(m).padStart(2, "০");
}
