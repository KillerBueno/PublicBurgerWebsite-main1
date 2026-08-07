// Calcolo della tariffa di consegna in base ai minuti di guida dal locale.
// Punto di partenza: Piazza Doria Boncompagni, Isola del Liri (FR).

const ORIGIN = { lat: 41.68616, lon: 13.56975 };

export interface DeliveryQuote {
  minutes: number;            // minuti di guida stimati (arrotondati per eccesso)
  fee: number | null;         // tariffa €, null se fuori zona
  deliverable: boolean;       // false oltre il tempo massimo
  source: 'route' | 'estimate'; // 'estimate' se il routing non ha risposto
}

// Fasce concordate: <=7 min → 2€, 8–12 → 4€, 13–19 → 6€, oltre 19 → no consegna.
const MAX_MINUTES = 19;

function feeForMinutes(minutes: number): number | null {
  if (minutes <= 7) return 2;
  if (minutes <= 12) return 4;
  if (minutes <= 19) return 6;
  return null;
}

// Distanza in linea d'aria (km), usata solo come stima di riserva.
function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Minuti di guida reali via OSRM; null se il servizio non risponde. */
async function drivingMinutes(destLat: number, destLon: number): Promise<number | null> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${ORIGIN.lon},${ORIGIN.lat};${destLon},${destLat}?overview=false`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const seconds = data?.routes?.[0]?.duration;
    return typeof seconds === 'number' ? seconds / 60 : null;
  } catch {
    return null;
  }
}

export async function getDeliveryQuote(destLat: number, destLon: number): Promise<DeliveryQuote> {
  const routed = await drivingMinutes(destLat, destLon);

  let minutes: number;
  let source: DeliveryQuote['source'];
  if (routed !== null) {
    minutes = Math.ceil(routed);
    source = 'route';
  } else {
    // Riserva: strade cittadine ~25 km/h, con un piccolo margine
    const km = haversineKm(ORIGIN.lat, ORIGIN.lon, destLat, destLon);
    minutes = Math.ceil((km / 25) * 60) + 1;
    source = 'estimate';
  }

  const fee = feeForMinutes(minutes);
  return { minutes, fee, deliverable: minutes <= MAX_MINUTES, source };
}
