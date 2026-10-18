"use server";

import { redirect } from "next/navigation";
import { findCartId, forgetCartCookie } from "@/lib/cart";
import { checkoutSchema, placeOrder } from "@/lib/checkout";

const fields = ["customerName", "customerPhone", "customerEmail", "deliveryZoneId", "shippingAddress", "customerNote"] as const;
type Field = (typeof fields)[number];

export type CheckoutState = {
  formError?: string;
  fieldErrors: Partial<Record<Field, string>>;
  values: Partial<Record<Field, string>>;
};

const formErrors = {
  "empty-cart": "আপনার ব্যাগ খালি। আগে পণ্য যোগ করুন।",
  "zone-unavailable": "এই এলাকায় এখন ডেলিভারি দেওয়া যাচ্ছে না। অন্য এলাকা বেছে নিন।",
  "cart-changed": "ব্যাগের কিছু পণ্যের স্টক বা দাম বদলে গেছে। ব্যাগ দেখে আবার চেষ্টা করুন।",
} as const;

export async function placeOrderAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const values = Object.fromEntries(fields.map(field => [field, String(formData.get(field) ?? "").slice(0, 1000)])) as Record<Field, string>;

  const parsed = checkoutSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: CheckoutState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as Field;
      fieldErrors[field] ??= issue.message;
    }
    return { fieldErrors, values };
  }

  const cartId = await findCartId();
  if (!cartId) return { formError: formErrors["empty-cart"], fieldErrors: {}, values };

  let result;
  try {
    result = await placeOrder(cartId, parsed.data);
  } catch (error) {
    console.error("placeOrder failed", error);
    return { formError: "অর্ডার নেওয়া যায়নি। একটু পরে আবার চেষ্টা করুন।", fieldErrors: {}, values };
  }
  if (!result.ok) return { formError: formErrors[result.error], fieldErrors: {}, values };

  await forgetCartCookie();
  redirect(`/order/${result.orderId}`);
}
