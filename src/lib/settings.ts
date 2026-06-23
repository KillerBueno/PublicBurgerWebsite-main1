const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export async function fetchSetting<T>(key: string): Promise<T | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/settings?key=eq.${key}&select=value`,
      { headers: { apikey: SUPABASE_KEY } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data[0]?.value as T) ?? null;
  } catch {
    return null;
  }
}

export async function updateSetting(adminToken: string, key: string, value: unknown): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${adminToken}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Settings update failed: ${res.status}`);
}

export interface MondaySmashConfig {
  active: boolean;
  burgers: { name: string; desc: string; price: string }[];
}
