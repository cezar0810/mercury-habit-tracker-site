"use client";

import { useEffect, useRef, useState } from "react";
import {
  MercurySupabaseProvider,
  useMercurySupabase,
} from "@/components/mercury/supabase-auth";
import { AuthSplash } from "@/components/mercury/login-gate";

// O Google volta para este endereço com ?code=… (fluxo PKCE documentado).
//
// A troca acontece UMA única vez, com a API oficial do Supabase:
//   exchangeCodeForSession(code)  ← apenas o CÓDIGO, não a URL inteira.
// O client (singleton, mesmo storage) lê o code_verifier que o próprio
// signInWithOAuth gravou no início do fluxo. Depois provamos que a sessão
// existe e só então voltamos ao app. Falhas aparecem na tela.
export default function AuthCallbackPage() {
  return (
    <MercurySupabaseProvider>
      <AuthCallbackInner />
    </MercurySupabaseProvider>
  );
}

function AuthCallbackInner() {
  const { client } = useMercurySupabase();
  const [error, setError] = useState<string | null>(null);
  const redirected = useRef(false);

  useEffect(() => {
    if (!client) return;
    let active = true;

    const finish = async () => {
      try {
        // Sessão já existente (usuário reabrindo o callback já logado).
        const existing = (await client.auth.getSession()).data.session;

        if (!existing) {
          const code = new URLSearchParams(window.location.search).get("code");
          if (!code) {
            throw new Error(
              "O Google não devolveu o código de autorização. Tente entrar de novo.",
            );
          }

          // API oficial — apenas o código, uma única vez.
          const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        // Prova real: sessão precisa existir antes de voltar ao app.
        const finalSession = (await client.auth.getSession()).data.session;
        if (!finalSession) {
          throw new Error(
            "A sessão não ficou gravada no navegador. Tente entrar de novo.",
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
