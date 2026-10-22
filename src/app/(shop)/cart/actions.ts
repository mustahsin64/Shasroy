"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { addToCart, MAX_QUANTITY_PER_LINE, removeCartItem, setCartItemQuantity } from "@/lib/cart";
import { formatNumberBn } from "@/lib/format";

export type AddToCartState = { status: "idle" | "success" | "error"; message: string };

const addSchema = z.object({
  variantId: z.uuid(),
  quantity: z.coerce.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
});

export async function addToCartAction(_prev: AddToCartState, formData: FormData): Promise<AddToCartState> {
  const parsed = addSchema.safeParse({ variantId: formData.get("variantId"), quantity: formData.get("quantity") ?? 1 });
  if (!parsed.success) return { status: "error", message: "পরিমাণটি ঠিক নেই। আবার চেষ্টা করুন।" };

  const result = await addToCart(parsed.data.variantId, parsed.data.quantity);
  if (!result.ok) {
    return { status: "error", message: result.error === "out-of-stock" ? "দুঃখিত, এটি এখন স্টকে নেই।" : "এই পণ্যটি এখন পাওয়া যাচ্ছে না।" };
  }
  // "এখনই কিনুন" adds the item and goes straight to checkout.
  if (formData.get("intent") === "buy") redirect("/checkout");
  refresh();
  return {
    status: "success",
    message: result.clamped
      ? `স্টক অনুযায়ী ব্যাগে সর্বোচ্চ ${formatNumberBn(result.quantity)}টি রাখা হয়েছে।`
      : `ব্যাগে যোগ হয়েছে (মোট ${formatNumberBn(result.quantity)}টি)।`,
  };
}

const updateSchema = z.object({
  itemId: z.uuid(),
  quantity: z.coerce.number().int().min(0).max(99),
});

export async function updateCartItemAction(formData: FormData) {
  const parsed = updateSchema.safeParse({ itemId: formData.get("itemId"), quantity: formData.get("quantity") });
  if (!parsed.success) return;
  await setCartItemQuantity(parsed.data.itemId, parsed.data.quantity);
  refresh();
}

export async function removeCartItemAction(formData: FormData) {
  const parsed = z.uuid().safeParse(formData.get("itemId"));
  if (!parsed.success) return;
  await removeCartItem(parsed.data);
  refresh();
}
