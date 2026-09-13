import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const text=await readFile(new URL('../app/api/weather/route.ts',import.meta.url),'utf8');
const js=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {GET}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('coordenadas ausentes, vazias, infinitas e fora de faixa são rejeitadas',async()=>{
 for(const query of ['', '?lat=&lon=0','?lat=NaN&lon=0','?lat=91&lon=0','?lat=0&lon=-181']) assert.equal((await GET(new Request('https://example.test/api/weather'+query))).status,400);
});
test('clima usa coordenadas recebidas e lida com erro do provedor',async()=>{
 const original=globalThis.fetch;
 try {
  let requested;
  globalThis.fetch=async url=>{requested=new URL(url);return Response.json({properties:{timeseries:[{time:'2026-09-13T10:00:00Z',data:{instant:{details:{air_temperature:23}}}}]}});};
  const response=await GET(new Request('https://example.test/api/weather?lat=0&lon=0'));
  assert.equal(response.status,200);assert.equal(requested.searchParams.get('lat'),'0');assert.equal(requested.searchParams.get('lon'),'0');assert.equal((await response.json()).temperature,23);
  globalThis.fetch=async()=>{throw new Error('offline');};
  assert.equal((await GET(new Request('https://example.test/api/weather?lat=-23.55&lon=-46.63'))).status,502);
 } finally {globalThis.fetch=original;}
});
