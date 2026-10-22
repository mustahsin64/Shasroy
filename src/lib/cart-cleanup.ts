import "server-only";
import { lt } from "drizzle-orm";
import { db, schema } from "@/db";

/** Carts untouched for this long are abandoned and safe to delete. */
export const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Deletes carts not updated since the cutoff. cart_items cascade on delete. Returns the count removed. */
export async function deleteStaleCarts(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - CART_TTL_MS);
  const removed = await db.delete(schema.carts).where(lt(schema.carts.updatedAt, cutoff)).returning({ id: schema.carts.id });
  return removed.length;
}
