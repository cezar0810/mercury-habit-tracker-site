import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("página de atualização usa a versão e o APK do manifesto", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/version.json", import.meta.url), "utf8"));
  const { default: worker } = await import("../dist/server/index.js");
  const response = await worker.fetch(
    new Request("https://mercury.example/atualizacao", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes("Atualize seu Mercury."));
  assert.ok(html.includes("Baixar atualização"));
  assert.ok(html.includes(manifest.version_name));
  assert.ok(html.includes(`href="${manifest.download_url}"`));
  assert.ok(html.includes("Não desinstale seu app atual"));
  assert.equal(new URL(manifest.update_page_url).pathname, "/atualizacao");

  const downloadArea = await readFile(new URL("../components/mercury/download-area.tsx", import.meta.url), "utf8");
  assert.ok(downloadArea.includes("href={appRelease.download_url}"));
  assert.ok(downloadArea.includes("appRelease.version_name"));
});
