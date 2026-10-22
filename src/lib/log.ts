import "server-only";

type Level = "info" | "warn" | "error";
type Fields = Record<string, unknown>;

/**
 * Minimal structured logger: one JSON line per event so a hosting platform's log
 * drain can parse it. Never pass secrets or full request bodies as fields.
 */
function emit(level: Level, event: string, fields?: Fields) {
  const line = JSON.stringify({ level, event, time: new Date().toISOString(), ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (event: string, fields?: Fields) => emit("info", event, fields),
  warn: (event: string, fields?: Fields) => emit("warn", event, fields),
  error: (event: string, fields?: Fields) => emit("error", event, fields),
};

/** Normalise an unknown caught value into log-safe fields (message only, no stack to client). */
export function errFields(error: unknown): Fields {
  if (error instanceof Error) return { error: error.name, message: error.message };
  return { error: String(error) };
}
