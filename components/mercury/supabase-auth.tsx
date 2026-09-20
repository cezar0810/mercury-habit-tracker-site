"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKeyResolved, supabaseConfigured, supabaseUrlResolved } from "@/lib/supabase";

let sharedClient: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!supabaseConfigured || typeof window === "undefined") return null;
  if (!sharedClient) {
    sharedClient = createBrowserClient(supabaseUrlResolved, supabaseAnonKeyResolved, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
    });
  }
  return sharedClient;
}

type SupabaseContextValue = { client: SupabaseClient | null; configured: boolean };
const SupabaseContext = createContext<SupabaseContextValue>({ client: null, configured: false });

export function MercurySupabaseProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<SupabaseClient | null>(() => getClient());

  useEffect(() => {
    setClient(getClient());
  }, []);

  const value = useMemo(() => ({ client, configured: supabaseConfigured }), [client]);
  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useMercurySupabase() {
  return useContext(SupabaseContext);
}

export type MercuryUser = { id: string; email: string | null; name: string | null };

function sessionUser(session: Session | null): MercuryUser | null {
  const user = session?.user;
  if (!user) return null;
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    null;
  return { id: user.id, email: user.email ?? null, name };
}

export function useMercuryAuth() {
  const { client, configured } = useMercurySupabase();
  const [user, setUser] = useState<MercuryUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }
    let active = true;
    const { data: subscription } = client.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (!active) return;
        setUser(sessionUser(session));
        setLoading(false);
      },
    );
    void client.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!active) return;
      setUser(sessionUser(data.session));
      setLoading(false);
      // O route handler de callback volta para cá em caso de falha com
      // ?auth_error=... — mostramos o motivo inline na tela de login.
      const callbackError = new URLSearchParams(window.location.search).get("auth_error");
      if (callbackError) {
        setAuthError(
          callbackError === "oauth_code_missing"
            ? "O Google não devolveu o código de autorização. Tente entrar de novo."
            : "O servidor não conseguiu concluir o login. O código pode ter " +
              "expirado ou sido usado — tente entrar de novo.",
        );
        window.history.replaceState(null, "", window.location.pathname);
      }
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [client]);

  const signInWithGoogle = useMemo(() => async () => {
    if (!client) return;
    const redirectTo = new URL("/auth/callback", window.location.origin).toString();
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
  }, [client]);

  const signOut = useMemo(() => async () => {
    if (!client) return;
    await client.auth.signOut();
  }, [client]);

  return { client, configured, user, loading, authError, signInWithGoogle, signOut };
}
