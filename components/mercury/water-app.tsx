"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Droplets,
  History,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  blankMercuryData,
  createId,
  dateKey,
  waterTotalForDay,
  type MercuryData,
} from "./state";
import { readMercuryData, writeMercuryData } from "./mercury-storage";
import { setWaterGoal } from "./routine";

const QUICK_AMOUNTS = [250, 350, 500];

function entryTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Agora";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function MercuryWaterApp() {
  const [data, setData] = useState<MercuryData>({ ...blankMercuryData });
  const [hydrated, setHydrated] = useState(false);
  const [customAmount, setCustomAmount] = useState("200");
  const [goalDraft, setGoalDraft] = useState("2000");
  const [notice, setNotice] = useState("");
  const today = dateKey(new Date());

  useEffect(() => {
    const restored = readMercuryData();
    setData(restored);
    setGoalDraft(String(restored.waterGoalMl));
    setHydrated(true);
  }, []);

  const entries = data.waterEntriesByDay[today] || [];
  const total = waterTotalForDay(data, today);
  const percentage = Math.min(
    100,
    Math.round((total / Math.max(1, data.waterGoalMl)) * 100),
  );
  const remaining = Math.max(0, data.waterGoalMl - total);
  const liters = (total / 1000).toLocaleString("pt-BR", {
    minimumFractionDigits: total % 1000 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  });
  const orderedEntries = useMemo(() => [...entries].reverse(), [entries]);

  function persist(next: MercuryData) {
    setData(next);
    writeMercuryData(next);
  }

  function addWater(amount: number) {
    const safeAmount = Math.min(2000, Math.max(50, Math.round(amount)));
    if (!Number.isFinite(safeAmount)) return;
    const next: MercuryData = {
      ...data,
      waterEntriesByDay: {
        ...data.waterEntriesByDay,
        [today]: [
          ...entries,
          {
            id: createId("water"),
            amountMl: safeAmount,
            recordedAt: new Date().toISOString(),
          },
        ],
      },
    };
    persist(next);
    setNotice(`${safeAmount} ml adicionados.`);
  }

  function addCustomWater(event: FormEvent) {
    event.preventDefault();
    const amount = Number(customAmount);
    if (!Number.isFinite(amount) || amount < 50 || amount > 2000) {
      setNotice("Informe uma quantidade entre 50 e 2.000 ml.");
      return;
    }
    addWater(amount);
  }

  function saveGoal(event: FormEvent) {
    event.preventDefault();
    const goal = Number(goalDraft);
    if (!Number.isFinite(goal) || goal < 500 || goal > 6000) {
      setNotice("A meta deve ficar entre 500 e 6.000 ml.");
      return;
    }
    const safeGoal = Math.round(goal);
    persist(setWaterGoal(data, safeGoal));
    setGoalDraft(String(safeGoal));
    setNotice("Meta diária atualizada.");
  }

  function removeEntry(id: string) {
    const next: MercuryData = {
      ...data,
      waterEntriesByDay: {
        ...data.waterEntriesByDay,
        [today]: entries.filter((entry) => entry.id !== id),
      },
    };
    persist(next);
    setNotice("Registro removido.");
  }

  if (!hydrated) {
    return (
      <main className="grid min-h-screen place-items-center bg-black text-white">
        <Droplets className="size-8 animate-pulse text-sky-300" aria-label="Carregando controle de água" />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(14,165,233,0.2),transparent_38%),radial-gradient(circle_at_100%_75%,rgba(37,99,235,0.1),transparent_30%)]" />
      <section className="relative mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0a0c0f]/90 px-4 py-3 backdrop-blur-xl sm:px-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-sky-400/15 text-sky-300 ring-1 ring-sky-300/15">
              <Droplets className="size-6" />
            </div>
            <div>
              <p className="text-base font-black">Mercury Água</p>
              <p className="text-xs text-white/42">Hidratação diária</p>
            </div>
          </div>
          <a
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-bold text-white/65 transition hover:bg-white/[0.06]"
          >
            <ArrowLeft className="size-4" /> Voltar ao Mercury
          </a>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="overflow-hidden rounded-[30px] border border-sky-300/15 bg-[linear-gradient(145deg,rgba(8,78,130,0.3),rgba(5,6,7,0.96)_58%)] p-5 sm:p-8">
            <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-center">
              <div
                className="relative grid size-[190px] shrink-0 place-items-center rounded-full before:absolute before:size-[158px] before:rounded-full before:bg-[#071018]"
                style={{
                  background: `conic-gradient(#38bdf8 ${percentage * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                }}
              >
                <div className="relative text-center">
                  <Droplets className="mx-auto size-7 text-sky-300" />
                  <p className="mt-1 text-[42px] font-black tracking-[-0.06em]">{percentage}%</p>
                  <p className="text-xs font-semibold text-white/42">DA META</p>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-semibold text-sky-300">Consumo de hoje</p>
                <h1 className="mt-1 text-[38px] font-black tracking-[-0.05em] sm:text-[44px]">
                  {liters} L
                </h1>
                <p className="mt-2 text-sm leading-6 text-white/52">
                  {remaining
                    ? `Faltam ${remaining.toLocaleString("pt-BR")} ml para sua meta de ${data.waterGoalMl.toLocaleString("pt-BR")} ml.`
                    : `Você alcançou sua meta de ${data.waterGoalMl.toLocaleString("pt-BR")} ml. Muito bem!`}
                </p>
                {!remaining && (
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="size-4" /> Meta alcançada
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8 border-t border-white/[0.08] pt-6">
              <p className="text-sm font-bold">Adicionar água</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => addWater(amount)}
                    className="min-h-12 rounded-xl border border-sky-300/15 bg-sky-400/[0.07] text-sm font-bold text-sky-100 transition hover:border-sky-300/35 hover:bg-sky-400/15"
                  >
                    + {amount} ml
                  </button>
                ))}
              </div>
              <form onSubmit={addCustomWater} className="mt-3 flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <input
                    type="number"
                    min={50}
                    max={2000}
                    step={10}
                    inputMode="numeric"
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    aria-label="Quantidade personalizada de água em mililitros"
                    className="min-h-12 w-full rounded-xl border border-white/[0.12] bg-black/30 px-4 pr-12 text-sm font-semibold outline-none focus:border-sky-400"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/38">ml</span>
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-black shadow-[0_10px_26px_rgba(14,165,233,0.22)]"
                >
                  <Plus className="size-4" /> Adicionar
                </button>
              </form>
              {notice && <p className="mt-3 text-xs text-sky-100/60" role="status">{notice}</p>}
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-[25px] border border-white/10 bg-[#0a0c0f] p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-[#347cf6]/10 text-[#6ca0ff]">
                  <Target className="size-5" />
                </div>
                <div>
                  <h2 className="font-bold">Meta diária</h2>
                  <p className="text-xs text-white/42">Ajuste ao seu objetivo</p>
                </div>
              </div>
              <form onSubmit={saveGoal} className="mt-4 flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <input
                    type="number"
                    min={500}
                    max={6000}
                    step={100}
                    inputMode="numeric"
                    value={goalDraft}
                    onChange={(event) => setGoalDraft(event.target.value)}
                    aria-label="Meta diária de água em mililitros"
                    className="min-h-11 w-full rounded-xl border border-white/[0.12] bg-black/30 px-3 pr-10 text-sm font-semibold outline-none focus:border-[#347cf6]"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/38">ml</span>
                </div>
                <button type="submit" className="min-h-11 rounded-xl bg-[#347cf6] px-4 text-sm font-bold">
                  Salvar
                </button>
              </form>
            </section>

            <section className="rounded-[25px] border border-white/10 bg-[#0a0c0f] p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-sky-400/10 text-sky-300">
                  <History className="size-5" />
                </div>
                <div>
                  <h2 className="font-bold">Registros de hoje</h2>
                  <p className="text-xs text-white/42">{entries.length} registro{entries.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              {orderedEntries.length ? (
                <div className="mt-4 space-y-2">
                  {orderedEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
                      <Droplets className="size-4 text-sky-300" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">{entry.amountMl} ml</p>
                        <p className="text-[11px] text-white/38">{entryTime(entry.recordedAt)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        aria-label={`Remover registro de ${entry.amountMl} ml`}
                        className="grid size-9 place-items-center rounded-lg text-white/35 transition hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-white/38">
                  Nenhuma água registrada hoje.
                </p>
              )}
            </section>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] leading-5 text-white/30">
          A meta é pessoal e pode variar. Este controle não substitui orientação profissional.
        </p>
      </section>
    </main>
  );
}
