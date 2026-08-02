import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order } from './lib/orders';
import type { UserProfile } from './lib/profiles';
import { setProfileOverride } from './lib/profiles';
import { getTier, TIERS } from './lib/gamification';
import { eur } from './lib/gestionale';

interface CustomerRow {
  email: string;
  name: string;
  avatar: string;
  orders: Order[];
  ordersCount: number;
  confirmedCount: number;
  totalSpent: number;
  avgTicket: number;
  firstOrder: string;
  lastOrder: string;
  daysSinceLast: number;
  override: number | null;
  registered: boolean;
}

type SortKey = 'spesa' | 'ordini' | 'recente' | 'nome';

const DAY_MS = 86_400_000;

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' });
}

/** Aggrega ordini + profili in una riga per cliente. */
function buildRows(orders: Order[], profiles: UserProfile[]): CustomerRow[] {
  const byEmail = new Map<string, Order[]>();
  for (const o of orders) {
    if (!o.user_email) continue;
    const list = byEmail.get(o.user_email) ?? [];
    list.push(o);
    byEmail.set(o.user_email, list);
  }

  const profileByEmail = new Map(profiles.map(p => [p.email, p]));
  const emails = new Set([...byEmail.keys(), ...profiles.map(p => p.email)]);

  return [...emails].map(email => {
    const list = (byEmail.get(email) ?? []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const profile = profileByEmail.get(email);
    const totalSpent = list.reduce((s, o) => s + Number(o.total), 0);
    const last = list[0]?.created_at ?? profile?.last_seen ?? '';
    const first = list[list.length - 1]?.created_at ?? profile?.first_seen ?? '';

    return {
      email,
      name: profile?.name || list[0]?.user_name || list[0]?.customer_name || email.split('@')[0],
      avatar: profile?.avatar_url ?? '',
      orders: list,
      ordersCount: list.length,
      confirmedCount: list.filter(o => o.status === 'confermato').length,
      totalSpent,
      avgTicket: list.length ? totalSpent / list.length : 0,
      firstOrder: first,
      lastOrder: last,
      daysSinceLast: last ? daysAgo(last) : Infinity,
      override: profile?.order_count_override ?? null,
      registered: !!profile,
    };
  });
}

/** Piatti più ordinati da un cliente. */
function topItems(orders: Order[], limit = 4): { name: string; qty: number }[] {
  const counts: Record<string, number> = {};
  for (const o of orders) {
    for (const item of o.items) {
      counts[item.name] = (counts[item.name] ?? 0) + (item.qty ?? 1);
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, qty]) => ({ name, qty }));
}

