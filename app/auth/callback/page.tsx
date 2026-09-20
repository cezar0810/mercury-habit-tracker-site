"use client";

import { useEffect, useRef, useState } from "react";
import {
  MercurySupabaseProvider,
  useMercurySupabase,
  readPkceVerifier,
  clearPkceVerifier,
} from "@/components/mercury/supabase-auth";
import { AuthSplash } from "@/components/mercury/login-gate";
import {
  supabaseAnonKeyResolved,
  supabaseConfigured,
  supabaseUrlResolved,
} from "@/lib/supabase";

// O Google volta para este endereço com ?code=… (fluxo PKCE).
//
// A troca do código é feita AQUI, de forma única e explícita, direto no
// endpoint /auth/v1/token?grant_type=pkce, com o code_verifier que NÓS
// geramos no login (localStorage/sessionStorage) — sem depender dos
// mecanismos internos do supabase-js que falharam nos testes anteriores.
//
// Depois de obter os tokens, alimentamos a sessão do client singleton
// (setSession) — o app abre já logado. Qualquer falha aparece na tela.
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
    if (!client || !supabaseConfigured) return;
    let active = true;

    const finish = async () => {
      try {
        // Sessão já existente (usuário reabrindo o callback já logado).
        const existing = (await client.auth.getSession()).data.session;

        if (!existing) {
          const params = new URLSearchParams(window.location.search);
          const code = params.get("code");
          if (!code) {
            throw new Error(
              "O Google não devolveu o código de autorização. Tente entrar de novo.",
            );
          }

          const verifier = readPkceVerifier();
          if (!verifier) {
            throw new Error(
              "O verifier do fluxo de login não foi encontrado neste navegador. " +
                "Isso acontece se o login começou em outra janela/aba ou se o " +
                "armazenamento foi limpo no meio do processo. Tente de novo, " +
                "na mesma janela.",
            );
          }

          // Troca ÚNICA e explícita: POST /auth/v1/token?grant_type=pkce.
          const tokenRes = await fetch(
            `${supabaseUrlResolved}/auth/v1/token?grant_type=pkce`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: supabaseAnonKeyResolved,
              },
              body: JSON.stringify({
                auth_code: code,
                code_verifier: verifier,
              }),
            },
          );

          if (!tokenRes.ok) {
            const detail = await tokenRes.json().catch(() => null);
            const message =
              (detail as { error_description?: string; msg?: string } | null)
                ?.error_description ??
              (detail as { msg?: string } | null)?.msg ??
              `HTTP ${tokenRes.status}`;
            throw new Error(`Supabase recusou o código (${message}).`);
          }

          const tokens = (await tokenRes.json()) as {
            access_token: string;
            refresh_token: string;
            expires_in?: number;
          };

          // Alimenta a sessão do client singleton — o app abre logado.
          const { error: setSessionError } = await client.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          });
          if (setSessionError) throw setSessionError;
        }

        clearPkceVerifier();

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
        clearPkceVerifier();
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
