const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseReady = !!(SUPABASE_URL && SUPABASE_KEY);

const SESSION_KEY = 'pb_user';

export interface PBUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  access_token: string;
}

// Parse token from URL hash after OAuth redirect (hash already cleaned in index.html)
export async function handleAuthCallback(): Promise<PBUser | null> {
  const saved = sessionStorage.getItem('pb_oauth_hash') || window.location.hash;
  if (!saved || !SUPABASE_URL) return null;
  const params = new URLSearchParams(saved.startsWith('#') ? saved.slice(1) : saved);
  const accessToken = params.get('access_token');
  if (!accessToken) return null;

  sessionStorage.removeItem('pb_oauth_hash');
  window.history.replaceState(null, '', window.location.pathname);

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_KEY!,
      },
    });
    const data = await res.json();
    const user: PBUser = {
      id: data.id,
      email: data.email,
      name: data.user_metadata?.full_name || data.email,
      avatar_url: data.user_metadata?.avatar_url || '',
      access_token: accessToken,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
}

export function getStoredUser(): PBUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = '/';
}

export async function signInWithProvider(provider: 'google' | 'apple' | 'facebook') {
  if (!SUPABASE_URL) throw new Error('Supabase non configurato');
  const redirect = encodeURIComponent(window.location.origin);
  window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${redirect}`;
}
