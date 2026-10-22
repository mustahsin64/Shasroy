import { NextResponse, type NextRequest } from "next/server";
import { deleteStaleCarts } from "@/lib/cart-cleanup";
import { errFields, log } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * Deletes abandoned carts. Protect with CRON_SECRET and call on a schedule
 * (e.g. a Vercel Cron job) with header: Authorization: Bearer <CRON_SECRET>.
 * Returns 404 when no secret is configured so the endpoint is effectively off.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const removed = await deleteStaleCarts();
    log.info("cart_cleanup", { removed });
    return NextResponse.json({ removed });
  } catch (error) {
    log.error("cart_cleanup_failed", errFields(error));
    return NextResponse.json({ error: "cleanup failed" }, { status: 500 });
  }
}
