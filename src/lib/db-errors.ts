/** Drizzle wraps driver errors, so walk the cause chain looking for Postgres 23505 on the given constraint. */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  for (let e = error as { code?: string; constraint_name?: string; cause?: unknown } | undefined, depth = 0; e && depth < 5; e = e.cause as typeof e, depth++) {
    if (e.code === "23505" && e.constraint_name === constraint) return true;
  }
  return false;
}
