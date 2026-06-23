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

export type PriceOverrides = Record<string, {
  single?: number;
  double?: number;
  triple?: number;
  fixed?: number;
}>;

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface OpeningHours {
  enabled: boolean;
  manual_close: boolean;
  manual_close_message: string;
  hours: Record<DayKey, DayHours>;
}

const DAY_MAP: Record<number, DayKey> = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };

export function isCurrentlyOpen(config: OpeningHours): boolean {
  if (!config.enabled) return true;
  if (config.manual_close) return false;
  const now = new Date();
  const dayKey = DAY_MAP[now.getDay()];
  const day = config.hours[dayKey];
  if (!day || day.closed) return false;
  const [oh, om] = day.open.split(':').map(Number);
  const [ch, cm] = day.close.split(':').map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}
