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
  content: {
    key: "630d2e92a8d18337fae21876b6d1cb20",
    width: 468,
    height: 60,
    scriptUrl: "https://www.highrevenueformat.com/630d2e92a8d18337fae21876b6d1cb20/invoke.js",
  },
  app: {
    key: "e3e738f5e05faf47328d4aef05b5da4f",
    width: 320,
    height: 50,
    scriptUrl: "https://www.highrevenueformat.com/e3e738f5e05faf47328d4aef05b5da4f/invoke.js",
  },
} as const;

export type BannerPlacement = keyof typeof bannerUnits;

export function contentAdFits(availableWidth: number) {
  // A unidade é fixa em 468 px e não deve ser comprimida ou cortada.
  return availableWidth >= bannerUnits.content.width;
}

export function contentAdPlacement(availableWidth: number): BannerPlacement | null {
  if (availableWidth >= bannerUnits.content.width) return "content";
  if (availableWidth >= bannerUnits.app.width) return "app";
  return null;
}

export function sidebarAdFits(availableWidth: number, viewportWidth: number) {
  return availableWidth >= 300 && viewportWidth >= 1024;
}

export function bannerDocument(placement: BannerPlacement, label = false) {
  const unit = bannerUnits[placement];
  // Cada documento tem seu próprio atOptions. Os scripts executam na ordem
  // original do fornecedor, sem disputar uma variável global no React.
  return `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Publicidade ${unit.width}×${unit.height}</title>
<meta name="robots" content="noindex,nofollow">
<style>html,body{margin:0;padding:0;min-width:${unit.width}px;background:${label ? "#000" : "transparent"};color:#aaa}body{width:${unit.width}px;margin:auto}iframe{border:0;display:block}.ad-label{height:20px;margin:0;font:10px/20px Arial,sans-serif;text-align:center;letter-spacing:1px}#ad-status{margin:0;font:12px/20px Arial,sans-serif;color:#aaa;text-align:center}</style>
</head><body>
${label ? '<p class="ad-label">PUBLICIDADE</p>' : ""}
<p id="ad-status" role="status" hidden>Publicidade indisponível no momento.</p>
<script>atOptions = ${JSON.stringify({ key: unit.key, format: "iframe", height: unit.height, width: unit.width, params: {} })};</script>
<script src="${unit.scriptUrl}" data-cfasync="false" onerror="document.getElementById('ad-status').hidden=false; if(window.MercuryAds) window.MercuryAds.postMessage('unavailable');"></script>
<script>(function(){
  var finished=false;
  function send(message){try{if(window.MercuryAds&&window.MercuryAds.postMessage)window.MercuryAds.postMessage(message)}catch(error){}}
  function verify(){
    var frame=document.querySelector('iframe');
    if(!frame)return false;
    finished=true;
    document.body.dataset.mercuryAd='loaded';
    send('loaded');
    return true;
  }
  if(!verify()){
    var observer=new MutationObserver(function(){if(verify())observer.disconnect()});
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(function(){
      observer.disconnect();
      if(!finished){document.getElementById('ad-status').hidden=false;send('unavailable')}
    },15000);
  }
})();</script>
</body></html>`;
}
