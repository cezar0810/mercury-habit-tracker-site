"use client";

import {
  Download,
  Settings,
  Trash2,
  UserRound,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BottomNavigation } from "./controls";
import { AdsterraBanner } from "./adsterra-banner";
import { DownloadArea } from "./download-area";
import { FocusScreen } from "./focus-screen";
import { HabitsScreen } from "./habits-screen";
import { InicioScreen } from "./inicio-screen";
import { PlannerScreen } from "./planner-screen";
import {
  blankMercuryData,
  createId,
  dateKey,
  profileIsComplete,
  type MercuryData,
  type PlannerPeriod,
} from "./state";
import { tabs, type Tab } from "./data";

const STORAGE_KEY = "mercury-habit-tracker-web-v1";

type DeleteRequest =
  | { type: "habit"; id: string; title: string }
  | { type: "task"; id: string; title: string };

function cleanStoredData(value: unknown): MercuryData {
  if (!value || typeof value !== "object") return { ...blankMercuryData };
  const saved = value as Partial<MercuryData>;
  return {
    name: typeof saved.name === "string" ? saved.name : "",
    goal: typeof saved.goal === "string" ? saved.goal : "",
    gender: typeof saved.gender === "string" ? saved.gender : "",
    characterClass:
      typeof saved.characterClass === "string" ? saved.characterClass : "",
    habits: Array.isArray(saved.habits) ? saved.habits : [],
    completions:
      saved.completions && typeof saved.completions === "object"
        ? saved.completions
        : {},
    plannerTasks: Array.isArray(saved.plannerTasks) ? saved.plannerTasks : [],
    focusMinutesByDay:
      saved.focusMinutesByDay &&
      typeof saved.focusMinutesByDay === "object"
        ? saved.focusMinutesByDay
        : {},
  };
}

