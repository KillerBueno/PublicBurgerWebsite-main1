// Stub — login social verrà attivato quando le env vars Supabase saranno configurate
export const supabaseReady = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function signInWithProvider(provider: 'google' | 'apple' | 'facebook') {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase non configurato');
  const redirect = encodeURIComponent(window.location.origin);
  window.location.href = `${url}/auth/v1/authorize?provider=${provider}&redirect_to=${redirect}`;
}
