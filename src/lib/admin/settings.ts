import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { recordAudit } from "./audit";

const { shopSettings } = schema;

type Result = { ok: true } | { ok: false; error: string };

/**
 * Optimistic concurrency on `updated_at`, like delivery zones. Orders keep the
 * fee they were placed with, so a change only affects new orders.
 */
export async function updateGiftWrapSettings(fields: { giftWrapEnabled: boolean; giftWrapFeePaisa: number }, expectedUpdatedAtMs: number, adminId: string): Promise<Result> {
  return db.transaction(async tx => {
    const [current] = await tx.select().from(shopSettings).limit(1).for("update");
    if (!current) return { ok: false, error: "সেটিংস পাওয়া যায়নি। মাইগ্রেশন চালানো হয়েছে কি না দেখুন।" } as const;
    if (current.updatedAt.getTime() !== expectedUpdatedAtMs) {
      return { ok: false, error: "অন্য কেউ এর মধ্যে এটি বদলে দিয়েছেন। পাতা রিফ্রেশ করে আবার চেষ্টা করুন।" } as const;
    }
    await tx.update(shopSettings).set(fields).where(eq(shopSettings.id, current.id));
    await recordAudit(tx, {
      actorId: adminId,
      action: "gift_wrap_update",
      entityType: "shop_settings",
      entityId: current.id,
      before: { giftWrapEnabled: current.giftWrapEnabled, giftWrapFeePaisa: current.giftWrapFeePaisa },
      after: fields,
    });
    return { ok: true } as const;
  });
}
