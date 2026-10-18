import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/lib/env";
import * as schema from "./schema";

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { shasroySql?: postgres.Sql };

function createClient() {
  // The Supabase transaction pooler does not support prepared statements.
  return postgres(serverEnv().DATABASE_URL, { prepare: false, max: 5 });
}

const client = globalForDb.shasroySql ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.shasroySql = client;

export const db = drizzle(client, { schema });
export { schema };
