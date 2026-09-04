export const MAX_WORKOUTS = 5;

export const EXERCISE_DATA_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

const EXERCISE_IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

export type CatalogExercise = {
  id: string;
  name: string;
  level: string;
  equipment: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
};

export type WorkoutExercise = CatalogExercise & {
  sets: number;
  reps: number;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function textList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function count(value: unknown, fallback: number, maximum: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(maximum, Math.max(1, Math.round(numeric)));
}

export function exerciseImageUrl(path: string) {
  return EXERCISE_IMAGE_BASE + path.split("/").map(encodeURIComponent).join("/");
}

export function normalizeCatalog(value: unknown): CatalogExercise[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const source = item as Record<string, unknown>;
    const id = text(source.id);
    const name = text(source.name);
    if (!id || !name) return [];
    return [{
      id,
      name,
      level: text(source.level, "não informado"),
      equipment: text(source.equipment, "não informado"),
      category: text(source.category, "exercício"),
      primaryMuscles: textList(source.primaryMuscles),
      secondaryMuscles: textList(source.secondaryMuscles),
      instructions: textList(source.instructions),
      images: textList(source.images),
    }];
  });
}

export function cleanWorkoutPlans(value: unknown): WorkoutPlan[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_WORKOUTS).flatMap((item, planIndex) => {
    if (!item || typeof item !== "object") return [];
    const source = item as Record<string, unknown>;
    const name = text(source.name).slice(0, 36);
    if (!name) return [];
    const rawExercises = Array.isArray(source.exercises) ? source.exercises : [];
    const exercises = rawExercises.flatMap((exercise, exerciseIndex) => {
      if (!exercise || typeof exercise !== "object") return [];
      const data = exercise as Record<string, unknown>;
      const id = text(data.id);
      const exerciseName = text(data.name);
      if (!id || !exerciseName) return [];
      return [{
        id,
        name: exerciseName,
        level: text(data.level, "não informado"),
        equipment: text(data.equipment, "não informado"),
        category: text(data.category, "exercício"),
        primaryMuscles: textList(data.primaryMuscles),
        secondaryMuscles: textList(data.secondaryMuscles),
        instructions: textList(data.instructions),
        images: textList(data.images),
        sets: count(data.sets, 3, 20),
        reps: count(data.reps, 10, 100),
      }];
    });
    return [{
      id: text(source.id, `treino-${planIndex + 1}`),
      name,
      exercises,
    }];
  });
}

function searchable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

export function searchCatalog(
  catalog: CatalogExercise[],
  query: string,
  limit = 30,
) {
  const term = searchable(query.trim());
  if (!term) return catalog.slice(0, limit);
  return catalog
    .map((exercise) => {
      const name = searchable(exercise.name);
      const extra = searchable([
        exercise.equipment,
        exercise.category,
        ...exercise.primaryMuscles,
        ...exercise.secondaryMuscles,
      ].join(" "));
      const score = name.startsWith(term) ? 3 : name.includes(term) ? 2 : extra.includes(term) ? 1 : 0;
      return { exercise, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name))
    .slice(0, limit)
    .map((item) => item.exercise);
}
