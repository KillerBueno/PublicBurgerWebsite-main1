// Supabase is loaded dynamically to avoid build issues when not configured
export const supabaseReady = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function getSupabase() {
  if (!supabaseReady) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  );
}
