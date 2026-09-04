export type Habit = {
  id: string;
  title: string;
  emoji: string;
  source?: "workout";
  sourceId?: string;
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
};

export const plannerPeriods: PlannerPeriod[] = [
  "Prioridades",
  "Manhã",
  "Tarde",
  "Noite",
];

export const blankMercuryData: MercuryData = {
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
  const habits = Array.isArray(saved.habits)
    ? saved.habits.slice(0, 20).flatMap((item) => {
        const habit = cleanRecord(item);
        const id = cleanText(habit.id, 100);
        const title = cleanText(habit.title, 45);
        if (!id || !title) return [];
        const source = habit.source === "workout" ? "workout" as const : undefined;
        const sourceId = source ? cleanText(habit.sourceId, 100) : undefined;
        return [{
          id,
          title,
          emoji: cleanText(habit.emoji, 8) || habitEmoji(title),
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
        amountMl: Math.min(2000, Math.max(10, Math.round(amount))),
        recordedAt: cleanText(entry.recordedAt, 40) || new Date().toISOString(),
      }];
    });
  });

  const waterGoal = Number(saved.waterGoalMl);
  return {
    name: cleanText(saved.name, 28),
    goal: cleanText(saved.goal, 60),
    gender: cleanText(saved.gender, 40),
    characterClass: cleanText(saved.characterClass, 40),
    habits,
    completions,
    plannerTasks: Array.isArray(saved.plannerTasks) ? saved.plannerTasks as PlannerTask[] : [],
    focusMinutesByDay,
    waterGoalMl: Number.isFinite(waterGoal)
      ? Math.min(6000, Math.max(500, Math.round(waterGoal)))
      : 2000,
    waterEntriesByDay,
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