export default function ClientiTab({
  orders,
  profiles,
  adminToken,
  onProfilesChange,
}: {
  orders: Order[];
  profiles: UserProfile[];
  adminToken: string;
  onProfilesChange: (updater: (prev: UserProfile[]) => UserProfile[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('spesa');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => buildRows(orders, profiles), [orders, profiles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? rows.filter(r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
      : rows;
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === 'spesa')   return b.totalSpent - a.totalSpent;
      if (sort === 'ordini')  return b.ordersCount - a.ordersCount;
      if (sort === 'recente') return a.daysSinceLast - b.daysSinceLast;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [rows, search, sort]);

  const kpi = useMemo(() => {
    const withOrders = rows.filter(r => r.ordersCount > 0);
    const revenue = withOrders.reduce((s, r) => s + r.totalSpent, 0);
    return {
      total: rows.length,
      active: rows.filter(r => r.daysSinceLast <= 30).length,
      dormant: withOrders.filter(r => r.daysSinceLast > 60).length,
      avgTicket: withOrders.length
        ? revenue / withOrders.reduce((s, r) => s + r.ordersCount, 0)
        : 0,
    };
  }, [rows]);

  async function saveOverride(email: string, raw: string) {
    const trimmed = raw.trim();
    const value = trimmed === '' ? null : Number(trimmed);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      alert('Inserisci un numero valido (o lascia vuoto per azzerare l\'override)');
      return;
    }
    setSaving(true);
    try {
      await setProfileOverride(adminToken, email, value);
      onProfilesChange(prev =>
        prev.map(p => (p.email === email ? { ...p, order_count_override: value } : p)),
      );
      setEditingEmail(null);
    } catch (e) {
      alert(`Errore nel salvataggio: ${e instanceof Error ? e.message : 'sconosciuto'}`);
    }
    setSaving(false);
  }

  return (
    <div className="pb-16">
      {/* KPI */}
      <div className="grid grid-cols-4 divide-x divide-black/8 bg-white border-b border-black/8">
        {[
          { label: 'Clienti', value: String(kpi.total) },
          { label: 'Attivi 30g', value: String(kpi.active) },
          { label: 'Dormienti', value: String(kpi.dormant) },
          { label: 'Scontrino', value: kpi.avgTicket ? eur(kpi.avgTicket) : '—' },
        ].map(s => (
          <div key={s.label} className="px-2 py-3.5 text-center">
            <p className="text-base font-bold text-[#1a0a10] tabular-nums">{s.value}</p>
            <p className="text-[9px] uppercase tracking-widest text-black/35 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div className="px-4 py-3 bg-white border-b border-black/6 flex flex-wrap gap-2 sticky top-0 z-10 shadow-sm">
        <input
          type="text"
          value={search}
          placeholder="🔍  Cerca cliente…"
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[140px] border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
        >
          <option value="spesa">Più spesa</option>
          <option value="ordini">Più ordini</option>
          <option value="recente">Più recenti</option>
          <option value="nome">Nome A-Z</option>
        </select>
      </div>

      <div className="p-4 space-y-3 max-w-2xl mx-auto">
        {filtered.length === 0 && (
          <p className="text-center text-black/30 py-16 text-sm uppercase tracking-wider">
            Nessun cliente trovato
          </p>
        )}

        {filtered.map(row => {
          const effective = row.override ?? row.confirmedCount;
          const tier = getTier(effective);
          const nextTier = tier ? TIERS.find(t => t.min === tier.nextMin) : TIERS[0];
          const isOpen = expanded === row.email;

          return (
            <div key={row.email} className="bg-white rounded-2xl border border-black/6 overflow-hidden shadow-sm">
              <button
                className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
                onClick={() => setExpanded(isOpen ? null : row.email)}
              >
                {row.avatar ? (
                  <img src={row.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-black/10 shrink-0" />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-[#CF6990] text-white font-bold flex items-center justify-center shrink-0">
                    {row.name[0]?.toUpperCase()}
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-[#1a0a10] truncate">{row.name}</p>
                    {tier && (
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border"
                        style={{ color: tier.color, borderColor: `${tier.color}66`, background: `${tier.color}14` }}
                      >
                        {tier.name}
                      </span>
                    )}
                    {row.daysSinceLast > 60 && row.ordersCount > 0 && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-200 font-semibold uppercase tracking-wider">
                        Dormiente
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-black/35 truncate">{row.email}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-[#CF6990] text-sm tabular-nums">{eur(row.totalSpent)}</p>
                  <p className="text-[10px] text-black/30">
                    {row.ordersCount} ord. · {row.confirmedCount} conf.
                  </p>
                </div>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-black/25 text-sm shrink-0"
                >
                  ▾
                </motion.span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-black/6 px-4 py-4 space-y-4 bg-[#fdf5f8]/60">
                      {/* Metriche */}
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Scontrino medio', value: row.avgTicket ? eur(row.avgTicket) : '—' },
                          { label: 'Ordini confermati', value: String(row.confirmedCount) },
                          { label: 'Primo ordine', value: row.firstOrder ? fmtDate(row.firstOrder) : '—' },
                          {
                            label: 'Ultimo ordine',
                            value: row.lastOrder
                              ? `${fmtDate(row.lastOrder)} (${row.daysSinceLast}g fa)`
                              : '—',
                          },
                        ].map(m => (
                          <div key={m.label} className="bg-white rounded-xl border border-black/6 px-3 py-2">
                            <p className="text-[9px] uppercase tracking-widest text-black/30">{m.label}</p>
                            <p className="text-sm font-semibold text-[#1a0a10] mt-0.5">{m.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Fedeltà */}
                      <div className="bg-white rounded-xl border border-black/6 px-3 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] uppercase tracking-widest text-black/30">Punti fedeltà</p>
                          <span className="text-sm font-bold text-[#CF6990] tabular-nums">{effective}</span>
                        </div>
                        <p className="text-[10px] text-black/40 mb-2.5">
                          {nextTier
                            ? `Ancora ${Math.max(0, nextTier.min - effective)} ordini per ${nextTier.name}`
                            : 'Livello massimo raggiunto'}
                          {row.override !== null && (
                            <span className="text-[#CF6990] font-semibold"> · override manuale attivo</span>
                          )}
                        </p>

                        {editingEmail === row.email ? (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              placeholder="Vuoto = automatico"
                              autoFocus
                              className="flex-1 border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990]"
                            />
                            <button
                              onClick={() => saveOverride(row.email, editValue)}
                              disabled={saving}
                              className="px-3 py-2 bg-[#1a0a10] text-white text-[10px] uppercase tracking-wider rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40"
                            >
                              {saving ? '…' : 'Salva'}
                            </button>
                            <button
                              onClick={() => setEditingEmail(null)}
                              className="px-3 py-2 border border-black/12 text-black/40 text-[10px] uppercase tracking-wider rounded-xl hover:border-black/25 transition-colors"
                            >
                              Annulla
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingEmail(row.email);
                              setEditValue(row.override === null ? '' : String(row.override));
                            }}
                            className="text-[10px] uppercase tracking-wider text-[#CF6990] font-semibold hover:underline"
                          >
                            ✎ Modifica punti
                          </button>
                        )}
                      </div>

                      {/* Preferiti */}
                      {row.ordersCount > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-black/30 mb-2">Preferiti</p>
                          <div className="flex flex-wrap gap-1.5">
                            {topItems(row.orders).map(item => (
                              <span
                                key={item.name}
                                className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-black/8 text-black/55"
                              >
                                {item.name} <span className="text-[#CF6990] font-bold">×{item.qty}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Storico */}
                      {row.ordersCount > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-black/30 mb-2">
                            Storico ordini ({row.ordersCount})
                          </p>
                          <div className="space-y-1.5 max-h-64 overflow-y-auto">
                            {row.orders.map(o => (
                              <div
                                key={o.id}
                                className="flex items-center gap-2 bg-white rounded-xl border border-black/6 px-3 py-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-semibold text-[#1a0a10]">
                                    {fmtDate(o.created_at)}
                                    <span className="text-black/30 font-normal"> · {o.order_type}</span>
                                  </p>
                                  <p className="text-[10px] text-black/35 truncate">
                                    {o.items.map(i => i.name).join(', ')}
                                  </p>
                                </div>
                                {o.status === 'confermato' && (
                                  <span className="text-[9px] text-green-600 shrink-0">✓</span>
                                )}
                                <span className="text-[11px] font-bold text-[#1a0a10] shrink-0 tabular-nums">
                                  {eur(Number(o.total))}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {row.ordersCount === 0 && (
                        <p className="text-[11px] text-black/30 italic text-center py-2">
                          Registrato ma nessun ordine effettuato
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
