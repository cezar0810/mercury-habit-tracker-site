"use client";

// Camada de sincronização Site ↔ Supabase.
//
// Usa o MESMO schema do aplicativo Flutter — fonte central: a tabela
// `mercury_documents`, que guarda o estado consolidado do usuário como um
// documento JSONB (`document`) com controle de versão (`revision`).
//
// Estratégia (offline-first, sem perda de dados):
// - O localStorage continua sendo a leitura instantânea.
// - Ao entrar na conta: baixa o documento remoto. Se não existe (primeiro
//   login), os dados locais deste navegador viram a base e são enviados.
//   Se existe, o remoto vence (o app é a fonte primária do usuário).
// - A cada mudança local: push com debounce, incrementando `revision`.
// - Pull periódico de segurança só aplica mudanças quando não há edições
//   locais pendentes — nunca reverte o que o usuário acabou de fazer.
//
// O formato MercuryData (state.ts) não muda; a sincronização é transparente.

import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanMercuryData, type MercuryData } from "./state";
import { useMercuryAuth } from "./supabase-auth";
import {
  MERCURY_STORAGE_KEY,
  readMercuryData,
  writeMercuryData,
} from "./mercury-storage";

export type SyncPhase =
  | "off" // sem login ou sem Supabase configurado
  | "idle" // logado, tudo em ordem
  | "syncing" // enviando/baixando agora
  | "error"; // última operação falhou (dados locais preservados)

type DocumentRow = {
  document: unknown;
  revision: number;
  updated_at: string;
};

function documentToData(raw: unknown): MercuryData | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  // Documento vazio do app (primeiro login no app sem dados).
  if (!record.schemaVersion && !record.habits) return null;
  return cleanMercuryData(record);
}

// ---------------------------------------------------------------------------
// Pull / Push
// ---------------------------------------------------------------------------

type PullResult = {
  data: MercuryData;
  revision: number;
  updatedAt: string | null;
};

async function pullRemote(
  client: SupabaseClient,
  userId: string,
): Promise<PullResult> {
  const res = await client
    .from("mercury_documents")
    .select("document, revision, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (res.error) throw res.error;

  const row = (res.data ?? null) as DocumentRow | null;
  if (!row) {
    // Sem documento remoto: mantém os dados locais (primeiro login num
    // navegador já usado — nada é apagado; serão enviados no push).
    return { data: readMercuryData(), revision: 0, updatedAt: null };
  }

  const data = documentToData(row.document);
  if (!data) {
    return { data: readMercuryData(), revision: row.revision, updatedAt: row.updated_at };
  }
  return { data, revision: row.revision, updatedAt: row.updated_at };
}

async function pushAll(
  client: SupabaseClient,
  userId: string,
  data: MercuryData,
  revision: number,
): Promise<string | null> {
  const res = await client
    .from("mercury_documents")
    .upsert(
      {
        user_id: userId,
        document: data,
        revision: revision + 1,
      },
      { onConflict: "user_id" },
    )
    .select("updated_at")
    .single();

  if (res.error) throw res.error;
  return (res.data as { updated_at: string } | null)?.updated_at ?? null;
}

// ---------------------------------------------------------------------------
// Hook principal
// ---------------------------------------------------------------------------

function readLocalRaw() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MERCURY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export type MercurySyncState = {
  phase: SyncPhase;
  lastError: string | null;
};

const POLL_MS = 60_000;
const DEBOUNCE_MS = 1_500;

export function useMercurySync(
  data: MercuryData,
  setData: (next: MercuryData) => void,
): MercurySyncState {
  const { client, user } = useMercuryAuth();
  const [state, setState] = useState<MercurySyncState>({
    phase: "off",
    lastError: null,
  });

  // Última serialização enviada/baixada — detecta edições pendentes.
  const lastSyncedSerializedRef = useRef<string>("");
  // Revisão remota conhecida — incrementada a cada push.
  const revisionRef = useRef<number>(0);
  // updated_at remoto conhecido — evita reaplicar o mesmo documento.
  const remoteUpdatedAtRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  // Espelho do dado atual para os efeitos de longa duração (evita stale closure).
  const dataRef = useRef(data);
  dataRef.current = data;

  // Pull ao entrar na conta.
  useEffect(() => {
    if (!client || !user) {
      remoteUpdatedAtRef.current = null;
      revisionRef.current = 0;
      lastSyncedSerializedRef.current = "";
      setState({ phase: "off", lastError: null });
      return;
    }
    let cancelled = false;
    busyRef.current = true;
    setState({ phase: "syncing", lastError: null });

    (async () => {
      try {
        const remote = await pullRemote(client, user.id);
        if (cancelled) return;
        const serialized = JSON.stringify(remote.data);
        setData(remote.data);
        writeMercuryData(remote.data);
        lastSyncedSerializedRef.current = serialized;
        revisionRef.current = remote.revision;
        remoteUpdatedAtRef.current = remote.updatedAt;
        setState({ phase: "idle", lastError: null });
      } catch (error) {
        if (cancelled) return;
        // Sem documento remoto conhecido: o push seguirá dos dados locais.
        lastSyncedSerializedRef.current = JSON.stringify(readMercuryData());
        setState({
          phase: "error",
          lastError:
            error instanceof Error ? error.message : "Falha ao baixar dados",
        });
      } finally {
        busyRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
    // Executa quando a sessão muda (login/logout/troca de conta).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, user?.id]);

  // Push com debounce a cada mudança local (após o primeiro pull).
  useEffect(() => {
    if (!client || !user || busyRef.current) return;
    const serialized = JSON.stringify(data);
    if (serialized === lastSyncedSerializedRef.current) return;
    const timer = window.setTimeout(() => {
      busyRef.current = true;
      setState((current) => ({ ...current, phase: "syncing" }));
      pushAll(client, user.id, data, revisionRef.current)
        .then((updatedAt) => {
          lastSyncedSerializedRef.current = serialized;
          revisionRef.current += 1;
          if (updatedAt) remoteUpdatedAtRef.current = updatedAt;
          setState({ phase: "idle", lastError: null });
        })
        .catch((error) =>
          setState({
            phase: "error",
            lastError:
              error instanceof Error ? error.message : "Falha ao enviar dados",
          }),
        )
        .finally(() => {
          busyRef.current = false;
        });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, client, user?.id]);

  // Pull periódico de segurança: só aplica quando não há edições locais
  // pendentes e o documento remoto realmente mudou (app editou, por exemplo).
  useEffect(() => {
    if (!client || !user) return;
    const interval = window.setInterval(async () => {
      if (busyRef.current || document.hidden) return;
      const serialized = JSON.stringify(dataRef.current);
      if (serialized !== lastSyncedSerializedRef.current) return; // push pendente
      busyRef.current = true;
      try {
        const remote = await pullRemote(client, user.id);
        if (remote.updatedAt === remoteUpdatedAtRef.current) return;
        const nextSerialized = JSON.stringify(remote.data);
        if (nextSerialized === lastSyncedSerializedRef.current) {
          remoteUpdatedAtRef.current = remote.updatedAt;
          revisionRef.current = remote.revision;
          return;
        }
        setData(remote.data);
        writeMercuryData(remote.data);
        lastSyncedSerializedRef.current = nextSerialized;
        revisionRef.current = remote.revision;
        remoteUpdatedAtRef.current = remote.updatedAt;
        setState({ phase: "idle", lastError: null });
      } catch {
        // Silencioso: o próximo ciclo tenta de novo.
      } finally {
        busyRef.current = false;
      }
    }, POLL_MS);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, user?.id]);

  return state;
}
