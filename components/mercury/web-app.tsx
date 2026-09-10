"use client";

import {
  Download,
  Droplets,
  Dumbbell,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressScreen } from "./progress-screen";
import { activeHabits, allWeekdays, habitLink, scheduleHabit, setHabitLink } from "./routine";
import { recognizeHabit } from "./habit-recognition";
import type { HabitOptionsChange } from "./habit-options";
import { AdsterraContentAd, AdsterraSidebarAd } from "./adsterra-banner";
import { FocusScreen } from "./focus-screen";
import { HabitsScreen } from "./habits-screen";
import { InicioScreen } from "./inicio-screen";
import { PlannerScreen } from "./planner-screen";
import {
  blankMercuryData,
  createId,
  dateKey,
  habitEmoji,
  profileIsComplete,
  type MercuryData,
  type PlannerPeriod,
} from "./state";
import { tabs, type Tab } from "./data";
import {
  MERCURY_STORAGE_KEY,
  readMercuryData,
  writeMercuryData,
} from "./mercury-storage";
import { withPhysicalProfile } from "./physical-profile-dialog";

type DeleteRequest =
  | { type: "habit"; id: string; title: string }
  | { type: "task"; id: string; title: string };

export function MercuryWebApp() {
  const [tab, setTab] = useState<Tab>("inicio");
  const [routineView, setRoutineView] = useState("habitos");
  const [data, setData] = useState<MercuryData>({ ...blankMercuryData });
  const [hydrated, setHydrated] = useState(false);
  const [, setCalendarDay] = useState(() => dateKey(new Date()));
  const [viewMonth, setViewMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [plannerDate, setPlannerDate] = useState(() => dateKey(new Date()));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [goalDraft, setGoalDraft] = useState("");
  const [genderDraft, setGenderDraft] = useState("");
  const [classDraft, setClassDraft] = useState("");
  const [weightDraft, setWeightDraft] = useState("");
  const [heightDraft, setHeightDraft] = useState("");
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(
    null,
  );

  useEffect(() => {
    setData(readMercuryData());
    setHydrated(true);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === MERCURY_STORAGE_KEY) setData(readMercuryData());
    };
    window.addEventListener("storage", handleStorage);
    const refresh = () => { setData(readMercuryData()); setCalendarDay(dateKey(new Date())); };
    window.addEventListener("pageshow", refresh);
    const clock = window.setInterval(() => setCalendarDay(dateKey(new Date())), 30_000);
    return () => { window.removeEventListener("storage", handleStorage); window.removeEventListener("pageshow", refresh); window.clearInterval(clock); };
  }, []);

  useEffect(() => {
    if (hydrated) {
      writeMercuryData(data);
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
    setWeightDraft(data.weightKg?.toString() || "");
    setHeightDraft(data.heightCm?.toString() || "");
    setSettingsOpen(true);
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    const nextName = nameDraft.trim();
    if (!nextName) return;
    setData((current) => {
      const next = {
        ...current,
        name: nextName.slice(0, 28),
        goal: goalDraft,
        gender: genderDraft,
        characterClass: classDraft,
      };
      const weightKg = Number(weightDraft.replace(",", "."));
      const heightCm = Number(heightDraft.replace(",", "."));
      return weightKg >= 25 && weightKg <= 350 && heightCm >= 100 && heightCm <= 250
        ? withPhysicalProfile(next, { weightKg: Math.round(weightKg * 10) / 10, heightCm: Math.round(heightCm) })
        : next;
    });
    setSettingsOpen(false);
  };

  const addHabit = (title: string) => {
    const nextTitle = title.trim();
    const manualHabitCount = activeHabits(data).filter((habit) => habit.source !== "workout").length;
    if (!nextTitle || manualHabitCount >= 15) return false;
    setData((current) => ({
      ...current,
      habits: [
        ...current.habits,
        {
          id: createId("habit"),
          title: nextTitle.slice(0, 45),
          emoji: habitEmoji(nextTitle),
          emojiMode: "auto",
          link: recognizeHabit(nextTitle),
          linkHistory: [{ from: dateKey(new Date()), link: recognizeHabit(nextTitle) }],
          linkMode: "auto",
          createdOn: dateKey(new Date()),
          scheduleHistory: [{ from: dateKey(new Date()), weekdays: allWeekdays }],
        },
      ],
    }));
    return true;
  };

  const renameHabit = (id: string, title: string) => {
    setData((current) => ({
      ...current,
      habits: current.habits.map((habit) =>
        habit.id === id && habit.source !== "workout"
          ? { ...setHabitLink(habit, habit.linkMode === "manual" ? habitLink(habit) : recognizeHabit(title), dateKey(new Date())), title: title.slice(0, 45), emoji: habit.emojiMode === "custom" ? habit.emoji : habitEmoji(title) }
          : habit,
      ),
    }));
  };

  const deleteHabit = (id: string) => {
    setData((current) => {
      const habit = current.habits.find((item) => item.id === id);
      if (habit?.source === "workout") return current;
      return {
        ...current,
        habits: current.habits.map(habit => habit.id === id ? { ...habit, archivedOn: dateKey(new Date()) } : habit),
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
    if (day > dateKey(new Date())) return;
    const habit = data.habits.find(item => item.id === habitId);
    if (habit && habitLink(habit) !== "none") {
      window.location.href = habitLink(habit) === "water" ? "/water" : "/treinos";
      return;
    }
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

  const changeHabitOptions = (id: string, change: HabitOptionsChange) => {
    setData(current => ({ ...current, habits: current.habits.map(habit => {
      if (habit.id !== id) return habit;
      let next = { ...habit };
      if (change.emoji) next = { ...next, emoji: change.emoji, emojiMode: "custom" };
      if (change.link && habit.source !== "workout") next = { ...setHabitLink(next, change.link, dateKey(new Date())), linkMode: "manual" };
      if (change.weekdays) next = scheduleHabit(next, change.weekdays, dateKey(new Date()));
      return next;
    }) }));
  };

  const quickWater = (amountMl: number) => {
    const today = dateKey(new Date());
    const entry = { id: createId("water"), amountMl, recordedAt: new Date().toISOString() };
    setData(current => ({ ...current, waterEntriesByDay: { ...current.waterEntriesByDay, [today]: [...(current.waterEntriesByDay[today] || []), entry] } }));
    return entry.id;
  };
  const undoQuickWater = (id: string) => {
    setData(current => ({ ...current, waterEntriesByDay: Object.fromEntries(Object.entries(current.waterEntriesByDay).map(([day, entries]) => [day, entries.filter(entry => entry.id !== id)])) }));
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

  // A hora local e os dados do navegador só existem no cliente. Renderizar
  // uma moldura estável até a leitura evita texto diferente entre SSR e React.
  if (!hydrated) {
    return (
      <main className="grid min-h-screen place-items-center bg-black text-white">
        <div className="flex items-center gap-3 text-sm text-white/60">
          <img src="/mercury-app-icon.png" alt="Mercury" className="size-10 rounded-xl" />
          Preparando seu Mercury…
        </div>
      </main>
    );
  }

  let screen = (
    <HabitsScreen
      data={data}
      habits={activeHabits(data)}
      completions={data.completions}
      viewMonth={viewMonth}
      onMonthChange={setViewMonth}
      onAddHabit={addHabit}
      manualHabitCount={activeHabits(data).filter((habit) => habit.source !== "workout").length}
      onRenameHabit={renameHabit}
      onDeleteHabit={(id) => {
        const habit = data.habits.find((item) => item.id === id);
        if (habit) setDeleteRequest({ type: "habit", id, title: habit.title });
      }}
      onMoveHabit={moveHabit}
      onToggle={toggleHabit}
      onOptions={changeHabitOptions}
    />
  );

  if (tab === "inicio") {
    screen = (
      <InicioScreen
        data={data}
        onRoutine={() => setTab("rotina")}
        onProgress={() => setTab("progresso")}
        onHabit={toggleHabit}
        onTask={toggleTask}
        onWater={quickWater}
        onUndoWater={undoQuickWater}
      />
    );
  }

  if (tab === "planejar" || (tab === "rotina" && routineView === "planejar")) {
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
  if (tab === "progresso") screen = <ProgressScreen data={data} />;
  if (tab === "rotina") screen = <Tabs value={routineView} onValueChange={setRoutineView}>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <TabsList className="h-auto bg-[#11151c] p-1"><TabsTrigger value="habitos" className="min-h-11 text-white/70 data-[state=active]:bg-[#1b3764] data-[state=active]:text-white">Hábitos</TabsTrigger><TabsTrigger value="planejar" className="min-h-11 text-white/70 data-[state=active]:bg-[#1b3764] data-[state=active]:text-white">Planejar</TabsTrigger></TabsList>
      <a href="/treinos" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-3 text-sm text-[#a8c8ff]"><Dumbbell className="size-4" />Meus treinos</a>
    </div><TabsContent value={routineView}>{screen}</TabsContent>
  </Tabs>;

  const confirmDelete = () => {
    if (!deleteRequest) return;
    if (deleteRequest.type === "habit") deleteHabit(deleteRequest.id);
    if (deleteRequest.type === "task") deleteTask(deleteRequest.id);
    setDeleteRequest(null);
  };
  const profileComplete = profileIsComplete(data);

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_-30%,rgba(48,126,255,0.16),transparent_62%)]" />

      <section className="relative mx-auto min-h-[100svh] max-w-7xl sm:px-6 sm:py-8 lg:px-8">
        <header className="mx-4 mt-4 flex items-center justify-between rounded-[22px] border border-white/[0.11] bg-[#090a0b]/95 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:mt-0 sm:px-5">
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
              href="/download"
              aria-label="Abrir a página de download do Mercury"
              className="flex min-h-10 items-center gap-2 rounded-xl bg-[#2f80ff] px-3 text-xs font-bold shadow-[0_8px_20px_rgba(47,128,255,0.26)] transition hover:bg-[#438cff]"
            >
              <Download className="size-4" />
              <span>Download</span>
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
                  <a
                    href="/treinos"
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-white/58 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <Dumbbell className="size-5" />
                    Treinos
                  </a>
                  <a
                    href="/water"
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-white/58 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <Droplets className="size-5" />
                    Água
                  </a>
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
              {hydrated && data.name.trim() && <AdsterraSidebarAd />}
            </div>
          </aside>

          <section className="min-w-0 border-y border-white/[0.08] bg-black sm:rounded-[28px] sm:border sm:border-white/[0.1] sm:bg-[#050607]/95 sm:shadow-[0_20px_70px_rgba(0,0,0,0.24)]">
            <div className="px-5 py-7 sm:px-8 sm:py-9">
              {screen}
              {hydrated && data.name.trim() && (
                <div className="mt-8 border-t border-white/[0.07] pt-7">
                  <AdsterraContentAd />
                </div>
              )}
            </div>
            <div className="sticky bottom-0 z-40 border-t border-white/[0.06] bg-black/95 pt-1 backdrop-blur-xl lg:hidden">
              <BottomNavigation tab={tab} onChange={setTab} />
            </div>
          </section>
        </div>
      </section>

      <footer className="relative hidden border-t border-white/[0.07] px-5 py-7 text-center text-xs text-white/38 lg:block">
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
            <a href="/download" className="mt-3 flex min-h-11 items-center justify-center text-sm text-[#a8c8ff]">Quero apenas instalar no celular</a>
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
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold">Peso
                <span className="relative mt-2 block"><input type="number" min={25} max={350} step="0.1" value={weightDraft} onChange={event => setWeightDraft(event.target.value)} placeholder="70" className="min-h-12 w-full rounded-xl border border-white/[0.14] bg-black/30 px-3 pr-9 text-base outline-none focus:border-[#347cf6]" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">kg</span></span>
              </label>
              <label className="text-sm font-semibold">Altura
                <span className="relative mt-2 block"><input type="number" min={100} max={250} step="1" value={heightDraft} onChange={event => setHeightDraft(event.target.value)} placeholder="175" className="min-h-12 w-full rounded-xl border border-white/[0.14] bg-black/30 px-3 pr-9 text-base outline-none focus:border-[#347cf6]" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">cm</span></span>
              </label>
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
