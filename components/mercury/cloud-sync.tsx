"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase-client";
import { applyChanges, changes, expand, flatten, type Change, type Flat } from "@/lib/sync-protocol";
import { MERCURY_STORAGE_KEY, WORKOUTS_STORAGE_KEY } from "./mercury-storage";

export const LOCAL_CHANGE = "mercury-local-change";
export const REMOTE_CHANGE = "mercury-remote-change";
const CACHE = "mercury-cloud-v1:";
type Pending = { sequence: number; operations: Change[]; journal?: string };
type Cache = { device: string; sequence: number; shadow: Flat; pending: Pending[] };
function localDocument() {
  return { ...JSON.parse(localStorage.getItem(MERCURY_STORAGE_KEY) || "{}"), workoutPlans: JSON.parse(localStorage.getItem(WORKOUTS_STORAGE_KEY) || "[]") };
}
function render(flat: Flat) {
  const { workoutPlans = [], ...data } = expand(flat);
  localStorage.setItem(MERCURY_STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(workoutPlans));
  window.dispatchEvent(new Event(REMOTE_CHANGE));
}

// One owner per browser profile (Web Lock); pending requests are durable and replayable.
export function CloudSync({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const supabase = getSupabase();
    setAvailable(!!supabase);
    if (!supabase) { setStatus("Sincronização ainda não configurada"); return; }
    if (!navigator.locks) { setStatus("Este navegador não oferece sincronização segura entre abas. Use um navegador atualizado."); return; }
    let stop = () => {};
    let generation = 0;
    let owner: string | null | undefined;
    const switchAccount = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user.id || null;
      if (user === owner) return;
      owner = user;
      const epoch = ++generation;
      stop();
      setSignedIn(!!user);
      const previous = localStorage.getItem(CACHE + "owner");
      if (!user) {
        if (previous) { localStorage.removeItem(CACHE + "owner"); render({}); }
        setStatus("Dados neste dispositivo");
        return;
      }
      const claimed = localStorage.getItem(CACHE + "guest-owner");
      if (!previous && !claimed) {
        localStorage.setItem(CACHE + "guest", JSON.stringify(flatten(localDocument())));
        localStorage.setItem(CACHE + "guest-owner", user);
      }
      const guest = localStorage.getItem(CACHE + "guest-owner") === user ? JSON.parse(localStorage.getItem(CACHE + "guest") || "{}") : {};
      localStorage.setItem(CACHE + "owner", user);
      let cache: Cache;
      try { cache = JSON.parse(localStorage.getItem(CACHE + user) || "null"); } catch { cache = null as any; }
      cache ||= { device: crypto.randomUUID(), sequence: 0, shadow: {}, pending: [] };
      let baseline = cache.pending.reduce((doc, p) => applyChanges(doc, p.operations), cache.shadow);
      render(baseline);
      const lock = <T,>(fn: () => Promise<T>) => navigator.locks.request(CACHE + user, fn);
      const reload = () => { const raw = localStorage.getItem(CACHE + user); if (raw) cache = JSON.parse(raw); };
      const save = () => localStorage.setItem(CACHE + user, JSON.stringify(cache));
      let alive = true;
      let busy = false;
      let initialized = false;
      let revision = -1;
      const capture = (event: Event) => {
        if (!alive) return;
        const operations = (event as CustomEvent<Change[]>).detail;
        if (!operations?.length) return;
        // Journal before awaiting the browser-wide lock: survives reload/offline.
        const journal = `${CACHE}${user}:journal:${crypto.randomUUID()}`;
        localStorage.setItem(journal, JSON.stringify(operations));
        void lock(async () => {
          if (!alive) return;
          reload();
          drainJournals();
          save();
        }).then(() => flush());
      };
      const drainJournals = () => {
        const journals = Object.keys(localStorage).filter(k => k.startsWith(`${CACHE}${user}:journal:`)).sort();
        for (const journal of journals) {
          if (!cache.pending.some(p => p.journal === journal)) cache.pending.push({ sequence: ++cache.sequence, operations: JSON.parse(localStorage.getItem(journal) || "[]"), journal });
          save();
          localStorage.removeItem(journal);
        }
      };
      const accept = (row: any) => {
        if (!alive || epoch !== generation || row.revision < revision) return;
        drainJournals();
        revision = row.revision;
        cache.shadow = row.document || {};
        baseline = cache.pending.reduce((doc, p) => applyChanges(doc, p.operations), cache.shadow);
        save(); render(baseline);
      };
      const flush = async () => {
        if (!alive || busy || !initialized) return;
        busy = true;
        await lock(async () => {
        if (!alive) { busy = false; return; }
        reload(); drainJournals();
        try {
          setStatus("Sincronizando…");
          while (cache.pending.length && alive) {
            const request = cache.pending[0];
            const { data, error } = await supabase.rpc("mercury_apply", { p_device: cache.device, p_sequence: request.sequence, p_operations: request.operations });
            if (error) throw error;
            if (!alive) return;
            cache.pending.shift();
            accept(data);
          }
          setStatus("Sincronizado");
        } catch { if (alive) setStatus("Sem conexão. Alterações salvas para sincronizar."); }
        finally { busy = false; }
        });
      };
      const pull = async () => {
        if (!alive || busy) return;
        await lock(async () => {
        if (!alive) return;
        reload(); drainJournals();
        const { data, error } = await supabase.from("mercury_documents").select("document,revision").eq("user_id", user).maybeSingle();
        if (error || !alive) { if (alive) setStatus("Não foi possível sincronizar. Tentando novamente…"); return; }
        // Import guest data only into an empty account, never over an existing account.
        if (!initialized && !data && !cache.pending.length && Object.keys(guest).length) {
          cache.pending.push({ sequence: ++cache.sequence, operations: changes({}, guest) });
        }
        initialized = true;
        accept(data || { document: {}, revision: 0 });
        });
        await flush();
      };
      const channel = supabase.channel(`mercury:${user}`).on("postgres_changes", { event: "*", schema: "public", table: "mercury_documents", filter: `user_id=eq.${user}` }, () => { void pull(); }).subscribe(state => { if (state === "SUBSCRIBED") void pull(); });
      window.addEventListener(LOCAL_CHANGE, capture);
      window.addEventListener("online", pull);
      const timer = window.setInterval(pull, 15000);
      stop = () => { alive = false; clearInterval(timer); window.removeEventListener(LOCAL_CHANGE, capture); window.removeEventListener("online", pull); void supabase.removeChannel(channel); };
      void pull();
    };
    // Do not call async Supabase methods inside the synchronous auth callback.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if ((session?.user.id || null) !== owner) { generation++; stop(); setTimeout(switchAccount, 0); } });
    void switchAccount();
    return () => { generation++; stop(); subscription.unsubscribe(); };
  }, []);
  async function login() {
    const client = getSupabase();
    if (!client) return;
    const { error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/` } });
    if (error) setStatus("Não foi possível entrar com Google. Tente novamente.");
  }
  return <><div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black px-4 py-2 text-xs text-white/60"><span role="status">{status}</span><button className="min-h-9 rounded-xl border border-white/15 px-3 text-white disabled:opacity-40" disabled={!available} onClick={() => signedIn ? void getSupabase()?.auth.signOut() : void login()}>{signedIn ? "Sair da conta" : "Entrar com Google"}</button></div>{children}</>;
}
