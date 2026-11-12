"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Check, Plus } from "lucide-react";
import { addToCartAction, type AddToCartState } from "@/app/(shop)/cart/actions";

const initialState: AddToCartState = { status: "idle", message: "" };

/** Round "+" over the product photo; adds one of a single-variant product. */
export function QuickAddButton({ variantId, productName }: { variantId: string; productName: string }) {
  const [state, formAction, pending] = useActionState(addToCartAction, initialState);
  const added = state.status === "success";
  return <form action={formAction} className="quick-add">
    <input type="hidden" name="variantId" value={variantId} />
    <input type="hidden" name="quantity" value="1" />
    <button type="submit" className="card-add" disabled={pending} aria-label={`${productName} ব্যাগে যোগ করুন`}>
      {added ? <Check size={20} strokeWidth={2.4} aria-hidden="true" /> : <Plus size={20} strokeWidth={2.4} aria-hidden="true" />}
    </button>
    <p role="status" aria-live="polite" className={`quick-add-message cart-message-${state.status}`}>
      {added ? <Link href="/cart">যোগ হয়েছে · ব্যাগ দেখুন</Link> : pending ? "যোগ হচ্ছে…" : state.message}
    </p>
  </form>;
}
