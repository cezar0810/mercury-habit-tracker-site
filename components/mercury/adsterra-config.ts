// Códigos públicos das unidades, copiados do painel do proprietário.
// A unidade do app não é usada como segundo anúncio na página do tracker.
export const bannerUnits = {
  sidebar: {
    key: "9f638f6846aefc97bc991b4d39110738",
    width: 300,
    height: 250,
    // Preserva o endereço da unidade que já funcionava na lateral.
    scriptUrl: "https://www.highperformanceformat.com/9f638f6846aefc97bc991b4d39110738/invoke.js",
  },
  leaderboard: {
    key: "5aec9e5a23fec0603deeddcac95f3069",
    width: 728,
    height: 90,
    scriptUrl: "https://www.highrevenueformat.com/5aec9e5a23fec0603deeddcac95f3069/invoke.js",
  },
  app: {
    key: "e3e738f5e05faf47328d4aef05b5da4f",
    width: 320,
    height: 50,
    scriptUrl: "https://www.highrevenueformat.com/e3e738f5e05faf47328d4aef05b5da4f/invoke.js",
  },
} as const;

export const nativeUnit = {
  containerId: "container-52e866d544fa95f5ea6617eb9aaf1c28",
  scriptUrl: "https://pl31157743.profitableratecpmnetwork.com/52e866d544fa95f5ea6617eb9aaf1c28/invoke.js",
} as const;

export type BannerPlacement = keyof typeof bannerUnits;

export function contentAdFormat(availableWidth: number, viewportWidth: number) {
  if (availableWidth <= 0 || viewportWidth <= 0) return null;
  // Janelas estreitas de desktop também não devem comprimir o banner de 728px.
  return viewportWidth >= 1024 && availableWidth >= 728 ? "leaderboard" : "native";
}

export function sidebarAdFits(availableWidth: number, viewportWidth: number) {
  return availableWidth >= 300 && viewportWidth >= 1024;
}

export function bannerDocument(placement: BannerPlacement) {
  const unit = bannerUnits[placement];
  // Cada documento tem seu próprio atOptions. Os scripts executam na ordem
  // original do fornecedor, sem disputar uma variável global no React.
  return `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Publicidade ${unit.width}×${unit.height}</title>
<style>html,body{margin:0;padding:0;width:${unit.width}px;height:${unit.height}px;background:transparent}iframe{border:0;display:block}#ad-status{margin:0;font:12px Arial,sans-serif;color:#aaa;text-align:center}</style>
</head><body>
<p id="ad-status" role="status" hidden>Publicidade indisponível no momento.</p>
<script>atOptions = ${JSON.stringify({ key: unit.key, format: "iframe", height: unit.height, width: unit.width, params: {} })};</script>
<script src="${unit.scriptUrl}" data-cfasync="false" onerror="document.getElementById('ad-status').hidden=false"></script>
</body></html>`;
}
