import { recognizeHabit, type HabitLink } from "./habit-recognition";

export type Habit = {
  id: string;
  title: string;
  emoji: string;
  source?: "workout";
  sourceId?: string;
  link?: HabitLink;
  linkMode?: "auto" | "manual";
  emojiMode?: "auto" | "custom";
  createdOn?: string;
  archivedOn?: string;
  scheduleHistory?: Array<{ from: string; weekdays: number[] }>;
  linkHistory?: Array<{ from: string; link: HabitLink }>;
};

export type WaterEntry = {
  id: string;
  amountMl: number;
  recordedAt: string;
};

export type PlannerPeriod = "Prioridades" | "Manhã" | "Tarde" | "Noite";

export type PlannerTask = {
  id: string;
  title: string;
  date: string;
  period: PlannerPeriod;
  completed: boolean;
};

export type MercuryData = {
  workoutCaloriesByCompletion?: Record<string, Record<string, number>>;
  workoutDone?: Record<string, Record<string, boolean>>;
  stepsByDay: Record<string, number>;
  schemaVersion: 2;
  trackingSince: string;
  name: string;
  goal: string;
  gender: string;
  characterClass: string;
  habits: Habit[];
  completions: Record<string, Record<string, boolean>>;
  plannerTasks: PlannerTask[];
  focusMinutesByDay: Record<string, number>;
  waterGoalMl: number;
  waterEntriesByDay: Record<string, WaterEntry[]>;
  waterGoalHistory: Array<{ from: string; goalMl: number }>;
  workoutCompletionsByDay: Record<string, string[]>;
  workoutCaloriesByDay: Record<string, number>;
  weightKg: number | null;
  heightCm: number | null;
  physicalProfilePrompted: boolean;
  waterGoalCustomized: boolean;
};

export const plannerPeriods: PlannerPeriod[] = [
  "Prioridades",
  "Manhã",
  "Tarde",
  "Noite",
];

export const blankMercuryData: MercuryData = {
  stepsByDay: {},
  schemaVersion: 2,
  trackingSince: "",
  name: "",
  goal: "",
  gender: "",
  characterClass: "",
  habits: [],
  completions: {},
  plannerTasks: [],
  focusMinutesByDay: {},
  waterGoalMl: 2000,
  waterEntriesByDay: {},
  waterGoalHistory: [],
  workoutCompletionsByDay: {},
  workoutCaloriesByDay: {},
  weightKg: null,
  heightCm: null,
  physicalProfilePrompted: false,
  waterGoalCustomized: false,
};

export function habitEmoji(title: string) {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
  if (/trein|academia|muscul|exerc/.test(normalized)) return "🏋️";
  if (/agua|hidrata/.test(normalized)) return "💧";
  if (/ler|leitura|livro/.test(normalized)) return "📚";
  if (/estud|curso|aula/.test(normalized)) return "🎓";
  if (/medit|respira/.test(normalized)) return "🧘";
  if (/dorm|sono|acord/.test(normalized)) return "😴";
  if (/pedal|biciclet/.test(normalized)) return "🚴";
  if (/corr|caminh/.test(normalized)) return "🏃";
  if (/remedio|medica|vitamina/.test(normalized)) return "💊";
  if (/aliment|comer|dieta|fruta/.test(normalized)) return "🥗";
  return "✅";
}

