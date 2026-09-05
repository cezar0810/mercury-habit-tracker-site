import { bannerDocument, bannerUnits, type BannerPlacement } from "@/components/mercury/adsterra-config";

export function GET(request: Request) {
  const placement = new URL(request.url).pathname.split("/").filter(Boolean).at(-1) || "";
  if (!Object.hasOwn(bannerUnits, placement)) return new Response("Not found", { status: 404 });
  return new Response(bannerDocument(placement as BannerPlacement), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}
