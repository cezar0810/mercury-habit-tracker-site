import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = await readFile(new URL("../components/mercury/workouts-data.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const compiledModule = { exports: {} };
runInNewContext(`(function(module, exports) { ${outputText}\n})`)(compiledModule, compiledModule.exports);
const data = compiledModule.exports;

test("limita o usuário a cinco treinos e limpa contagens", () => {
  const raw = Array.from({ length: 7 }, (_, index) => ({
    id: `t-${index}`,
    name: `Treino ${index}`,
    exercises: [{ id: `e-${index}`, name: "Exercício", sets: 99, reps: 0 }],
  }));
  const plans = data.cleanWorkoutPlans(raw);
  assert.equal(data.MAX_WORKOUTS, 5);
  assert.equal(plans.length, 5);
  assert.equal(plans[0].exercises[0].sets, 20);
  assert.equal(plans[0].exercises[0].reps, 1);
});

test("busca em português por nome, músculo e equipamento", () => {
  const catalog = data.normalizeCatalog([
    { id: "1", name: "Supino com halteres", primaryMuscles: ["peito"], equipment: "halteres" },
    { id: "2", name: "Tríceps no banco", primaryMuscles: ["triceps"], equipment: "peso-do-corpo" },
  ]);
  assert.equal(data.searchCatalog(catalog, "supino")[0].id, "1");
  assert.equal(data.searchCatalog(catalog, "tríceps")[0].id, "2");
  assert.equal(data.searchCatalog(catalog, "halteres")[0].id, "1");
});

test("usa o catálogo com tradução completa em português", () => {
  assert.match(data.EXERCISE_DATA_URL, /exercicios-bd-ptbr/);
  assert.match(data.EXERCISE_DATA_URL, /full-translation\.json$/);
});

test("gera a URL pública das imagens sem perder subpastas", () => {
  assert.equal(
    data.exerciseImageUrl("3_4_Sit-Up/0.jpg"),
    "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/3_4_Sit-Up/0.jpg",
  );
});
