// Wire contract v1: arrays of entities use stable IDs, never array offsets.
export type Flat = Record<string, unknown>;
export type Change = { key: string; mode: "set" | "remove" | "increment" | "max"; value?: unknown };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export function flatten(value: unknown, path: string[] = [], result: Flat = {}): Flat {
  if (Array.isArray(value) && !value.length && (["habits", "plannerTasks", "workoutPlans", "exercises"].includes(path.at(-1) || "") || path[0] === "waterEntriesByDay")) return result;
  if (Array.isArray(value) && value.length && value.every(v => object(v) && typeof v.id === "string")) {
    value.forEach((v, order) => flatten({ ...v, _order: order }, [...path, "@", v.id as string], result));
  } else if (object(value)) {
    for (const [key, item] of Object.entries(value)) if (item !== undefined) flatten(item, [...path, key], result);
  } else if (value !== undefined) result[JSON.stringify(path)] = value;
  return result;
}
export function expand(flat: Flat): Record<string, any> {
  const root: Record<string, any> = Object.create(null);
  for (const [key, value] of Object.entries(flat)) {
    const path = JSON.parse(key) as string[];
    if (!path.length || path.some(p => ["__proto__", "constructor", "prototype"].includes(p))) continue;
    let node = root;
    path.forEach((p, index) => {
      if (index === path.length - 1) node[p] = value;
      else { if (!object(node[p])) node[p] = Object.create(null); node = node[p]; }
    });
  }
  const restore = (v: any): any => {
    if (!object(v)) return v;
    if (v["@"]) return Object.values(v["@"]).filter((x: any) => x.id)
      .sort((a: any, b: any) => (a._order ?? 0) - (b._order ?? 0) || a.id.localeCompare(b.id))
      .map((x: any) => { const { _order, ...rest } = x; return restore(rest); });
    return Object.fromEntries(Object.entries(v).map(([k, item]) => [k, restore(item)]));
  };
  const restored = restore(root);
  // Stable completion keys are authoritative; a concurrently edited legacy array is not.
  for (const [day, done] of Object.entries(restored.workoutDone || {})) {
    restored.workoutCompletionsByDay ||= {};
    restored.workoutCompletionsByDay[day] = Object.entries(done as Record<string, unknown>).filter(([, value]) => value === true).map(([id]) => id).sort();
  }
  return restored;
}
export function changes(before: Flat, after: Flat): Change[] {
  const result: Change[] = [];
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const a = before[key], b = after[key];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    const path = JSON.parse(key) as string[];
    if (!(key in after)) result.push({ key, mode: "remove" });
    else if (["focusMinutesByDay", "workoutCaloriesByDay"].includes(path[0]) && typeof b === "number")
      result.push({ key, mode: "increment", value: b - (typeof a === "number" ? a : 0) });
    else result.push({ key, mode: path[0] === "stepsByDay" ? "max" : "set", value: b });
  }
  return result;
}
export function applyChanges(base: Flat, operations: Change[]): Flat {
  const next = { ...base };
  for (const op of operations) {
    if (op.mode === "remove") delete next[op.key];
    else if (op.mode === "increment") next[op.key] = Math.max(0, Number(next[op.key] || 0) + Number(op.value));
    else if (op.mode === "max") next[op.key] = Math.max(Number(next[op.key] || 0), Number(op.value));
    else next[op.key] = op.value;
  }
  return next;
}
