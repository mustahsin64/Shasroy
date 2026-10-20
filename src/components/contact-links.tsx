import { Facebook, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { shopContact } from "@/lib/shop-contact";

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Renders only the channels that are configured. Renders nothing when none are. */
export function ContactLinks({ variant = "list" }: { variant?: "list" | "inline" }) {
  const c = shopContact;
  if (!c.hasAny) return null;
  return <ul className={`contact-links contact-${variant}`}>
    {c.phone && <li><a href={c.phone.href} aria-label={`ফোন করুন: ${c.phone.display}`}><Phone size={15} aria-hidden /> {c.phone.display}</a></li>}
    {c.whatsapp && <li><a href={c.whatsapp.href} {...external} aria-label={`হোয়াটসঅ্যাপে মেসেজ করুন: ${c.whatsapp.display} (নতুন ট্যাবে খুলবে)`}><MessageCircle size={15} aria-hidden /> হোয়াটসঅ্যাপ</a></li>}
    {c.facebook && <li><a href={c.facebook.href} {...external} aria-label="আমাদের ফেসবুক পেজ (নতুন ট্যাবে খুলবে)"><Facebook size={15} aria-hidden /> ফেসবুক পেজ</a></li>}
    {c.email && <li><a href={c.email.href} aria-label={`ইমেইল করুন: ${c.email.display}`}><Mail size={15} aria-hidden /> {c.email.display}</a></li>}
    {c.pickupAddress && variant === "list" && <li className="contact-address"><MapPin size={15} aria-hidden /> <span>{c.pickupAddress}</span></li>}
  </ul>;
}
