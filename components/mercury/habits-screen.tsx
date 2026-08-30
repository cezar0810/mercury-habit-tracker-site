"use client";

import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Plus,
  Trash2,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { CheckBox } from "./controls";
import {
  dateKey,
  daysForMonth,
  monthLabel,
  weekdayLabel,
  type Habit,
} from "./state";

export function HabitsScreen({
  habits,
  completions,
  viewMonth,
  onMonthChange,
  onAddHabit,
  onRenameHabit,
  onDeleteHabit,
  onMoveHabit,
  onToggle,
}: {
  habits: Habit[];
  completions: Record<string, Record<string, boolean>>;
  viewMonth: Date;
  onMonthChange: (month: Date) => void;
  onAddHabit: (title: string) => boolean;
  onRenameHabit: (id: string, title: string) => void;
  onDeleteHabit: (id: string) => void;
  onMoveHabit: (id: string, direction: -1 | 1) => void;
  onToggle: (habitId: string, day: string) => void;
}) {
  const [newHabit, setNewHabit] = useState("");
  const [notice, setNotice] = useState("");
  const days = useMemo(() => daysForMonth(viewMonth), [viewMonth]);
  const gridColumns = "minmax(215px, 1fr) repeat(" + days.length + ", 48px)";
  const completed = days.reduce(
    (total, day) =>
      total +
      habits.filter((habit) => completions[dateKey(day)]?.[habit.id]).length,
    0,
  );
  const possible = days.length * habits.length;
  const percentage = possible ? Math.round((completed / possible) * 100) : 0;

  const addHabit = (event: FormEvent) => {
    event.preventDefault();
    const created = onAddHabit(newHabit);
    if (created) {
      setNewHabit("");
      setNotice("");
      return;
    }
    setNotice(
      habits.length >= 15
        ? "O limite é de 15 hábitos."
        : "Escreva um nome para o hábito.",
    );
  };

  const changeMonth = (amount: number) => {
    onMonthChange(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + amount, 1),
    );
  };

  return (
    <div>
      <header className="flex items-center">
        <div>
          <h1 className="text-[34px] font-bold tracking-[-0.045em]">
            Hábitos
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Sua planilha mensal de progresso
          </p>
        </div>
      </header>

      <div className="mt-7 flex items-center justify-between rounded-2xl border border-white/[0.1] bg-[#0c0d0e] p-2">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Mês anterior"
          className="grid size-10 place-items-center rounded-xl text-white/65 transition hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="text-[17px] font-bold">{monthLabel(viewMonth)}</p>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Próximo mês"
          className="grid size-10 place-items-center rounded-xl text-white/65 transition hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <section className="mt-5 flex items-center gap-4 rounded-[25px] border border-white/[0.12] bg-[#0c0d0e] p-5">
        <div className="grid size-14 place-items-center rounded-2xl bg-[#102b59] text-[#347cf6]">
          <BarChart3 className="size-7" />
        </div>
        <div>
          <p className="text-[21px] font-bold">{percentage}% neste mês</p>
          <p className="mt-1 text-[14px] leading-5 text-white/55">
            {completed} marcações concluídas de {possible || 0} possíveis.
          </p>
        </div>
      </section>

      <form
        onSubmit={addHabit}
        className="mt-5 flex gap-2 rounded-[21px] border border-white/[0.12] bg-[#0c0d0e] p-2"
      >
        <input
          value={newHabit}
          onChange={(event) => {
            setNewHabit(event.target.value);
            setNotice("");
          }}
          maxLength={45}
          placeholder="Adicionar hábito"
          aria-label="Nome do novo hábito"
          className="min-w-0 flex-1 bg-transparent px-3 text-[15px] outline-none placeholder:text-white/35"
        />
        <button
          type="submit"
          className="grid size-11 place-items-center rounded-[15px] bg-[#347cf6] shadow-[0_8px_20px_rgba(52,124,246,0.25)]"
          aria-label="Adicionar hábito"
        >
          <Plus className="size-6" />
        </button>
      </form>
      {notice && <p className="mt-2 text-xs text-[#8db8ff]">{notice}</p>}

      {habits.length === 0 ? (
        <section className="mt-5 rounded-[25px] border border-dashed border-white/[0.18] bg-white/[0.025] px-6 py-12 text-center">
          <BarChart3 className="mx-auto size-8 text-[#347cf6]" />
          <h2 className="mt-4 text-lg font-bold">Sua planilha está pronta</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/52">
            Crie seu primeiro hábito acima. As estatísticas aparecerão somente
            a partir das suas marcações reais.
          </p>
        </section>
      ) : (
        <section className="mt-5 overflow-hidden rounded-[25px] border border-white/[0.12] bg-[#0c0d0e]">
          <div className="overflow-x-auto">
            <div className="min-w-[850px]">
              <div
                className="grid border-b border-white/[0.12] text-center text-[11px] font-bold"
                style={{ gridTemplateColumns: gridColumns }}
              >
                <div className="sticky left-0 z-10 flex items-center bg-[#0c0d0e] px-4 py-4 text-left text-white/55">
                  HÁBITOS
                </div>
                {days.map((day) => {
                  const key = dateKey(day);
                  const isToday = key === dateKey(new Date());
                  return (
                    <div
                      key={key}
                      className="border-l border-white/[0.1] py-2 text-white/55"
                    >
                      <span
                        className={
                          "mx-auto grid size-8 place-items-center rounded-lg " +
                          (isToday ? "bg-[#347cf6] text-white" : "")
                        }
                      >
                        {day.getDate()}
                      </span>
                      <span className="mt-1 block text-[9px] font-medium uppercase">
                        {weekdayLabel(key)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {habits.map((habit, index) => (
                <div
                  key={habit.id}
                  className="grid min-h-[74px] border-b border-white/[0.1] last:border-b-0"
                  style={{ gridTemplateColumns: gridColumns }}
                >
                  <div className="sticky left-0 z-10 flex min-w-0 items-center gap-1.5 bg-[#0c0d0e] px-3">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => onMoveHabit(habit.id, -1)}
                        aria-label={"Subir " + habit.title}
                        className="grid size-5 place-items-center text-white/38 disabled:opacity-20"
                      >
                        <ChevronsUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === habits.length - 1}
                        onClick={() => onMoveHabit(habit.id, 1)}
                        aria-label={"Descer " + habit.title}
                        className="grid size-5 place-items-center text-white/38 disabled:opacity-20"
                      >
                        <ChevronsDown className="size-3.5" />
                      </button>
                    </div>
                    <input
                      value={habit.title}
                      onChange={(event) =>
                        onRenameHabit(habit.id, event.target.value)
                      }
                      maxLength={45}
                      aria-label={"Editar nome de " + habit.title}
                      className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold outline-none placeholder:text-white/30 focus:text-[#8db8ff]"
                    />
                    <button
                      type="button"
                      onClick={() => onDeleteHabit(habit.id)}
                      aria-label={"Excluir " + habit.title}
                      className="grid size-8 place-items-center rounded-lg text-white/42 transition hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  {days.map((day) => {
                    const key = dateKey(day);
                    return (
                      <div
                        key={key}
                        className="grid place-items-center border-l border-white/[0.1]"
                      >
                        <CheckBox
                          compact
                          checked={Boolean(completions[key]?.[habit.id])}
                          onClick={() => onToggle(habit.id, key)}
                          label={"Marcar " + habit.title + " em " + key}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <p className="border-t border-white/[0.08] px-4 py-3 text-center text-xs text-white/38">
            Arraste a tabela para os lados para ver todos os dias do mês.
          </p>
        </section>
      )}
    </div>
  );
}
