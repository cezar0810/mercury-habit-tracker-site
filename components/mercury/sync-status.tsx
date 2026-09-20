"use client";

import { CheckCircle2, CloudOff, LoaderCircle, TriangleAlert } from "lucide-react";
import { useMercuryAuth } from "./supabase-auth";
import type { MercurySyncState } from "./sync";

// Indicador discreto do rodapé: estado real da sincronização com o
// Supabase quando há conta; caso contrário, "salvo neste navegador".
export function CloudCheck({ syncState }: { syncState?: MercurySyncState }) {
  const { configured, user } = useMercuryAuth();
  if (!configured) return null;
  if (!user) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-white/40">
        <CloudOff className="size-3.5" aria-hidden="true" />
        Salvo neste navegador
      </span>
    );
  }
  const phase = syncState?.phase ?? "off";
  if (phase === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-300/90">
        <TriangleAlert className="size-3.5" aria-hidden="true" />
        Sincronização com falha — dados seguros neste navegador
      </span>
    );
  }
  if (phase === "syncing") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#82b1ff]">
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
        Sincronizando…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300/80">
      <CheckCircle2 className="size-3.5" aria-hidden="true" />
      Sincronizado com {user.email ?? "sua conta"}
    </span>
  );
}
