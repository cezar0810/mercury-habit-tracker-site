"use client";

import { Download, ExternalLink, Settings } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { BottomNavigation } from "./controls";
import { DownloadArea } from "./download-area";
import { FocusScreen } from "./focus-screen";
import { HabitsScreen } from "./habits-screen";
import { InicioScreen } from "./inicio-screen";
import { PlannerScreen } from "./planner-screen";
import { tabs, type Tab } from "./data";
import {
  blankMercuryData,
  createId,
  dateKey,
  type MercuryData,
  type PlannerPeriod,
} from "./state";

const STORAGE_KEY = "mercury-habit-tracker-web-v1";
const SPONSORED_URL =
  "https://www.profitableratecpmnetwork.com/q7kmyirz3?key=00ae12917d891a3918722a293c3be462";

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
      saved.focusMinutesByDay && typeof saved.focusMinutesByDay === "object"
        ? saved.focusMinutesByDay
        : {},
  };
}

function SponsoredOffer() {
  return (
    <a
      href={SPONSORED_URL}
      target="_blank"
      rel="sponsored noopener noreferrer"
      referrerPolicy="no-referrer"
      aria-label="Abrir conteúdo patrocinado em uma nova página"
      className="group block rounded-2xl border border-[#347cf6]/20 bg-[linear-gradient(135deg,rgba(52,124,246,0.12),rgba(52,124,246,0.035))] p-4 transition hover:border-[#347cf6]/40 hover:bg-[#347cf6]/[0.12]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md bg-white/[0.08] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
          Publicidade
        </span>
        <ExternalLink className="size-4 text-[#82b1ff]" />
      </div>
      <p className="mt-3 text-sm font-bold text-white">Conteúdo patrocinado</p>
      <p className="mt-1 text-xs leading-5 text-white/45">
        Veja uma oferta de um parceiro. Abre uma página externa.
      </p>
    </a>
  );
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
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  useEffect(() => {
    if (hydrated && !data.name.trim()) setSettingsOpen(true);
  }, [data.name, hydrated]);

  const openSettings = () => {
    setNameDraft(data.name);
    setGoalDraft(data.goal);
    setGenderDraft(data.gender);
    setClassDraft(data.characterClass);
    setSettingsOpen(true);
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    const name = nameDraft.trim();
    if (!name) return;
    setData((current) => ({
      ...current,
      name: name.slice(0, 28),
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
      const completions: MercuryData["completions"] = {};
      Object.entries(current.completions).forEach(([day, values]) => {
        const next = { ...values };
        delete next[id];
        completions[day] = next;
      });
      return {
        ...current,
        habits: current.habits.filter((habit) => habit.id !== id),
        completions,
      };
    });
  };

  const moveHabit = (id: string, direction: -1 | 1) => {
    setData((current) => {
      const index = current.habits.findIndex((habit) => habit.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.habits.length) return current;
      const habits = [...current.habits];
      [habits[index], habits[target]] = [habits[target], habits[index]];
      return { ...current, habits };
    });
  };

  const toggleHabit = (habitId: string, day: string) => {
    setData((current) => {
      const values = current.completions[day] || {};
      return {
        ...current,
        completions: {
          ...current.completions,
          [day]: { ...values, [habitId]: !values[habitId] },
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
      const group = current.plannerTasks.filter(
        (item) => item.date === task.date && item.period === task.period,
      );
      const position = group.findIndex((item) => item.id === id);
      const target = position + direction;
      if (target < 0 || target >= group.length) return current;
      const targetId = group[target].id;
      const from = current.plannerTasks.findIndex((item) => item.id === id);
      const to = current.plannerTasks.findIndex((item) => item.id === targetId);
      const plannerTasks = [...current.plannerTasks];
      [plannerTasks[from], plannerTasks[to]] = [plannerTasks[to], plannerTasks[from]];
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
      onDeleteHabit={deleteHabit}
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
        onDeleteTask={deleteTask}
        onMoveTask={moveTask}
      />
    );
  }

  if (tab === "foco") screen = <FocusScreen onWorkComplete={recordWork} />;

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(52,124,246,0.18),transparent_35%)]" />
      <section className="relative mx-auto min-h-[100svh] max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex items-center justify-between rounded-2xl border border-white/[0.1] bg-[#0b0c0d]/90 px-4 py-3 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/mercury-app-icon.png" alt="Mercury" className="size-10 rounded-xl ring-1 ring-white/10" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold">Mercury Habit Tracker</p>
              <p className="text-[11px] text-white/42">Seus dados ficam neste navegador</p>
            </div>
          </div>
          <div className="ml-3 flex items-center gap-2">
            <button
              type="button"
              onClick={openSettings}
              className="grid size-10 place-items-center rounded-xl border border-white/[0.1] text-white/80"
              aria-label="Configurar informações"
            >
              <Settings className="size-4 text-[#347cf6]" />
            </button>
            <a href="#download" className="grid size-10 place-items-center rounded-xl bg-[#347cf6]" aria-label="Ir para download">
              <Download className="size-4" />
            </a>
          </div>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[235px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav className="sticky top-6 rounded-[24px] border border-white/[0.1] bg-[#0b0c0d] p-3">
              <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">Seu espaço</p>
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
                        (active ? "bg-[#112b58] text-[#4b8cff]" : "text-white/58 hover:bg-white/[0.05] hover:text-white")
                      }
                    >
                      <Icon className="size-5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4"><SponsoredOffer /></div>
            </nav>
          </aside>

          <section className="min-w-0 rounded-[28px] border border-white/[0.1] bg-[#050607]/90">
            <div className="px-5 py-7 sm:px-8 sm:py-9">
              {screen}
              <div className="mt-7 lg:hidden"><SponsoredOffer /></div>
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

      {settingsOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4">
          <form onSubmit={saveProfile} className="w-full max-w-sm rounded-[26px] border border-white/[0.12] bg-[#111214] p-6 shadow-2xl">
            <h2 className="text-2xl font-bold">Configurar informações</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">Seu nome é necessário. Os outros campos podem ser preenchidos agora ou depois.</p>
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              maxLength={28}
              autoFocus
              placeholder="Seu nome"
              className="mt-5 w-full rounded-xl border border-white/[0.14] bg-black/30 px-4 py-3 outline-none focus:border-[#347cf6]"
            />
            <select value={goalDraft} onChange={(event) => setGoalDraft(event.target.value)} className="mt-3 w-full rounded-xl border border-white/[0.14] bg-[#151618] px-4 py-3">
              <option value="">Objetivo principal</option>
              <option value="Criar uma rotina">Criar uma rotina</option>
              <option value="Estudar melhor">Estudar melhor</option>
              <option value="Cuidar da saúde">Cuidar da saúde</option>
              <option value="Ter mais foco">Ter mais foco</option>
            </select>
            <select value={genderDraft} onChange={(event) => setGenderDraft(event.target.value)} className="mt-3 w-full rounded-xl border border-white/[0.14] bg-[#151618] px-4 py-3">
              <option value="">Gênero do personagem</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Prefiro não informar">Prefiro não informar</option>
            </select>
            <select value={classDraft} onChange={(event) => setClassDraft(event.target.value)} className="mt-3 w-full rounded-xl border border-white/[0.14] bg-[#151618] px-4 py-3">
              <option value="">Escolha sua classe</option>
              <option value="Mago">Mago · estudos e foco</option>
              <option value="Guerreiro">Guerreiro · saúde e força</option>
              <option value="Curandeiro">Curandeiro · bem-estar</option>
            </select>
            <div className="mt-5 flex gap-2">
              {data.name.trim() && (
                <button type="button" onClick={() => setSettingsOpen(false)} className="min-h-12 flex-1 rounded-xl border border-white/[0.12] text-sm font-semibold">Cancelar</button>
              )}
              <button type="submit" className="min-h-12 flex-1 rounded-xl bg-[#347cf6] text-sm font-bold">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
