"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  CircleCheckBig,
  Dumbbell,
  Eye,
  ImageOff,
  ListChecks,
  LoaderCircle,
  Plus,
  Play,
  Search,
  Trash2,
  X,
} from "lucide-react";
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
import {
  cleanWorkoutPlans,
  exerciseImageUrl,
  EXERCISE_DATA_URL,
  MAX_WORKOUTS,
  normalizeCatalog,
  searchCatalog,
  type CatalogExercise,
  type WorkoutExercise,
  type WorkoutPlan,
} from "./workouts-data";
import {
  WORKOUTS_STORAGE_KEY,
  readMercuryData,
  syncCompletedWorkout,
  syncWorkoutPlans,
  writeMercuryData,
} from "./mercury-storage";
import { blankMercuryData, type MercuryData } from "./state";
import { estimatedWorkoutCalories } from "./health-metrics";
import { PhysicalProfileDialog, withPhysicalProfile } from "./physical-profile-dialog";

type DeleteTarget =
  | { kind: "workout"; workoutId: string; name: string }
  | { kind: "exercise"; workoutId: string; exerciseId: string; name: string };

type TrainingSession = {
  workoutId: string;
  completed: string[];
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const PORTUGUESE_LABELS: Record<string, string> = {
  avancado: "Avançado",
  intermediario: "Intermediário",
  forca: "Força",
  "levantamento-olimpico": "Levantamento olímpico",
  "bola-de-exercicio": "Bola de exercício",
  "bola-medicinal": "Bola medicinal",
  "barra-w": "Barra W",
  maquina: "Máquina",
  "peso-do-corpo": "Peso do corpo",
  "rolo-de-espuma": "Rolo de espuma",
  antebracos: "Antebraços",
  biceps: "Bíceps",
  gluteos: "Glúteos",
  "inferior-das-costas": "Lombar",
  "meio-das-costas": "Meio das costas",
  pescoco: "Pescoço",
  quadriceps: "Quadríceps",
  trapezio: "Trapézio",
  triceps: "Tríceps",
};

function label(value: string) {
  if (!value || value === "não informado") return "Não informado";
  const normalized = value.toLocaleLowerCase();
  if (PORTUGUESE_LABELS[normalized]) return PORTUGUESE_LABELS[normalized];
  const readable = value.replaceAll("-", " ");
  return readable.charAt(0).toLocaleUpperCase("pt-BR") + readable.slice(1);
}

function ExerciseImage({ path, name }: { path?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!path || failed) {
    return (
      <div className="grid h-full min-h-40 place-items-center bg-white/[0.04] text-white/30">
        <ImageOff className="size-7" />
      </div>
    );
  }
  return (
    <img
      src={exerciseImageUrl(path)}
      alt={`Demonstração de ${name}`}
      className="h-full w-full bg-white object-contain"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function MercuryWorkoutsApp() {
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [catalog, setCatalog] = useState<CatalogExercise[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"add" | "details">("add");
  const [query, setQuery] = useState("");
  const [chosenExercise, setChosenExercise] = useState<CatalogExercise | null>(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [completedWorkout, setCompletedWorkout] = useState("");
  const [completedCalories, setCompletedCalories] = useState(0);
  const [physicalData, setPhysicalData] = useState<MercuryData>({ ...blankMercuryData });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WORKOUTS_STORAGE_KEY);
      const restored = cleanWorkoutPlans(raw ? JSON.parse(raw) : []);
      setWorkouts(restored);
      setSelectedWorkoutId(restored[0]?.id ?? "");
      syncWorkoutPlans(restored);
      setPhysicalData(readMercuryData());
    } catch {
      window.localStorage.removeItem(WORKOUTS_STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(workouts));
    }
  }, [hydrated, workouts]);

  useEffect(() => {
    if (hydrated) void loadCatalog();
  }, [hydrated]);

  useEffect(() => {
    if (!chosenExercise || !catalog.length) return;
    const translated = catalog.find((exercise) => exercise.id === chosenExercise.id);
    if (translated && translated !== chosenExercise) setChosenExercise(translated);
  }, [catalog, chosenExercise?.id]);

  const selectedWorkout = workouts.find((workout) => workout.id === selectedWorkoutId) ?? null;
  const activeWorkout = session
    ? workouts.find((workout) => workout.id === session.workoutId) ?? null
    : null;

  const visibleExercises = useMemo(
    () => searchCatalog(catalog, query),
    [catalog, query],
  );

  async function loadCatalog() {
    if (catalogLoading || catalog.length) return;
    setCatalogLoading(true);
    setCatalogError("");
    try {
      const response = await fetch(EXERCISE_DATA_URL, { cache: "force-cache" });
      if (!response.ok) throw new Error("catalog unavailable");
      const nextCatalog = normalizeCatalog(await response.json());
      if (!nextCatalog.length) throw new Error("empty catalog");
      setCatalog(nextCatalog);
      const translatedById = new Map(nextCatalog.map((exercise) => [exercise.id, exercise]));
      setWorkouts((current) => current.map((workout) => ({
        ...workout,
        exercises: workout.exercises.map((exercise) => {
          const translated = translatedById.get(exercise.id);
          return translated ? { ...translated, sets: exercise.sets, reps: exercise.reps } : exercise;
        }),
      })));
    } catch {
      setCatalogError("Não foi possível carregar os exercícios. Verifique sua internet e tente novamente.");
    } finally {
      setCatalogLoading(false);
    }
  }

  function createWorkout(event: FormEvent) {
    event.preventDefault();
    const name = workoutName.trim();
    if (!name || workouts.length >= MAX_WORKOUTS) return;
    const workout: WorkoutPlan = {
      id: createId("treino"),
      name: name.slice(0, 36),
      exercises: [],
    };
    const nextWorkouts = [...workouts, workout];
    setWorkouts(nextWorkouts);
    syncWorkoutPlans(nextWorkouts);
    setSelectedWorkoutId(workout.id);
    setWorkoutName("");
    setCreateOpen(false);
  }

  function openExercisePicker() {
    if (!selectedWorkout) return;
    setPickerMode("add");
    setChosenExercise(null);
    setQuery("");
    setSets(3);
    setReps(10);
    setPickerOpen(true);
    void loadCatalog();
  }

  function openDetails(exercise: CatalogExercise) {
    setPickerMode("details");
    setChosenExercise(exercise);
    setPickerOpen(true);
    void loadCatalog();
  }

  function chooseExercise(exercise: CatalogExercise) {
    setChosenExercise(exercise);
    setSets(3);
    setReps(10);
  }

  function addExercise() {
    if (!selectedWorkout || !chosenExercise) return;
    const alreadyAdded = selectedWorkout.exercises.some((item) => item.id === chosenExercise.id);
    if (alreadyAdded) return;
    const exercise: WorkoutExercise = {
      ...chosenExercise,
      sets: Math.min(20, Math.max(1, Math.round(sets))),
      reps: Math.min(100, Math.max(1, Math.round(reps))),
    };
    setWorkouts((current) => current.map((workout) =>
      workout.id === selectedWorkout.id
        ? { ...workout, exercises: [...workout.exercises, exercise] }
        : workout,
    ));
    setPickerOpen(false);
    setChosenExercise(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "workout") {
      const next = workouts.filter((workout) => workout.id !== deleteTarget.workoutId);
      setWorkouts(next);
      syncWorkoutPlans(next);
      if (selectedWorkoutId === deleteTarget.workoutId) {
        setSelectedWorkoutId(next[0]?.id ?? "");
      }
    } else {
      setWorkouts((current) => current.map((workout) =>
        workout.id === deleteTarget.workoutId
          ? { ...workout, exercises: workout.exercises.filter((exercise) => exercise.id !== deleteTarget.exerciseId) }
          : workout,
      ));
    }
    setDeleteTarget(null);
  }

  function startTraining(workout: WorkoutPlan) {
    if (!workout.exercises.length) return;
    setCompletedWorkout("");
    setCompletedCalories(0);
    setSession({ workoutId: workout.id, completed: [] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleExercise(exerciseId: string) {
    setSession((current) => {
      if (!current) return current;
      const completed = current.completed.includes(exerciseId)
        ? current.completed.filter((id) => id !== exerciseId)
        : [...current.completed, exerciseId];
      return { ...current, completed };
    });
  }

  const progress = activeWorkout && session
    ? Math.round((session.completed.length / activeWorkout.exercises.length) * 100)
    : 0;

  if (!hydrated) {
    return (
      <main className="grid min-h-screen place-items-center bg-black text-white">
        <LoaderCircle className="size-7 animate-spin text-[#4b8cff]" aria-label="Carregando treinos" />
      </main>
    );
  }

  if (activeWorkout && session) {
    const finished = session.completed.length === activeWorkout.exercises.length;
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(52,124,246,0.2),transparent_38%)]" />
        <section className="relative mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#76a7ff]">Treino em andamento</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{activeWorkout.name}</h1>
            </div>
            <button
              type="button"
              onClick={() => setSession(null)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-bold text-white/65 hover:bg-white/[0.06]"
            >
              <X className="size-4" /> Encerrar
            </button>
          </header>

          <div className="mt-7 rounded-2xl border border-white/10 bg-[#0a0c0f] p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm text-white/50">Progresso</p>
                <p className="mt-1 text-lg font-bold">{session.completed.length} de {activeWorkout.exercises.length} exercícios</p>
              </div>
              <strong className="text-2xl text-[#5b94ff]">{progress}%</strong>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#347cf6] transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {activeWorkout.exercises.map((exercise, index) => {
              const done = session.completed.includes(exercise.id);
              return (
                <article
                  key={exercise.id}
                  className={`grid gap-4 rounded-2xl border p-4 transition sm:grid-cols-[70px_minmax(0,1fr)_auto] sm:items-center ${done ? "border-[#347cf6]/35 bg-[#102650]" : "border-white/10 bg-[#0a0c0f]"}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExercise(exercise.id)}
                    aria-label={done ? `Desmarcar ${exercise.name}` : `Concluir ${exercise.name}`}
                    className={`grid size-14 place-items-center rounded-2xl border text-lg font-black ${done ? "border-[#5b94ff] bg-[#347cf6] text-white" : "border-white/15 text-white/35 hover:border-[#347cf6] hover:text-[#5b94ff]"}`}
                  >
                    {done ? <Check className="size-7" /> : index + 1}
                  </button>
                  <div className="min-w-0">
                    <h2 className={`text-lg font-bold ${done ? "text-white/60 line-through" : "text-white"}`}>{exercise.name}</h2>
                    <p className="mt-1 text-sm text-white/48">{exercise.sets} séries × {exercise.reps} repetições</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDetails(exercise)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-semibold text-white/65 hover:bg-white/[0.06]"
                  >
                    <Eye className="size-4" /> Detalhes
                  </button>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!finished}
            onClick={() => {
              const calories = physicalData.weightKg
                ? estimatedWorkoutCalories(physicalData.weightKg, activeWorkout.exercises)
                : 0;
              syncCompletedWorkout({ id: activeWorkout.id, name: activeWorkout.name }, calories);
              setCompletedWorkout(activeWorkout.name);
              setCompletedCalories(calories);
              setSession(null);
            }}
            className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#347cf6] text-base font-black shadow-[0_14px_35px_rgba(52,124,246,0.28)] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
          >
            <CircleCheckBig className="size-5" />
            {finished ? "Concluir treino" : "Marque todos para concluir"}
          </button>
        </section>
        <ExerciseDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          mode="details"
          chosen={chosenExercise}
          onBack={() => setPickerOpen(false)}
          query=""
          onQueryChange={() => undefined}
          loading={false}
          error=""
          results={[]}
          onRetry={() => undefined}
          onChoose={() => undefined}
          sets={sets}
          reps={reps}
          onSetsChange={setSets}
          onRepsChange={setReps}
          onAdd={() => undefined}
          alreadyAdded={false}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(52,124,246,0.2),transparent_35%),radial-gradient(circle_at_100%_70%,rgba(19,69,160,0.1),transparent_30%)]" />
      <section className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0a0c0f]/90 px-4 py-3 backdrop-blur-xl sm:px-5">
          <div className="flex items-center gap-3">
            <img src="/mercury-app-icon.png" alt="Mercury" className="size-11 rounded-xl ring-1 ring-white/10" />
            <div>
              <p className="text-base font-black">Mercury Treinos</p>
              <p className="text-xs text-white/42">Suas fichas ficam salvas neste navegador</p>
            </div>
          </div>
          <a href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-bold text-white/65 hover:bg-white/[0.06]">
            <ArrowLeft className="size-4" /> Habit Tracker
          </a>
        </header>

        {completedWorkout && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            <CircleCheckBig className="size-5 shrink-0 text-emerald-400" />
            Treino “{completedWorkout}” concluído. {completedCalories > 0 ? `≈ ${completedCalories} kcal registradas.` : "Bom trabalho!"}
            <button type="button" onClick={() => setCompletedWorkout("")} className="ml-auto rounded-lg p-1 text-emerald-100/60 hover:bg-white/10" aria-label="Fechar mensagem">
              <X className="size-4" />
            </button>
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-[24px] border border-white/10 bg-[#0a0c0f] p-4 lg:self-start lg:sticky lg:top-6">
            <div className="flex items-end justify-between gap-3 px-1">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/35">Suas fichas</p>
                <p className="mt-1 text-sm text-white/55">{workouts.length} de {MAX_WORKOUTS} treinos</p>
              </div>
              <button
                type="button"
                disabled={workouts.length >= MAX_WORKOUTS}
                onClick={() => setCreateOpen(true)}
                aria-label="Criar treino"
                className="grid size-11 place-items-center rounded-xl bg-[#347cf6] shadow-[0_10px_24px_rgba(52,124,246,0.25)] disabled:bg-white/10 disabled:text-white/30"
              >
                <Plus className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {workouts.map((workout) => {
                const selected = workout.id === selectedWorkoutId;
                return (
                  <button
                    key={workout.id}
                    type="button"
                    onClick={() => setSelectedWorkoutId(workout.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${selected ? "border-[#347cf6]/40 bg-[#112b58]" : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-base font-bold">{workout.name}</span>
                        <span className="mt-1 block text-xs text-white/45">{workout.exercises.length} exercício{workout.exercises.length === 1 ? "" : "s"}</span>
                      </span>
                      <Dumbbell className={`size-5 shrink-0 ${selected ? "text-[#6ca0ff]" : "text-white/28"}`} />
                    </span>
                  </button>
                );
              })}
            </div>

            {!workouts.length && (
              <div className="mt-5 rounded-2xl border border-dashed border-white/12 px-4 py-8 text-center">
                <Dumbbell className="mx-auto size-7 text-white/25" />
                <p className="mt-3 text-sm font-semibold text-white/65">Crie sua primeira ficha</p>
                <p className="mt-1 text-xs leading-5 text-white/38">Você pode montar até cinco treinos.</p>
              </div>
            )}
          </aside>

          <section className="min-w-0 rounded-[28px] border border-white/10 bg-[#050607]/92 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] sm:p-8">
            {selectedWorkout ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.07] pb-6">
                  <div>
                    <p className="text-sm font-semibold text-[#6ca0ff]">Ficha de treino</p>
                    <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{selectedWorkout.name}</h1>
                    <p className="mt-2 text-sm text-white/45">{selectedWorkout.exercises.length} exercício{selectedWorkout.exercises.length === 1 ? "" : "s"} configurado{selectedWorkout.exercises.length === 1 ? "" : "s"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ kind: "workout", workoutId: selectedWorkout.id, name: selectedWorkout.name })}
                      aria-label={`Excluir treino ${selectedWorkout.name}`}
                      className="grid size-11 place-items-center rounded-xl border border-red-400/15 text-red-300/75 hover:bg-red-500/10"
                    >
                      <Trash2 className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={!selectedWorkout.exercises.length}
                      onClick={() => startTraining(selectedWorkout)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#347cf6] px-4 text-sm font-black shadow-[0_10px_24px_rgba(52,124,246,0.25)] disabled:bg-white/10 disabled:text-white/30"
                    >
                      <Play className="size-4 fill-current" /> Iniciar treino
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {selectedWorkout.exercises.map((exercise, index) => (
                    <article key={exercise.id} className="grid gap-4 rounded-2xl border border-white/[0.08] bg-[#0a0c0f] p-4 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-center">
                      <div className="grid size-12 place-items-center rounded-xl bg-[#112b58] font-black text-[#6ca0ff]">{index + 1}</div>
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold">{exercise.name}</h2>
                        <p className="mt-1 text-sm text-white/45">{exercise.sets} séries × {exercise.reps} repetições</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openDetails(exercise)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-semibold text-white/60 hover:bg-white/[0.05]">
                          <Eye className="size-4" /> <span className="hidden sm:inline">Detalhes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ kind: "exercise", workoutId: selectedWorkout.id, exerciseId: exercise.id, name: exercise.name })}
                          aria-label={`Remover ${exercise.name}`}
                          className="grid size-10 place-items-center rounded-xl border border-white/10 text-white/35 hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={openExercisePicker}
                  className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#347cf6]/35 bg-[#347cf6]/[0.06] text-sm font-black text-[#76a7ff] hover:bg-[#347cf6]/10"
                >
                  <Plus className="size-5" /> Adicionar exercício
                </button>
              </>
            ) : (
              <div className="grid min-h-[430px] place-items-center text-center">
                <div className="max-w-sm">
                  <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#112b58] text-[#6ca0ff]"><ListChecks className="size-8" /></div>
                  <h1 className="mt-5 text-2xl font-black">Monte seu treino</h1>
                  <p className="mt-2 text-sm leading-6 text-white/45">Crie uma ficha, escolha os exercícios e defina séries e repetições.</p>
                  <button type="button" onClick={() => setCreateOpen(true)} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#347cf6] px-5 text-sm font-black">
                    <Plus className="size-4" /> Criar primeiro treino
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="py-8 text-center text-xs leading-5 text-white/35">
          Catálogo em português: <a className="underline underline-offset-4 hover:text-white/60" href="https://github.com/gugeldev/exercicios-bd-ptbr" target="_blank" rel="noreferrer">Exercícios BD PT-BR</a>, baseado no <a className="underline underline-offset-4 hover:text-white/60" href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">Free Exercise DB</a>.
        </footer>
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-white/10 bg-[#101216] p-6 text-white sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl">Novo treino</DialogTitle>
            <DialogDescription className="text-white/50">Dê um nome fácil de reconhecer, como Peito e tríceps.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createWorkout} className="mt-2">
            <label htmlFor="workout-name" className="text-sm font-bold">Nome do treino</label>
            <input id="workout-name" autoFocus value={workoutName} onChange={(event) => setWorkoutName(event.target.value)} maxLength={36} placeholder="Ex.: Treino A" className="mt-2 min-h-12 w-full rounded-xl border border-white/12 bg-black/30 px-4 text-base outline-none placeholder:text-white/25 focus:border-[#347cf6]" />
            <button type="submit" disabled={!workoutName.trim()} className="mt-4 min-h-12 w-full rounded-xl bg-[#347cf6] text-sm font-black disabled:bg-white/10 disabled:text-white/30">Criar treino</button>
          </form>
        </DialogContent>
      </Dialog>

      <ExerciseDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode={pickerMode}
        chosen={chosenExercise}
        onBack={() => {
          if (pickerMode === "details") {
            setPickerOpen(false);
            return;
          }
          setChosenExercise(null);
        }}
        query={query}
        onQueryChange={setQuery}
        loading={catalogLoading}
        error={catalogError}
        results={visibleExercises}
        onRetry={() => void loadCatalog()}
        onChoose={chooseExercise}
        sets={sets}
        reps={reps}
        onSetsChange={setSets}
        onRepsChange={setReps}
        onAdd={addExercise}
        alreadyAdded={Boolean(chosenExercise && selectedWorkout?.exercises.some((item) => item.id === chosenExercise.id))}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-white/10 bg-[#101216] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget?.kind === "workout" ? "Excluir este treino?" : "Remover este exercício?"}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">“{deleteTarget?.name}” será removido. Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/[0.06] hover:text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 text-white hover:bg-red-400">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <PhysicalProfileDialog
        open={hydrated && !physicalData.physicalProfilePrompted}
        data={physicalData}
        onSave={(values) => {
          const next = withPhysicalProfile(readMercuryData(), values);
          writeMercuryData(next);
          setPhysicalData(next);
        }}
        onSkip={() => {
          const next = { ...readMercuryData(), physicalProfilePrompted: true };
          writeMercuryData(next);
          setPhysicalData(next);
        }}
      />
    </main>
  );
}

type ExerciseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "details";
  chosen: CatalogExercise | null;
  onBack: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  loading: boolean;
  error: string;
  results: CatalogExercise[];
  onRetry: () => void;
  onChoose: (exercise: CatalogExercise) => void;
  sets: number;
  reps: number;
  onSetsChange: (value: number) => void;
  onRepsChange: (value: number) => void;
  onAdd: () => void;
  alreadyAdded: boolean;
};

function ExerciseDialog(props: ExerciseDialogProps) {
  const detailsOnly = props.mode === "details";
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-hidden border-white/10 bg-[#101216] p-0 text-white sm:max-w-4xl">
        {props.chosen ? (
          <div className="max-h-[92svh] overflow-y-auto p-5 sm:p-7">
            <button type="button" onClick={props.onBack} className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-semibold text-white/60 hover:bg-white/[0.05]">
              <ChevronLeft className="size-4" /> {detailsOnly ? "Fechar detalhes" : "Voltar à busca"}
            </button>
            <DialogHeader className="text-left">
              <DialogTitle className="pr-8 text-2xl sm:text-3xl">{props.chosen.name}</DialogTitle>
              <DialogDescription className="text-white/48">{label(props.chosen.category)} · {label(props.chosen.level)} · {label(props.chosen.equipment)}</DialogDescription>
            </DialogHeader>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[props.chosen.images[0], props.chosen.images[1]].map((image, index) => (
                <div key={image ?? index} className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/10">
                  <ExerciseImage path={image} name={`${props.chosen?.name} — posição ${index + 1}`} />
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/35">Músculos principais</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{props.chosen.primaryMuscles.map(label).join(", ") || "Não informado"}</p>
                {props.chosen.secondaryMuscles.length > 0 && (
                  <>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-white/35">Músculos secundários</p>
                    <p className="mt-2 text-sm leading-6 text-white/70">{props.chosen.secondaryMuscles.map(label).join(", ")}</p>
                  </>
                )}
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/35">Como fazer</p>
                {props.chosen.instructions.length ? (
                  <ol className="mt-3 space-y-3 text-sm leading-6 text-white/68">
                    {props.chosen.instructions.map((instruction, index) => (
                      <li key={`${index}-${instruction}`} className="grid grid-cols-[24px_1fr] gap-2">
                        <span className="grid size-6 place-items-center rounded-full bg-[#112b58] text-xs font-bold text-[#76a7ff]">{index + 1}</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                ) : <p className="mt-2 text-sm text-white/45">Instruções não disponíveis.</p>}
              </div>
            </div>

            {!detailsOnly && (
              <div className="mt-5 rounded-2xl border border-[#347cf6]/25 bg-[#347cf6]/[0.06] p-4">
                <p className="text-sm font-bold">Configuração no treino</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="text-sm text-white/55">Séries
                    <input type="number" min={1} max={20} value={props.sets} onChange={(event) => props.onSetsChange(Number(event.target.value))} className="mt-2 min-h-12 w-full rounded-xl border border-white/12 bg-black/30 px-3 text-base font-bold text-white outline-none focus:border-[#347cf6]" />
                  </label>
                  <label className="text-sm text-white/55">Repetições
                    <input type="number" min={1} max={100} value={props.reps} onChange={(event) => props.onRepsChange(Number(event.target.value))} className="mt-2 min-h-12 w-full rounded-xl border border-white/12 bg-black/30 px-3 text-base font-bold text-white outline-none focus:border-[#347cf6]" />
                  </label>
                </div>
                <button type="button" disabled={props.alreadyAdded} onClick={props.onAdd} className="mt-4 min-h-12 w-full rounded-xl bg-[#347cf6] text-sm font-black disabled:bg-white/10 disabled:text-white/30">
                  {props.alreadyAdded ? "Exercício já adicionado" : "Adicionar ao treino"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex max-h-[92svh] min-h-[560px] flex-col p-5 sm:p-7">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl">Adicionar exercício</DialogTitle>
              <DialogDescription className="text-white/48">Pesquise por nome, músculo ou equipamento.</DialogDescription>
            </DialogHeader>
            <label className="relative mt-5 block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/30" />
              <input autoFocus value={props.query} onChange={(event) => props.onQueryChange(event.target.value)} placeholder="Ex.: bench press, chest, dumbbell" className="min-h-12 w-full rounded-xl border border-white/12 bg-black/30 pl-12 pr-4 text-base outline-none placeholder:text-white/25 focus:border-[#347cf6]" />
            </label>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              {props.loading && (
                <div className="grid min-h-72 place-items-center text-center text-sm text-white/45">
                  <div><LoaderCircle className="mx-auto size-7 animate-spin text-[#5b94ff]" /><p className="mt-3">Carregando catálogo de exercícios…</p></div>
                </div>
              )}
              {props.error && !props.loading && (
                <div className="grid min-h-72 place-items-center text-center">
                  <div className="max-w-sm"><p className="text-sm leading-6 text-white/55">{props.error}</p><button type="button" onClick={props.onRetry} className="mt-4 min-h-11 rounded-xl bg-[#347cf6] px-5 text-sm font-bold">Tentar novamente</button></div>
                </div>
              )}
              {!props.loading && !props.error && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {props.results.map((exercise) => (
                    <button key={exercise.id} type="button" onClick={() => props.onChoose(exercise)} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 text-left hover:border-[#347cf6]/35 hover:bg-[#347cf6]/[0.06]">
                      <div className="h-[72px] overflow-hidden rounded-xl"><ExerciseImage path={exercise.images[0]} name={exercise.name} /></div>
                      <span className="min-w-0 self-center"><span className="block line-clamp-2 text-sm font-bold leading-5">{exercise.name}</span><span className="mt-1 block truncate text-xs text-white/40">{exercise.primaryMuscles.map(label).join(", ") || label(exercise.category)}</span></span>
                    </button>
                  ))}
                </div>
              )}
              {!props.loading && !props.error && props.query.trim() && !props.results.length && (
                <p className="py-16 text-center text-sm text-white/45">Nenhum exercício encontrado.</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
