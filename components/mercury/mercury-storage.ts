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
    return cleanMercuryData(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...blankMercuryData };
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

function workoutHabit(workout: WorkoutIdentity): Habit {
  return {
    id: workoutHabitId(workout.id),
    title: workoutHabitTitle(workout.name),
    emoji: "🏋️",
    source: "workout",
    sourceId: workout.id,
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
  const syncedHabits = workouts.map(workoutHabit);
  const completions: MercuryData["completions"] = {};
  Object.entries(data.completions).forEach(([day, values]) => {
    completions[day] = Object.fromEntries(
      Object.entries(values).filter(([habitId]) => !removedHabitIds.has(habitId)),
    );
  });
  return { ...data, habits: [...manualHabits, ...syncedHabits], completions };
}

export function withCompletedWorkout(
  data: MercuryData,
  workout: WorkoutIdentity,
  day = dateKey(new Date()),
) {
  const habit = workoutHabit(workout);
  const habits = data.habits.some((item) => item.id === habit.id)
    ? data.habits.map((item) => item.id === habit.id ? habit : item)
    : [...data.habits, habit];
  return {
    ...data,
    habits,
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
