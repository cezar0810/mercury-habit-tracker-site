import { dateFromKey, dateKey, shiftDate, waterTotalForDay, type Habit, type MercuryData } from "./state";
import { recognizeHabit } from "./habit-recognition";

export const allWeekdays = [0, 1, 2, 3, 4, 5, 6];
export const weekdayChoices = [{ day: 1, label: "Seg" }, { day: 2, label: "Ter" }, { day: 3, label: "Qua" }, { day: 4, label: "Qui" }, { day: 5, label: "Sex" }, { day: 6, label: "Sáb" }, { day: 0, label: "Dom" }];
export function habitLink(habit: Habit, day?: string) {
  return habit.source === "workout" ? "workout" : (day ? habit.linkHistory?.filter(item => item.from <= day).at(-1)?.link : undefined) ?? habit.link ?? recognizeHabit(habit.title);
}
export function activeHabits(data: Pick<MercuryData, "habits">, day = dateKey(new Date())) {
  return data.habits.filter(habit => !habit.archivedOn || habit.archivedOn > day);
}
export function weekdaysForHabit(habit: Habit, day: string) {
  const revision = habit.scheduleHistory?.filter(item => item.from <= day).at(-1);
  return revision?.weekdays ?? (habit.source === "workout" ? [] : allWeekdays);
}
export function habitIsScheduled(habit: Habit, day: string) {
  return (!habit.createdOn || habit.createdOn <= day) && (!habit.archivedOn || habit.archivedOn > day) && weekdaysForHabit(habit, day).includes(dateFromKey(day).getDay());
}
export function waterGoalForDay(data: MercuryData, day: string) {
  return data.waterGoalHistory.filter(item => item.from <= day).at(-1)?.goalMl ?? data.waterGoalMl;
}
export function habitIsComplete(data: MercuryData, habit: Habit, day: string) {
  const manual = data.completions[day]?.[habit.id];
  if (habitLink(habit,day) === "water" && day >= data.trackingSince) return waterTotalForDay(data, day) >= waterGoalForDay(data, day);
  if (habitLink(habit,day) === "workout") {
    const completed = data.workoutCompletionsByDay[day] || [];
    return (habit.sourceId ? completed.includes(habit.sourceId) : completed.length > 0) || manual === true;
  }
  return manual === true;
}
export function setHabitLink(habit: Habit, link: NonNullable<Habit["link"]>, from: string): Habit {
  return { ...habit, link, linkHistory: [...(habit.linkHistory || []).filter(item => item.from !== from), { from, link }].sort((a,b) => a.from.localeCompare(b.from)) };
}
export function scheduleHabit(habit: Habit, weekdays: number[], from: string): Habit {
  return { ...habit, scheduleHistory: [...(habit.scheduleHistory || []).filter(item => item.from !== from), { from, weekdays: [...new Set(weekdays)].filter(day => allWeekdays.includes(day)) }].sort((a,b) => a.from.localeCompare(b.from)) };
}
export function setWaterGoal(data: MercuryData, goalMl: number, from = dateKey(new Date())): MercuryData {
  return { ...data, waterGoalMl: goalMl, waterGoalHistory: [...data.waterGoalHistory.filter(item => item.from !== from), { from, goalMl }].sort((a,b) => a.from.localeCompare(b.from)) };
}
export function addWater(data: MercuryData, amountMl: number, now = new Date()): MercuryData {
  const day = dateKey(now);
  return { ...data, waterEntriesByDay: { ...data.waterEntriesByDay, [day]: [...(data.waterEntriesByDay[day] || []), { id: `water-${now.getTime()}-${Math.random().toString(36).slice(2,7)}`, amountMl, recordedAt: now.toISOString() }] } };
}
export function dayPlan(data: MercuryData, day: string) {
  const habits = data.habits.filter(habit => habitIsScheduled(habit, day));
  const workoutPlans = habits.filter(habit => habitLink(habit,day) === "workout" && habit.sourceId);
  const seen = new Set<string>();
  const items = habits.flatMap(habit => {
    const link = habitLink(habit,day);
    // A generic gym habit and the scheduled training represent the same action.
    if (link === "workout" && !habit.sourceId && workoutPlans.length) return [];
    const identity = link === "none" ? habit.id : link === "water" ? "water" : `workout:${habit.sourceId || "any"}`;
    if (seen.has(identity)) return [];
    seen.add(identity);
    return [{ id: habit.id, title: habit.title, emoji: habit.emoji, kind: link === "workout" ? "workout" as const : "habit" as const, link, done: habitIsComplete(data, habit, day), habit, task: undefined }];
  });
  const tasks = data.plannerTasks.filter(task => task.date === day).map(task => ({ id: task.id, title: task.title, emoji: "📝", kind: "task" as const, link: "none" as const, done: task.completed, habit: undefined, task }));
  return [...tasks.sort((a,b) => Number(b.task.period === "Prioridades") - Number(a.task.period === "Prioridades")), ...items];
}
export function weekDays(day = dateKey(new Date())) {
  const monday = shiftDate(day, -((dateFromKey(day).getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => shiftDate(monday, index));
}
export function weekReport(data: MercuryData, anchor: string, today = dateKey(new Date())) {
  const days = weekDays(anchor);
  const availableDays = days.filter(day => day <= today && day >= data.trackingSince);
  const rows = days.map(day => {
    const plan = dayPlan(data, day);
    const available = availableDays.includes(day);
    const done = plan.filter(item => item.done).length;
    return { day, plan, done, available, rate: available && plan.length ? Math.round(done / plan.length * 100) : null };
  });
  const items = rows.filter(row => row.available).flatMap(row => row.plan);
  const waterDays = availableDays.filter(day => (data.waterEntriesByDay[day] || []).length > 0);
  return {
    days, rows, availableDays,
    planned: items.length, done: items.filter(item => item.done).length,
    groups: ["habit", "task", "workout"].map(kind => ({ kind, total: items.filter(item => item.kind === kind).length, done: items.filter(item => item.kind === kind && item.done).length })),
    waterAverage: waterDays.length ? Math.round(waterDays.reduce((total,day) => total + waterTotalForDay(data,day),0) / waterDays.length) : null,
    waterRecordedDays: waterDays.length,
    waterGoalDays: waterDays.filter(day => waterTotalForDay(data,day) >= waterGoalForDay(data,day)).length,
    focusMinutes: availableDays.reduce((total,day) => total + (data.focusMinutesByDay[day] || 0),0),
    workoutsDone: availableDays.reduce((total,day) => total + (data.workoutCompletionsByDay[day] || []).length,0),
  };
}
