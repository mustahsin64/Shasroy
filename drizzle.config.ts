import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL_DIRECT;
if (!url) throw new Error("DATABASE_URL_DIRECT is not set (session pooler, port 5432).");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["public"],
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
