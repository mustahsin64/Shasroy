import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const { adminUsers } = schema;

export type AdminRole = (typeof schema.adminRole.enumValues)[number];
export type Admin = { id: string; email: string; displayName: string | null; role: AdminRole };

/**
 * Authentication comes from Supabase Auth (verified JWT claims).
 * Authorization comes from our own admin_users table: a signed-in user who is
 * not an active admin gets nothing. Cached per request.
 */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub || typeof claims.email !== "string") return null;
  const email = claims.email.toLowerCase();

  let admin = await db.query.adminUsers.findFirst({ where: eq(adminUsers.authUserId, claims.sub) });
  if (!admin) {
    // First sign-in: link the invitation (matched by email) to this auth user.
    const [linked] = await db
      .update(adminUsers)
      .set({ authUserId: claims.sub })
      .where(and(eq(adminUsers.email, email), isNull(adminUsers.authUserId)))
      .returning();
    admin = linked;
  }
  if (!admin || !admin.isActive) return null;
  return { id: admin.id, email: admin.email, displayName: admin.displayName, role: admin.role };
});

const roleRank: Record<AdminRole, number> = { staff: 1, manager: 2, owner: 3 };

export function hasRole(admin: Admin, minimum: AdminRole) {
  return roleRank[admin.role] >= roleRank[minimum];
}

/** For pages: redirects to login when not an admin, or home of admin when the role is too low. */
export async function requireAdmin(minimum: AdminRole = "staff"): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (!hasRole(admin, minimum)) redirect("/admin?denied=1");
  return admin;
}

/** For Server Actions: throws instead of redirecting so a forged request gets nothing. */
export async function assertAdmin(minimum: AdminRole = "staff"): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin || !hasRole(admin, minimum)) throw new Error("Not authorised");
  return admin;
}
