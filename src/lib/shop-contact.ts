import { z } from "zod";
import { BD_MOBILE_PATTERN, normalizeBdPhone } from "@/lib/validation";

/**
 * The shop's public contact details: one place, used by the header, footer,
 * order confirmation and FAQ. Public information only; credentials live in .env.
 *
 * Fill in the real values below. Anything left empty or invalid is omitted
 * from every page; nothing here is ever invented.
 */
export const rawShopContact = {
  phone: "", // e.g. "01712345678"
  whatsapp: "", // e.g. "01712345678" or "+8801712345678"
  facebookUrl: "", // e.g. "https://www.facebook.com/shasroy"
  email: "", // e.g. "hello@example.com"
  pickupAddress: "", // optional, shown as plain text
};

type Raw = Partial<Record<keyof typeof rawShopContact, string>>;

const FACEBOOK_HOSTS = new Set(["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com", "www.fb.com", "fb.me"]);

const bnDigits = (value: string) => value.replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[Number(d)]);

export function parsePhone(value: string | undefined) {
  const local = normalizeBdPhone(value ?? "");
  if (!BD_MOBILE_PATTERN.test(local)) return null;
  return { display: bnDigits(local), href: `tel:+88${local}` };
}

/** Digits-only international number for wa.me; no message text is ever attached. */
export function parseWhatsapp(value: string | undefined) {
  const text = (value ?? "").trim();
  if (!text) return null;
  const local = normalizeBdPhone(text);
  const digits = BD_MOBILE_PATTERN.test(local) ? `88${local}` : /^\+[1-9]\d{7,14}$/.test(text.replace(/[\s-]/g, "")) ? text.replace(/[\s+-]/g, "") : null;
  return digits ? { display: bnDigits(BD_MOBILE_PATTERN.test(local) ? local : `+${digits}`), href: `https://wa.me/${digits}` } : null;
}

export function parseFacebookUrl(value: string | undefined) {
  try {
    const url = new URL((value ?? "").trim());
    if (url.protocol !== "https:" || !FACEBOOK_HOSTS.has(url.hostname.toLowerCase()) || url.pathname.replace(/\//g, "").length === 0) return null;
    return { href: `https://${url.hostname.toLowerCase()}${url.pathname}` };
  } catch {
    return null;
  }
}

export function parseEmail(value: string | undefined) {
  const parsed = z.email().max(254).safeParse((value ?? "").trim());
  return parsed.success ? { display: parsed.data, href: `mailto:${parsed.data}` } : null;
}

export function buildShopContact(raw: Raw) {
  const pickup = (raw.pickupAddress ?? "").trim().slice(0, 300);
  const contact = {
    phone: parsePhone(raw.phone),
    whatsapp: parseWhatsapp(raw.whatsapp),
    facebook: parseFacebookUrl(raw.facebookUrl),
    email: parseEmail(raw.email),
    pickupAddress: pickup || null,
  };
  return { ...contact, hasAny: Object.values(contact).some(Boolean) };
}

export const shopContact = buildShopContact(rawShopContact);
