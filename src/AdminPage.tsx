import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchOrders, type Order } from './lib/orders';
import { getStoredUser } from './lib/supabase';
import { fetchProfiles, setProfileOverride, effectiveCount, type UserProfile } from './lib/profiles';
import { getTier, TIERS } from './lib/gamification';

const ADMIN_EMAIL = 'prrsmn91@gmail.com';

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function Badge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    asporto: 'bg-blue-50 text-blue-600 border border-blue-200',
    domicilio: 'bg-orange-50 text-orange-600 border border-orange-200',
    tavolo: 'bg-green-50 text-green-600 border border-green-200',
  };
  return (
    <span className={`text-[10px] uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full ${colors[type] ?? 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
      {type}
    </span>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<'ordini' | 'profili'>('ordini');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('tutti');
  const [dateFilter, setDateFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const loggedUser = getStoredUser();
  const isAdmin = loggedUser?.email === ADMIN_EMAIL;
  const isLoggedIn = !!loggedUser;

  // Block non-admin logged-in users
  if (isLoggedIn && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a0a10]">
        <div className="text-center px-8">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-white text-xl font-bold mb-2">Accesso negato</h1>
          <p className="text-white/40 text-sm mb-8">Non hai i permessi per accedere a quest'area.</p>
          <a href="/" className="text-[#CF6990] text-[11px] uppercase tracking-[0.25em] hover:text-white transition-colors">
            ← Torna al sito
          </a>
        </div>
      </div>
    );
  }

  // Not logged in at all
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a0a10]">
        <div className="text-center px-8">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-white text-xl font-bold mb-2">Area riservata</h1>
          <p className="text-white/40 text-sm mb-8">Accedi con l'account admin per continuare.</p>
          <a href="/login" className="inline-block px-6 py-3 bg-[#CF6990] text-white text-[11px] uppercase tracking-[0.25em] font-semibold rounded-2xl hover:bg-white hover:text-[#1a0a10] transition-colors">
            Accedi con Google
          </a>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchOrders(loggedUser!.access_token),
      fetchProfiles(loggedUser!.access_token),
    ]).then(([ordersData, profilesData]) => {
      setOrders(ordersData);
      // Merge real order count from orders table
      const countMap: Record<string, number> = {};
      for (const o of ordersData) {
        if (o.user_email) countMap[o.user_email] = (countMap[o.user_email] ?? 0) + 1;
      }
      setProfiles(profilesData.map(p => ({ ...p, real_order_count: countMap[p.email] ?? 0 })));
      setProfilesLoading(false);
      setLoading(false);
    }).catch(() => { setErr('Errore nel caricamento dati'); setLoading(false); setProfilesLoading(false); });
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = !search ||
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (o.user_email ?? '').toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'tutti' || o.order_type === typeFilter;
      const matchDate = !dateFilter || o.created_at.startsWith(dateFilter);
      return matchSearch && matchType && matchDate;
    });
  }, [orders, search, typeFilter, dateFilter]);

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-screen bg-[#f7f0f3]">
      {/* Header */}
      <div className="bg-[#1a0a10] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-public-burger.png" alt="Public Burger" className="h-9 brightness-0 invert opacity-90" />
          <div className="border-l border-white/15 pl-3">
            <p className="text-[9px] uppercase tracking-[0.35em] text-[#CF6990] font-semibold">Dashboard</p>
            <p className="text-white font-bold text-sm tracking-tight">Storico Ordini</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {loggedUser.avatar_url && (
            <img src={loggedUser.avatar_url} className="w-7 h-7 rounded-full border border-white/20" />
          )}
          <a href="/" className="text-[10px] uppercase tracking-[0.2em] text-white/35 hover:text-white transition-colors">
            ← Sito
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-black/8 border-b border-black/8 bg-white">
        {[
          { label: 'Ordini', value: filtered.length.toString() },
          { label: 'Incasso', value: `€${totalRevenue.toFixed(2)}` },
          { label: 'Media', value: filtered.length ? `€${(totalRevenue / filtered.length).toFixed(2)}` : '—' },
        ].map(s => (
          <div key={s.label} className="px-4 py-5 text-center">
            <p className="text-2xl font-bold text-[#1a0a10]">{s.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-black/35 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-black/8">
        {(['ordini', 'profili'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[11px] uppercase tracking-[0.25em] font-semibold transition-colors ${
              tab === t ? 'text-[#CF6990] border-b-2 border-[#CF6990]' : 'text-black/30 hover:text-black/60'
            }`}
          >
            {t === 'ordini' ? `Ordini (${filtered.length})` : `Profili (${profiles.length})`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className={`px-4 py-3 bg-white border-b border-black/6 flex flex-wrap gap-2 sticky top-0 z-10 shadow-sm${tab !== 'ordini' ? ' hidden' : ''}`}>
        <input
          type="text" value={search} placeholder="🔍  Cerca cliente o email…"
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
        />
        <input
          type="date" value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
        />
        <select
          value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
        >
          {['tutti', 'asporto', 'domicilio', 'tavolo'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        {(search || dateFilter || typeFilter !== 'tutti') && (
          <button onClick={() => { setSearch(''); setDateFilter(''); setTypeFilter('tutti'); }}
            className="text-[11px] uppercase tracking-wider text-[#CF6990] px-2 hover:text-[#a8456b]">
            ✕ Reset
          </button>
        )}
      </div>

      {/* Orders */}
      <div className={`p-4 space-y-3 max-w-2xl mx-auto pb-16${tab !== 'ordini' ? ' hidden' : ''}`}>
        {loading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-[#CF6990] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-black/30 text-sm">Caricamento ordini…</p>
          </div>
        )}
        {err && <p className="text-center text-red-400 py-12 text-sm">{err}</p>}
        {!loading && !err && filtered.length === 0 && (
          <p className="text-center text-black/30 py-16 text-sm uppercase tracking-wider">Nessun ordine trovato</p>
        )}

        <AnimatePresence>
          {filtered.map((order, idx) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="bg-white rounded-2xl border border-black/6 overflow-hidden shadow-sm"
            >
              <button
                className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge type={order.order_type} />
                    <span className="text-[10px] text-black/30">{fmt(order.created_at)}</span>
                  </div>
                  <p className="font-semibold text-sm text-[#1a0a10] truncate">{order.customer_name}</p>
                  {order.user_email && (
                    <p className="text-[11px] text-black/35 truncate">{order.user_email}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#CF6990] text-base">€{order.total.toFixed(2)}</p>
                  <p className="text-[10px] text-black/30">{order.items.length} articoli</p>
                </div>
                <motion.span
                  animate={{ rotate: expanded === order.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-black/25 text-sm shrink-0"
                >▾</motion.span>
              </button>

              <AnimatePresence>
                {expanded === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-black/6 px-5 py-4 space-y-2 bg-[#fdf5f8]/60">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-[#1a0a10]">{item.name}</span>
                            {item.size && <span className="text-[11px] text-black/40 ml-1.5">({item.size})</span>}
                            {item.qty && item.qty > 1 && <span className="text-[11px] text-black/40 ml-1.5">×{item.qty}</span>}
                            {item.removed?.length ? <p className="text-[11px] text-black/40 mt-0.5">Senza: {item.removed.join(', ')}</p> : null}
                            {item.extras?.length ? <p className="text-[11px] text-[#CF6990] mt-0.5">+ {item.extras.join(', ')}</p> : null}
                          </div>
                          <span className="text-sm font-semibold text-[#1a0a10] shrink-0">€{item.price.toFixed(2)}</span>
                        </div>
                      ))}
                      {order.notes && (
                        <p className="text-[11px] text-black/40 pt-2 border-t border-black/6 italic">⏱ {order.notes}</p>
                      )}
                      <div className="flex justify-between pt-2 border-t border-black/10 font-bold text-sm">
                        <span className="text-black/60">Totale ordine</span>
                        <span className="text-[#CF6990]">€{order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Profiles tab */}
      {tab === 'profili' && (
        <div className="p-4 space-y-3 max-w-2xl mx-auto pb-16">
          {profilesLoading && (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-[#CF6990] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            </div>
          )}
          {!profilesLoading && profiles.length === 0 && (
            <p className="text-center text-black/30 py-16 text-sm uppercase tracking-wider">Nessun profilo ancora</p>
          )}
          {profiles.map((p) => {
            const count = effectiveCount(p);
            const tier = getTier(count);
            const nextTier = tier ? TIERS.find(t => t.min === tier.nextMin) ?? null : TIERS[0];
            const isEditing = editingEmail === p.email;
            return (
              <motion.div
                key={p.email}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-black/6 px-5 py-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {p.avatar_url
                    ? <img src={p.avatar_url} className="w-10 h-10 rounded-full border border-black/8 shrink-0" />
                    : <span className="w-10 h-10 rounded-full bg-[#CF6990] text-white text-sm font-bold flex items-center justify-center shrink-0">{p.name?.[0]?.toUpperCase()}</span>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#1a0a10] truncate">{p.name}</p>
                    <p className="text-[11px] text-black/35 truncate">{p.email}</p>
                    <p className="text-[10px] text-black/25 mt-0.5">
                      Prima visita: {new Date(p.first_seen).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {tier ? (
                      <p className="text-[11px] font-bold" style={{ color: tier.color }}>{tier.name}</p>
                    ) : nextTier ? (
                      <p className="text-[10px] text-black/25">→ {nextTier.name}</p>
                    ) : null}
                    <p className="text-xl font-bold text-[#1a0a10]">{count}</p>
                    <p className="text-[9px] text-black/25 uppercase tracking-wide">ordini</p>
                    {p.order_count_override !== null && (
                      <p className="text-[9px] text-[#CF6990]">override</p>
                    )}
                  </div>
                </div>

                {/* Edit row */}
                <div className="mt-3 pt-3 border-t border-black/6">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        placeholder="Punteggio override…"
                        className="flex-1 border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
                        autoFocus
                      />
                      <button
                        onClick={async () => {
                          const val = editValue.trim() === '' ? null : parseInt(editValue, 10);
                          await setProfileOverride(loggedUser!.access_token, p.email, val);
                          setProfiles(prev => prev.map(x => x.email === p.email ? { ...x, order_count_override: val } : x));
                          setEditingEmail(null);
                        }}
                        className="px-3 py-2 bg-[#1a0a10] text-white text-[10px] uppercase tracking-wider rounded-xl hover:bg-[#CF6990] transition-colors"
                      >
                        Salva
                      </button>
                      <button
                        onClick={() => {
                          setEditingEmail(null);
                          if (p.order_count_override !== null) {
                            setProfileOverride(loggedUser!.access_token, p.email, null).then(() =>
                              setProfiles(prev => prev.map(x => x.email === p.email ? { ...x, order_count_override: null } : x))
                            );
                          }
                        }}
                        className="px-3 py-2 border border-black/12 text-black/40 text-[10px] uppercase tracking-wider rounded-xl hover:border-red-300 hover:text-red-400 transition-colors"
                      >
                        {p.order_count_override !== null ? 'Reset' : 'Annulla'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingEmail(p.email); setEditValue(p.order_count_override?.toString() ?? ''); }}
                      className="text-[10px] uppercase tracking-[0.2em] text-black/30 hover:text-[#CF6990] transition-colors"
                    >
                      ✏ Modifica punteggio
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

