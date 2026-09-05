import type { WorkoutExercise } from "./workouts-data";

const WALKING_MET = 3.5;
const RESISTANCE_TRAINING_MET = 3.5;

function finite(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function recommendedWaterMl(weightKg: number) {
  const estimate = finite(weightKg) * 35;
  return Math.round(Math.min(5000, Math.max(1200, estimate)) / 50) * 50;
}

export function metCalories(met: number, weightKg: number, minutes: number) {
  return Math.max(0, Math.round((finite(met) * 3.5 * finite(weightKg) / 200) * finite(minutes)));
}

export function estimatedStepCadence(heightCm: number) {
  return Math.min(115, Math.max(90, 100 + (175 - finite(heightCm, 175)) * 0.5));
}

export function estimatedStepCalories(steps: number, weightKg: number, heightCm: number) {
  const minutes = Math.max(0, finite(steps)) / estimatedStepCadence(heightCm);
  return metCalories(WALKING_MET, weightKg, minutes);
}

export function estimatedWorkoutMinutes(exercises: Pick<WorkoutExercise, "sets" | "reps">[]) {
  const minutes = exercises.reduce((total, exercise) => {
    const sets = Math.min(20, Math.max(1, finite(exercise.sets, 1)));
    const reps = Math.min(100, Math.max(1, finite(exercise.reps, 1)));
    const activeSeconds = sets * reps * 3;
    const restSeconds = Math.max(0, sets - 1) * 60;
    return total + Math.max(2, (activeSeconds + restSeconds) / 60);
  }, 0);
  return Math.max(1, Math.round(minutes));
}

export function estimatedWorkoutCalories(weightKg: number, exercises: Pick<WorkoutExercise, "sets" | "reps">[]) {
  return metCalories(RESISTANCE_TRAINING_MET, weightKg, estimatedWorkoutMinutes(exercises));
}
