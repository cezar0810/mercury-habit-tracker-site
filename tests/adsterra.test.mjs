import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

// Testes de lógica e renderização em memória: nunca executam scripts de ads.
const require = createRequire(import.meta.url);
async function loadSource(relativePath, aliases = {}) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const compiledModule = { exports: {} };
  runInNewContext(`(function(module, exports, require) { ${outputText}\n})`)(
    compiledModule, compiledModule.exports, (name) => aliases[name] ?? require(name),
  );
  return compiledModule.exports;
}
const config = await loadSource("../components/mercury/adsterra-config.ts");
const ads = await loadSource("../components/mercury/adsterra-banner.tsx", {
  "./adsterra-config": config,
});

test("preserva o 300x250 e usa os códigos exatos das capturas", () => {
  const { sidebar, leaderboard, app } = config.bannerUnits;
  assert.equal(sidebar.key, "9f638f6846aefc97bc991b4d39110738");
  assert.equal(sidebar.scriptUrl, "https://www.highperformanceformat.com/9f638f6846aefc97bc991b4d39110738/invoke.js");
  assert.equal(leaderboard.scriptUrl, "https://www.highrevenueformat.com/5aec9e5a23fec0603deeddcac95f3069/invoke.js");
  assert.equal(app.scriptUrl, "https://www.highrevenueformat.com/e3e738f5e05faf47328d4aef05b5da4f/invoke.js");
  assert.equal(config.nativeUnit.containerId, "container-52e866d544fa95f5ea6617eb9aaf1c28");
  assert.equal(config.nativeUnit.scriptUrl, "https://pl31157743.profitableratecpmnetwork.com/52e866d544fa95f5ea6617eb9aaf1c28/invoke.js");
  assert.equal(new Set(Object.values(config.bannerUnits).map(unit => unit.key)).size, 3);
});

for (const [width, viewport, expected] of [
  [0, 1366, null], [728, 0, null],
  [246, 320, "native"], [301, 375, "native"], [356, 430, "native"],
  [688, 768, "native"], [900, 1000, "native"],
  [544, 1024, "native"], [727, 1366, "native"],
  [728, 1366, "leaderboard"], [800, 1920, "leaderboard"],
]) {
  test(`seleciona ${expected} com ${width}px disponíveis e tela de ${viewport}px`, () => {
    assert.equal(config.contentAdFormat(width, viewport), expected);
  });
}

test("não carrega o banner lateral oculto ou sem espaço", () => {
  assert.equal(config.sidebarAdFits(0, 375), false);
  assert.equal(config.sidebarAdFits(300, 375), false);
  assert.equal(config.sidebarAdFits(299, 1366), false);
  assert.equal(config.sidebarAdFits(300, 1024), true);
});

test("cada banner mantém dimensões, script e atOptions em documento próprio", () => {
  const contexts = [];
  for (const [placement, unit] of Object.entries(config.bannerUnits)) {
    const document = config.bannerDocument(placement);
    const code = document.match(/<script>([^<]+)<\/script>/)?.[1];
    assert.ok(code);
    const context = {};
    runInNewContext(code, context);
    contexts.push(context);
    assert.deepEqual(JSON.parse(JSON.stringify(context.atOptions)), {
      key: unit.key, format: "iframe", height: unit.height, width: unit.width, params: {},
    });
    assert.ok(document.indexOf("atOptions =") < document.indexOf(unit.scriptUrl));
    assert.equal((document.match(/<script src=/g) ?? []).length, 1);
    assert.doesNotMatch(document, /setInterval|setTimeout|window\.open|profitableratecpmnetwork\.com\/q7/);
    const html = renderToStaticMarkup(React.createElement(ads.AdsterraBannerFrame, { placement }));
    assert.match(html, new RegExp(`width="${unit.width}" height="${unit.height}"`));
    assert.match(html, /srcDoc=/);
    assert.match(html, /title="Publicidade/);
    assert.doesNotMatch(html, /loading="lazy"|transform:|scale\(/);
  }
  assert.notEqual(contexts[0].atOptions.key, contexts[1].atOptions.key);
  assert.notEqual(contexts[1].atOptions.key, contexts[2].atOptions.key);
});

test("HTML inicial não dispara anúncios antes de conhecer a largura", () => {
  for (const Component of [ads.AdsterraSidebarAd, ads.AdsterraContentAd, ads.AdsterraAppAd]) {
    const html = renderToStaticMarkup(React.createElement(Component));
    assert.doesNotMatch(html, /<iframe|<script|invoke\.js/);
    assert.match(html, /Publicidade|PUBLICIDADE/);
  }
});

test("/anuncio é compacto, sem tracker, download ou cadastro", async () => {
  const page = await loadSource("../app/anuncio/page.tsx", {
    "@/components/mercury/adsterra-banner": ads,
  });
  const html = renderToStaticMarkup(React.createElement(page.default));
  assert.equal(page.metadata.robots.index, false);
  assert.match(html, /min-h-\[70px\]/);
  assert.match(html, /PUBLICIDADE/);
  assert.doesNotMatch(html, /Seu espaço|Como podemos te chamar|Baixar|<nav|<form/);
});

test("tracker tem um lateral e um responsivo, preservando dados e download", async () => {
  const webApp = await readFile(new URL("../components/mercury/web-app.tsx", import.meta.url), "utf8");
  const download = await readFile(new URL("../components/mercury/download-area.tsx", import.meta.url), "utf8");
  assert.equal((webApp.match(/<AdsterraSidebarAd/g) ?? []).length, 1);
  assert.equal((webApp.match(/<AdsterraContentAd/g) ?? []).length, 1);
  assert.doesNotMatch(webApp, /<AdsterraAppAd|<AdsterraBanner\s/);
  assert.match(webApp, /mercury-habit-tracker-web-v1/);
  const manifest = JSON.parse(await readFile(new URL("../public/version.json", import.meta.url), "utf8"));
  const apkDownload = await readFile(new URL("../components/mercury/apk-download.tsx", import.meta.url), "utf8");
  assert.match(download, /<ApkDownload/);
  assert.match(apkDownload, /href=\{appRelease\.download_url\}/);
  assert.match(manifest.download_url, /releases\/latest\/download\/Mercury-Habit-Tracker\.apk/);
});
