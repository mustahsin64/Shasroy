import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

let cached: z.infer<typeof serverEnvSchema> | undefined;

export function serverEnv() {
  if (!cached) {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      // Report variable names only; never echo values.
      const names = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))];
      throw new Error(`Missing or invalid server environment variables: ${names.join(", ")}`);
    }
    cached = parsed.data;
  }
  return cached;
}
