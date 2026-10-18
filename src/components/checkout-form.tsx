"use client";

import { useActionState, useState } from "react";
import { placeOrderAction, type CheckoutState } from "@/app/(shop)/checkout/actions";
import { formatNumberBn, formatTaka } from "@/lib/format";

type Zone = { id: string; nameBn: string; feePaisa: number; minDays: number; maxDays: number };

const initialState: CheckoutState = { fieldErrors: {}, values: {} };

export function CheckoutForm({ zones, subtotalPaisa }: { zones: Zone[]; subtotalPaisa: number }) {
  const [state, formAction, pending] = useActionState(placeOrderAction, initialState);
  const [zoneId, setZoneId] = useState(state.values.deliveryZoneId ?? "");
  const zone = zones.find(z => z.id === zoneId);
  const errors = state.fieldErrors;

  const field = (name: keyof CheckoutState["values"], label: string, input: React.ReactNode, hint?: string) => <div className={`checkout-field${errors[name] ? " has-error" : ""}`}>
    <label htmlFor={name}>{label}</label>
    {input}
    {errors[name] ? <p className="field-error" id={`${name}-error`}>{errors[name]}</p> : hint && <p className="field-hint">{hint}</p>}
  </div>;
  const describedBy = (name: keyof CheckoutState["values"]) => (errors[name] ? `${name}-error` : undefined);

  return <form action={formAction} className="checkout-form" noValidate>
    <div className="checkout-fields">
      <h2>যোগাযোগ ও ঠিকানা</h2>
      {state.formError && <p className="form-error" role="alert">{state.formError}</p>}
      {/* key forces inputs to pick up preserved values after a failed submission */}
      <div key={JSON.stringify(state.values)} className="checkout-grid">
        {field("customerName", "আপনার নাম *", <input id="customerName" name="customerName" autoComplete="name" required maxLength={80} defaultValue={state.values.customerName} aria-invalid={!!errors.customerName} aria-describedby={describedBy("customerName")} />)}
        {field("customerPhone", "মোবাইল নম্বর *", <input id="customerPhone" name="customerPhone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="০১XXXXXXXXX" defaultValue={state.values.customerPhone} aria-invalid={!!errors.customerPhone} aria-describedby={describedBy("customerPhone")} />, "ডেলিভারির আগে এই নম্বরে ফোন করা হবে।")}
        {field("customerEmail", "ইমেইল (ঐচ্ছিক)", <input id="customerEmail" name="customerEmail" type="email" autoComplete="email" maxLength={120} defaultValue={state.values.customerEmail} aria-invalid={!!errors.customerEmail} aria-describedby={describedBy("customerEmail")} />)}
        <fieldset className={`checkout-field zone-options${errors.deliveryZoneId ? " has-error" : ""}`} aria-describedby={describedBy("deliveryZoneId")}>
          <legend>ডেলিভারির এলাকা *</legend>
          {zones.map(z => <label key={z.id} className="zone-option">
            <input type="radio" name="deliveryZoneId" value={z.id} checked={zoneId === z.id} onChange={() => setZoneId(z.id)} required />
            <span><strong>{z.nameBn}</strong><small>{formatNumberBn(z.minDays)}–{formatNumberBn(z.maxDays)} দিন</small></span>
            <b>{formatTaka(z.feePaisa)}</b>
          </label>)}
          {errors.deliveryZoneId && <p className="field-error" id="deliveryZoneId-error">{errors.deliveryZoneId}</p>}
        </fieldset>
        {field("shippingAddress", "পুরো ঠিকানা *", <textarea id="shippingAddress" name="shippingAddress" autoComplete="street-address" rows={3} required maxLength={500} placeholder="বাসা/ফ্ল্যাট, রাস্তা, এলাকা, থানা, জেলা" defaultValue={state.values.shippingAddress} aria-invalid={!!errors.shippingAddress} aria-describedby={describedBy("shippingAddress")} />)}
        {field("customerNote", "বিশেষ নির্দেশনা (ঐচ্ছিক)", <textarea id="customerNote" name="customerNote" rows={2} maxLength={500} placeholder="যেমন: বিকেলে ডেলিভারি দিলে ভালো হয়" defaultValue={state.values.customerNote} aria-invalid={!!errors.customerNote} aria-describedby={describedBy("customerNote")} />)}
      </div>
    </div>

    <aside className="cart-summary">
      <h2>পেমেন্ট</h2>
      <p className="payment-method"><strong>ক্যাশ অন ডেলিভারি</strong><small>পণ্য হাতে পেয়ে টাকা দিন।</small></p>
      <dl>
        <div><dt>পণ্যের দাম</dt><dd>{formatTaka(subtotalPaisa)}</dd></div>
        <div><dt>ডেলিভারি চার্জ</dt><dd className={zone ? undefined : "muted"}>{zone ? formatTaka(zone.feePaisa) : "এলাকা বেছে নিন"}</dd></div>
        <div className="summary-total"><dt>মোট</dt><dd>{formatTaka(subtotalPaisa + (zone?.feePaisa ?? 0))}</dd></div>
      </dl>
      <button type="submit" className="checkout-submit" disabled={pending}>{pending ? "অর্ডার হচ্ছে…" : "অর্ডার নিশ্চিত করুন"}</button>
      <p className="summary-note">অর্ডার নিশ্চিত করার সময় দাম ও স্টক আবার যাচাই করা হবে।</p>
    </aside>
  </form>;
}
