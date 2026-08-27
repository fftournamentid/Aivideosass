/**
 * Optional Supabase client scaffold.
 *
 * The studio uses the workspace PostgreSQL API by default. If you later add
 * Supabase credentials, this module is ready for provider-specific features
 * without changing the app's domain types.
 */
export type SupabaseTable =
  | "profiles"
  | "projects"
  | "characters"
  | "generations";

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL ?? "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
};

export const isSupabaseConfigured =
  Boolean(supabaseConfig.url) && Boolean(supabaseConfig.anonKey);

export function getSupabaseTableName(table: SupabaseTable): SupabaseTable {
  return table;
}