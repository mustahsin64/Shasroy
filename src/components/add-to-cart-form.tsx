"use client";

import Link from "next/link";
import { useActionState } from "react";
import { addToCartAction, type AddToCartState } from "@/app/cart/actions";

const initialState: AddToCartState = { status: "idle", message: "" };

export function AddToCartForm({ variantId, maxQuantity }: { variantId: string; maxQuantity: number }) {
  const [state, formAction, pending] = useActionState(addToCartAction, initialState);
  const soldOut = maxQuantity <= 0;
  return <form action={formAction} className="add-to-cart">
    <input type="hidden" name="variantId" value={variantId} />
    <label>
      <span>পরিমাণ</span>
      <input type="number" name="quantity" defaultValue={1} min={1} max={Math.max(maxQuantity, 1)} disabled={soldOut} inputMode="numeric" />
    </label>
    <button type="submit" disabled={soldOut || pending}>{soldOut ? "স্টক শেষ" : pending ? "যোগ হচ্ছে…" : "ব্যাগে যোগ করুন"}</button>
    <p role="status" aria-live="polite" className={`cart-message cart-message-${state.status}`}>
      {state.message}{state.status === "success" && <> <Link href="/cart">ব্যাগ দেখুন</Link></>}
    </p>
  </form>;
}
