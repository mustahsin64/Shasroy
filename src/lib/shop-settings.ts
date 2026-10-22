import "server-only";
import { db, schema } from "@/db";

const { shopSettings } = schema;

/** Fallback if the settings row is missing: gift wrap off, so nothing is charged by surprise. */
const defaults = { giftWrapEnabled: false, giftWrapFeePaisa: 0 } as const;

export async function getShopSettings() {
  const [row] = await db.select({ id: shopSettings.id, giftWrapEnabled: shopSettings.giftWrapEnabled, giftWrapFeePaisa: shopSettings.giftWrapFeePaisa, updatedAt: shopSettings.updatedAt }).from(shopSettings).limit(1);
  return row ?? { id: null, ...defaults, updatedAt: null };
}
