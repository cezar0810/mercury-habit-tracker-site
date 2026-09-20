"use client";

import { useEffect, useRef, useState } from "react";
import {
  MercurySupabaseProvider,
  useMercuryAuth,
} from "@/components/mercury/supabase-auth";
import { AuthSplash } from "@/components/mercury/login-gate";

// O Google volta para este endereço com o código do OAuth (fluxo PKCE).
// Só redirecionamos ao app DEPOIS de confirmar que a sessão existe de fato.
// Se a troca falhar, o erro aparece na tela — nada é engolido em silêncio.
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
        // Sessão já existente (usuário voltando ao callback já logado).
        let session = (await client.auth.getSession()).data.session;

        if (!session) {
          // Troca ÚNICA e explícita do código PKCE. O client é criado com
          // detectSessionInUrl: false, então nada mais disputa este código.
          const { error: exchangeError } = await client.auth.exchangeCodeForSession(
            window.location.href,
          );
          if (exchangeError) throw exchangeError;
          session = (await client.auth.getSession()).data.session;
        }

        // 3) Prova real: sem sessão aqui, não adianta voltar ao app.
        if (!session) {
          throw new Error(
            "O Google autorizou o acesso, mas a sessão não foi criada. " +
              "O código pode ter expirado — tente entrar de novo.",
          );
        }

        if (active && !redirected.current) {
          redirected.current = true;
          // Espera o storage gravar a sessão antes de navegar.
          window.setTimeout(() => window.location.replace("/"), 200);
        }
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Falha desconhecida no login.",
        );
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
