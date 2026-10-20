import "server-only";
import { db, schema } from "@/db";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type AuditAction = (typeof schema.adminAuditAction.enumValues)[number];

/**
 * Call inside the transaction that makes the change. `before` / `after` must
 * be hand-picked fields; never pass request payloads, tokens or credentials.
 */
export async function recordAudit(
  tx: Tx,
  event: { actorId: string; action: AuditAction; entityType: "delivery_zone" | "admin_user"; entityId: string; before?: Record<string, unknown> | null; after?: Record<string, unknown> | null },
) {
  await tx.insert(schema.adminAuditEvents).values({
    actorId: event.actorId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    before: event.before ?? null,
    after: event.after ?? null,
  });
}
