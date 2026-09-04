import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

async function loadSource(relativePath, aliases = {}) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const compiledModule = { exports: {} };
  runInNewContext(`(function(module, exports, require) { ${outputText}\n})`)(
    compiledModule,
    compiledModule.exports,
    (name) => aliases[name] ?? require(name),
  );
  return compiledModule.exports;
}

const state = await loadSource("../components/mercury/state.ts");
const storage = await loadSource("../components/mercury/mercury-storage.ts", {
  "./state": state,
});

function clean(value) {
  return JSON.parse(JSON.stringify(value));
}

test("criar um treino gera imediatamente um hábito com emoji", () => {
  const initial = state.cleanMercuryData({
    name: "Cezar",
    habits: [{ id: "manual", title: "Ler", emoji: "📚" }],
  });
  const synced = storage.withSyncedWorkouts(initial, [
    { id: "abc", name: "Peito e tríceps" },
  ]);

  assert.deepEqual(clean(synced.habits), [
    { id: "manual", title: "Ler", emoji: "📚" },
    {
      id: "workout-habit-abc",
      title: "Treino: Peito e tríceps",
      emoji: "🏋️",
      source: "workout",
      sourceId: "abc",
    },
  ]);
});

test("concluir um treino marca automaticamente o hábito naquele dia", () => {
  const initial = state.cleanMercuryData({ name: "Cezar" });
  const completed = storage.withCompletedWorkout(
    initial,
    { id: "abc", name: "Treino A" },
    "2026-09-04",
  );

  assert.equal(completed.completions["2026-09-04"]["workout-habit-abc"], true);
  assert.equal(completed.habits[0].emoji, "🏋️");
});

test("apagar uma ficha remove somente o hábito sincronizado", () => {
  const initial = state.cleanMercuryData({
    habits: [
      { id: "manual", title: "Estudar", emoji: "🎓" },
      {
        id: "workout-habit-abc",
        title: "Treino A",
        emoji: "🏋️",
        source: "workout",
        sourceId: "abc",
      },
    ],
    completions: {
      "2026-09-04": { manual: true, "workout-habit-abc": true },
    },
  });
  const synced = storage.withSyncedWorkouts(initial, []);

  assert.deepEqual(clean(synced.habits), [
    { id: "manual", title: "Estudar", emoji: "🎓" },
  ]);
  assert.deepEqual(clean(synced.completions["2026-09-04"]), { manual: true });
});

test("migra hábitos antigos e soma a água do dia", () => {
  const migrated = state.cleanMercuryData({
    habits: [{ id: "corrida", title: "Corrida" }],
    waterGoalMl: 2500,
    waterEntriesByDay: {
      "2026-09-04": [
        { id: "a", amountMl: 250, recordedAt: "2026-09-04T10:00:00Z" },
        { id: "b", amountMl: 500, recordedAt: "2026-09-04T12:00:00Z" },
      ],
    },
  });

  assert.equal(migrated.habits[0].emoji, "🏃");
  assert.equal(state.waterTotalForDay(migrated, "2026-09-04"), 750);
});
