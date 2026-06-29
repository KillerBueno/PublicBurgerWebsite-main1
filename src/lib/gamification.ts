const KEY = 'pb_order_count';
const VERSION_KEY = 'pb_order_version';
const VERSION = 'v2'; // bumping resets all local counters to 0

export interface Tier {
  name: string;
  min: number;
  color: string;
  shimmerClass: string;
  nextMin: number | null;
}

export const TIERS: Tier[] = [
  { name: 'Bronze',   min: 5,   color: '#cd7f32', shimmerClass: 'tier-bronze',   nextMin: 15  },
  { name: 'Silver',   min: 15,  color: '#b8c4cc', shimmerClass: 'tier-silver',   nextMin: 30  },
  { name: 'Gold',     min: 30,  color: '#ffd700', shimmerClass: 'tier-gold',     nextMin: 50  },
  { name: 'Platinum', min: 50,  color: '#e2e8f0', shimmerClass: 'tier-platinum', nextMin: 100 },
  { name: 'Diamond',  min: 100, color: '#a5f3fc', shimmerClass: 'tier-diamond',  nextMin: null },
];

export function getOrderCount(): number {
  if (localStorage.getItem(VERSION_KEY) !== VERSION) {
    localStorage.setItem(KEY, '0');
    localStorage.setItem(VERSION_KEY, VERSION);
  }
  return parseInt(localStorage.getItem(KEY) || '0', 10);
}

export function setOrderCount(count: number): void {
  localStorage.setItem(KEY, String(count));
  localStorage.setItem(VERSION_KEY, VERSION);
  window.dispatchEvent(new CustomEvent('pb-orders-changed', { detail: { count } }));
}

export function getTier(count: number): Tier | null {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (count >= TIERS[i].min) return TIERS[i];
  }
  return null;
}
