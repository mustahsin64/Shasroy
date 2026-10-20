export type AdminRole = "owner" | "manager" | "staff";
export type Admin = { id: string; email: string; displayName: string | null; role: AdminRole };

const roleRank: Record<AdminRole, number> = { staff: 1, manager: 2, owner: 3 };

export function hasRole(admin: Pick<Admin, "role">, minimum: AdminRole) {
  return roleRank[admin.role] >= roleRank[minimum];
}
