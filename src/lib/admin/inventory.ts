import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

const { inventoryMovements, productVariants } = schema;

export type MovementReason = (typeof schema.inventoryReason.enumValues)[number];

export const movementReasonLabels: Record<MovementReason, string> = {
  initial: "শুরুর স্টক",
  restock: "নতুন মাল",
  order: "অর্ডার",
  cancellation: "বাতিলে ফেরত",
  adjustment: "সংশোধন",
};

export const MOVEMENTS_PAGE_SIZE = 30;

/**
 * Read-only ledger view. Returns null when the variant does not belong to the
 * product. Movements are deltas, so no running balance is derived: history
 * may predate the ledger, and an invented balance would be wrong.
 */
export async function getVariantHistory(productId: string, variantId: string, reason: MovementReason | undefined, page: number) {
  const variant = await db.query.productVariants.findFirst({
    where: and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)),
    columns: { id: true, sku: true, nameBn: true, stockQuantity: true },
    with: { product: { columns: { id: true, nameBn: true } } },
  });
  if (!variant) return null;

  const where = and(eq(inventoryMovements.variantId, variantId), reason ? eq(inventoryMovements.reason, reason) : undefined);
  const [rows, [{ total }]] = await Promise.all([
    db.query.inventoryMovements.findMany({
      where,
      orderBy: [desc(inventoryMovements.createdAt), desc(inventoryMovements.id)],
      limit: MOVEMENTS_PAGE_SIZE,
      offset: (page - 1) * MOVEMENTS_PAGE_SIZE,
      columns: { id: true, change: true, reason: true, note: true, createdAt: true },
      with: {
        createdByAdmin: { columns: { email: true, displayName: true } },
        order: { columns: { id: true, orderNumber: true } },
      },
    }),
    db.select({ total: count() }).from(inventoryMovements).where(where),
  ]);
  return { variant, rows, total, pageSize: MOVEMENTS_PAGE_SIZE };
}
