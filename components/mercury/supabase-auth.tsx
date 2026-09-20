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
        // Nenhuma mágica de URL: a troca do código PKCE é feita de forma
        // explícita e ÚNICA pelo callback (/auth/callback), com verifier
        // gerenciado por nós (ver PKCE_VERIFIER_KEY abaixo).
        detectSessionInUrl: false,
        flowType: "pkce",
        storageKey: "mercury-supabase-auth",
      },
    });
  }
  return sharedClient;
}

// Chave onde o code_verifier do fluxo PKCE fica guardado durante o
// redirecionamento Google → Supabase → site. Gravamos em localStorage E
// sessionStorage (o callback lê a primeira que existir).
export const PKCE_VERIFIER_KEY = "mercury-pkce-verifier";

export function savePkceVerifier(verifier: string) {
  try {
    window.localStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  } catch {
    /* storage indisponível — seguimos com o sessionStorage */
  }
  try {
    window.sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  } catch {
    /* idem */
  }
}

export function readPkceVerifier(): string | null {
  try {
    const fromLocal = window.localStorage.getItem(PKCE_VERIFIER_KEY);
    if (fromLocal) return fromLocal;
  } catch {
    /* segue para o sessionStorage */
  }
  try {
    return window.sessionStorage.getItem(PKCE_VERIFIER_KEY);
  } catch {
    return null;
  }
}

export function clearPkceVerifier() {
  try {
    window.localStorage.removeItem(PKCE_VERIFIER_KEY);
  } catch {
    /* ok */
  }
  try {
    window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  } catch {
    /* ok */
  }
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

function base64url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

  // Login com Google — PKCE MANUAL:
  // 1. geramos verifier/challenge nós mesmos;
  // 2. gravamos o verifier em localStorage + sessionStorage;
  // 3. redirecionamos ao authorize do Supabase com S256.
  // O callback troca o código direto em /auth/v1/token?grant_type=pkce.
  const signInWithGoogle = useMemo(() => {
    return async () => {
      if (!supabaseConfigured) return;
      const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
      const verifier = base64url(verifierBytes);
      const challengeBytes = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(verifier),
      );
      const challenge = base64url(new Uint8Array(challengeBytes));

      savePkceVerifier(verifier);

      const redirectTo = new URL("/auth/callback", window.location.origin).toString();
      const authorize = new URL(`${supabaseUrlResolved}/auth/v1/authorize`);
      authorize.searchParams.set("provider", "google");
      authorize.searchParams.set("redirect_to", redirectTo);
      authorize.searchParams.set("code_challenge", challenge);
      authorize.searchParams.set("code_challenge_method", "s256");
      window.location.href = authorize.toString();
    };
  }, []);

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
