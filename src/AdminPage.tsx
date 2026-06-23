import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchOrders, updateOrderStatus, deleteOrder, exportOrdersCSV, type Order } from './lib/orders';
import { getStoredUser } from './lib/supabase';
import { fetchProfiles, setProfileOverride, effectiveCount, type UserProfile } from './lib/profiles';
import { getTier, TIERS } from './lib/gamification';
import { fetchSetting, updateSetting, type MondaySmashConfig } from './lib/settings';
import { BURGERS, FRIES, ALL_EXTRAS } from './menuData';

const PRIMARY_ADMIN = 'prrsmn91@gmail.com';
type Tab = 'ordini' | 'statistiche' | 'menu' | 'smash' | 'profili';

const NON_DISABLEABLE = [
  'Brioche bun', 'Bun classico', 'Piadina',
  'Hamburger di manzo', 'Hamburger vegetale', 'Spalla di maiale sfilacciata',
  'Petto di pollo', 'Hamburger di pollo', 'Cotoletta di pollo croccante',
];

const ALL_INGREDIENTS = Array.from(new Set([
  ...BURGERS.flatMap(b => b.ingredients),
  ...ALL_EXTRAS,
])).filter(i => !NON_DISABLEABLE.includes(i));

const ORDER_STATUSES = [
  { value: 'nuovo',        label: 'Nuovo',           color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { value: 'preparazione', label: 'In preparazione', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'pronto',       label: 'Pronto',          color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'consegnato',   label: 'Consegnato',      color: 'bg-gray-50 text-gray-400 border-gray-200' },
];

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status?: string }) {
  const s = ORDER_STATUSES.find(x => x.value === (status ?? 'nuovo')) ?? ORDER_STATUSES[0];
  return (
    <span className={`text-[10px] uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full border ${s.color}`}>
      {s.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    asporto: 'bg-blue-50 text-blue-600 border-blue-200',
    domicilio: 'bg-orange-50 text-orange-600 border-orange-200',
    tavolo: 'bg-green-50 text-green-600 border-green-200',
  };
  return (
    <span className={`text-[10px] uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full border ${colors[type] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {type}
    </span>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────
function StatisticheTab({ orders }: { orders: Order[] }) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

  const rev = (filter: (o: Order) => boolean) => orders.filter(filter).reduce((s, o) => s + o.total, 0);
  const revenueToday = rev(o => o.created_at.startsWith(today));
  const revenueWeek  = rev(o => o.created_at.slice(0, 10) >= weekAgo);
  const revenueMonth = rev(o => o.created_at.slice(0, 10) >= monthAgo);
  const revenueTotal = rev(() => true);

  const productCount: Record<string, number> = {};
  for (const o of orders) for (const item of o.items) {
    productCount[item.name] = (productCount[item.name] ?? 0) + (item.qty ?? 1);
  }
  const topProducts = Object.entries(productCount).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const maxProd = topProducts[0]?.[1] ?? 1;

  const hourCount = new Array(24).fill(0);
  for (const o of orders) hourCount[new Date(o.created_at).getHours()]++;
  const peakHours = Array.from({ length: 24 }, (_, h) => ({ h, count: hourCount[h] }))
    .filter(x => x.h >= 17 || x.count > 0);
  const maxHour = Math.max(...hourCount, 1);

  const typeCount: Record<string, number> = {};
  for (const o of orders) typeCount[o.order_type] = (typeCount[o.order_type] ?? 0) + 1;
  const total = orders.length || 1;

  return (
    <div className="p-4 max-w-2xl mx-auto pb-16 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Oggi', value: revenueToday },
          { label: 'Ultimi 7 giorni', value: revenueWeek },
          { label: 'Ultimi 30 giorni', value: revenueMonth },
          { label: 'Totale storico', value: revenueTotal },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-black/6 p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-black/30 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-[#1a0a10]">€{s.value.toFixed(0)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-black/6 p-4 shadow-sm">
        <p className="text-[10px] uppercase tracking-widest text-black/30 mb-3">Tipo ordine</p>
        <div className="space-y-2">
          {Object.entries(typeCount).map(([type, count]) => (
            <div key={type} className="flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-wider text-black/50 w-20">{type}</span>
              <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#CF6990] rounded-full" style={{ width: `${(count / total) * 100}%` }} />
              </div>
              <span className="text-[11px] font-bold text-[#1a0a10] w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/6 p-4 shadow-sm">
        <p className="text-[10px] uppercase tracking-widest text-black/30 mb-3">Prodotti più venduti</p>
        {topProducts.length === 0 && <p className="text-black/25 text-sm">Nessun dato ancora</p>}
        <div className="space-y-2">
          {topProducts.map(([name, count], i) => (
            <div key={name} className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-black/20 w-4">{i + 1}</span>
              <span className="text-[12px] text-[#1a0a10] flex-1 truncate">{name}</span>
              <div className="w-24 h-2 bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#CF6990] rounded-full" style={{ width: `${(count / maxProd) * 100}%` }} />
              </div>
              <span className="text-[11px] font-bold text-[#1a0a10] w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/6 p-4 shadow-sm">
        <p className="text-[10px] uppercase tracking-widest text-black/30 mb-4">Orario di punta</p>
        <div className="flex items-end gap-1 h-20">
          {peakHours.map(({ h, count }) => (
            <div key={h} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t bg-[#CF6990]/70"
                style={{ height: `${(count / maxHour) * 64}px`, minHeight: count > 0 ? 3 : 0 }} />
              <span className="text-[8px] text-black/25">{h}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Menu Tab ─────────────────────────────────────────────────────────────────
function MenuTab({ adminToken }: { adminToken: string }) {
  const [disabledProducts, setDisabledProducts] = useState<string[]>([]);
  const [disabledIngredients, setDisabledIngredients] = useState<string[]>([]);
  const [savingProd, setSavingProd] = useState<string | null>(null);
  const [savingIng, setSavingIng] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchSetting<string[]>('disabled_products'),
      fetchSetting<string[]>('disabled_ingredients'),
    ]).then(([prods, ings]) => {
      setDisabledProducts(prods ?? []);
      setDisabledIngredients(ings ?? []);
      setLoaded(true);
    });
  }, []);

  async function toggleProduct(name: string) {
    const next = disabledProducts.includes(name)
      ? disabledProducts.filter(x => x !== name)
      : [...disabledProducts, name];
    setSavingProd(name);
    try {
      await updateSetting(adminToken, 'disabled_products', next);
      setDisabledProducts(next);
    } catch { alert('Errore nel salvataggio'); }
    setSavingProd(null);
  }

  async function toggleIngredient(name: string) {
    const next = disabledIngredients.includes(name)
      ? disabledIngredients.filter(x => x !== name)
      : [...disabledIngredients, name];
    setSavingIng(name);
    try {
      await updateSetting(adminToken, 'disabled_ingredients', next);
      setDisabledIngredients(next);
    } catch { alert('Errore nel salvataggio'); }
    setSavingIng(null);
  }

  if (!loaded) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-[#CF6990] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const productSections = [
    { label: 'Burger', items: BURGERS.map(b => b.name) },
    { label: 'Fries / Appetizer', items: FRIES.map(f => f.name) },
  ];

  return (
    <div className="p-4 max-w-2xl mx-auto pb-16 space-y-5">
      <div className="bg-[#FBE8EF]/60 rounded-2xl px-4 py-3 text-[11px] text-[#a8456b]">
        Prodotti e ingredienti disattivati scompaiono dal menu. Le modifiche sono immediate.
      </div>

      {/* Prodotti */}
      <p className="text-[10px] uppercase tracking-[0.25em] text-black/30 px-1">Prodotti</p>
      {productSections.map(({ label, items }) => (
        <div key={label} className="bg-white rounded-2xl border border-black/6 shadow-sm overflow-hidden">
          <p className="px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-[#CF6990] font-bold border-b border-black/6">{label}</p>
          {items.map(name => {
            const isOff = disabledProducts.includes(name);
            return (
              <div key={name} className="flex items-center justify-between px-4 py-3 border-b border-black/4 last:border-0">
                <span className={`text-sm font-medium ${isOff ? 'text-black/30 line-through' : 'text-[#1a0a10]'}`}>{name}</span>
                <button
                  onClick={() => toggleProduct(name)}
                  disabled={savingProd === name}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isOff ? 'bg-black/15' : 'bg-[#CF6990]'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${isOff ? 'left-1' : 'left-7'}`} />
                </button>
              </div>
            );
          })}
        </div>
      ))}

      {/* Ingredienti */}
      <p className="text-[10px] uppercase tracking-[0.25em] text-black/30 px-1 pt-2">Ingredienti / Topping</p>
      <div className="bg-white rounded-2xl border border-black/6 shadow-sm overflow-hidden">
        <p className="px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-[#CF6990] font-bold border-b border-black/6">Disponibilità ingredienti</p>
        {ALL_INGREDIENTS.map(name => {
          const isOff = disabledIngredients.includes(name);
          return (
            <div key={name} className="flex items-center justify-between px-4 py-3 border-b border-black/4 last:border-0">
              <div>
                <span className={`text-sm font-medium ${isOff ? 'text-black/30 line-through' : 'text-[#1a0a10]'}`}>{name}</span>
                {isOff && <span className="ml-2 text-[10px] text-red-400 uppercase tracking-wider">esaurito</span>}
              </div>
              <button
                onClick={() => toggleIngredient(name)}
                disabled={savingIng === name}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isOff ? 'bg-black/15' : 'bg-[#CF6990]'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${isOff ? 'left-1' : 'left-7'}`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Monday Smash Tab ─────────────────────────────────────────────────────────
function SmashTab({ adminToken }: { adminToken: string }) {
  const [config, setConfig] = useState<MondaySmashConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSetting<MondaySmashConfig>('monday_smash').then(v => { if (v) setConfig(v); });
  }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    try {
      await updateSetting(adminToken, 'monday_smash', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { alert('Errore nel salvataggio'); }
    setSaving(false);
  }

  if (!config) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-[#CF6990] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 max-w-2xl mx-auto pb-16 space-y-4">
      <div className="bg-white rounded-2xl border border-black/6 shadow-sm px-4 py-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-[#1a0a10] text-sm">Popup Monday Smash</p>
          <p className="text-[11px] text-black/35 mt-0.5">{config.active ? 'Visibile agli utenti' : 'Nascosto'}</p>
        </div>
        <button
          onClick={() => setConfig(c => c ? { ...c, active: !c.active } : c)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${config.active ? 'bg-[#CF6990]' : 'bg-black/15'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${config.active ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      <p className="text-[10px] uppercase tracking-[0.25em] text-black/30 px-1">Burger in lista</p>
      {config.burgers.map((b, i) => (
        <div key={i} className="bg-white rounded-2xl border border-black/6 shadow-sm p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-[#CF6990] font-bold">Burger {i + 1}</p>
          <input value={b.name}
            onChange={e => setConfig(c => { if (!c) return c; const bs = [...c.burgers]; bs[i] = { ...bs[i], name: e.target.value }; return { ...c, burgers: bs }; })}
            placeholder="Nome"
            className="w-full border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
          />
          <input value={b.desc}
            onChange={e => setConfig(c => { if (!c) return c; const bs = [...c.burgers]; bs[i] = { ...bs[i], desc: e.target.value }; return { ...c, burgers: bs }; })}
            placeholder="Ingredienti"
            className="w-full border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
          />
          <input value={b.price}
            onChange={e => setConfig(c => { if (!c) return c; const bs = [...c.burgers]; bs[i] = { ...bs[i], price: e.target.value }; return { ...c, burgers: bs }; })}
            placeholder="Prezzo (es. da €9)"
            className="w-full border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
          />
        </div>
      ))}

      <button onClick={save} disabled={saving}
        className="w-full py-4 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.25em] font-semibold rounded-2xl hover:bg-[#CF6990] transition-colors disabled:opacity-50">
        {saved ? '✓ Salvato' : saving ? 'Salvataggio…' : 'Salva modifiche'}
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const loggedUser = getStoredUser();

  // Load extra admin emails from public settings (anon-readable)
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [adminEmailsLoaded, setAdminEmailsLoaded] = useState(false);

  useEffect(() => {
    fetchSetting<string[]>('admin_emails').then(v => {
      setAdminEmails(v ?? []);
      setAdminEmailsLoaded(true);
    });
  }, []);

  const isPrimaryAdmin = loggedUser?.email === PRIMARY_ADMIN;
  const isAdmin = isPrimaryAdmin || adminEmails.includes(loggedUser?.email ?? '');

  const [tab, setTab] = useState<Tab>('ordini');
  const [orders, setOrders] = useState<(Order & { status?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('tutti');
  const [dateFilter, setDateFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newOrderCount, setNewOrderCount] = useState(0);
  const lastOrderId = useRef<string | null>(null);
  // Admin email management
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [savingAdmins, setSavingAdmins] = useState(false);

  const loadData = async () => {
    if (!loggedUser) return;
    setLoading(true);
    try {
      const [ordersData, profilesData] = await Promise.all([
        fetchOrders(loggedUser.access_token),
        fetchProfiles(loggedUser.access_token),
      ]);
      setOrders(ordersData);
      if (lastOrderId.current && ordersData[0]?.id !== lastOrderId.current) {
        const count = ordersData.findIndex(o => o.id === lastOrderId.current);
        if (count > 0) { setNewOrderCount(c => c + count); playBeep(); }
      }
      lastOrderId.current = ordersData[0]?.id ?? null;
      const countMap: Record<string, number> = {};
      for (const o of ordersData) if (o.user_email) countMap[o.user_email] = (countMap[o.user_email] ?? 0) + 1;
      setProfiles(profilesData.map(p => ({ ...p, real_order_count: countMap[p.email] ?? 0 })));
      setProfilesLoading(false);
    } catch { setErr('Errore nel caricamento dati'); }
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin || !adminEmailsLoaded) return;
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [isAdmin, adminEmailsLoaded]);

  const filtered = useMemo(() => orders.filter(o => {
    const matchSearch = !search
      || o.customer_name.toLowerCase().includes(search.toLowerCase())
      || (o.user_email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'tutti' || o.order_type === typeFilter;
    const matchDate = !dateFilter || o.created_at.startsWith(dateFilter);
    return matchSearch && matchType && matchDate;
  }), [orders, search, typeFilter, dateFilter]);

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);

  async function handleDeleteOrder(orderId: string) {
    if (!window.confirm('Eliminare questo ordine? L\'azione non è reversibile.')) return;
    setDeletingId(orderId);
    try {
      await deleteOrder(loggedUser!.access_token, orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (expanded === orderId) setExpanded(null);
    } catch { alert('Errore nell\'eliminazione'); }
    setDeletingId(null);
  }

  async function saveAdminEmails(next: string[]) {
    setSavingAdmins(true);
    try {
      await updateSetting(loggedUser!.access_token, 'admin_emails', next);
      setAdminEmails(next);
    } catch { alert('Errore nel salvataggio'); }
    setSavingAdmins(false);
  }

  // ── Not logged in ──
  if (!loggedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a0a10]">
        <div className="text-center px-8">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-white text-xl font-bold mb-2">Area riservata</h1>
          <p className="text-white/40 text-sm mb-8">Accedi con l'account admin per continuare.</p>
          <a href="/login" className="inline-block px-6 py-3 bg-[#CF6990] text-white text-[11px] uppercase tracking-[0.25em] font-semibold rounded-2xl hover:bg-white hover:text-[#1a0a10] transition-colors">Accedi</a>
        </div>
      </div>
    );
  }

  // ── Loading admin check ──
  if (!adminEmailsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a0a10]">
        <div className="w-8 h-8 border-2 border-[#CF6990] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not admin ──
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a0a10]">
        <div className="text-center px-8">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-white text-xl font-bold mb-2">Accesso negato</h1>
          <p className="text-white/40 text-sm mb-8">L'account <span className="text-white/60">{loggedUser.email}</span> non ha i permessi admin.</p>
          <a href="/" className="text-[#CF6990] text-[11px] uppercase tracking-[0.25em] hover:text-white transition-colors">← Torna al sito</a>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ordini',      label: `Ordini${newOrderCount > 0 ? ` 🔴${newOrderCount}` : ` (${filtered.length})`}` },
    { key: 'statistiche', label: 'Stats' },
    { key: 'menu',        label: 'Menu' },
    { key: 'smash',       label: 'Smash' },
    { key: 'profili',     label: `Profili (${profiles.length})` },
  ];

  return (
    <div className="min-h-screen bg-[#f7f0f3]">
      {/* Header */}
      <div className="bg-[#1a0a10] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-public-burger.png" alt="Public Burger" className="h-9 brightness-0 invert opacity-90" />
          <div className="border-l border-white/15 pl-3">
            <p className="text-[9px] uppercase tracking-[0.35em] text-[#CF6990] font-semibold">Dashboard</p>
            <p className="text-white font-bold text-sm tracking-tight">Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {loggedUser.avatar_url && <img src={loggedUser.avatar_url} className="w-7 h-7 rounded-full border border-white/20" />}
          <a href="/" className="text-[10px] uppercase tracking-[0.2em] text-white/35 hover:text-white transition-colors">← Sito</a>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 divide-x divide-black/8 border-b border-black/8 bg-white">
        {[
          { label: 'Ordini', value: filtered.length.toString() },
          { label: 'Incasso', value: `€${totalRevenue.toFixed(0)}` },
          { label: 'Media', value: filtered.length ? `€${(totalRevenue / filtered.length).toFixed(0)}` : '—' },
        ].map(s => (
          <div key={s.label} className="px-4 py-4 text-center">
            <p className="text-xl font-bold text-[#1a0a10]">{s.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-black/35 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-black/8 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key}
            onClick={() => { setTab(t.key); if (t.key === 'ordini') setNewOrderCount(0); }}
            className={`flex-1 min-w-fit py-3 px-2 text-[10px] uppercase tracking-[0.2em] font-semibold whitespace-nowrap transition-colors ${
              tab === t.key ? 'text-[#CF6990] border-b-2 border-[#CF6990]' : 'text-black/30 hover:text-black/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Ordini ── */}
      {tab === 'ordini' && (
        <>
          <div className="px-4 py-3 bg-white border-b border-black/6 flex flex-wrap gap-2 sticky top-0 z-10 shadow-sm">
            <input type="text" value={search} placeholder="🔍  Cerca cliente…"
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[130px] border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
            />
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
            />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
            >
              {['tutti', 'asporto', 'domicilio', 'tavolo'].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <button onClick={() => exportOrdersCSV(filtered)}
              className="px-3 py-2 border border-black/12 rounded-xl text-[10px] uppercase tracking-wider text-black/50 hover:border-[#CF6990] hover:text-[#CF6990] transition-colors">
              ↓ CSV
            </button>
            {(search || dateFilter || typeFilter !== 'tutti') && (
              <button onClick={() => { setSearch(''); setDateFilter(''); setTypeFilter('tutti'); }}
                className="text-[11px] uppercase tracking-wider text-[#CF6990] px-2 hover:text-[#a8456b]">✕</button>
            )}
          </div>

          <div className="p-4 space-y-3 max-w-2xl mx-auto pb-16">
            {loading && <div className="text-center py-16"><div className="w-8 h-8 border-2 border-[#CF6990] border-t-transparent rounded-full animate-spin mx-auto" /></div>}
            {err && <p className="text-center text-red-400 py-12 text-sm">{err}</p>}
            {!loading && !err && filtered.length === 0 && (
              <p className="text-center text-black/30 py-16 text-sm uppercase tracking-wider">Nessun ordine trovato</p>
            )}

            <AnimatePresence>
              {filtered.map((order, idx) => (
                <motion.div key={order.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: idx * 0.02 }}
                  className="bg-white rounded-2xl border border-black/6 overflow-hidden shadow-sm"
                >
                  <button
                    className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left"
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <TypeBadge type={order.order_type} />
                        <StatusBadge status={order.status} />
                        <span className="text-[10px] text-black/30">{fmt(order.created_at)}</span>
                      </div>
                      <p className="font-semibold text-sm text-[#1a0a10] truncate">{order.customer_name}</p>
                      {order.user_email && <p className="text-[11px] text-black/35 truncate">{order.user_email}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#CF6990] text-base">€{order.total.toFixed(2)}</p>
                      <p className="text-[10px] text-black/30">{order.items.length} art.</p>
                    </div>
                    <motion.span animate={{ rotate: expanded === order.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }} className="text-black/25 text-sm shrink-0">▾</motion.span>
                  </button>

                  <AnimatePresence>
                    {expanded === order.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-black/6 px-5 py-4 space-y-3 bg-[#fdf5f8]/60">
                          {/* Status */}
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-black/30 mb-2">Stato ordine</p>
                            <div className="flex flex-wrap gap-2">
                              {ORDER_STATUSES.map(s => (
                                <button key={s.value}
                                  onClick={async () => {
                                    try {
                                      await updateOrderStatus(loggedUser.access_token, order.id, s.value);
                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: s.value } : o));
                                    } catch { alert('Errore aggiornamento stato'); }
                                  }}
                                  className={`text-[10px] px-3 py-1.5 rounded-full border font-semibold uppercase tracking-wider transition-all ${
                                    (order.status ?? 'nuovo') === s.value
                                      ? s.color
                                      : 'border-black/10 text-black/30 hover:border-black/25'
                                  }`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Items */}
                          <div className="space-y-2">
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
                          </div>

                          {order.notes && (
                            <p className="text-[11px] text-black/40 pt-2 border-t border-black/6 italic">⏱ {order.notes}</p>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-black/10">
                            <span className="text-sm font-bold text-black/60">Totale</span>
                            <span className="text-sm font-bold text-[#CF6990]">€{order.total.toFixed(2)}</span>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={deletingId === order.id}
                            className="w-full mt-1 py-2.5 rounded-xl border border-red-200 text-red-400 text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-40"
                          >
                            {deletingId === order.id ? 'Eliminazione…' : '🗑 Elimina ordine'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {tab === 'statistiche' && <StatisticheTab orders={orders} />}
      {tab === 'menu' && <MenuTab adminToken={loggedUser.access_token} />}
      {tab === 'smash' && <SmashTab adminToken={loggedUser.access_token} />}

      {/* ── Profili ── */}
      {tab === 'profili' && (
        <div className="p-4 space-y-4 max-w-2xl mx-auto pb-16">

          {/* Admin management — solo primary admin */}
          {isPrimaryAdmin && (
            <div className="bg-white rounded-2xl border border-black/6 shadow-sm overflow-hidden">
              <p className="px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-[#CF6990] font-bold border-b border-black/6">
                Amministratori
              </p>

              {/* Primary admin */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/4">
                <div>
                  <p className="text-sm font-semibold text-[#1a0a10]">{PRIMARY_ADMIN}</p>
                  <p className="text-[10px] text-black/30 mt-0.5">Admin principale</p>
                </div>
                <span className="text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#FBE8EF] text-[#CF6990] border border-[#CF6990]/20 font-semibold">
                  Owner
                </span>
              </div>

              {/* Extra admins */}
              {adminEmails.map(email => (
                <div key={email} className="flex items-center justify-between px-4 py-3 border-b border-black/4 last:border-0">
                  <p className="text-sm text-[#1a0a10]">{email}</p>
                  <button
                    onClick={async () => {
                      const next = adminEmails.filter(e => e !== email);
                      await saveAdminEmails(next);
                    }}
                    className="text-[10px] text-red-400 hover:text-red-600 uppercase tracking-wider transition-colors"
                  >
                    Rimuovi
                  </button>
                </div>
              ))}

              {/* Add new admin */}
              <div className="px-4 py-3 flex gap-2">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newAdminEmail.includes('@')) {
                      const next = [...new Set([...adminEmails, newAdminEmail.toLowerCase().trim()])];
                      saveAdminEmails(next).then(() => setNewAdminEmail(''));
                    }
                  }}
                  placeholder="Aggiungi email admin…"
                  className="flex-1 border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
                />
                <button
                  onClick={async () => {
                    if (!newAdminEmail.includes('@')) return;
                    const next = [...new Set([...adminEmails, newAdminEmail.toLowerCase().trim()])];
                    await saveAdminEmails(next);
                    setNewAdminEmail('');
                  }}
                  disabled={savingAdmins || !newAdminEmail.includes('@')}
                  className="px-4 py-2 bg-[#1a0a10] text-white text-[10px] uppercase tracking-wider rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* User profiles */}
          {profilesLoading && (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-[#CF6990] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}
          {!profilesLoading && profiles.length === 0 && (
            <p className="text-center text-black/30 py-16 text-sm uppercase tracking-wider">Nessun profilo ancora</p>
          )}

          {profiles.map(p => {
            const count = effectiveCount(p);
            const tier = getTier(count);
            const nextTier = tier ? TIERS.find(t => t.min === tier.nextMin) ?? null : TIERS[0];
            const isEditing = editingEmail === p.email;
            const isExtraAdmin = adminEmails.includes(p.email);

            return (
              <motion.div key={p.email} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-black/6 px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  {p.avatar_url
                    ? <img src={p.avatar_url} className="w-10 h-10 rounded-full border border-black/8 shrink-0" />
                    : <span className="w-10 h-10 rounded-full bg-[#CF6990] text-white text-sm font-bold flex items-center justify-center shrink-0">{p.name?.[0]?.toUpperCase()}</span>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-[#1a0a10] truncate">{p.name}</p>
                      {isExtraAdmin && (
                        <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#FBE8EF] text-[#CF6990] border border-[#CF6990]/20 font-semibold shrink-0">Admin</span>
                      )}
                    </div>
                    <p className="text-[11px] text-black/35 truncate">{p.email}</p>
                    <p className="text-[10px] text-black/25 mt-0.5">Prima visita: {new Date(p.first_seen).toLocaleDateString('it-IT')}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {tier
                      ? <p className="text-[11px] font-bold" style={{ color: tier.color }}>{tier.name}</p>
                      : nextTier ? <p className="text-[10px] text-black/25">→ {nextTier.name}</p> : null}
                    <p className="text-xl font-bold text-[#1a0a10]">{count}</p>
                    <p className="text-[9px] text-black/25 uppercase tracking-wide">ordini</p>
                    {p.order_count_override !== null && <p className="text-[9px] text-[#CF6990]">override</p>}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-black/6 flex items-center justify-between gap-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="number" min="0" value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        placeholder="Override contatore…"
                        className="flex-1 border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
                        autoFocus
                      />
                      <button onClick={async () => {
                        const raw = editValue.trim();
                        const val = raw === '' ? null : parseInt(raw, 10);
                        if (raw !== '' && isNaN(val!)) return;
                        try {
                          await setProfileOverride(loggedUser.access_token, p.email, val);
                          setProfiles(prev => prev.map(x => x.email === p.email ? { ...x, order_count_override: val } : x));
                          setEditingEmail(null);
                        } catch { alert('Errore nel salvataggio.'); }
                      }} className="px-3 py-2 bg-[#1a0a10] text-white text-[10px] uppercase tracking-wider rounded-xl hover:bg-[#CF6990] transition-colors">
                        Salva
                      </button>
                      <button onClick={async () => {
                        setEditingEmail(null);
                        if (p.order_count_override !== null) {
                          try {
                            await setProfileOverride(loggedUser.access_token, p.email, null);
                            setProfiles(prev => prev.map(x => x.email === p.email ? { ...x, order_count_override: null } : x));
                          } catch { alert('Errore nel reset.'); }
                        }
                      }} className="px-3 py-2 border border-black/12 text-black/40 text-[10px] uppercase tracking-wider rounded-xl hover:border-red-300 hover:text-red-400 transition-colors">
                        {p.order_count_override !== null ? 'Reset' : 'Annulla'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingEmail(p.email); setEditValue(p.order_count_override?.toString() ?? ''); }}
                      className="text-[10px] uppercase tracking-[0.2em] text-black/30 hover:text-[#CF6990] transition-colors">
                      ✏ Modifica punteggio
                    </button>
                  )}

                  {/* Admin toggle — solo primary admin, non su se stesso */}
                  {isPrimaryAdmin && p.email !== PRIMARY_ADMIN && (
                    <button
                      onClick={async () => {
                        const next = isExtraAdmin
                          ? adminEmails.filter(e => e !== p.email)
                          : [...adminEmails, p.email];
                        await saveAdminEmails(next);
                      }}
                      disabled={savingAdmins}
                      className={`text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-xl border font-semibold transition-colors shrink-0 ${
                        isExtraAdmin
                          ? 'border-[#CF6990]/30 text-[#CF6990] hover:bg-red-50 hover:border-red-300 hover:text-red-400'
                          : 'border-black/12 text-black/30 hover:border-[#CF6990] hover:text-[#CF6990]'
                      }`}
                    >
                      {isExtraAdmin ? '− Admin' : '+ Admin'}
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
