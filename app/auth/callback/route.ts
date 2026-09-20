import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const redirectPath = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const successUrl = new URL(redirectPath, url.origin);

  if (!code) {
    const errorUrl = new URL("/login", url.origin);
    errorUrl.searchParams.set("error", "oauth_code_missing");
    return NextResponse.redirect(errorUrl);
  }

  const response = NextResponse.redirect(successUrl);
  const supabase = createSupabaseServerClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errorUrl = new URL("/login", url.origin);
    errorUrl.searchParams.set("error", "oauth_callback_failed");
    return NextResponse.redirect(errorUrl);
  }

  return response;
}