export function MercuryWebApp() {
  const [tab, setTab] = useState<Tab>("habitos");
  const [data, setData] = useState<MercuryData>({ ...blankMercuryData });
  const [hydrated, setHydrated] = useState(false);
  const [viewMonth, setViewMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [plannerDate, setPlannerDate] = useState(() => dateKey(new Date()));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [goalDraft, setGoalDraft] = useState("");
  const [genderDraft, setGenderDraft] = useState("");
  const [classDraft, setClassDraft] = useState("");
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(
    null,
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setData(cleanStoredData(JSON.parse(saved)));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, hydrated]);

  const saveInitialName = (event: FormEvent) => {
    event.preventDefault();
    const nextName = nameDraft.trim();
    if (!nextName) return;
    setData((current) => ({ ...current, name: nextName.slice(0, 28) }));
  };

  const openSettings = () => {
    setNameDraft(data.name);
    setGoalDraft(data.goal);
    setGenderDraft(data.gender);
    setClassDraft(data.characterClass);
    setSettingsOpen(true);
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    const nextName = nameDraft.trim();
    if (!nextName) return;
    setData((current) => ({
      ...current,
      name: nextName.slice(0, 28),
      goal: goalDraft,
      gender: genderDraft,
      characterClass: classDraft,
    }));
    setSettingsOpen(false);
  };

  const addHabit = (title: string) => {
    const nextTitle = title.trim();
    if (!nextTitle || data.habits.length >= 15) return false;
    setData((current) => ({
      ...current,
      habits: [
        ...current.habits,
        { id: createId("habit"), title: nextTitle.slice(0, 45) },
      ],
    }));
    return true;
  };

  const renameHabit = (id: string, title: string) => {
    setData((current) => ({
      ...current,
      habits: current.habits.map((habit) =>
        habit.id === id ? { ...habit, title: title.slice(0, 45) } : habit,
      ),
    }));
  };

  const deleteHabit = (id: string) => {
    setData((current) => {
      const nextCompletions: MercuryData["completions"] = {};
      Object.entries(current.completions).forEach(([day, values]) => {
        const { [id]: removed, ...remaining } = values;
        nextCompletions[day] = remaining;
      });
      return {
        ...current,
        habits: current.habits.filter((habit) => habit.id !== id),
        completions: nextCompletions,
      };
    });
  };

  const moveHabit = (id: string, direction: -1 | 1) => {
    setData((current) => {
      const index = current.habits.findIndex((habit) => habit.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.habits.length) {
        return current;
      }
      const habits = [...current.habits];
      [habits[index], habits[target]] = [habits[target], habits[index]];
      return { ...current, habits };
    });
  };

  const toggleHabit = (habitId: string, day: string) => {
    setData((current) => {
      const today = current.completions[day] || {};
      return {
        ...current,
        completions: {
          ...current.completions,
          [day]: { ...today, [habitId]: !today[habitId] },
        },
      };
    });
  };

  const addTask = (title: string, period: PlannerPeriod) => {
    const nextTitle = title.trim();
    if (!nextTitle) return false;
    setData((current) => ({
      ...current,
      plannerTasks: [
        ...current.plannerTasks,
        {
          id: createId("task"),
          title: nextTitle.slice(0, 70),
          date: plannerDate,
          period,
          completed: false,
        },
      ],
    }));
    return true;
  };

  const renameTask = (id: string, title: string) => {
    setData((current) => ({
      ...current,
      plannerTasks: current.plannerTasks.map((task) =>
        task.id === id ? { ...task, title: title.slice(0, 70) } : task,
      ),
    }));
  };

  const toggleTask = (id: string) => {
    setData((current) => ({
      ...current,
      plannerTasks: current.plannerTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    }));
  };

  const deleteTask = (id: string) => {
    setData((current) => ({
      ...current,
      plannerTasks: current.plannerTasks.filter((task) => task.id !== id),
    }));
  };

  const moveTask = (id: string, direction: -1 | 1) => {
    setData((current) => {
      const task = current.plannerTasks.find((item) => item.id === id);
      if (!task) return current;
      const sameGroup = current.plannerTasks.filter(
        (item) => item.date === task.date && item.period === task.period,
      );
      const position = sameGroup.findIndex((item) => item.id === id);
      const target = position + direction;
      if (target < 0 || target >= sameGroup.length) return current;
      const targetId = sameGroup[target].id;
      const from = current.plannerTasks.findIndex((item) => item.id === id);
      const to = current.plannerTasks.findIndex((item) => item.id === targetId);
      const plannerTasks = [...current.plannerTasks];
      [plannerTasks[from], plannerTasks[to]] = [
        plannerTasks[to],
        plannerTasks[from],
      ];
      return { ...current, plannerTasks };
    });
  };

  const recordWork = useCallback((minutes: number) => {
    const today = dateKey(new Date());
    setData((current) => ({
      ...current,
      focusMinutesByDay: {
        ...current.focusMinutesByDay,
        [today]: (current.focusMinutesByDay[today] || 0) + minutes,
      },
    }));
  }, []);

  let screen = (
    <HabitsScreen
      habits={data.habits}
      completions={data.completions}
      viewMonth={viewMonth}
      onMonthChange={setViewMonth}
      onAddHabit={addHabit}
      onRenameHabit={renameHabit}
      onDeleteHabit={(id) => {
        const habit = data.habits.find((item) => item.id === id);
        if (habit) setDeleteRequest({ type: "habit", id, title: habit.title });
      }}
      onMoveHabit={moveHabit}
      onToggle={toggleHabit}
    />
  );

  if (tab === "inicio") {
    screen = (
      <InicioScreen
        name={data.name || "você"}
        goal={data.goal}
        gender={data.gender}
        characterClass={data.characterClass}
        habits={data.habits}
        completions={data.completions}
        focusMinutesByDay={data.focusMinutesByDay}
        onHabits={() => setTab("habitos")}
      />
    );
  }

  if (tab === "planejar") {
    screen = (
      <PlannerScreen
        selectedDate={plannerDate}
        tasks={data.plannerTasks}
        onChangeDate={setPlannerDate}
        onAddTask={addTask}
        onRenameTask={renameTask}
        onToggleTask={toggleTask}
        onDeleteTask={(id) => {
          const task = data.plannerTasks.find((item) => item.id === id);
          if (task) setDeleteRequest({ type: "task", id, title: task.title });
        }}
        onMoveTask={moveTask}
      />
    );
  }

  if (tab === "foco") {
    screen = <FocusScreen onWorkComplete={recordWork} />;
  }

  const confirmDelete = () => {
    if (!deleteRequest) return;
    if (deleteRequest.type === "habit") deleteHabit(deleteRequest.id);
    if (deleteRequest.type === "task") deleteTask(deleteRequest.id);
    setDeleteRequest(null);
  };
  const profileComplete = profileIsComplete(data);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#000] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(52,124,246,0.18),transparent_35%),radial-gradient(circle_at_100%_50%,rgba(27,73,165,0.1),transparent_30%)]" />

      <section className="relative mx-auto min-h-[100svh] max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex items-center justify-between rounded-2xl border border-white/[0.1] bg-[#0b0c0d]/90 px-4 py-3 shadow-[0_14px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/mercury-app-icon.png"
              alt="Mercury"
              className="size-10 rounded-xl ring-1 ring-white/10"
            />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold">
                Mercury habit tracker
              </p>
              <p className="text-[11px] text-white/42">
                Seus dados ficam neste navegador
              </p>
            </div>
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openSettings}
              className="relative inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-white/[0.1] px-2.5 text-[11px] font-bold text-white/80 transition hover:bg-white/[0.06]"
            >
              <Settings className="size-4 text-[#347cf6]" />
              <span className="sm:hidden">Configurar</span>
              <span className="hidden sm:inline">Configurar informações</span>
              {!profileComplete && (
                <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[#0b0c0d] bg-red-500" />
              )}
            </button>
            <a
              href="#download"
              aria-label="Ir para download do aplicativo Android"
              className="grid size-10 place-items-center rounded-xl bg-[#347cf6] shadow-[0_8px_20px_rgba(52,124,246,0.28)]"
            >
              <Download className="size-4" />
            </a>
          </div>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[332px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <nav className="rounded-[24px] border border-white/[0.1] bg-[#0b0c0d] p-3">
                <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
                  Seu espaço
                </p>
                <div className="space-y-1">
                  {tabs.map((item) => {
                    const Icon = item.icon;
                    const active = item.id === tab;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id)}
                        className={
                          "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition " +
                          (active
                            ? "bg-[#112b58] text-[#4b8cff]"
                            : "text-white/58 hover:bg-white/[0.05] hover:text-white")
                        }
                      >
                        <Icon className="size-5" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                {!profileComplete && (
                  <button
                    type="button"
                    onClick={openSettings}
                    className="mt-4 flex w-full items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.08] p-3 text-left text-xs leading-5 text-red-100/85"
                  >
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-red-500" />
                    Complete as informações do perfil.
                  </button>
                )}
              </nav>
              <AdsterraBanner />
            </div>
          </aside>

          <section className="min-w-0 rounded-[28px] border border-white/[0.1] bg-[#050607]/90 shadow-[0_20px_70px_rgba(0,0,0,0.24)]">
            <div className="px-5 py-7 sm:px-8 sm:py-9">
              {screen}
              <div className="mt-8 border-t border-white/[0.07] pt-7">
                <AdsterraBanner />
              </div>
            </div>
            <div className="border-t border-white/[0.06] lg:hidden">
              <BottomNavigation tab={tab} onChange={setTab} />
            </div>
          </section>
        </div>
      </section>

      <DownloadArea />
      <footer className="relative border-t border-white/[0.07] px-5 py-7 text-center text-xs text-white/38">
        Mercury Habit Tracker · seus dados ficam salvos neste navegador
      </footer>

      <Dialog
        open={hydrated && !data.name.trim()}
        onOpenChange={() => undefined}
      >
        <DialogContent
          showCloseButton={false}
          className="border-white/[0.12] bg-[#111214] p-6 text-white sm:max-w-sm"
          onPointerDownOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader className="text-left">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#102b59] text-[#82b1ff]">
              <UserRound className="size-6" />
            </div>
            <DialogTitle className="mt-3 text-[25px]">Como podemos te chamar?</DialogTitle>
            <DialogDescription className="leading-6 text-white/55">
              Esta é a única informação necessária para começar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveInitialName} className="mt-2">
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              autoFocus
              maxLength={28}
              placeholder="Seu nome"
              className="w-full rounded-xl border border-white/[0.14] bg-black/30 px-4 py-3 text-[16px] outline-none placeholder:text-white/32 focus:border-[#347cf6]"
            />
            <button
              type="submit"
              className="mt-3 min-h-12 w-full rounded-xl bg-[#347cf6] text-sm font-bold shadow-[0_10px_24px_rgba(52,124,246,0.28)]"
            >
              Entrar no Mercury
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="border-white/[0.12] bg-[#111214] p-6 text-white sm:max-w-sm">
          <DialogHeader className="text-left">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#102b59] text-[#82b1ff]">
              <Settings className="size-6" />
            </div>
            <DialogTitle className="mt-3 text-[24px]">
              Configurar informações
            </DialogTitle>
            <DialogDescription className="leading-6 text-white/55">
              Você pode alterar tudo aqui. O ponto vermelho no topo desaparece
              quando o perfil estiver completo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveProfile} className="mt-2 space-y-4">
            <label className="text-sm font-semibold" htmlFor="mercury-name">
              Seu nome <span className="text-red-400">*</span>
            </label>
            <input
              id="mercury-name"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              maxLength={28}
              className="mt-2 w-full rounded-xl border border-white/[0.14] bg-black/30 px-4 py-3 text-[16px] outline-none focus:border-[#347cf6]"
            />
            <div>
              <label className="text-sm font-semibold" htmlFor="mercury-goal">
                Objetivo principal
                {!goalDraft && (
                  <span className="ml-2 inline-block size-2 rounded-full bg-red-500" />
                )}
              </label>
              <select
                id="mercury-goal"
                value={goalDraft}
                onChange={(event) => setGoalDraft(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/[0.14] bg-black/30 px-4 py-3 text-[15px] outline-none focus:border-[#347cf6]"
              >
                <option value="">Selecione seu objetivo</option>
                <option value="Criar uma rotina">Criar uma rotina</option>
                <option value="Estudar melhor">Estudar melhor</option>
                <option value="Cuidar da saúde">Cuidar da saúde</option>
                <option value="Ter mais foco">Ter mais foco</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold" htmlFor="mercury-gender">
                Gênero do personagem
                {!genderDraft && (
                  <span className="ml-2 inline-block size-2 rounded-full bg-red-500" />
                )}
              </label>
              <select
                id="mercury-gender"
                value={genderDraft}
                onChange={(event) => setGenderDraft(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/[0.14] bg-black/30 px-4 py-3 text-[15px] outline-none focus:border-[#347cf6]"
              >
                <option value="">Selecione uma opção</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Prefiro não informar">Prefiro não informar</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold" htmlFor="mercury-class">
                Classe
                {!classDraft && (
                  <span className="ml-2 inline-block size-2 rounded-full bg-red-500" />
                )}
              </label>
              <select
                id="mercury-class"
                value={classDraft}
                onChange={(event) => setClassDraft(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/[0.14] bg-black/30 px-4 py-3 text-[15px] outline-none focus:border-[#347cf6]"
              >
                <option value="">Escolha sua classe</option>
                <option value="Mago">Mago · estudos e foco</option>
                <option value="Guerreiro">Guerreiro · saúde e força</option>
                <option value="Curandeiro">Curandeiro · bem-estar</option>
              </select>
            </div>
            <p className="text-xs leading-5 text-white/48">
              Os pontos vermelhos mostram o que ainda falta configurar.
            </p>
            <button
              type="submit"
              className="min-h-12 w-full rounded-xl bg-[#347cf6] text-sm font-bold"
            >
              Salvar informações
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteRequest)}
        onOpenChange={(open) => {
          if (!open) setDeleteRequest(null);
        }}
      >
        <AlertDialogContent className="border-white/[0.12] bg-[#111214] text-white">
          <AlertDialogHeader>
            <div className="grid size-12 place-items-center rounded-2xl bg-red-500/10 text-red-300">
              <Trash2 className="size-6" />
            </div>
            <AlertDialogTitle>Excluir {deleteRequest?.type === "habit" ? "hábito" : "tarefa"}?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">
              {deleteRequest?.title
                ? "“" + deleteRequest.title + "” será removido permanentemente."
                : "Este item será removido permanentemente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/[0.12] bg-transparent text-white hover:bg-white/[0.06] hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 text-white hover:bg-red-400"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
