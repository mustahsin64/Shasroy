import "server-only";
import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizeBdPhone } from "@/lib/validation";

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

export const ORDER_SEARCH_MAX_LENGTH = 80;
export const ORDERS_PAGE_SIZE = 30;

const likeEscape = (value: string) => value.replace(/[\\%_]/g, c => `\\${c}`);

/**
 * Splits a raw search box value into LIKE patterns. `%` and `_` are literal.
 * Phone matching works on normalised digits (Bangla digits, +880 and 880
 * prefixes) and accepts partial numbers of three or more digits.
 */
export function buildOrderSearch(raw: string | undefined) {
  const text = (raw ?? "").replace(/[০-৯]/g, d => String("০১২৩৪৫৬৭৮৯".indexOf(d))).trim().slice(0, ORDER_SEARCH_MAX_LENGTH);
  if (!text) return null;
  const phoneLike = /^\+?[\d\s-]+$/.test(text) ? normalizeBdPhone(text) : "";
  return {
    text: `%${likeEscape(text)}%`,
    phone: phoneLike.length >= 3 ? `%${likeEscape(phoneLike)}%` : null,
  };
}

function orderFilter(status?: OrderStatus, query?: string): SQL | undefined {
  const search = buildOrderSearch(query);
  const searchWhere = search
    ? or(
        ilike(orders.orderNumber, search.text),
        ilike(orders.customerName, search.text),
        search.phone ? ilike(orders.customerPhone, search.phone) : undefined,
      )
    : undefined;
  return and(status ? eq(orders.status, status) : undefined, searchWhere);
}

export async function listOrders({ status, query, page = 1 }: { status?: OrderStatus; query?: string; page?: number } = {}) {
  const where = orderFilter(status, query);
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
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(ORDERS_PAGE_SIZE)
      .offset((page - 1) * ORDERS_PAGE_SIZE),
    db.select({ total: count() }).from(orders).where(where),
  ]);
  return { rows, total, pageSize: ORDERS_PAGE_SIZE };
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

/**
 * Minimal projection for parcel slips: no internal notes, no status-history
 * comments, no admin identities.
 */
export async function getOrderForPrint(id: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    columns: {
      orderNumber: true,
      status: true,
      createdAt: true,
      customerName: true,
      customerPhone: true,
      shippingAddress: true,
      customerNote: true,
      deliveryZoneNameBn: true,
      subtotalPaisa: true,
      deliveryFeePaisa: true,
      discountPaisa: true,
      totalPaisa: true,
      paymentMethod: true,
      paymentStatus: true,
    },
    with: {
      items: { columns: { id: true, productNameBn: true, variantNameBn: true, sku: true, quantity: true, unitPricePaisa: true, lineTotalPaisa: true }, orderBy: [orderItems.createdAt, orderItems.id] },
    },
  });
}

export type PrintableOrder = NonNullable<Awaited<ReturnType<typeof getOrderForPrint>>>;

/** What the courier should collect on delivery; never print the plain total as money owed. */
export function collectionState(order: Pick<PrintableOrder, "status" | "paymentMethod" | "paymentStatus" | "totalPaisa">) {
  if (order.status === "cancelled") return { kind: "cancelled" as const };
  if (order.paymentStatus === "refunded") return { kind: "refunded" as const };
  if (order.paymentStatus === "paid") return { kind: "paid" as const };
  if (order.paymentMethod === "cod" && order.paymentStatus === "unpaid") return { kind: "collect" as const, amountPaisa: order.totalPaisa };
  return { kind: "none" as const };
}
