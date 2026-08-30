"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  ClipboardList,
  Coffee,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { CheckBox } from "./controls";
import {
  plannerPeriods,
  shiftDate,
  shortDateLabel,
  type PlannerPeriod,
  type PlannerTask,
} from "./state";

const icons = {
  Prioridades: Sparkles,
  Manhã: Sun,
  Tarde: Coffee,
  Noite: Moon,
};

export function PlannerScreen({
  selectedDate,
  tasks,
  onChangeDate,
  onAddTask,
  onRenameTask,
  onToggleTask,
  onDeleteTask,
  onMoveTask,
}: {
  selectedDate: string;
  tasks: PlannerTask[];
  onChangeDate: (date: string) => void;
  onAddTask: (title: string, period: PlannerPeriod) => boolean;
  onRenameTask: (id: string, title: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onMoveTask: (id: string, direction: -1 | 1) => void;
}) {
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState<PlannerPeriod>("Prioridades");
  const [notice, setNotice] = useState("");
  const todaysTasks = tasks.filter((task) => task.date === selectedDate);

  const addTask = (event: FormEvent) => {
    event.preventDefault();
    if (onAddTask(title, period)) {
      setTitle("");
      setNotice("");
    } else {
      setNotice("Escreva uma tarefa antes de adicionar.");
    }
  };

  return (
    <div>
      <header>
        <h1 className="text-[34px] font-bold tracking-[-0.045em]">Planejar</h1>
        <p className="mt-2 text-[16px] text-white/55">
          Organize as tarefas do seu dia.
        </p>
      </header>

      <div className="mt-7 flex items-center justify-between rounded-2xl border border-white/[0.1] bg-[#0c0d0e] p-2">
        <button
          type="button"
          onClick={() => onChangeDate(shiftDate(selectedDate, -1))}
          aria-label="Dia anterior"
          className="grid size-10 place-items-center rounded-xl text-white/65 transition hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="flex items-center gap-2 text-[16px] font-bold">
          <CalendarDays className="size-4 text-[#347cf6]" />
          {shortDateLabel(selectedDate)}
        </p>
        <button
          type="button"
          onClick={() => onChangeDate(shiftDate(selectedDate, 1))}
          aria-label="Próximo dia"
          className="grid size-10 place-items-center rounded-xl text-white/65 transition hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <form
        onSubmit={addTask}
        className="mt-5 rounded-[23px] border border-white/[0.12] bg-[#0c0d0e] p-3"
      >
        <input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setNotice("");
          }}
          maxLength={70}
          placeholder="Nova tarefa"
          aria-label="Nome da nova tarefa"
          className="w-full bg-transparent px-2 py-2 text-[16px] outline-none placeholder:text-white/35"
        />
        <div className="mt-2 flex gap-2">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as PlannerPeriod)}
            aria-label="Período da tarefa"
            className="min-w-0 flex-1 rounded-xl border border-white/[0.1] bg-[#151618] px-3 py-2 text-sm outline-none"
          >
            {plannerPeriods.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#347cf6] px-4 text-sm font-bold"
          >
            <Plus className="size-4" /> Adicionar
          </button>
        </div>
      </form>
      {notice && <p className="mt-2 text-xs text-[#8db8ff]">{notice}</p>}

      {todaysTasks.length === 0 ? (
        <section className="mt-5 rounded-[25px] border border-dashed border-white/[0.18] bg-white/[0.025] px-6 py-12 text-center">
          <ClipboardList className="mx-auto size-8 text-[#347cf6]" />
          <h2 className="mt-4 text-lg font-bold">Nada planejado ainda</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/52">
            Crie uma tarefa e escolha em qual período ela deve aparecer.
          </p>
        </section>
      ) : (
        <div className="mt-5 space-y-4">
          {plannerPeriods.map((group) => {
            const Icon = icons[group];
            const groupTasks = todaysTasks.filter(
              (task) => task.period === group,
            );
            const groupDone = groupTasks.filter((task) => task.completed).length;
            return (
              <section
                key={group}
                className="rounded-[27px] border border-white/[0.12] bg-[#0c0d0e] px-5 py-5"
              >
                <div className="flex items-center">
                  <Icon className="size-7 text-[#347cf6]" />
                  <h2 className="ml-4 text-[21px] font-bold">{group}</h2>
                  <span className="ml-auto text-[15px] text-white/55">
                    {groupDone}/{groupTasks.length}
                  </span>
                </div>

                {groupTasks.length ? (
                  <div className="mt-4 space-y-3">
                    {groupTasks.map((task, index) => (
                      <div className="flex items-center gap-2" key={task.id}>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => onMoveTask(task.id, -1)}
                            aria-label={"Subir " + task.title}
                            className="grid size-5 place-items-center text-white/40 disabled:opacity-20"
                          >
                            <ChevronsUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === groupTasks.length - 1}
                            onClick={() => onMoveTask(task.id, 1)}
                            aria-label={"Descer " + task.title}
                            className="grid size-5 place-items-center text-white/40 disabled:opacity-20"
                          >
                            <ChevronsDown className="size-3.5" />
                          </button>
                        </div>
                        <CheckBox
                          checked={task.completed}
                          onClick={() => onToggleTask(task.id)}
                          label={"Concluir " + task.title}
                        />
                        <input
                          value={task.title}
                          onChange={(event) =>
                            onRenameTask(task.id, event.target.value)
                          }
                          maxLength={70}
                          aria-label={"Editar " + task.title}
                          className={
                            "min-w-0 flex-1 bg-transparent text-[16px] outline-none " +
                            (task.completed
                              ? "text-white/40 line-through"
                              : "text-white")
                          }
                        />
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          aria-label={"Excluir " + task.title}
                          className="grid size-8 place-items-center rounded-lg text-white/42 transition hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-white/40">
                    Sem tarefas neste período.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
