import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
async function loadSource(relativePath, aliases = {}) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const compiledModule = { exports: {} };
  runInNewContext(`(function(module, exports, require) { ${outputText}\n})`)(compiledModule, compiledModule.exports, name => aliases[name] ?? require(name));
  return compiledModule.exports;
}
const recognition = await loadSource("../components/mercury/habit-recognition.ts");
const state = await loadSource("../components/mercury/state.ts", { "./habit-recognition": recognition });
const storage = await loadSource("../components/mercury/mercury-storage.ts", { "./state": state });
const routine = await loadSource("../components/mercury/routine.ts", { "./state": state, "./habit-recognition": recognition });
const health = await loadSource("../components/mercury/health-metrics.ts");
const clean = value => JSON.parse(JSON.stringify(value));

test("reconhece somente hábitos com intenção clara", () => {
  assert.equal(recognition.recognizeHabit("Academia"), "workout");
  assert.equal(recognition.recognizeHabit("Fazer musculação"), "workout");
  assert.equal(recognition.recognizeHabit("Beber água"), "water");
  assert.equal(recognition.recognizeHabit("Regar as plantas com água"), "none");
  assert.equal(recognition.recognizeHabit("Estudar treino de programação"), "none");
});

test("migra dados antigos sem apagar marcações e inicia o relatório hoje", () => {
  const migrated = state.cleanMercuryData({
    name: "Cezar",
    habits: [{ id: "agua", title: "Beber água", emoji: "💧" }],
    completions: { "2026-09-01": { agua: true } },
  });
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.habits[0].link, "water");
  assert.equal(migrated.completions["2026-09-01"].agua, true);
  assert.match(migrated.trackingSince, /^\d{4}-\d{2}-\d{2}$/);
});

test("água e academia atualizam hábitos ligados sem dupla contagem", () => {
  const data = state.cleanMercuryData({
    schemaVersion: 2, trackingSince: "2026-09-01", waterGoalMl: 500,
    waterGoalHistory: [{ from: "2026-09-01", goalMl: 500 }],
    habits: [
      { id: "agua", title: "Beber água", emoji: "💧", link: "water", createdOn: "2026-09-01", scheduleHistory: [{ from: "2026-09-01", weekdays: [0,1,2,3,4,5,6] }] },
      { id: "academia", title: "Academia", emoji: "🏋️", link: "workout", createdOn: "2026-09-01", scheduleHistory: [{ from: "2026-09-01", weekdays: [1] }] },
      { id: "ficha", title: "Treino A", emoji: "🏋️", source: "workout", sourceId: "a", createdOn: "2026-09-01", scheduleHistory: [{ from: "2026-09-01", weekdays: [1] }] },
    ],
    waterEntriesByDay: { "2026-09-07": [{ id: "copo", amountMl: 500, recordedAt: "2026-09-07T10:00:00Z" }] },
    workoutCompletionsByDay: { "2026-09-07": ["a"] },
  });
  assert.equal(routine.habitIsComplete(data, data.habits[0], "2026-09-07"), true);
  assert.equal(routine.habitIsComplete(data, data.habits[1], "2026-09-07"), true);
  const plan = routine.dayPlan(data, "2026-09-07");
  assert.equal(plan.filter(item => item.link === "workout").length, 1);
  assert.equal(plan.filter(item => item.done).length, 2);
});

test("alterar frequência e ligação não muda o passado", () => {
  let habit = { id:"ler", title:"Ler", emoji:"📚", link:"none", createdOn:"2026-09-01", scheduleHistory:[{ from:"2026-09-01", weekdays:[1,2,3,4,5] }], linkHistory:[{ from:"2026-09-01", link:"none" }] };
  habit = routine.scheduleHabit(habit, [6], "2026-09-05");
  habit = routine.setHabitLink(habit, "water", "2026-09-05");
  assert.equal(routine.habitIsScheduled(habit, "2026-09-04"), true);
  assert.equal(routine.habitLink(habit, "2026-09-04"), "none");
  assert.equal(routine.habitIsScheduled(habit, "2026-09-05"), true);
  assert.equal(routine.habitLink(habit, "2026-09-05"), "water");
});

test("criar, concluir e apagar treino preserva o histórico", () => {
  const initial = state.cleanMercuryData({ schemaVersion:2, trackingSince:"2026-09-01", habits:[{ id:"manual", title:"Ler", emoji:"📚" }] });
  const synced = storage.withSyncedWorkouts(initial, [{ id:"abc", name:"Peito e tríceps" }]);
  assert.equal(synced.habits.at(-1).sourceId, "abc");
  const completed = storage.withCompletedWorkout(synced, { id:"abc", name:"Peito e tríceps" }, "2026-09-04");
  assert.deepEqual(clean(completed.workoutCompletionsByDay["2026-09-04"]), ["abc"]);
  const removed = storage.withSyncedWorkouts(completed, []);
  assert.equal(removed.habits.find(habit => habit.sourceId === "abc").archivedOn !== undefined, true);
  assert.deepEqual(clean(removed.workoutCompletionsByDay["2026-09-04"]), ["abc"]);
});

test("relatório ignora futuro e usa medidas separadas", () => {
  const data = state.cleanMercuryData({ schemaVersion:2, trackingSince:"2026-09-01", habits:[{ id:"ler", title:"Ler", emoji:"📚", createdOn:"2026-09-01", link:"none", scheduleHistory:[{ from:"2026-09-01", weekdays:[1,2,3,4,5,6,0] }] }], completions:{ "2026-09-04":{ ler:true } }, focusMinutesByDay:{ "2026-09-04":25 } });
  const report = routine.weekReport(data, "2026-09-04", "2026-09-04");
  assert.equal(report.availableDays.length, 4);
  assert.equal(report.planned, 4);
  assert.equal(report.done, 1);
  assert.equal(report.focusMinutes, 25);
  assert.equal(report.rows.filter(row => row.day > "2026-09-04").every(row => row.rate === null), true);
});

test("meta de água e energia usam estimativas determinísticas", () => {
  assert.equal(health.recommendedWaterMl(70), 2450);
  assert.equal(health.estimatedStepCalories(10000, 70, 175), 429);
  const exercises = [
    { sets: 3, reps: 10 },
    { sets: 4, reps: 12 },
  ];
  assert.equal(health.estimatedWorkoutMinutes(exercises), 9);
  assert.equal(health.estimatedWorkoutCalories(70, exercises), 39);
});

test("calorias do treino entram uma vez no relatório semanal", () => {
  const initial = state.cleanMercuryData({
    schemaVersion: 2,
    trackingSince: "2026-09-01",
  });
  const once = storage.withCompletedWorkout(
    initial,
    { id: "abc", name: "Treino A" },
    "2026-09-04",
    120,
  );
  const twice = storage.withCompletedWorkout(
    once,
    { id: "abc", name: "Treino A" },
    "2026-09-04",
    120,
  );
  assert.equal(twice.workoutCaloriesByDay["2026-09-04"], 120);
  assert.equal(routine.weekReport(twice, "2026-09-04", "2026-09-04").caloriesBurned, 120);
});
