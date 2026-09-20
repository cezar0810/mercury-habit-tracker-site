"use client";

import { useMemo, useState } from "react";
import { LogIn, LogOut, LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMercuryAuth } from "@/components/mercury/supabase-auth";

export function AccountControl({ currentName }: { currentName?: string }) {
  const { configured, user, loading, signInWithGoogle, signOut } = useMercuryAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const shortName = useMemo(() => {
    const source = user?.name || user?.email || currentName?.trim();
    if (!source) return "Entrar";
    if (user?.name || user?.email) return source.split("@")[0];
    return source;
  }, [user, currentName]);

  if (!configured) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => (user ? setDialogOpen(true) : void signInWithGoogle())}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.1] px-2.5 text-[11px] font-bold text-white/80 transition hover:bg-white/[0.06]"
      >
        {loading ? (
          <LoaderCircle className="size-4 animate-spin text-[#347cf6]" />
        ) : user ? (
          <>
            <span className="grid size-5 place-items-center rounded-full bg-[#102b59] text-[9px] font-black text-[#82b1ff]">
              {(shortName || "M").slice(0, 1).toUpperCase()}
            </span>
            <span className="max-w-[9ch] truncate sm:max-w-[14ch]">{shortName}</span>
          </>
        ) : (
          <>
            <LogIn className="size-4 text-[#347cf6]" />
            <span className="hidden sm:inline">Entrar com Google</span>
            <span className="sm:hidden">Entrar</span>
          </>
        )}
        {user && <span className="size-1.5 rounded-full bg-emerald-400" aria-label="Conectado" />}
      </button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-white/[0.12] bg-[#111214] p-6 text-white sm:max-w-sm">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl">Sua conta</DialogTitle>
            <DialogDescription className="leading-6 text-white/55">
              Ao entrar com o Google, o Mercury sincroniza seus dados entre o app e o site com o mesmo login.
            </DialogDescription>
          </DialogHeader>
          {user ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Conectado</p>
                <p className="mt-1 truncate text-sm font-semibold">{user.name || user.email}</p>
                {user.email && user.name && (
                  <p className="truncate text-xs text-white/50">{user.email}</p>
                )}
                <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-white/55">
                  Os dados locais deste navegador serão mantidos e sincronizados com a sua conta.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setSigningOut(true);
                  await signOut();
                  setSigningOut(false);
                  setDialogOpen(false);
                }}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.14] text-sm font-bold text-white/85 transition hover:bg-white/[0.06]"
              >
                {signingOut ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                Sair da conta
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#347cf6] text-sm font-bold shadow-[0_10px_24px_rgba(52,124,246,0.28)] transition hover:bg-[#2466d7]"
            >
              Entrar com Google
            </button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
