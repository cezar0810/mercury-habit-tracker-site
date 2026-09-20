// A URL e a publishable key públicas do Supabase seguem a convenção Next.js:
// o vinext inlines process.env.NEXT_PUBLIC_* no bundle do navegador.
// Formatos aceitos: a anon key JWT clássica e a nova publishable key
// (sb_publishable_...), que substituiu a anon key nos projetos novos.
//
// Como o builder remoto (Cloudflare) não lê o .env.local deste sandbox,
// a configuração padrão pública vive commitada em lib/supabase-config.ts
// e as variáveis de ambiente servem apenas de override.
import { SUPABASE_PUBLIC_CONFIG } from "@/lib/supabase-config";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Alguns provedores de hospedagem removem prefixos NEXT_PUBLIC_ ao expor
// variáveis de ambiente. Como fallback de leitura, aceitamos chaves sem o
// prefixo quando as duas variáveis principais não estiverem definidas.
const fallbackUrl = process.env.SUPABASE_URL ?? "";
const fallbackAnonKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ?? "";

export const supabaseUrlResolved =
  supabaseUrl || fallbackUrl || SUPABASE_PUBLIC_CONFIG.url;
export const supabaseAnonKeyResolved =
  supabaseAnonKey || fallbackAnonKey || SUPABASE_PUBLIC_CONFIG.publishableKey;

export const supabaseConfigured = Boolean(
  supabaseUrlResolved && supabaseAnonKeyResolved,
);
