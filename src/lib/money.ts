import { z } from "zod";

/** Converts Bangla digits to Latin so form input like "২৫০" parses. Non-strings pass through. */
export const bnDigitsToLatin = (v: unknown) => (typeof v === "string" ? v.replace(/[০-৯]/g, d => String("০১২৩৪৫৬৭৮৯".indexOf(d))) : v);

/**
 * Taka typed by a person ("250", "250.5", "২৫০.৫০") to integer paisa.
 * Pure string arithmetic, so there is no floating-point rounding; more than
 * two decimals, negatives and exponents are rejected.
 */
export function takaStringToPaisa(input: string): number | null {
  const match = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(input.trim());
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}

export const takaToPaisa = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const paisa = takaStringToPaisa(v);
    if (paisa === null) {
      ctx.addIssue({ code: "custom", message: "টাকায় লিখুন, যেমন ২৫০ বা 250.50 (পয়সা সর্বোচ্চ দুই ঘর)।" });
      return z.NEVER;
    }
    return paisa;
  });
