"use client";

import { useEffect, useRef, useState } from "react";
import {
  MercurySupabaseProvider,
  useMercurySupabase,
} from "@/components/mercury/supabase-auth";

// O Google volta para este endereço com o código/fragment do OAuth.
// O client Supabase detecta a sessão na URL; aqui apenas garantimos que a
// troca aconteceu e enviamos o usuário de volta ao app.
export default function AuthCallbackPage() {
  return (
    <MercurySupabaseProvider>
      <AuthCallbackInner />
    </MercurySupabaseProvider>
  );
}

function AuthCallbackInner() {
  const { client, configured } = useMercurySupabase();
  const [error, setError] = useState<string | null>(null);
  const redirected = useRef(false);

  useEffect(() => {
    if (!client) return;
    let active = true;

    const finish = async () => {
      try {
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(window.location.href);
        if (exchangeError) throw exchangeError;
      } catch {
        // Fluxo implícito: a sessão já foi detectada na URL; seguir normalmente.
      }
      if (active && !redirected.current) {
        redirected.current = true;
        window.location.replace("/");
      }
    };

    void finish();
    return () => {
      active = false;
    };
  }, [client]);

  if (!configured) {
    return (
      <main className="grid min-h-dvh place-items-center bg-black px-5 text-white">
        <p className="max-w-md text-center text-sm leading-6 text-white/60">
          Login não configurado. Defina <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no ambiente.
        </p>
      </main>
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-black px-5 text-white">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-base font-semibold text-red-400">Não foi possível concluir o login.</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/60">{error}</p>
            <a href="/" className="mt-6 inline-flex min-h-11 items-center text-sm text-[#a8c8ff] underline underline-offset-4">
              Voltar ao app
            </a>
          </>
        ) : (
          <>
            <p className="text-base font-semibold">Conectando sua conta…</p>
            <p className="mt-2 text-sm text-white/55">Você será levado de volta ao Mercury.</p>
          </>
        )}
      </div>
    </main>
  );
}
