import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchOrders, type Order } from './lib/orders';
import { getStoredUser } from './lib/supabase';

const ADMIN_EMAIL = 'prrsmn91@gmail.com';
const ADMIN_PASS = 'Public1010';
const SESSION_KEY = 'pb_admin_token';

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function Badge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    asporto: 'bg-blue-100 text-blue-700',
    domicilio: 'bg-orange-100 text-orange-700',
    tavolo: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full ${colors[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {type}
    </span>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY));
  const [pass, setPass] = useState('');
  const [passErr, setPassErr] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('tutti');
  const [dateFilter, setDateFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Check if logged-in user is admin
  const loggedUser = getStoredUser();
  const isAdminUser = loggedUser?.email === ADMIN_EMAIL;

  function handlePassLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pass === ADMIN_PASS) {
      const fakeToken = 'admin-local';
      sessionStorage.setItem(SESSION_KEY, fakeToken);
      setToken(fakeToken);
    } else setPassErr(true);
  }

  useEffect(() => {
    if (!token && !isAdminUser) return;
    setLoading(true);
    // Use stored Supabase token if logged in as admin, else use anon key
    const authToken = sessionStorage.getItem('pb_user')
      ? JSON.parse(sessionStorage.getItem('pb_user')!).access_token
      : null;
    fetchOrders(authToken ?? import.meta.env.VITE_SUPABASE_ANON_KEY)
      .then(data => { setOrders(data); setLoading(false); })
      .catch(() => { setErr('Errore nel caricamento ordini'); setLoading(false); });
  }, [token, isAdminUser]);

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

  if (!token && !isAdminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a0a10]">
        <div className="bg-white w-full max-w-xs mx-4 p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <img src="/logo-public-burger.png" alt="Public Burger" className="h-12 mb-4" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-black/30">Area Admin</p>
          </div>
          <form onSubmit={handlePassLogin} className="space-y-4">
            <input
              type="password" value={pass} placeholder="Password admin"
              onChange={e => { setPass(e.target.value); setPassErr(false); }}
              className="w-full border border-black/15 px-4 py-3 text-sm rounded-xl focus:outline-none focus:border-[#CF6990]"
            />
            {passErr && <p className="text-[11px] text-red-400 text-center uppercase tracking-wider">Password errata</p>}
            <button type="submit" className="w-full py-3 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.25em] font-semibold rounded-2xl hover:bg-[#CF6990] transition-colors">
              Entra
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf5f8]">
      {/* Header */}
      <div className="bg-[#1a0a10] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-public-burger.png" alt="" className="h-8 brightness-0 invert" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Dashboard</p>
            <h1 className="text-base font-bold tracking-tight">Storico Ordini</h1>
          </div>
        </div>
        <a href="/" className="text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">← Sito</a>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-px bg-black/8 border-b border-black/8">
        {[
          { label: 'Ordini', value: filtered.length },
          { label: 'Totale', value: `€${totalRevenue.toFixed(2)}` },
          { label: 'Media', value: filtered.length ? `€${(totalRevenue / filtered.length).toFixed(2)}` : '—' },
        ].map(s => (
          <div key={s.label} className="bg-white px-4 py-4 text-center">
            <p className="text-xl font-bold text-[#1a0a10]">{s.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-black/40 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="px-4 py-4 bg-white border-b border-black/6 flex flex-wrap gap-2">
        <input
          type="text" value={search} placeholder="Cerca cliente o email…"
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990]"
        />
        <input
          type="date" value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990]"
        />
        <select
          value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-white"
        >
          {['tutti', 'asporto', 'domicilio', 'tavolo'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        {(search || dateFilter || typeFilter !== 'tutti') && (
          <button onClick={() => { setSearch(''); setDateFilter(''); setTypeFilter('tutti'); }}
            className="text-[11px] uppercase tracking-wider text-[#CF6990] px-3">
            Reset
          </button>
        )}
      </div>

      {/* Orders list */}
      <div className="p-4 space-y-3 max-w-2xl mx-auto">
        {loading && <p className="text-center text-black/40 py-12 text-sm">Caricamento…</p>}
        {err && <p className="text-center text-red-400 py-12 text-sm">{err}</p>}
        {!loading && !err && filtered.length === 0 && (
          <p className="text-center text-black/30 py-12 text-sm uppercase tracking-wider">Nessun ordine trovato</p>
        )}
        <AnimatePresence>
          {filtered.map(order => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-black/6 overflow-hidden shadow-sm"
            >
              <button
                className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge type={order.order_type} />
                    <span className="text-[10px] text-black/30">{fmt(order.created_at)}</span>
                  </div>
                  <p className="font-semibold text-sm text-[#1a0a10] truncate">{order.customer_name}</p>
                  {order.user_email && <p className="text-[11px] text-black/35 truncate">{order.user_email}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#CF6990]">€{order.total.toFixed(2)}</p>
                  <p className="text-[10px] text-black/30">{order.items.length} articoli</p>
                </div>
                <span className={`text-black/30 transition-transform duration-200 ${expanded === order.id ? 'rotate-180' : ''}`}>▾</span>
              </button>

              <AnimatePresence>
                {expanded === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-black/6 px-5 py-4 space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 text-sm">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.size && <span className="text-[11px] text-black/40 ml-1">({item.size})</span>}
                            {item.qty && item.qty > 1 && <span className="text-[11px] text-black/40 ml-1">×{item.qty}</span>}
                            {item.removed?.length ? <p className="text-[11px] text-black/40">Senza: {item.removed.join(', ')}</p> : null}
                            {item.extras?.length ? <p className="text-[11px] text-black/40">+ {item.extras.join(', ')}</p> : null}
                          </div>
                          <span className="text-sm font-medium shrink-0">€{item.price.toFixed(2)}</span>
                        </div>
                      ))}
                      {order.notes && (
                        <p className="text-[11px] text-black/40 pt-1 border-t border-black/6">Note: {order.notes}</p>
                      )}
                      <div className="flex justify-between pt-2 border-t border-black/8 font-bold">
                        <span>Totale</span>
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
    </div>
  );
}
