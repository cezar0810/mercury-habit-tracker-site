"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Droplets,
  Flame,
  Trophy,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  dateKey,
  greeting,
  shiftDate,
  waterTotalForDay,
  weekdayLabel,
  type Habit,
  type WaterEntry,
} from "./state";
import { WeatherCard } from "./weather-card";

export function InicioScreen({
  name,
  goal,
  gender,
  characterClass,
  habits,
  completions,
  focusMinutesByDay,
  waterGoalMl,
  waterEntriesByDay,
  onHabits,
}: {
  name: string;
  goal: string;
  gender: string;
  characterClass: string;
  habits: Habit[];
  completions: Record<string, Record<string, boolean>>;
  focusMinutesByDay: Record<string, number>;
  waterGoalMl: number;
  waterEntriesByDay: Record<string, WaterEntry[]>;
  onHabits: () => void;
}) {
  const today = dateKey(new Date());
  const todayCompleted = habits.filter(
    (habit) => completions[today]?.[habit.id],
  ).length;
  const progress = habits.length
    ? Math.round((todayCompleted / habits.length) * 100)
    : 0;
  const totalCompletions = Object.values(completions).reduce(
    (total, day) => total + Object.values(day).filter(Boolean).length,
    0,
  );
  const xp = totalCompletions * 15;
  const level = Math.floor(xp / 125) + 1;
  const currentLevelXp = xp % 125;
  const focusToday = focusMinutesByDay[today] || 0;
  const waterToday = waterTotalForDay({ waterEntriesByDay }, today);
  const waterProgress = Math.min(
    100,
    Math.round((waterToday / Math.max(1, waterGoalMl)) * 100),
  );
  const week = Array.from({ length: 7 }, (_, index) =>
    shiftDate(today, index - 6),
  );
  const weeklyRates = week.map((day) => {
    if (!habits.length) return 0;
    const completed = habits.filter((habit) => completions[day]?.[habit.id])
      .length;
    return Math.round((completed / habits.length) * 100);
  });
  const weeklyChart = week.map((day, index) => ({
    day: weekdayLabel(day).slice(0, 3),
    rate: weeklyRates[index],
  }));

  let streak = 0;
  for (let index = 0; index < 365; index += 1) {
    const day = shiftDate(today, -index);
    const hasProgress = habits.some((habit) => completions[day]?.[habit.id]);
    if (!hasProgress) break;
    streak += 1;
  }

  const pending = habits.filter((habit) => !completions[today]?.[habit.id]);

  return (
    <div className="space-y-6">
      <div className="grid items-stretch gap-4 md:grid-cols-[minmax(0,1fr)_330px]">
        <div className="flex min-h-[154px] flex-col justify-center rounded-[25px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(52,124,246,0.12),rgba(12,13,14,0.8))] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#82b1ff]">
            Hoje é um novo começo
          </p>
          <h1 className="mt-2 text-[31px] font-bold tracking-[-0.045em] sm:text-[36px]">
            {greeting()}, {name}
          </h1>
          <p className="mt-1 text-[16px] text-white/55">
            Um passo de cada vez.
          </p>
        </div>
        <WeatherCard />
      </div>

      <section className="rounded-[27px] border border-white/[0.12] bg-[#0c0d0e] p-5">
        <div className="flex items-center gap-4">
          <div className="grid size-[68px] place-items-center rounded-full border-2 border-[#347cf6] bg-[radial-gradient(circle_at_35%_25%,#425a8e,transparent_28%),linear-gradient(135deg,#192e57,#11131b)]">
            <Trophy className="size-7 text-[#c7d9ff]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center">
              <p className="truncate text-[20px] font-bold">{name}</p>
              <p className="ml-auto text-[12px] font-bold text-[#347cf6]">
                NÍVEL {level}
              </p>
            </div>
            <p className="text-[14px] text-white/55">
              {characterClass || "Classe não escolhida"} ·{" "}
              {gender || "perfil em configuração"}
            </p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#347cf6]"
                style={{ width: Math.max(4, (currentLevelXp / 125) * 100) + "%" }}
              />
            </div>
            <p className="mt-2 text-[12px] text-white/55">
              {currentLevelXp} / 125 XP para o próximo nível
            </p>
          </div>
        </div>
      </section>

      {goal && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#347cf6]/20 bg-[#347cf6]/[0.07] px-4 py-3 text-sm text-white/70">
          <Trophy className="size-5 text-[#82b1ff]" />
          <span>
            Objetivo atual: <strong className="font-semibold text-white">{goal}</strong>
          </span>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[27px] border border-white/[0.12] bg-[#0c0d0e] p-5">
          <div className="flex items-center gap-5">
            <div
              className="relative grid size-[124px] shrink-0 place-items-center rounded-full before:absolute before:size-[102px] before:rounded-full before:bg-[#0c0d0e]"
              style={{
                background:
                  "conic-gradient(#347cf6 " +
                  progress * 3.6 +
                  "deg, rgba(255,255,255,0.12) 0deg)",
              }}
            >
              <div className="relative text-center">
                <p className="text-[31px] font-bold tracking-[-0.04em]">
                  {progress}%
                </p>
                <p className="text-sm text-white/55">hoje</p>
              </div>
            </div>
            <div>
              <h2 className="text-[23px] font-bold">Seus hábitos</h2>
              <p className="mt-2 text-[15px] leading-6 text-white/55">
                {habits.length
                  ? todayCompleted + " de " + habits.length + " hábitos concluídos."
                  : "Crie hábitos para acompanhar seu progresso."}
              </p>
            </div>
          </div>
        </section>

        <a
          href="/water"
          className="group rounded-[27px] border border-sky-300/15 bg-[linear-gradient(135deg,rgba(14,116,180,0.2),#0c0d0e_70%)] p-5 transition hover:border-sky-300/30"
          aria-label="Abrir controle de água"
        >
          <div className="flex items-center gap-5">
            <div
              className="relative grid size-[124px] shrink-0 place-items-center rounded-full before:absolute before:size-[102px] before:rounded-full before:bg-[#0c0d0e]"
              style={{
                background:
                  "conic-gradient(#38bdf8 " +
                  waterProgress * 3.6 +
                  "deg, rgba(255,255,255,0.12) 0deg)",
              }}
            >
              <div className="relative text-center">
                <p className="text-[29px] font-bold tracking-[-0.04em]">
                  {waterProgress}%
                </p>
                <Droplets className="mx-auto mt-0.5 size-4 text-sky-300" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sky-300">Água hoje</p>
              <h2 className="mt-1 text-[23px] font-bold">
                {waterToday.toLocaleString("pt-BR")} ml
              </h2>
              <p className="mt-1 text-[14px] leading-5 text-white/50">
                Meta de {waterGoalMl.toLocaleString("pt-BR")} ml
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-sky-300">
                Registrar água
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <section className="rounded-[25px] border border-white/[0.12] bg-[#0c0d0e] p-5">
          <Flame className="size-7 text-[#347cf6]" />
          <p className="mt-6 text-[15px] text-white/55">Sequência</p>
          <p className="mt-1 text-[26px] font-bold">
            {streak} {streak === 1 ? "dia" : "dias"}
          </p>
        </section>
        <section className="rounded-[25px] border border-white/[0.12] bg-[#0c0d0e] p-5">
          <Clock3 className="size-7 text-[#347cf6]" />
          <p className="mt-6 text-[15px] text-white/55">Foco hoje</p>
          <p className="mt-1 text-[26px] font-bold">{focusToday} min</p>
        </section>
      </div>

      <section>
        <div className="mb-4 flex items-center">
          <h2 className="text-[22px] font-bold">Esta semana</h2>
          <button
            type="button"
            onClick={onHabits}
            className="ml-auto text-[14px] font-semibold text-[#347cf6]"
          >
            Ver hábitos
          </button>
        </div>
        <div className="rounded-[25px] border border-white/[0.1] bg-[#0c0d0e] p-5">
          {habits.length ? (
            <div className="h-52 w-full" aria-label="Gráfico de conclusão dos hábitos nos últimos sete dias">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weeklyChart}
                  margin={{ top: 10, right: 8, bottom: 0, left: -20 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.12)"
                    strokeDasharray="3 3"
                    vertical
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 10 }}
                  />
                  <Tooltip
                    cursor={{ stroke: "rgba(255,255,255,0.18)" }}
                    contentStyle={{
                      background: "#111317",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      color: "white",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.58)" }}
                    formatter={(value) => [`${Number(value)}%`, "Concluídos"]}
                  />
                  <Line
                    type="linear"
                    dataKey="rate"
                    stroke="#347cf6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#347cf6", stroke: "#b9d1ff", strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: "#82b1ff", stroke: "#ffffff", strokeWidth: 2 }}
                    isAnimationActive
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-7 text-center text-sm text-white/45">
              O gráfico começa a ser preenchido quando você criar hábitos.
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center">
          <h2 className="text-[22px] font-bold">Pendentes de hoje</h2>
          <span className="ml-auto text-sm text-white/45">{pending.length}</span>
        </div>
        {pending.length ? (
          <div className="space-y-2">
            {pending.slice(0, 4).map((habit) => (
              <button
                type="button"
                onClick={onHabits}
                key={habit.id}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.1] bg-[#0c0d0e] p-4 text-left transition hover:border-[#347cf6]/45"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-base" aria-hidden="true">
                  {habit.emoji}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">
                  {habit.title}
                </span>
                <ArrowRight className="size-4 text-white/45" />
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/[0.14] px-4 py-6 text-center text-sm text-white/48">
            {habits.length ? (
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-5 text-[#347cf6]" /> Tudo certo
                por hoje.
              </span>
            ) : (
              "Você ainda não criou hábitos."
            )}
          </div>
        )}
      </section>
    </div>
  );
}
