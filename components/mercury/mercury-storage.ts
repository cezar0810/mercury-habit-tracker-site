import {
  blankMercuryData,
  cleanMercuryData,
  dateKey,
  type Habit,
  type MercuryData,
} from "./state";

export const MERCURY_STORAGE_KEY = "mercury-habit-tracker-web-v1";
export const WORKOUTS_STORAGE_KEY = "mercury-workouts-v1";

type WorkoutIdentity = {
  id: string;
  name: string;
};

export function readMercuryData() {
  if (typeof window === "undefined") return { ...blankMercuryData };
  try {
    const raw = window.localStorage.getItem(MERCURY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (raw && parsed?.schemaVersion !== 2) {
      const backupKey = "mercury-backup-before-routine-v2";
      try { if (!window.localStorage.getItem(backupKey)) window.localStorage.setItem(backupKey, raw); } catch { /* Read still works when backup storage is full. */ }
    }
    return cleanMercuryData(parsed);
  } catch {
    return cleanMercuryData(null);
  }
}

export function writeMercuryData(data: MercuryData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MERCURY_STORAGE_KEY, JSON.stringify(data));
}

function workoutHabitTitle(name: string) {
  const cleanName = name.trim();
  return /^treino\b/i.test(cleanName)
    ? cleanName.slice(0, 45)
    : `Treino: ${cleanName}`.slice(0, 45);
}

export function workoutHabitId(workoutId: string) {
  return `workout-habit-${workoutId}`;
}

function workoutHabit(workout: WorkoutIdentity, previous?: Habit, day = dateKey(new Date())): Habit {
  return {
    ...previous,
    id: workoutHabitId(workout.id),
    title: workoutHabitTitle(workout.name),
    emoji: previous?.emojiMode === "custom" ? previous.emoji : "🏋️",
    source: "workout",
    sourceId: workout.id,
    link: "workout",
    createdOn: previous?.createdOn || day,
    archivedOn: undefined,
    scheduleHistory: previous?.scheduleHistory || [{ from: day, weekdays: [] }],
  };
}

export function withSyncedWorkouts(
  data: MercuryData,
  workouts: WorkoutIdentity[],
) {
  const identities = new Map(workouts.map((workout) => [workout.id, workout]));
  const removedHabitIds = new Set(
    data.habits
      .filter((habit) => habit.source === "workout" && (!habit.sourceId || !identities.has(habit.sourceId)))
      .map((habit) => habit.id),
  );
  const manualHabits = data.habits.filter((habit) => habit.source !== "workout");
  const syncedHabits = workouts.map(workout => workoutHabit(workout, data.habits.find(habit => habit.sourceId === workout.id)));
  const archived = data.habits.filter(habit => removedHabitIds.has(habit.id)).map(habit => ({ ...habit, archivedOn: habit.archivedOn || dateKey(new Date()) }));
  return { ...data, habits: [...manualHabits, ...syncedHabits, ...archived] };
}

export function withCompletedWorkout(
  data: MercuryData,
  workout: WorkoutIdentity,
  day = dateKey(new Date()),
) {
  const habit = workoutHabit(workout, data.habits.find(item => item.sourceId === workout.id), day);
  const habits = data.habits.some((item) => item.id === habit.id)
    ? data.habits.map((item) => item.id === habit.id ? habit : item)
    : [...data.habits, habit];
  return {
    ...data,
    habits,
    workoutCompletionsByDay: {
      ...data.workoutCompletionsByDay,
      [day]: [...new Set([...(data.workoutCompletionsByDay[day] || []), workout.id])],
    },
    completions: {
      ...data.completions,
      [day]: { ...(data.completions[day] || {}), [habit.id]: true },
    },
  };
}

export function syncWorkoutPlans(workouts: WorkoutIdentity[]) {
  const next = withSyncedWorkouts(readMercuryData(), workouts);
  writeMercuryData(next);
}

export function syncCompletedWorkout(workout: WorkoutIdentity) {
  const next = withCompletedWorkout(readMercuryData(), workout);
  writeMercuryData(next);
}
