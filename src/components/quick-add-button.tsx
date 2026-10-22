"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ShoppingBag } from "lucide-react";
import { addToCartAction, type AddToCartState } from "@/app/(shop)/cart/actions";

const initialState: AddToCartState = { status: "idle", message: "" };

/** Adds one of a single-variant product from the product card. */
export function QuickAddButton({ variantId, productName }: { variantId: string; productName: string }) {
  const [state, formAction, pending] = useActionState(addToCartAction, initialState);
  return <form action={formAction} className="quick-add">
    <input type="hidden" name="variantId" value={variantId} />
    <input type="hidden" name="quantity" value="1" />
    <button type="submit" disabled={pending} aria-label={`${productName} ব্যাগে যোগ করুন`}><ShoppingBag size={16} strokeWidth={1.8} />{pending ? "যোগ হচ্ছে…" : "ব্যাগে যোগ"}</button>
    <p role="status" aria-live="polite" className={`quick-add-message cart-message-${state.status}`}>
      {state.status === "success" ? <Link href="/cart">যোগ হয়েছে · ব্যাগ দেখুন</Link> : state.message}
    </p>
  </form>;
}
