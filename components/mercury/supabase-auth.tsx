"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import {
  supabaseAnonKeyResolved,
  supabaseConfigured,
  supabaseUrlResolved,
} from "@/lib/supabase";

// Cliente único (singleton): todas as páginas compartilham a mesma instância,
// então a sessão salva pelo callback é vista imediatamente pelo app.
let sharedClient: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!supabaseConfigured || typeof window === "undefined") return null;
  if (!sharedClient) {
    sharedClient = createClient(supabaseUrlResolved, supabaseAnonKeyResolved, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Fluxo PKCE documentado do Supabase: signInWithOAuth gera e guarda
        // o code_verifier; a troca acontece UMA única vez no callback via
        // exchangeCodeForSession(code). detectSessionInUrl fica desligado
        // para o client NÃO disputar a troca com o callback (causa do erro
        // "invalid flow state" observado antes).
        detectSessionInUrl: false,
        flowType: "pkce",
        storageKey: "mercury-supabase-auth",
      },
    });
  }
  return sharedClient;
}

type SupabaseContextValue = {
  client: SupabaseClient | null;
  configured: boolean;
};

const SupabaseContext = createContext<SupabaseContextValue>({
  client: null,
  configured: false,
});

export function MercurySupabaseProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<SupabaseClient | null>(() => getClient());

  useEffect(() => {
    // O cliente só existe no navegador; SSR/prerender não toca no localStorage.
    setClient(getClient());
  }, []);

  const value = useMemo<SupabaseContextValue>(
    () => ({ client, configured: supabaseConfigured }),
    [client],
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useMercurySupabase() {
  return useContext(SupabaseContext);
}

export type MercuryUser = {
  id: string;
  email: string | null;
  name: string | null;
};

function sessionUser(session: Session | null): MercuryUser | null {
  const user = session?.user;
  if (!user) return null;
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    null;
  return {
    id: user.id,
    email: user.email ?? null,
    name: name || null,
  };
}

export function useMercuryAuth() {
  const { client, configured } = useMercurySupabase();
  const [user, setUser] = useState<MercuryUser | null>(null);
  // loading = verdadeiro até sabermos se há sessão (evita mostrar "Entrar"
  // antes de ler a sessão salva — e é o sinal para o portão de login).
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }
    let active = true;

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(sessionUser(session));
      setLoading(false);
    });

    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(sessionUser(data.session));
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [client]);

  // Fluxo documentado do Supabase: signInWithOAuth gerencia o PKCE completo
  // (gera o verifier, grava no storage do client e monta o authorize).
  const signInWithGoogle = useMemo(() => {
    return async () => {
      if (!client) return;
      const redirectTo = new URL("/auth/callback", window.location.origin).toString();
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
    };
  }, [client]);

  const signOut = useMemo(() => {
    return async () => {
      if (!client) return;
      await client.auth.signOut();
    };
  }, [client]);

  return {
    client,
    configured,
    user,
    loading,
    signInWithGoogle,
    signOut,
  };
}
