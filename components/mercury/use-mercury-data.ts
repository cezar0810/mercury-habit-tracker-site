"use client";
import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { blankMercuryData, type MercuryData } from "./state";
import { readMercuryData, writeMercuryData, WORKOUTS_STORAGE_KEY } from "./mercury-storage";
import { cleanWorkoutPlans, type WorkoutPlan } from "./workouts-data";
import { applyChanges, changes, flatten, expand } from "@/lib/sync-protocol";

export function useMercuryData() {
  const [data, update] = useState<MercuryData>({ ...blankMercuryData });
  const [hydrated, ready] = useState(false);
  useEffect(() => {
    const refresh = () => { update(readMercuryData()); ready(true); };
    refresh();
    for (const event of ["storage", "pageshow", "mercury-remote-change", "mercury-local-change"]) window.addEventListener(event, refresh);
    return () => { for (const event of ["storage", "pageshow", "mercury-remote-change", "mercury-local-change"]) window.removeEventListener(event, refresh); };
  }, []);
  const setData = useCallback((action: SetStateAction<MercuryData>) => {
    const current = readMercuryData();
    // Non-functional callers may hold an older render; apply only their actual edits.
    const next = typeof action === "function" ? action(current) : expand(applyChanges(flatten(current), changes(flatten(data), flatten(action)))) as MercuryData;
    writeMercuryData(next);
    update(next);
  }, [data]);
  return [data, setData, hydrated] as const;
}
export function useWorkouts() {
  const read = () => cleanWorkoutPlans(JSON.parse(localStorage.getItem(WORKOUTS_STORAGE_KEY) || "[]"));
  const [data, update] = useState<WorkoutPlan[]>([]);
  useEffect(() => {
    const refresh = () => update(read());
    refresh();
    for (const e of ["storage", "mercury-remote-change", "mercury-local-change"]) window.addEventListener(e, refresh);
    return () => { for (const e of ["storage", "mercury-remote-change", "mercury-local-change"]) window.removeEventListener(e, refresh); };
  }, []);
  const setData = useCallback((action: SetStateAction<WorkoutPlan[]>) => {
    const current = read();
    const next = typeof action === "function" ? action(current) : expand(applyChanges(flatten({ workoutPlans: current }), changes(flatten({ workoutPlans: data }), flatten({ workoutPlans: action })))).workoutPlans || [];
    localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("mercury-local-change", { detail: changes(flatten({workoutPlans:current}), flatten({workoutPlans:next})) }));
    update(next);
  }, [data]);
  return [data, setData] as const;
}
