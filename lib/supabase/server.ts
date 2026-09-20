import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKeyResolved, supabaseUrlResolved } from "@/lib/supabase";

export function createSupabaseServerClient(request: Request, response: Response) {
  return createServerClient(supabaseUrlResolved, supabaseAnonKeyResolved, {
    cookies: {
      getAll() {
        const header = request.headers.get("cookie") ?? "";
        return header.split(/;\s*/).filter(Boolean).map((part) => {
          const i = part.indexOf("=");
          return i === -1 ? { name: part, value: "" } : { name: part.slice(0, i), value: part.slice(i + 1) };
        });
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          const parts = [
            `${name}=${value}`,
            options?.maxAge != null ? `Max-Age=${options.maxAge}` : "",
            options?.domain ? `Domain=${options.domain}` : "",
            options?.path ? `Path=${options.path}` : "Path=/",
            options?.expires ? `Expires=${options.expires.toUTCString()}` : "",
            options?.httpOnly ? "HttpOnly" : "",
            options?.secure ? "Secure" : "",
            options?.sameSite ? `SameSite=${String(options.sameSite)}` : "",
          ].filter(Boolean).join("; ");
          response.headers.append("Set-Cookie", parts);
        }
      },
    },
  });
}
