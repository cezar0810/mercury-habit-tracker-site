import { bannerDocument } from "@/components/mercury/adsterra-config";

// HTML direto para o WebView: o anúncio independe de React, hidratação e srcdoc.
export function GET() {
  return new Response(bannerDocument("app", true), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}
