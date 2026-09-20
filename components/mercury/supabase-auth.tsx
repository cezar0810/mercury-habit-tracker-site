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

type SupabaseContextValue = {
  client: SupabaseClient | null;
  configured: boolean;
};

const SupabaseContext = createContext<SupabaseContextValue>({
  client: null,
  configured: false,
});

export function MercurySupabaseProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    // O cliente só existe no navegador; SSR/prerender não toca no localStorage.
    if (!supabaseConfigured || typeof window === "undefined") return;
    let active = true;
    import("@supabase/supabase-js").then(({ createClient: create }) => {
      if (!active) return;
      setClient(
        create(supabaseUrlResolved, supabaseAnonKeyResolved, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: "mercury-supabase-auth",
          },
        }),
      );
    });
    return () => {
      active = false;
    };
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

export function useMercuryAuth() {
  const { client, configured } = useMercurySupabase();
  const [user, setUser] = useState<MercuryUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client) return;
    let active = true;
    setLoading(true);

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

  const signInWithGoogle = useMemo(() => {
    return async () => {
      if (!client) return;
      const redirectTo = new URL("/auth/callback", window.location.origin).toString();
      await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
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