function cleanText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function cleanRecord(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export function cleanMercuryData(value: unknown): MercuryData {
  const saved = cleanRecord(value);
  const today = dateKey(new Date());
  const validDay = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const trackingSince = validDay(saved.trackingSince) ? String(saved.trackingSince) : today;
  const habits = Array.isArray(saved.habits)
    ? saved.habits.flatMap((item) => {
        const habit = cleanRecord(item);
        const id = cleanText(habit.id, 100);
        const title = cleanText(habit.title, 45);
        if (!id || !title) return [];
        const source = habit.source === "workout" ? "workout" as const : undefined;
        const sourceId = source ? cleanText(habit.sourceId, 100) : undefined;
        const link = ["none", "water", "workout"].includes(String(habit.link))
          ? habit.link as HabitLink : source ? "workout" : recognizeHabit(title);
        const scheduleHistory = Array.isArray(habit.scheduleHistory) ? habit.scheduleHistory.flatMap(item => {
          const revision = cleanRecord(item);
          if (!validDay(revision.from) || !Array.isArray(revision.weekdays)) return [];
          return [{ from: String(revision.from), weekdays: [...new Set(revision.weekdays.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6))] }];
        }).sort((a, b) => a.from.localeCompare(b.from)) : [];
        return [{
          ...habit,
          id,
          title,
          emoji: cleanText(habit.emoji, 32) || habitEmoji(title),
          link,
          linkHistory: Array.isArray(habit.linkHistory) ? habit.linkHistory.flatMap(item => {
            const revision = cleanRecord(item);
            return validDay(revision.from) && ["none", "water", "workout"].includes(String(revision.link)) ? [{ from: String(revision.from), link: revision.link as HabitLink }] : [];
          }).sort((a,b) => a.from.localeCompare(b.from)) : [{ from: trackingSince, link }],
          linkMode: habit.linkMode === "manual" ? "manual" as const : "auto" as const,
          emojiMode: habit.emojiMode === "custom" ? "custom" as const : "auto" as const,
          createdOn: validDay(habit.createdOn) ? String(habit.createdOn) : trackingSince,
          ...(validDay(habit.archivedOn) ? { archivedOn: String(habit.archivedOn) } : {}),
          scheduleHistory: scheduleHistory.length ? scheduleHistory : [{ from: trackingSince, weekdays: source ? [] : [0, 1, 2, 3, 4, 5, 6] }],
          ...(source && sourceId ? { source, sourceId } : {}),
        }];
      })
    : [];

  const completions: MercuryData["completions"] = {};
  Object.entries(cleanRecord(saved.completions)).forEach(([day, rawValues]) => {
    const values: Record<string, boolean> = {};
    Object.entries(cleanRecord(rawValues)).forEach(([habitId, completed]) => {
      if (typeof completed === "boolean") values[habitId] = completed;
    });
    completions[day] = values;
  });

  const focusMinutesByDay: Record<string, number> = {};
  Object.entries(cleanRecord(saved.focusMinutesByDay)).forEach(([day, minutes]) => {
    const amount = Number(minutes);
    if (Number.isFinite(amount) && amount >= 0) focusMinutesByDay[day] = amount;
  });

  const waterEntriesByDay: Record<string, WaterEntry[]> = {};
  Object.entries(cleanRecord(saved.waterEntriesByDay)).forEach(([day, rawEntries]) => {
    if (!Array.isArray(rawEntries)) return;
    waterEntriesByDay[day] = rawEntries.slice(0, 100).flatMap((item, index) => {
      const entry = cleanRecord(item);
      const amount = Number(entry.amountMl);
      if (!Number.isFinite(amount) || amount <= 0) return [];
      return [{
        id: cleanText(entry.id, 100) || `agua-${day}-${index}`,
        amountMl: Math.min(5000, Math.max(1, Math.round(amount))),
        recordedAt: cleanText(entry.recordedAt, 40) || new Date().toISOString(),
      }];
    });
  });

  const waterGoal = Number(saved.waterGoalMl);
  const sanitizedGoal = Number.isFinite(waterGoal) ? Math.min(10000, Math.max(250, Math.round(waterGoal))) : 2000;
  const waterGoalHistory = Array.isArray(saved.waterGoalHistory) ? saved.waterGoalHistory.flatMap(item => {
    const revision = cleanRecord(item);
    return validDay(revision.from) && Number.isFinite(Number(revision.goalMl))
      ? [{ from: String(revision.from), goalMl: Math.min(10000, Math.max(250, Math.round(Number(revision.goalMl)))) }] : [];
  }).sort((a, b) => a.from.localeCompare(b.from)) : [];
  const workoutCompletionsByDay: Record<string, string[]> = {};
  Object.entries(cleanRecord(saved.workoutCompletionsByDay)).forEach(([day, ids]) => {
    if (validDay(day) && Array.isArray(ids)) workoutCompletionsByDay[day] = [...new Set(ids.filter((id): id is string => typeof id === "string" && id.length < 101))];
  });
  // Preserve completed workouts from the earlier storage format.
  habits.filter(habit => habit.source === "workout").forEach(habit => {
    Object.entries(completions).forEach(([day, values]) => {
      if (values[habit.id] && habit.sourceId) workoutCompletionsByDay[day] = [...new Set([...(workoutCompletionsByDay[day] || []), habit.sourceId])];
    });
  });
  const workoutCaloriesByDay: Record<string, number> = {};
  Object.entries(cleanRecord(saved.workoutCaloriesByDay)).forEach(([day, calories]) => {
    const amount = Number(calories);
    if (validDay(day) && Number.isFinite(amount) && amount >= 0) {
      workoutCaloriesByDay[day] = Math.min(10000, Math.round(amount));
    }
  });
  const weight = Number(saved.weightKg);
  const height = Number(saved.heightCm);
  return {
    ...saved,
    stepsByDay: Object.fromEntries(Object.entries(cleanRecord(saved.stepsByDay)).filter(([day, n]) => validDay(day) && typeof n === "number" && Number.isFinite(n) && n >= 0)) as Record<string, number>,
    schemaVersion: 2,
    trackingSince,
    name: cleanText(saved.name, 28),
    goal: cleanText(saved.goal, 60),
    gender: ({Masculino:"male",Feminino:"female","Prefiro não informar":"other"} as Record<string,string>)[String(saved.gender)] || cleanText(saved.gender,40),
    characterClass: ({Mago:"mage",Guerreiro:"knight",Curandeiro:"cleric",Arqueiro:"ranger"} as Record<string,string>)[String(saved.characterClass)] || cleanText(saved.characterClass,40),
    habits,
    completions,
    plannerTasks: Array.isArray(saved.plannerTasks) ? saved.plannerTasks as PlannerTask[] : [],
    focusMinutesByDay,
    waterGoalMl: sanitizedGoal,
    waterGoalHistory: waterGoalHistory.length ? waterGoalHistory : [{ from: trackingSince, goalMl: sanitizedGoal }],
    waterEntriesByDay,
    workoutCompletionsByDay,
    workoutCaloriesByDay,
    weightKg: Number.isFinite(weight) && weight >= 25 && weight <= 350 ? Math.round(weight * 10) / 10 : null,
    heightCm: Number.isFinite(height) && height >= 100 && height <= 250 ? Math.round(height) : null,
    physicalProfilePrompted: saved.physicalProfilePrompted === true,
    waterGoalCustomized: saved.waterGoalCustomized === true,
  };
}

export function waterTotalForDay(
  data: Pick<MercuryData, "waterEntriesByDay">,
  day: string,
) {
  return (data.waterEntriesByDay[day] || []).reduce(
    (total, entry) => total + entry.amountMl,
    0,
  );
}

export function profileIsComplete(data: MercuryData) {
  return Boolean(
    data.name.trim() &&
      data.goal.trim() &&
      data.gender.trim() &&
      data.characterClass.trim(),
  );
}

export function createId(prefix: string) {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

export function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function shiftDate(key: string, amount: number) {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}

export function daysForMonth(month: Date) {
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: total }, (_, index) =>
    new Date(month.getFullYear(), month.getMonth(), index + 1),
  );
}

export function monthLabel(month: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  })
    .format(month)
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function shortDateLabel(key: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(dateFromKey(key))
    .replace(".", "");
}

export function weekdayLabel(key: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(dateFromKey(key))
    .replace(".", "")
    .slice(0, 3);
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function workoutCaloriesTotal(data: MercuryData, day: string) {
  return (data.workoutCaloriesByDay[day] || 0) + Object.values(data.workoutCaloriesByCompletion?.[day] || {}).reduce((sum, value) => sum + value, 0);
}
