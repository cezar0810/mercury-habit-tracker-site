// Configuração PÚBLICA do Supabase, commitada no repositório.
//
// A URL do projeto e a publishable key (formato novo sb_publishable_...)
// são valores públicos por design: eles identificam o projeto e são
// entregues ao navegador de qualquer visitante. A proteção dos dados é
// feita pelo Row Level Security (RLS) no banco, e não pelo sigilo desta
// chave — exatamente como a anon key clássica do Supabase.
//
// As variáveis de ambiente (NEXT_PUBLIC_SUPABASE_URL e
// NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) continuam tendo precedência para
// permitir apontar o build para outro projeto sem alterar código.
export const SUPABASE_PUBLIC_CONFIG = {
  url: "https://ujgmefsbaehwpvmelqrc.supabase.co",
  publishableKey: "sb_publishable_i2Sp7oC7vUo8G01ESDfT5Q_5mUFzgOs",
} as const;
