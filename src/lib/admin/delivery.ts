import "server-only";
import { asc, eq } from "drizzle-orm";
import type { z } from "zod";
import { db, schema } from "@/db";
import { isUniqueViolation } from "@/lib/db-errors";
import type { deliveryZoneInputSchema, deliveryZoneUpdateSchema } from "@/lib/validation";
import { recordAudit } from "./audit";

const { deliveryZones } = schema;

export async function listAllDeliveryZones() {
  return db.select().from(deliveryZones).orderBy(asc(deliveryZones.sortOrder), asc(deliveryZones.nameBn));
}

type Row = typeof deliveryZones.$inferSelect;
const snapshot = (zone: Pick<Row, "nameBn" | "feePaisa" | "minDays" | "maxDays" | "sortOrder" | "isActive">) => ({
  nameBn: zone.nameBn,
  feePaisa: zone.feePaisa,
  minDays: zone.minDays,
  maxDays: zone.maxDays,
  sortOrder: zone.sortOrder,
  isActive: zone.isActive,
});

type Result = { ok: true } | { ok: false; error: string };

export async function createDeliveryZone(fields: z.infer<typeof deliveryZoneInputSchema>, adminId: string): Promise<Result> {
  try {
    await db.transaction(async tx => {
      const [zone] = await tx.insert(deliveryZones).values(fields).returning();
      await recordAudit(tx, { actorId: adminId, action: "delivery_zone_create", entityType: "delivery_zone", entityId: zone.id, after: { slug: zone.slug, ...snapshot(zone) } });
    });
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error, "delivery_zones_slug_unique")) return { ok: false, error: "এই স্লাগ আগে থেকেই আছে।" };
    throw error;
  }
}

/**
 * Optimistic concurrency: the form carries the `updated_at` (ms) it was
 * rendered with; if the row changed since, nothing is written. Orders already
 * placed keep their own fee and zone-name snapshot, so edits never rewrite history.
 */
export async function updateDeliveryZone(id: string, fields: z.infer<typeof deliveryZoneUpdateSchema>, expectedUpdatedAtMs: number, adminId: string): Promise<Result> {
  return db.transaction(async tx => {
    const [current] = await tx.select().from(deliveryZones).where(eq(deliveryZones.id, id)).for("update");
    if (!current) return { ok: false, error: "এলাকা পাওয়া যায়নি।" } as const;
    if (current.updatedAt.getTime() !== expectedUpdatedAtMs) {
      return { ok: false, error: "অন্য কেউ এর মধ্যে এটি বদলে দিয়েছেন। পাতা রিফ্রেশ করে আবার চেষ্টা করুন।" } as const;
    }
    await tx.update(deliveryZones).set(fields).where(eq(deliveryZones.id, id));
    await recordAudit(tx, { actorId: adminId, action: "delivery_zone_update", entityType: "delivery_zone", entityId: id, before: snapshot(current), after: snapshot({ ...current, ...fields }) });
    return { ok: true } as const;
  });
}
