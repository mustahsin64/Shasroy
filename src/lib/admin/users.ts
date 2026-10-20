import "server-only";
import { asc, eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { isUniqueViolation } from "@/lib/db-errors";
import { recordAudit, type Tx } from "./audit";

const { adminUsers } = schema;

export type ManagedRole = Exclude<(typeof schema.adminRole.enumValues)[number], "owner">;
export const managedRoles: ManagedRole[] = ["staff", "manager"];
export const roleLabels = { owner: "মালিক", manager: "ম্যানেজার", staff: "স্টাফ" } as const;

export async function listAdminUsers() {
  return db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
      linked: adminUsers.authUserId,
      createdAt: adminUsers.createdAt,
      updatedAt: adminUsers.updatedAt,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.createdAt), asc(adminUsers.id));
}

type Result = { ok: true } | { ok: false; error: string };
const fail = (error: string) => ({ ok: false, error }) as const;

/**
 * Locks the acting admin, the target and every owner row (ordered by id so
 * concurrent callers cannot deadlock) and re-verifies, inside the transaction,
 * that the actor is still an active owner.
 */
async function lockAndVerify(tx: Tx, actorId: string, targetId?: string) {
  const rows = await tx
    .select()
    .from(adminUsers)
    .where(or(eq(adminUsers.id, actorId), targetId ? eq(adminUsers.id, targetId) : undefined, eq(adminUsers.role, "owner")))
    .orderBy(asc(adminUsers.id))
    .for("update");
  const actor = rows.find(r => r.id === actorId);
  if (!actor || !actor.isActive || actor.role !== "owner") return { ok: false, error: "শুধু মালিক এই কাজ করতে পারেন।" } as const;
  const target = targetId ? rows.find(r => r.id === targetId) : undefined;
  if (targetId && !target) return { ok: false, error: "ব্যবহারকারী পাওয়া যায়নি।" } as const;
  const activeOwners = rows.filter(r => r.role === "owner" && r.isActive);
  return { ok: true, actor, target, activeOwners } as const;
}

export async function registerAdmin(input: { email: string; displayName: string | null; role: ManagedRole }, actorId: string): Promise<Result> {
  try {
    return await db.transaction(async tx => {
      const locked = await lockAndVerify(tx, actorId);
      if (!locked.ok) return fail(locked.error);
      const [created] = await tx.insert(adminUsers).values({ email: input.email, displayName: input.displayName, role: input.role }).returning({ id: adminUsers.id });
      await recordAudit(tx, { actorId, action: "admin_register", entityType: "admin_user", entityId: created.id, after: { email: input.email, role: input.role, isActive: true } });
      return { ok: true } as const;
    });
  } catch (error) {
    if (isUniqueViolation(error, "admin_users_email_unique")) return fail("এই ইমেইল আগে থেকেই নিবন্ধিত।");
    throw error;
  }
}

/** `expectedRole` / `expectedActive` come from the rendered form; a mismatch means the form is stale. */
export async function setAdminActive(targetId: string, active: boolean, expected: { role: string; isActive: boolean }, actorId: string): Promise<Result> {
  return db.transaction(async tx => {
    const locked = await lockAndVerify(tx, actorId, targetId);
    if (!locked.ok) return fail(locked.error);
    const { target, activeOwners } = locked;
    if (target!.role !== expected.role || target!.isActive !== expected.isActive) return fail("তথ্য পুরনো হয়ে গেছে। পাতা রিফ্রেশ করুন।");
    if (target!.isActive === active) return { ok: true } as const;
    if (!active) {
      if (target!.id === actorId) return fail("নিজের অ্যাকাউন্ট নিজে বন্ধ করা যাবে না।");
      if (target!.role === "owner" && activeOwners.filter(o => o.id !== target!.id).length === 0) return fail("কমপক্ষে একজন সক্রিয় মালিক থাকতে হবে।");
    }
    await tx.update(adminUsers).set({ isActive: active }).where(eq(adminUsers.id, targetId));
    await recordAudit(tx, {
      actorId,
      action: active ? "admin_activate" : "admin_deactivate",
      entityType: "admin_user",
      entityId: targetId,
      before: { role: target!.role, isActive: target!.isActive },
      after: { role: target!.role, isActive: active },
    });
    return { ok: true } as const;
  });
}

export async function setAdminRole(targetId: string, role: ManagedRole, expected: { role: string; isActive: boolean }, actorId: string): Promise<Result> {
  return db.transaction(async tx => {
    const locked = await lockAndVerify(tx, actorId, targetId);
    if (!locked.ok) return fail(locked.error);
    const { target } = locked;
    if (target!.role !== expected.role || target!.isActive !== expected.isActive) return fail("তথ্য পুরনো হয়ে গেছে। পাতা রিফ্রেশ করুন।");
    if (target!.role === "owner") return fail("মালিকের ভূমিকা এখান থেকে বদলানো যায় না।");
    if (target!.id === actorId) return fail("নিজের ভূমিকা নিজে বদলানো যাবে না।");
    if (target!.role === role) return { ok: true } as const;
    await tx.update(adminUsers).set({ role }).where(eq(adminUsers.id, targetId));
    await recordAudit(tx, {
      actorId,
      action: "admin_role_change",
      entityType: "admin_user",
      entityId: targetId,
      before: { role: target!.role, isActive: target!.isActive },
      after: { role, isActive: target!.isActive },
    });
    return { ok: true } as const;
  });
}
