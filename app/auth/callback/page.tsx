"use client";

import { useEffect, useRef, useState } from "react";
import {
  MercurySupabaseProvider,
  useMercuryAuth,
} from "@/components/mercury/supabase-auth";
import { AuthSplash } from "@/components/mercury/login-gate";

// Fluxo implícito: o Google/Supabase devolve os tokens no fragmento da URL
// (#access_token=…) — nunca vai ao servidor. O client (singleton, com
// detectSessionInUrl: true) detecta e grava a sessão sozinho.
//
// Papel deste callback: esperar a detecção acontecer, PROVAR que a sessão
// existe e só então voltar ao app. Qualquer falha aparece na tela — nada é
// engolido em silêncio.
export default function AuthCallbackPage() {
  return (
    <MercurySupabaseProvider>
      <AuthCallbackInner />
    </MercurySupabaseProvider>
  );
}

function AuthCallbackInner() {
  const { client } = useMercuryAuth();
  const [error, setError] = useState<string | null>(null);
  const redirected = useRef(false);

  useEffect(() => {
    if (!client) return;
    let active = true;
    let tries = 0;

    const finish = async () => {
      try {
        // Fluxo implícito: a detecção da URL acontece na inicialização do
        // client. Damos até ~3s para o _saveSession completar, checando a
        // cada 100ms — prova real antes de navegar.
        while (active && tries < 30) {
          const { data } = await client.auth.getSession();
          if (data.session) break;
          tries += 1;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const { data } = await client.auth.getSession();
        if (!data.session) {
          throw new Error(
            "O Google autorizou o acesso, mas a sessão não chegou ao navegador. " +
              "Verifique se o fluxo do provedor Google no Supabase está com " +
              "\"Implicit flow\" habilitado e tente de novo.",
          );
        }

        if (active && !redirected.current) {
          redirected.current = true;
          window.setTimeout(() => window.location.replace("/"), 150);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Falha desconhecida no login.");
      }
    };

    void finish();
    return () => {
      active = false;
    };
  }, [client]);

  if (error) {
    return (
      <main className="grid min-h-dvh place-items-center bg-black px-5 text-white">
        <div className="w-full max-w-md text-center">
          <p className="text-base font-semibold text-red-400">
            Não foi possível concluir o login.
          </p>
          <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left text-xs leading-6 text-white/70">
            {error}
          </p>
          <button
            type="button"
            onClick={() => window.location.replace("/")}
            className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-white/[0.14] px-5 text-sm font-bold text-white/85 transition hover:bg-white/[0.06]"
          >
            Voltar ao início
          </button>
        </div>
      </main>
    );
  }

  return <AuthSplash />;
}
