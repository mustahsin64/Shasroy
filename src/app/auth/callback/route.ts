import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Magic-link landing: exchanges the one-time code for a session cookie.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const target = new URL("/admin", request.url);
  if (!code) return NextResponse.redirect(new URL("/admin/login?error=link", request.url));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/admin/login?error=link", request.url));
  return NextResponse.redirect(target);
}
