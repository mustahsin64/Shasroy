import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { BD_MOBILE_PATTERN, normalizeBdPhone } from "@/lib/validation";

const { carts, cartItems, deliveryZones, inventoryMovements, orderItems, orders, orderStatusHistory, productVariants, products } = schema;

export async function listDeliveryZones() {
  return db
    .select({ id: deliveryZones.id, nameBn: deliveryZones.nameBn, feePaisa: deliveryZones.feePaisa, minDays: deliveryZones.minDays, maxDays: deliveryZones.maxDays })
    .from(deliveryZones)
    .where(eq(deliveryZones.isActive, true))
    .orderBy(asc(deliveryZones.sortOrder));
}

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "আপনার নাম লিখুন।").max(80, "নাম ৮০ অক্ষরের মধ্যে রাখুন।"),
  customerPhone: z.string().transform(normalizeBdPhone).pipe(z.string().regex(BD_MOBILE_PATTERN, "সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)।")),
  customerEmail: z.union([z.literal(""), z.email("সঠিক ইমেইল দিন, অথবা খালি রাখুন।").max(120)]).transform(v => v || null),
  deliveryZoneId: z.uuid("ডেলিভারির এলাকা বেছে নিন।"),
  shippingAddress: z.string().trim().min(10, "পুরো ঠিকানা লিখুন (বাসা, রাস্তা, এলাকা, জেলা)।").max(500, "ঠিকানা ৫০০ অক্ষরের মধ্যে রাখুন।"),
  customerNote: z.string().trim().max(500, "নোট ৫০০ অক্ষরের মধ্যে রাখুন।").transform(v => v || null),
  // The delivery fee the customer saw when confirming; the server refuses if it changed since.
  expectedFeePaisa: z.coerce.number().int().min(0),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type PlaceOrderResult =
  | { ok: true; orderId: string; orderNumber: string }
  | { ok: false; error: "empty-cart" | "zone-unavailable" | "cart-changed" | "fee-changed" };

/**
 * Creates a cash-on-delivery order from the cart in one transaction:
 * locks the cart and variant rows, re-checks price/stock/availability,
 * decrements stock, records inventory movements and status history,
 * then deletes the cart. Any failure rolls everything back.
 */
export async function placeOrder(cartId: string, input: CheckoutInput): Promise<PlaceOrderResult> {
  return db.transaction(async tx => {
    // Serialises concurrent submissions of the same cart (double clicks).
    const [cart] = await tx.select({ id: carts.id }).from(carts).where(eq(carts.id, cartId)).for("update");
    if (!cart) return { ok: false, error: "empty-cart" } as const;

    const items = await tx.select({ variantId: cartItems.variantId, quantity: cartItems.quantity }).from(cartItems).where(eq(cartItems.cartId, cartId));
    if (items.length === 0) return { ok: false, error: "empty-cart" } as const;

    const [zone] = await tx
      .select({ id: deliveryZones.id, nameBn: deliveryZones.nameBn, feePaisa: deliveryZones.feePaisa })
      .from(deliveryZones)
      .where(and(eq(deliveryZones.id, input.deliveryZoneId), eq(deliveryZones.isActive, true)))
      // Shared lock: an admin editing this zone waits for this order to commit (or this
      // order sees the committed edit), so the fee checked below is the fee charged.
      .for("share");
    if (!zone) return { ok: false, error: "zone-unavailable" } as const;
    if (zone.feePaisa !== input.expectedFeePaisa) return { ok: false, error: "fee-changed" } as const;

    // Lock variants in a stable order to avoid deadlocks between concurrent orders.
    const variantIds = items.map(item => item.variantId).sort();
    const variants = await tx
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        nameBn: productVariants.nameBn,
        pricePaisa: productVariants.pricePaisa,
        stockQuantity: productVariants.stockQuantity,
        isActive: productVariants.isActive,
        productNameBn: products.nameBn,
        productStatus: products.status,
      })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(inArray(productVariants.id, variantIds))
      .orderBy(asc(productVariants.id))
      .for("update", { of: productVariants });
    const byId = new Map(variants.map(v => [v.id, v]));

    const lines = items.map(item => ({ item, variant: byId.get(item.variantId) }));
    const problem = lines.some(({ item, variant }) => !variant || !variant.isActive || variant.productStatus !== "active" || variant.stockQuantity < item.quantity);
    if (problem) return { ok: false, error: "cart-changed" } as const;

    const subtotalPaisa = lines.reduce((sum, { item, variant }) => sum + variant!.pricePaisa * item.quantity, 0);
    const [order] = await tx
      .insert(orders)
      .values({
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        shippingAddress: input.shippingAddress,
        customerNote: input.customerNote,
        deliveryZoneId: zone.id,
        deliveryZoneNameBn: zone.nameBn,
        subtotalPaisa,
        deliveryFeePaisa: zone.feePaisa,
        totalPaisa: subtotalPaisa + zone.feePaisa,
        paymentMethod: "cod",
      })
      .returning({ id: orders.id, orderNumber: orders.orderNumber });

    await tx.insert(orderItems).values(
      lines.map(({ item, variant }) => ({
        orderId: order.id,
        variantId: item.variantId,
        productNameBn: variant!.productNameBn,
        variantNameBn: variant!.nameBn,
        sku: variant!.sku,
        unitPricePaisa: variant!.pricePaisa,
        quantity: item.quantity,
        lineTotalPaisa: variant!.pricePaisa * item.quantity,
      })),
    );

    for (const { item } of lines) {
      await tx
        .update(productVariants)
        .set({ stockQuantity: sql`${productVariants.stockQuantity} - ${item.quantity}` })
        .where(eq(productVariants.id, item.variantId));
    }
    await tx.insert(inventoryMovements).values(
      lines.map(({ item }) => ({ variantId: item.variantId, change: -item.quantity, reason: "order" as const, orderId: order.id })),
    );
    await tx.insert(orderStatusHistory).values({ orderId: order.id, fromStatus: null, toStatus: "pending", note: "Order placed by customer" });

    await tx.delete(carts).where(eq(carts.id, cartId));
    return { ok: true, orderId: order.id, orderNumber: order.orderNumber } as const;
  });
}

/** Confirmation view. The order id is a random UUID, so it works as an unguessable link. */
export async function getOrderConfirmation(orderId: string) {
  if (!z.uuid().safeParse(orderId).success) return null;
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: {
      orderNumber: true,
      status: true,
      customerName: true,
      customerPhone: true,
      shippingAddress: true,
      deliveryZoneNameBn: true,
      subtotalPaisa: true,
      deliveryFeePaisa: true,
      discountPaisa: true,
      totalPaisa: true,
      createdAt: true,
    },
    with: {
      items: { columns: { id: true, productNameBn: true, variantNameBn: true, quantity: true, unitPricePaisa: true, lineTotalPaisa: true } },
    },
  });
  return order ?? null;
}
