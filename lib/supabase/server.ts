import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKeyResolved, supabaseUrlResolved } from "@/lib/supabase";
import type { NextRequest, NextResponse } from "next/server";

export function createSupabaseServerClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createServerClient(supabaseUrlResolved, supabaseAnonKeyResolved, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });
}
