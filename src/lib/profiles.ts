const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface UserProfile {
  email: string;
  name: string;
  avatar_url: string;
  order_count_override: number | null;
  first_seen: string;
  last_seen: string;
  // computed client-side after merge with orders
  real_order_count?: number;
}

export function effectiveCount(p: UserProfile): number {
  return p.order_count_override ?? (p.real_order_count ?? 0);
}

export async function upsertProfile(profile: { email: string; name: string; avatar_url: string }): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      email: profile.email,
      name: profile.name,
      avatar_url: profile.avatar_url,
      last_seen: new Date().toISOString(),
    }),
  }).catch(() => {});
}

export async function fetchProfiles(adminToken: string): Promise<UserProfile[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?order=last_seen.desc`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${adminToken}`,
    },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function setProfileOverride(
  adminToken: string,
  email: string,
  override: number | null,
): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/user_profiles?email=eq.${encodeURIComponent(email)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${adminToken}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ order_count_override: override }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase PATCH failed: ${res.status} ${text}`);
  }
}

export async function fetchProfileByEmail(userToken: string, email: string): Promise<UserProfile | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/user_profiles?email=eq.${encodeURIComponent(email)}&limit=1`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${userToken}`,
      },
    },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data[0] ?? null;
}
