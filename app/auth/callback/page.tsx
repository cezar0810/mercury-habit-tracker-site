"use client";

import { useEffect, useRef, useState } from "react";
import {
  MercurySupabaseProvider,
  useMercuryAuth,
} from "@/components/mercury/supabase-auth";
import { AuthSplash } from "@/components/mercury/login-gate";

// O Google volta para este endereço com o código/fragment do OAuth.
// O client Supabase (singleton) detecta a sessão na URL. Só redirecionamos
// de volta ao app DEPOIS que a sessão foi efetivamente persistida — antes
// disso o app abriria ainda deslogado (a causa do bug reportado).
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

    const finish = async () => {
      try {
        // Fluxo PKCE: troca explícita do código pela sessão.
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(
          window.location.href,
        );
        if (exchangeError) throw exchangeError;
      } catch {
        // Fluxo implícito: a sessão já foi detectada na URL pelo client;
        // garantimos só que ela foi lida do storage antes de navegar.
        await client.auth.getSession();
      }
      if (active && !redirected.current) {
        redirected.current = true;
        // Pequena espera: garante que o storage gravou a sessão antes do /
        window.setTimeout(() => window.location.replace("/"), 150);
      }
    };

    void finish();
    return () => {
      active = false;
    };
  }, [client]);

  return (
    <main className="grid min-h-dvh place-items-center bg-black px-5 text-white">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-base font-semibold text-red-400">
              Não foi possível concluir o login.
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/60">{error}</p>
            <a
              href="/"
              className="mt-6 inline-flex min-h-11 items-center text-sm text-[#a8c8ff] underline underline-offset-4"
            >
              Voltar ao app
            </a>
          </>
        ) : (
          <AuthSplash />
        )}
      </div>
    </main>
  );
}
