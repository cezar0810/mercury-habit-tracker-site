"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dateKey, shiftDate, shortDateLabel, weekdayLabel, type MercuryData } from "./state";
import { weekReport } from "./routine";

export function ProgressScreen({ data }: { data: MercuryData }) {
  const today = dateKey(new Date());
  const [anchor, setAnchor] = useState(today);
  const report = weekReport(data, anchor, today);
  const labels: Record<string, string> = { habit: "Hábitos", task: "Tarefas", workout: "Treinos previstos" };
  return <div className="space-y-6">
    <header><h1 className="text-[32px] font-bold tracking-tight">Seu progresso</h1><p className="mt-2 text-base text-white/60">O que você planejou e registrou na mesma semana.</p></header>
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 p-2">
      <button type="button" onClick={() => setAnchor(shiftDate(anchor,-7))} aria-label="Semana anterior" className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-white/10"><ChevronLeft /></button>
      <p className="text-center text-sm font-semibold">{shortDateLabel(report.days[0])} a {shortDateLabel(report.days[6])}</p>
      <button type="button" disabled={report.days[6] >= today} onClick={() => setAnchor(shiftDate(anchor,7))} aria-label="Próxima semana" className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-white/10 disabled:opacity-30"><ChevronRight /></button>
    </div>
    {!report.availableDays.length ? <p className="rounded-2xl border border-dashed border-white/20 p-6 text-white/65">O planejamento detalhado passou a ser registrado em {shortDateLabel(data.trackingSince || today)}. As marcações anteriores continuam guardadas; não há uma agenda antiga suficiente para calcular porcentagens com precisão.</p> : <>
      <section className="rounded-[24px] border border-white/15 bg-[#0c0e11] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-lg font-semibold">Plano realizado</h2><p className="text-[#a8c8ff]">{report.done} de {report.planned} atividades</p></div>
        <p className="mt-2 text-sm text-white/60">Percentual das atividades previstas em cada dia. Hoje ainda está em andamento.</p>
        {report.planned ? <div className="mt-5 h-52" role="img" aria-label="Gráfico semanal de atividades concluídas, de zero a cem por cento">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={report.rows.map(row => ({ ...row, label: weekdayLabel(row.day) }))} margin={{ left:-20, right:12, top:10, bottom:0 }}>
            <CartesianGrid stroke="rgba(255,255,255,.12)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill:"#adb6c6", fontSize:12 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0,100]} ticks={[0,25,50,75,100]} tickFormatter={value => `${value}%`} tick={{ fill:"#adb6c6", fontSize:12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:"#10151e", border:"1px solid #35445d", borderRadius:12 }} formatter={value => [`${value}%`, "Conclusão"]} />
            <Line type="linear" dataKey="rate" connectNulls={false} stroke="#77a7ff" strokeWidth={3} dot={{ r:4 }} activeDot={{ r:6 }} />
          </LineChart></ResponsiveContainer>
        </div> : <p className="py-8 text-center text-white/60">Programe hábitos ou adicione tarefas para acompanhar esta semana.</p>}
        <dl className="mt-3 divide-y divide-white/10">{report.groups.map(group => <div key={group.kind} className="flex justify-between gap-4 py-3 text-sm"><dt className="text-white/70">{labels[group.kind]}</dt><dd>{group.done} de {group.total}</dd></div>)}</dl>
        <p className="mt-2 text-xs leading-5 text-white/55">Dias sem atividades previstas ou sem histórico de planejamento ficam sem porcentagem. Uma atividade vinculada não é contada duas vezes.</p>
      </section>
      <section className="rounded-[24px] border border-white/15 bg-[#0c0e11] p-5">
        <h2 className="text-lg font-semibold">Registros da semana</h2>
        <dl className="mt-4 divide-y divide-white/10">
          <div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-white/70">Água média nos dias registrados</dt><dd className="shrink-0">{report.waterAverage === null ? "Sem registro" : `${(report.waterAverage/1000).toLocaleString("pt-BR",{ maximumFractionDigits:2 })} L/dia`}</dd></div>
          <div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-white/70">Meta de água atingida</dt><dd>{report.waterGoalDays} dias</dd></div>
          <div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-white/70">Dias com registro de água</dt><dd>{report.waterRecordedDays} de {report.availableDays.length}</dd></div>
          <div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-white/70">Tempo de foco concluído</dt><dd>{Math.floor(report.focusMinutes / 60)} h {report.focusMinutes % 60} min</dd></div>
          <div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-white/70">Treinos realizados, incluindo extras</dt><dd>{report.workoutsDone}</dd></div>
          <div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-white/70">Energia estimada nos treinos</dt><dd>≈ {report.caloriesBurned} kcal</dd></div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-white/45">Calorias são uma estimativa baseada no peso, nas séries, repetições e valores MET — não uma medição clínica.</p>
      </section>
    </>}
  </div>;
}
