"use client";

import { workoutCaloriesTotal } from "./state";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  dateKey,
  shiftDate,
  shortDateLabel,
  waterTotalForDay,
  weekdayLabel,
  type MercuryData,
} from "./state";
import { habitIsScheduled, habitIsComplete, waterGoalForDay, weekReport } from "./routine";

function percentage(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

function monthTitle(month: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(month).replace(/^./, (letter) => letter.toUpperCase());
}

function monthDays(month: Date) {
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: total }, (_, index) =>
    dateKey(new Date(month.getFullYear(), month.getMonth(), index + 1)),
  );
}

function shiftMonth(month: Date, amount: number) {
  return new Date(month.getFullYear(), month.getMonth() + amount, 1);
}

export function ProgressScreen({ data }: { data: MercuryData }) {
  const now = new Date();
  const today = dateKey(now);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [anchor, setAnchor] = useState(today);
  const [radarMonth, setRadarMonth] = useState(currentMonth);
  const report = weekReport(data, anchor, today);
  const labels: Record<string, string> = {
    habit: "Hábitos",
    task: "Tarefas",
    workout: "Treinos previstos",
  };

  const radarAvailableDays = monthDays(radarMonth).filter(
    (day) => day <= today,
  );
  const radarHabits = radarAvailableDays.flatMap(day => data.habits.filter(habit => habitIsScheduled(habit, day)).map(habit => ({ habit, done: habitIsComplete(data, habit, day) })));
  const radarWorkouts = radarHabits.filter(item => item.habit.source === "workout");

  const waterScore = radarAvailableDays.length
    ? Math.round(
        radarAvailableDays.reduce((total, day) => {
          const goal = waterGoalForDay(data, day);
          if (goal <= 0) return total;
          return total + Math.min(1, waterTotalForDay(data, day) / goal);
        }, 0) /
          radarAvailableDays.length *
          100,
      )
    : 0;

  const focusMinutes = radarAvailableDays.reduce(
    (total, day) => total + (data.focusMinutesByDay[day] || 0),
    0,
  );
  const focusScore = radarAvailableDays.length
    ? Math.min(100, Math.round((focusMinutes / (radarAvailableDays.length * 25)) * 100))
    : 0;

  const radarData = [
    {
      metric: "Hábitos",
      value: percentage(
        radarHabits.filter((item) => item.done).length,
        radarHabits.length,
      ),
    },
    { metric: "Passos", value: percentage(radarAvailableDays.reduce((sum, day) => sum + (data.stepsByDay[day] || 0), 0), radarAvailableDays.length * 10000) },
    { metric: "Água", value: waterScore },
    {
      metric: "Treino",
      value: percentage(
        radarWorkouts.filter((item) => item.done).length,
        radarWorkouts.length,
      ),
    },
    { metric: "Foco", value: focusScore },
  ];

  const canGoNextRadarMonth =
    radarMonth.getFullYear() < currentMonth.getFullYear() ||
    (radarMonth.getFullYear() === currentMonth.getFullYear() &&
      radarMonth.getMonth() < currentMonth.getMonth());

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[32px] font-bold tracking-tight">Relatório</h1>
        <p className="mt-2 text-base text-white/60">
          Acompanhe seu equilíbrio mensal e os detalhes da semana.
        </p>
      </header>

      <section className="rounded-[24px] border border-white/15 bg-[#0c0e11] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Equilíbrio do mês</h2>
            <p className="mt-1 text-sm text-white/60">
              Hábitos, água, treino e foco acumulados no mês selecionado.
            </p>
          </div>
          <span className="rounded-full border border-[#77a7ff]/25 bg-[#77a7ff]/10 px-3 py-1 text-xs font-semibold text-[#a8c8ff]">
            0–100%
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 p-2">
          <button
            type="button"
            onClick={() => setRadarMonth((month) => shiftMonth(month, -1))}
            aria-label="Mês anterior"
            className="grid size-10 shrink-0 place-items-center rounded-xl hover:bg-white/10"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p className="text-center text-sm font-semibold">{monthTitle(radarMonth)}</p>
          <button
            type="button"
            disabled={!canGoNextRadarMonth}
            onClick={() => setRadarMonth((month) => shiftMonth(month, 1))}
            aria-label="Próximo mês"
            className="grid size-10 shrink-0 place-items-center rounded-xl hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {radarAvailableDays.length ? (
          <>
            <div
              className="mt-4 h-[300px] w-full"
              role="img"
              aria-label="Gráfico mensal em teia com hábitos, passos, água, treino e foco"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={radarData}
                  cx="50%"
                  cy="50%"
                  outerRadius="72%"
                >
                  <PolarGrid stroke="rgba(255,255,255,.14)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: "#d8dee9", fontSize: 12, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#10151e",
                      border: "1px solid #35445d",
                      borderRadius: 12,
                    }}
                    formatter={(value) => [`${value}%`, "Progresso mensal"]}
                  />
                  <Radar
                    name="Progresso mensal"
                    dataKey="value"
                    stroke="#77a7ff"
                    fill="#77a7ff"
                    fillOpacity={0.2}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#a8c8ff" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-1 text-xs leading-5 text-white/50">
              Hábitos e treinos consideram tudo o que estava previsto no mês. Água
              compara o consumo diário com a meta e foco considera uma referência de
              25 min por dia. No mês atual, o cálculo vai somente até hoje.
            </p>
          </>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-white/60">
            Ainda não há dados suficientes para calcular este mês.
          </p>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Totais do mês">
        {[
          ['Hábitos', `${radarHabits.filter(item => item.done).length}/${radarHabits.length}`],
          ['Passos', radarAvailableDays.reduce((sum,day)=>sum+(data.stepsByDay[day]||0),0).toLocaleString('pt-BR')],
          ['Água', `${(radarAvailableDays.reduce((sum,day)=>sum+waterTotalForDay(data,day),0)/1000).toLocaleString('pt-BR')} L`],
          ['Foco', `${Math.round(focusMinutes)} min`],
          ['Treinos', radarWorkouts.filter(item=>item.done).length],
          ['kcal', radarAvailableDays.reduce((sum,day)=>sum+workoutCaloriesTotal(data, day),0)],
        ].map(([label,value])=><div key={label} className="rounded-[24px] border border-white/15 bg-[#0a0a0a] p-5"><p className="text-2xl font-extrabold text-white">{value}</p><p className="mt-2 text-sm text-white/50">{label}</p></div>)}
        <p className="col-span-2 text-xs text-white/50 sm:col-span-3">Passos sincronizados pelo aplicativo.</p>
      </section>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 p-2">
        <button
          type="button"
          onClick={() => setAnchor(shiftDate(anchor, -7))}
          aria-label="Semana anterior"
          className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-white/10"
        >
          <ChevronLeft />
        </button>
        <p className="text-center text-sm font-semibold">
          {shortDateLabel(report.days[0])} a {shortDateLabel(report.days[6])}
        </p>
        <button
          type="button"
          disabled={report.days[6] >= today}
          onClick={() => setAnchor(shiftDate(anchor, 7))}
          aria-label="Próxima semana"
          className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-white/10 disabled:opacity-30"
        >
          <ChevronRight />
        </button>
      </div>

      {!report.availableDays.length ? (
        <p className="rounded-2xl border border-dashed border-white/20 p-6 text-white/65">
          O planejamento detalhado passou a ser registrado em{" "}
          {shortDateLabel(data.trackingSince || today)}. As marcações anteriores
          continuam guardadas; não há uma agenda antiga suficiente para calcular
          porcentagens com precisão.
        </p>
      ) : (
        <>
          <section className="rounded-[24px] border border-white/15 bg-[#0c0e11] p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">Plano realizado</h2>
              <p className="text-[#a8c8ff]">
                {report.done} de {report.planned} atividades
              </p>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Percentual das atividades previstas em cada dia. Hoje ainda está em
              andamento.
            </p>
            {report.planned ? (
              <div
                className="mt-5 h-52"
                role="img"
                aria-label="Gráfico semanal de atividades concluídas, de zero a cem por cento"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={report.rows.map((row) => ({
                      ...row,
                      label: weekdayLabel(row.day),
                    }))}
                    margin={{ left: -20, right: 12, top: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="rgba(255,255,255,.12)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#adb6c6", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fill: "#adb6c6", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#10151e",
                        border: "1px solid #35445d",
                        borderRadius: 12,
                      }}
                      formatter={(value) => [`${value}%`, "Conclusão"]}
                    />
                    <Line
                      type="linear"
                      dataKey="rate"
                      connectNulls={false}
                      stroke="#77a7ff"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-white/60">
                Programe hábitos ou adicione tarefas para acompanhar esta semana.
              </p>
            )}
            <dl className="mt-3 divide-y divide-white/10">
              {report.groups.map((group) => (
                <div
                  key={group.kind}
                  className="flex justify-between gap-4 py-3 text-sm"
                >
                  <dt className="text-white/70">{labels[group.kind]}</dt>
                  <dd>
                    {group.done} de {group.total}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs leading-5 text-white/55">
              Dias sem atividades previstas ou sem histórico de planejamento ficam
              sem porcentagem. Uma atividade vinculada não é contada duas vezes.
            </p>
          </section>

          <section className="rounded-[24px] border border-white/15 bg-[#0c0e11] p-5">
            <h2 className="text-lg font-semibold">Registros da semana</h2>
            <dl className="mt-4 divide-y divide-white/10">
              <div className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-white/70">Água média nos dias registrados</dt>
                <dd className="shrink-0">
                  {report.waterAverage === null
                    ? "Sem registro"
                    : `${(report.waterAverage / 1000).toLocaleString("pt-BR", {
                        maximumFractionDigits: 2,
                      })} L/dia`}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-white/70">Meta de água atingida</dt>
                <dd>{report.waterGoalDays} dias</dd>
              </div>
              <div className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-white/70">Dias com registro de água</dt>
                <dd>
                  {report.waterRecordedDays} de {report.availableDays.length}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-white/70">Tempo de foco concluído</dt>
                <dd>
                  {Math.floor(report.focusMinutes / 60)} h {report.focusMinutes % 60} min
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-white/70">Treinos realizados, incluindo extras</dt>
                <dd>{report.workoutsDone}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-white/70">Energia estimada nos treinos</dt>
                <dd>≈ {report.caloriesBurned} kcal</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-5 text-white/45">
              Calorias são uma estimativa baseada no peso, nas séries, repetições e
              valores MET — não uma medição clínica.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
