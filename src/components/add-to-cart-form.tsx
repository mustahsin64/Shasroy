"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addToCartAction, type AddToCartState } from "@/app/(shop)/cart/actions";

const initialState: AddToCartState = { status: "idle", message: "" };

export function AddToCartForm({ variantId, maxQuantity }: { variantId: string; maxQuantity: number }) {
  const [state, formAction, pending] = useActionState(addToCartAction, initialState);
  const soldOut = maxQuantity <= 0;
  const [quantity, setQuantity] = useState(1);
  return <form action={formAction} className="add-to-cart">
    <input type="hidden" name="variantId" value={variantId} />
    <div className="purchase-quantity">
      <label htmlFor={`quantity-${variantId}`}>পরিমাণ</label>
      <div className="purchase-stepper">
        <button type="button" aria-label="পরিমাণ কমান" disabled={soldOut || pending || quantity <= 1} onClick={() => setQuantity(quantity - 1)}>−</button>
        <input id={`quantity-${variantId}`} type="number" name="quantity" value={quantity} onChange={event => setQuantity(Math.min(Math.max(1, Number(event.target.value) || 1), Math.max(maxQuantity, 1)))} min={1} max={Math.max(maxQuantity, 1)} disabled={soldOut || pending} inputMode="numeric" />
        <button type="button" aria-label="পরিমাণ বাড়ান" disabled={soldOut || pending || quantity >= maxQuantity} onClick={() => setQuantity(quantity + 1)}>+</button>
      </div>
    </div>
    <button type="submit" disabled={soldOut || pending}>{soldOut ? "স্টক শেষ" : pending ? "যোগ হচ্ছে…" : "ব্যাগে যোগ করুন"}</button>
    <p role="status" aria-live="polite" className={`cart-message cart-message-${state.status}`}>
      {state.message}{state.status === "success" && <> <Link href="/cart">ব্যাগ দেখুন</Link></>}
    </p>
  </form>;
}
