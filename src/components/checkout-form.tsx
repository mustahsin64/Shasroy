"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { placeOrderAction, type CheckoutState } from "@/app/(shop)/checkout/actions";
import { formatNumberBn, formatTaka } from "@/lib/format";

type Zone = { id: string; nameBn: string; feePaisa: number; minDays: number; maxDays: number };

const initialState: CheckoutState = { fieldErrors: {}, values: {} };
const fieldLabels: Record<keyof CheckoutState["values"], string> = {
  customerName: "আপনার নাম",
  customerPhone: "মোবাইল নম্বর",
  customerEmail: "ইমেইল",
  deliveryZoneId: "ডেলিভারির এলাকা",
  shippingAddress: "পুরো ঠিকানা",
  giftWrap: "গিফট র‍্যাপ",
  giftMessage: "উপহার বার্তা",
  customerNote: "বিশেষ নির্দেশনা",
  expectedFeePaisa: "ডেলিভারি চার্জ",
  expectedGiftWrapFeePaisa: "গিফট র‍্যাপের চার্জ",
};

/** `giftWrapFeePaisa` is null when gift wrap is switched off in admin. */
export function CheckoutForm({ zones, subtotalPaisa, giftWrapFeePaisa }: { zones: Zone[]; subtotalPaisa: number; giftWrapFeePaisa: number | null }) {
  const [state, formAction, pending] = useActionState(placeOrderAction, initialState);
  const [zoneId, setZoneId] = useState(state.values.deliveryZoneId ?? "");
  const zone = zones.find(z => z.id === zoneId);
  const [giftWrap, setGiftWrap] = useState(state.values.giftWrap === "on" && giftWrapFeePaisa !== null);
  const giftFee = giftWrap && giftWrapFeePaisa !== null ? giftWrapFeePaisa : 0;
  const errors = state.fieldErrors;
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const errorEntries = Object.entries(errors) as Array<[keyof CheckoutState["values"], string]>;
  const errorSignature = JSON.stringify([state.formError, errors]);

  useEffect(() => {
    if (state.formError || errorEntries.length > 0) errorSummaryRef.current?.focus();
  }, [errorEntries.length, errorSignature, state.formError]);

  const field = (name: keyof CheckoutState["values"], label: string, input: React.ReactNode, hint?: string) => <div className={`checkout-field${errors[name] ? " has-error" : ""}`}>
    <label htmlFor={name}>{label}</label>
    {input}
    {errors[name] ? <p className="field-error" id={`${name}-error`}>{errors[name]}</p> : hint && <p className="field-hint" id={`${name}-hint`}>{hint}</p>}
  </div>;
  const describedBy = (name: keyof CheckoutState["values"], hasHint = false) => errors[name] ? `${name}-error` : hasHint ? `${name}-hint` : undefined;

  return <form action={formAction} className="checkout-form" noValidate>
    <div className="checkout-fields">
      <h2>যোগাযোগ ও ঠিকানা</h2>
      {(state.formError || errorEntries.length > 0) && <div ref={errorSummaryRef} className="form-error error-summary" role="alert" tabIndex={-1}>
        <p>{state.formError ?? "নিচের তথ্যগুলো ঠিক করুন:"}</p>
        {errorEntries.length > 0 && <ul>{errorEntries.map(([name, message]) => <li key={name}><a href={`#${name}`}>{fieldLabels[name]}: {message}</a></li>)}</ul>}
      </div>}
      {/* key forces inputs to pick up preserved values after a failed submission */}
      <div key={JSON.stringify(state.values)} className="checkout-grid">
        {field("customerName", "আপনার নাম *", <input id="customerName" name="customerName" autoComplete="name" required maxLength={80} defaultValue={state.values.customerName} aria-invalid={!!errors.customerName} aria-describedby={describedBy("customerName")} />)}
        {field("customerPhone", "মোবাইল নম্বর *", <input id="customerPhone" name="customerPhone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="০১XXXXXXXXX" defaultValue={state.values.customerPhone} aria-invalid={!!errors.customerPhone} aria-describedby={describedBy("customerPhone", true)} />, "ডেলিভারির আগে এই নম্বরে ফোন করা হবে।")}
        {field("customerEmail", "ইমেইল (ঐচ্ছিক)", <input id="customerEmail" name="customerEmail" type="email" autoComplete="email" maxLength={120} defaultValue={state.values.customerEmail} aria-invalid={!!errors.customerEmail} aria-describedby={describedBy("customerEmail")} />)}
        <fieldset id="deliveryZoneId" className={`checkout-field zone-options${errors.deliveryZoneId ? " has-error" : ""}`} aria-invalid={!!errors.deliveryZoneId} aria-describedby={describedBy("deliveryZoneId")}>
          <legend>ডেলিভারির এলাকা *</legend>
          {zones.map(z => <label key={z.id} className="zone-option">
            <input type="radio" name="deliveryZoneId" value={z.id} checked={zoneId === z.id} onChange={() => setZoneId(z.id)} required />
            <span><strong>{z.nameBn}</strong><small>{formatNumberBn(z.minDays)}–{formatNumberBn(z.maxDays)} দিন</small></span>
            <b>{formatTaka(z.feePaisa)}</b>
          </label>)}
          {errors.deliveryZoneId && <p className="field-error" id="deliveryZoneId-error">{errors.deliveryZoneId}</p>}
        </fieldset>
        {field("shippingAddress", "পুরো ঠিকানা *", <textarea id="shippingAddress" name="shippingAddress" autoComplete="street-address" rows={3} required maxLength={500} placeholder="বাসা/ফ্ল্যাট, রাস্তা, এলাকা, থানা, জেলা" defaultValue={state.values.shippingAddress} aria-invalid={!!errors.shippingAddress} aria-describedby={describedBy("shippingAddress")} />)}
        {giftWrapFeePaisa !== null && <div className="checkout-field gift-option">
          <label className="gift-toggle">
            <input type="checkbox" name="giftWrap" checked={giftWrap} onChange={event => setGiftWrap(event.target.checked)} />
            <span><strong>গিফট র‍্যাপ করে দিন</strong><small>উপহারের মতো মুড়িয়ে পাঠানো হবে; স্লিপে দাম থাকবে না।</small></span>
            <b>+{formatTaka(giftWrapFeePaisa)}</b>
          </label>
          {giftWrap && <div className={`gift-message${errors.giftMessage ? " has-error" : ""}`}>
            <label htmlFor="giftMessage">উপহার বার্তা (ঐচ্ছিক)</label>
            <textarea id="giftMessage" name="giftMessage" rows={2} maxLength={200} placeholder="যেমন: শুভ জন্মদিন, মা!" defaultValue={state.values.giftMessage} aria-invalid={!!errors.giftMessage} aria-describedby={describedBy("giftMessage", true)} />
            {errors.giftMessage ? <p className="field-error" id="giftMessage-error">{errors.giftMessage}</p> : <p className="field-hint" id="giftMessage-hint">ছোট একটি কার্ডে লিখে দেওয়া হবে (২০০ অক্ষরের মধ্যে)।</p>}
          </div>}
        </div>}
        {field("customerNote", "বিশেষ নির্দেশনা (ঐচ্ছিক)", <textarea id="customerNote" name="customerNote" rows={2} maxLength={500} placeholder="যেমন: বিকেলে ডেলিভারি দিলে ভালো হয়" defaultValue={state.values.customerNote} aria-invalid={!!errors.customerNote} aria-describedby={describedBy("customerNote")} />)}
      </div>
    </div>

    <aside className="cart-summary">
      <h2>পেমেন্ট</h2>
      <p className="payment-method"><strong>ক্যাশ অন ডেলিভারি</strong><small>পণ্য হাতে পেয়ে টাকা দিন।</small></p>
      <dl>
        <div><dt>পণ্যের দাম</dt><dd>{formatTaka(subtotalPaisa)}</dd></div>
        <div><dt>ডেলিভারি চার্জ</dt><dd className={zone ? undefined : "muted"}>{zone ? formatTaka(zone.feePaisa) : "এলাকা বেছে নিন"}</dd></div>
        {giftWrap && <div><dt>গিফট র‍্যাপ</dt><dd>{formatTaka(giftFee)}</dd></div>}
        <div className="summary-total"><dt>মোট</dt><dd>{formatTaka(subtotalPaisa + (zone?.feePaisa ?? 0) + giftFee)}</dd></div>
      </dl>
      <input type="hidden" name="expectedFeePaisa" value={zone?.feePaisa ?? ""} />
      <input type="hidden" name="expectedGiftWrapFeePaisa" value={giftWrap ? giftFee : ""} />
      <button type="submit" className="checkout-submit" disabled={pending}>{pending ? "অর্ডার হচ্ছে…" : "অর্ডার নিশ্চিত করুন"}</button>
      <p className="summary-note">অর্ডার নিশ্চিত করার সময় দাম ও স্টক আবার যাচাই করা হবে।</p>
    </aside>
  </form>;
}
