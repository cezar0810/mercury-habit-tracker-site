export type Habit = {
  id: string;
  title: string;
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
};

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
