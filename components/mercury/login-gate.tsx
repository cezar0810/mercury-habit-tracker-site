"use client";

import { LoaderCircle } from "lucide-react";
import { useMercuryAuth } from "./supabase-auth";

// Portão de login: exibido enquanto o usuário não está autenticado.
// Minimalista, seguindo o tema do app (fundo preto, azul #347cf6, bordas suaves).
export function LoginGate() {
  const { signInWithGoogle } = useMercuryAuth();

  return (
    <main className="grid min-h-dvh place-items-center bg-black px-5 text-white">
      <div className="w-full max-w-sm text-center">
        <img
          src="/mercury-app-icon.png"
          alt="Mercury"
          className="mx-auto size-20 rounded-3xl shadow-[0_18px_50px_rgba(52,124,246,0.25)]"
        />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Mercury</h1>
        <p className="mt-2 text-sm leading-6 text-white/55">
          Entre com sua conta Google para acessar seu rotina sincronizada entre o app e o site.
        </p>

        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="mt-8 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#347cf6] text-sm font-bold shadow-[0_10px_24px_rgba(52,124,246,0.28)] transition hover:bg-[#2466d7] active:scale-[0.99]"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path
              fill="#fff"
              d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
            />
          </svg>
          Entrar com Google
        </button>

        <p className="mt-6 text-[11px] leading-5 text-white/35">
          Seus dados ficam protegidos e sincronizados com segurança entre seus dispositivos.
        </p>
      </div>
    </main>
  );
}

// Moldura de carregamento: exibida enquanto a sessão ainda está sendo lida,
// evitando "piscar" a tela de login para quem já está autenticado.
export function AuthSplash() {
  return (
    <main className="grid min-h-dvh place-items-center bg-black text-white">
      <div className="flex items-center gap-3 text-sm text-white/60">
        <LoaderCircle className="size-5 animate-spin text-[#347cf6]" />
        Verificando sua sessão…
      </div>
    </main>
  );
}
