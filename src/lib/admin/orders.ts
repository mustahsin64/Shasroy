import "server-only";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { orders, orderItems, orderStatusHistory, productVariants, inventoryMovements } = schema;

export type OrderStatus = (typeof schema.orderStatus.enumValues)[number];

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "নতুন",
  confirmed: "নিশ্চিত",
  processing: "প্যাক হচ্ছে",
  shipped: "পাঠানো হয়েছে",
  delivered: "ডেলিভারি সম্পন্ন",
  cancelled: "বাতিল",
};

/** Allowed next steps. Cancelling restores stock; delivering marks COD as paid. */
export const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export async function listOrders(status?: OrderStatus, page = 1) {
  const pageSize = 30;
  const where = status ? eq(orders.status, status) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        deliveryZoneNameBn: orders.deliveryZoneNameBn,
        totalPaisa: orders.totalPaisa,
        createdAt: orders.createdAt,
        itemCount: sql<number>`(select coalesce(sum(quantity), 0) from ${orderItems} where ${orderItems.orderId} = ${orders.id})`.mapWith(Number),
      })
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(orders).where(where),
  ]);
  return { rows, total, pageSize };
}

export async function orderStatusCounts() {
  const rows = await db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status);
  return Object.fromEntries(rows.map(r => [r.status, r.n])) as Partial<Record<OrderStatus, number>>;
}

export async function getOrderForAdmin(id: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: true,
      statusHistory: { orderBy: [desc(orderStatusHistory.createdAt)], with: { changedByAdmin: { columns: { email: true, displayName: true } } } },
    },
  });
}

export type ChangeStatusResult = { ok: true } | { ok: false; error: "not-found" | "invalid-transition" };

export async function changeOrderStatus(orderId: string, to: OrderStatus, adminId: string, note: string | null): Promise<ChangeStatusResult> {
  return db.transaction(async tx => {
    const [order] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) return { ok: false, error: "not-found" } as const;
    if (!orderTransitions[order.status].includes(to)) return { ok: false, error: "invalid-transition" } as const;

    if (to === "cancelled") {
      const items = await tx
        .select({ variantId: orderItems.variantId, quantity: orderItems.quantity })
        .from(orderItems)
        .where(and(eq(orderItems.orderId, orderId), sql`${orderItems.variantId} is not null`));
      for (const item of items) {
        await tx
          .update(productVariants)
          .set({ stockQuantity: sql`${productVariants.stockQuantity} + ${item.quantity}` })
          .where(eq(productVariants.id, item.variantId!));
        await tx.insert(inventoryMovements).values({
          variantId: item.variantId!,
          change: item.quantity,
          reason: "cancellation",
          orderId,
          createdBy: adminId,
        });
      }
    }

    await tx
      .update(orders)
      .set({ status: to, ...(to === "delivered" ? { paymentStatus: "paid" as const } : {}) })
      .where(eq(orders.id, orderId));
    await tx.insert(orderStatusHistory).values({ orderId, fromStatus: order.status, toStatus: to, note, changedBy: adminId });
    return { ok: true } as const;
  });
}
