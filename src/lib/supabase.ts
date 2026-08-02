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
  /** Serve a rinnovare l'access_token, che dura un'ora. */
  refresh_token?: string;
  /** Scadenza dell'access_token, in secondi epoch. */
  expires_at?: number;
}

// Parse token from URL hash after OAuth redirect (hash already cleaned in index.html)
export async function handleAuthCallback(): Promise<PBUser | null> {
  const saved = sessionStorage.getItem('pb_oauth_hash') || window.location.hash;
  if (!saved || !SUPABASE_URL) return null;
  const params = new URLSearchParams(saved.startsWith('#') ? saved.slice(1) : saved);
  const accessToken = params.get('access_token');
  if (!accessToken) return null;

  const refreshToken = params.get('refresh_token') ?? undefined;
  const expiresAt = Number(params.get('expires_at'))
    || nowSec() + (Number(params.get('expires_in')) || 3600);

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
      refresh_token: refreshToken,
      expires_at: expiresAt,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    // Upsert profile + sync count from Supabase
    try {
      const { upsertProfile, fetchProfileByEmail } = await import('./profiles');
      const { fetchUserOrderCount } = await import('./orders');
      const { setOrderCount } = await import('./gamification');
      await upsertProfile(accessToken, { email: user.email, name: user.name, avatar_url: user.avatar_url });
      const [profile, realCount] = await Promise.all([
        fetchProfileByEmail(accessToken, user.email),
        fetchUserOrderCount(accessToken, user.email),
      ]);
      // order_count_override (admin) ha precedenza; altrimenti conteggio ordini confermati reale
      setOrderCount(profile?.order_count_override ?? realCount);
    } catch (err) {
      console.error('handleAuthCallback: profile sync failed', err);
    }
    return user;
  } catch (err) {
    console.error('handleAuthCallback failed', err);
    return null;
  }
}

export function getStoredUser(): PBUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

// Una sola richiesta di rinnovo anche se più chiamate scadono insieme
let refreshing: Promise<string | null> | null = null;

async function refreshSession(user: PBUser): Promise<string | null> {
  if (!SUPABASE_URL || !user.refresh_token) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY! },
      body: JSON.stringify({ refresh_token: user.refresh_token }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.access_token) return null;

    const updated: PBUser = {
      ...user,
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? user.refresh_token,
      expires_at: data.expires_at ?? nowSec() + (data.expires_in ?? 3600),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('pb-user-changed'));
    return updated.access_token;
  } catch {
    return null;
  }
}

/**
 * Token valido per le chiamate autenticate: lo rinnova se sta per scadere.
 * L'access_token di Supabase dura un'ora, dopodiché le API rispondono
 * "JWT expired" e ogni salvataggio fallisce.
 */
export async function getAccessToken(): Promise<string | null> {
  const user = getStoredUser();
  if (!user) return null;

  const stillValid = user.expires_at && user.expires_at - nowSec() > 60;
  if (stillValid || !user.refresh_token) return user.access_token;

  refreshing ??= refreshSession(user).finally(() => { refreshing = null; });
  return (await refreshing) ?? user.access_token;
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = '/';
}

export async function signInWithProvider(provider: 'google' | 'apple' | 'facebook') {
  if (!SUPABASE_URL) throw new Error('Supabase non configurato');
  const redirect = encodeURIComponent(window.location.origin);
  window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${redirect}`;
}
