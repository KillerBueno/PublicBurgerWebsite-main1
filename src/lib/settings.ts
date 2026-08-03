const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export async function fetchSetting<T>(key: string): Promise<T | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(`fetchSetting('${key}'): VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY non configurate`);
    return null;
  }
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/settings?key=eq.${key}&select=value`,
      { headers: { apikey: SUPABASE_KEY } },
    );
    if (!res.ok) {
      console.error(`fetchSetting('${key}') failed: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    return (data[0]?.value as T) ?? null;
  } catch (err) {
    console.error(`fetchSetting('${key}') threw:`, err);
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

/** Il locale è aperto nel preciso istante `date`? Gestisce le sessioni oltre mezzanotte. */
export function isOpenAt(config: OpeningHours, date: Date): boolean {
  if (!config.enabled) return true;
  if (config.manual_close) return false;
  const mins = date.getHours() * 60 + date.getMinutes();

  // Giorno corrente; se siamo a notte fonda controlla anche la sessione di ieri
  const daysToCheck = [date.getDay()];
  if (date.getHours() < 6) daysToCheck.push((date.getDay() + 6) % 7);

  for (const jsDay of daysToCheck) {
    const day = config.hours[DAY_MAP[jsDay]];
    if (!day || day.closed) continue;
    const [oh, om] = day.open.split(':').map(Number);
    const [ch, cm] = day.close.split(':').map(Number);
    const openMins = oh * 60 + om;
    const closeMins = ch * 60 + cm;

    if (jsDay === date.getDay()) {
      if (closeMins <= openMins) {
        if (mins >= openMins) return true; // sessione che scavalca mezzanotte
      } else if (mins >= openMins && mins < closeMins) {
        return true;
      }
    } else if (closeMins <= openMins && mins < closeMins) {
      return true; // coda della sessione di ieri
    }
  }
  return false;
}

export function isCurrentlyOpen(config: OpeningHours): boolean {
  return isOpenAt(config, new Date());
}

/**
 * Orari selezionabili per ritiro/consegna: solo futuri e dentro l'apertura.
 * Parte da adesso + `leadMin` (tempo minimo di preparazione), a passi di
 * `stepMin`, e si ferma a fine della sessione aperta corrente/prossima.
 */
export function nextOrderSlots(
  config: OpeningHours | null,
  leadMin = 20,
  stepMin = 15,
  horizonMin = 12 * 60,
): string[] {
  const start = new Date(Date.now() + leadMin * 60000);
  const rem = start.getMinutes() % stepMin;
  if (rem) start.setMinutes(start.getMinutes() + (stepMin - rem));
  start.setSeconds(0, 0);

  const noHours = !config || !config.enabled || config.manual_close;
  const slots: string[] = [];
  let sessionStarted = false;

  for (let t = 0; t <= horizonMin; t += stepMin) {
    const cand = new Date(start.getTime() + t * 60000);
    const open = noHours ? true : isOpenAt(config, cand);
    if (open) {
      sessionStarted = true;
      const hh = String(cand.getHours()).padStart(2, '0');
      const mm = String(cand.getMinutes()).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
      if (slots.length >= 48) break;
    } else if (sessionStarted) {
      break; // fine della sessione aperta: non offrire orari dopo la chiusura
    }
  }
  return slots;
}
