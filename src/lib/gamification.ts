const KEY = 'pb_order_count';

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
  return parseInt(localStorage.getItem(KEY) || '0', 10);
}

export function incrementOrderCount(): number {
  const next = getOrderCount() + 1;
  localStorage.setItem(KEY, String(next));
  window.dispatchEvent(new CustomEvent('pb-orders-changed', { detail: { count: next } }));
  return next;
}

export function getTier(count: number): Tier | null {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (count >= TIERS[i].min) return TIERS[i];
  }
  return null;
}
