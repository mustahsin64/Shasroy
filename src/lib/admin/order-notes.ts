import "server-only";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";

const { orderNotes, orders } = schema;

export const NOTE_MAX_LENGTH = 2000;
export const NOTES_PAGE = 20;

export const noteBodySchema = z
  .string()
  .transform(v => v.replace(/\r\n/g, "\n").trim())
  .pipe(z.string().min(1, "নোট খালি রাখা যাবে না।").max(NOTE_MAX_LENGTH, `নোট ${NOTE_MAX_LENGTH.toLocaleString("bn-BD")} অক্ষরের মধ্যে রাখুন।`));

/** Newest first, stable by (created_at, id). `all` lifts the default cap (hard cap 500). */
export async function listOrderNotes(orderId: string, all = false) {
  const limit = all ? 500 : NOTES_PAGE;
  const [rows, [{ total }]] = await Promise.all([
    db.query.orderNotes.findMany({
      where: eq(orderNotes.orderId, orderId),
      orderBy: [desc(orderNotes.createdAt), desc(orderNotes.id)],
      limit,
      columns: { id: true, body: true, createdAt: true },
      with: { author: { columns: { email: true, displayName: true } } },
    }),
    db.select({ total: count() }).from(orderNotes).where(eq(orderNotes.orderId, orderId)),
  ]);
  return { rows, total, truncated: total > rows.length };
}

export type AddNoteResult = { ok: true } | { ok: false; error: string };

export async function addOrderNote(orderId: string, adminId: string, body: string): Promise<AddNoteResult> {
  const [order] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, orderId));
  if (!order) return { ok: false, error: "অর্ডার পাওয়া যায়নি।" };
  await db.insert(orderNotes).values({ orderId, body, createdBy: adminId });
  return { ok: true };
}
