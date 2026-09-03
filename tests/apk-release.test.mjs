import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../lib/apk-release.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { formatApkSize, loadApkRelease, releaseLookup } = await import(moduleUrl);

test("deriva a API e o nome do APK do link público", () => {
  const lookup = releaseLookup("https://github.com/cezar0810/mercury-downloads/releases/latest/download/Mercury-Habit-Tracker.apk");
  assert.equal(lookup.apiUrl, "https://api.github.com/repos/cezar0810/mercury-downloads/releases/latest");
  assert.equal(lookup.assetName, "Mercury-Habit-Tracker.apk");
  assert.throws(() => releaseLookup("https://example.com/app.apk"));
});

test("usa o tamanho do APK correto da Release mais recente", async () => {
  const fetcher = async () => new Response(JSON.stringify({
    draft: false,
    prerelease: false,
    assets: [
      { name: "outro.apk", size: 1, state: "uploaded" },
      { name: "Mercury-Habit-Tracker.apk", size: 55_420_000, state: "uploaded" },
    ],
  }));
  const info = await loadApkRelease("https://github.com/cezar0810/mercury-downloads/releases/latest/download/Mercury-Habit-Tracker.apk", fetcher);
  assert.deepEqual(info, { status: "available", sizeBytes: 55_420_000 });
  assert.equal(formatApkSize(info.sizeBytes), "55,4 MB");
});

test("não inventa tamanho quando a Release ou o arquivo não existem", async () => {
  const noRelease = await loadApkRelease(
    "https://github.com/cezar0810/mercury-downloads/releases/latest/download/Mercury-Habit-Tracker.apk",
    async () => new Response(null, { status: 404 }),
  );
  const noAsset = await loadApkRelease(
    "https://github.com/cezar0810/mercury-downloads/releases/latest/download/Mercury-Habit-Tracker.apk",
    async () => new Response(JSON.stringify({ draft: false, prerelease: false, assets: [] })),
  );
  assert.deepEqual(noRelease, { status: "unpublished" });
  assert.deepEqual(noAsset, { status: "unpublished" });
});
