"use client";

import { workoutCaloriesTotal } from "./state";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Droplets, Dumbbell, Plus, Shield, Grid2X2 } from "lucide-react";
import { dateKey, greeting, waterTotalForDay, type MercuryData } from "./state";
import { dayPlan, weekReport } from "./routine";
import { CheckBox } from "./controls";
import { WeatherCard } from "./weather-card";

export function InicioScreen({ data, onRoutine, onProgress, onHabit, onTask, onWater, onUndoWater }: {
  data: MercuryData; onRoutine: () => void; onProgress: () => void;
  onHabit: (id: string, day: string) => void; onTask: (id: string) => void;
  onWater: (amount: number) => string; onUndoWater: (id: string) => void;
}) {
  const today = dateKey(new Date());
  const plan = dayPlan(data,today);
  const done = plan.filter(item => item.done).length;
  const water = waterTotalForDay(data,today);
  const waterPercent = Math.min(100, Math.round(water / data.waterGoalMl * 100));
  const report = weekReport(data,today);
  const caloriesToday = workoutCaloriesTotal(data, today);
  const [lastWaterId, setLastWaterId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  return <div className="space-y-6">
    <header className="flex items-center gap-4">
      <div className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-[#347cf6] bg-[#0a0a0a]"><Shield className="size-8 fill-[#2979ff] text-[#2979ff]" /></div>
      <div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight sm:text-[32px]">{greeting()}, {data.name || "você"}</h1><p className="mt-1 text-sm text-white/60">{new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date())}</p></div>
    </header>
    <section className="rounded-[28px] border border-[#315793] bg-[linear-gradient(130deg,#193763,#090d15)] p-6 sm:p-8">
      <p className="text-xs font-extrabold tracking-[0.18em] text-[#508bff]">MISSÃO DE HOJE</p>
      <div className="my-5 flex items-center justify-between gap-4"><div><h2 className="text-2xl font-bold sm:text-3xl">Construa sua sequência</h2><p className="mt-3 text-sm text-white/60">{done} de {plan.length} atividades concluídas hoje.</p></div>
      <div className="relative grid size-24 shrink-0 place-items-center rounded-full before:absolute before:size-20 before:rounded-full before:bg-[#101c32]" style={{background:`conic-gradient(#2979ff ${plan.length ? done/plan.length*360 : 0}deg, #344052 0)`}}><strong className="relative text-xl">{plan.length ? Math.round(done/plan.length*100) : 0}%</strong></div></div>
      <div className="mb-5 border-t border-white/15 pt-4 text-sm text-white/60">Foco hoje <strong className="ml-2 text-white">{data.focusMinutesByDay[today] || 0} min</strong></div>
      <button onClick={onRoutine} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#2979ff] text-lg font-bold"><Grid2X2 className="size-5" />Abrir hábitos</button>
    </section>
    <section><p className="mb-2 text-xs font-bold tracking-widest text-white/50">AGORA</p><h2 className="mb-4 text-xl font-bold">Clima e condições</h2><WeatherCard /></section>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(220px,1fr)]">
      <section className="min-w-0 rounded-[24px] border border-white/15 bg-[#0c0e11] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">Seu dia</h2><span className="text-sm text-[#a8c8ff]">{done} de {plan.length} concluídas</span></div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Atividades concluídas hoje" aria-valuemin={0} aria-valuemax={Math.max(1,plan.length)} aria-valuenow={done}><div className="h-full rounded-full bg-[#6a9eff]" style={{ width:`${plan.length ? done/plan.length*100 : 0}%` }} /></div>
        {plan.length ? <div className="mt-3 divide-y divide-white/10">{[...plan].sort((a,b) => Number(a.done)-Number(b.done)).map(item => <div key={`${item.kind}-${item.id}`} className="py-4">
          <div className="flex items-center gap-3">
            {item.link === "none" ? <CheckBox checked={item.done} onClick={() => item.kind === "task" ? onTask(item.id) : onHabit(item.id,today)} label={(item.done ? "Desmarcar " : "Concluir ")+item.title} /> : <span className="grid size-8 shrink-0 place-items-center text-[#9bbfff]">{item.done ? <CheckCircle2 /> : <span aria-hidden="true">{item.emoji}</span>}</span>}
            <div className="min-w-0 flex-1"><p className={`break-words text-base ${item.done ? "text-white/55 line-through" : "text-white"}`}>{item.title}</p><p className="mt-1 text-xs text-white/55">{item.kind === "task" ? `Planejar · ${item.task?.period}` : item.link === "water" ? "Sincronizado com sua meta de água" : item.link === "workout" ? "Sincronizado com Treinos" : "Hábito previsto para hoje"}</p></div>
          </div>
          {item.link !== "none" && !item.done && <a href={item.link === "water" ? "/water" : "/treinos"} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#4c81d5]/50 bg-[#152847] px-3 text-sm font-semibold text-[#c4d8ff]">{item.link === "water" ? "Registrar água" : "Iniciar treino"}<ArrowRight className="size-4" /></a>}
        </div>)}</div> : <div className="py-7"><p className="text-base text-white/70">Nenhuma atividade prevista para hoje.</p><p className="mt-2 text-sm text-white/55">Escolha os dias dos hábitos em Rotina ou planeje uma tarefa.</p></div>}
        <button type="button" onClick={onRoutine} className="mt-3 min-h-11 text-sm font-semibold text-[#a8c8ff]">Organizar minha rotina →</button>
      </section>
      <section className="min-w-0 rounded-[24px] border border-white/15 bg-[#0c0e11] p-5">
        <h2 className="text-xl font-semibold">Ao longo do dia</h2>
        <div className="my-5 flex items-center gap-4"><div className="relative grid size-20 shrink-0 place-items-center rounded-full before:absolute before:size-[66px] before:rounded-full before:bg-[#0c0e11]" style={{ background:`conic-gradient(#57bdf4 ${waterPercent*3.6}deg, #223542 0)` }} role="progressbar" aria-label="Meta pessoal de água" aria-valuenow={waterPercent} aria-valuemin={0} aria-valuemax={100}><span className="relative text-sm text-sky-200">{waterPercent}%</span></div><div><p className="text-2xl font-semibold">{(water/1000).toLocaleString("pt-BR")} L</p><p className="mt-1 text-sm text-white/60">de {(data.waterGoalMl/1000).toLocaleString("pt-BR")} L de água</p></div></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setLastWaterId(onWater(250)); setNotice("250 ml registrados."); }} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#347cf6] px-3 text-sm font-semibold"><Plus className="size-4" />250 ml</button>{lastWaterId && <button type="button" onClick={() => { onUndoWater(lastWaterId); setLastWaterId(null); setNotice("Registro desfeito."); }} className="min-h-11 rounded-xl border border-white/20 px-3 text-sm">Desfazer</button>}</div>
        <a href="/water" className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-sky-200"><Droplets className="size-4" />Quantidades e meta de água</a>
        <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-white/10 pt-4 text-sm"><span className="text-white/65">Foco concluído hoje</span><span>{data.focusMinutesByDay[today] || 0} min</span></div>
        <a href="/treinos" className="mt-4 flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-3 text-sm"><Dumbbell className="size-4" /><span>Meus treinos{caloriesToday > 0 && <small className="ml-2 text-xs text-white/45">≈ {caloriesToday} kcal hoje</small>}</span><ArrowRight className="ml-auto size-4" /></a>
        <p className="mt-3 text-xs text-sky-200" role="status">{notice}</p>
      </section>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5"><div><p className="text-base">{report.done} de {report.planned} atividades nesta semana</p><p className="mt-1 text-sm text-white/55">Acompanhe os registros e o cumprimento do seu plano.</p></div><button type="button" onClick={onProgress} className="min-h-11 text-sm font-semibold text-[#a8c8ff]">Ver progresso →</button></div>
  </div>;
}
