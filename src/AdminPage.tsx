import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchOrders, updateOrderStatus, updateOrderNotes, deleteOrder, exportOrdersCSV, type Order, type StatusEntry } from './lib/orders';
import { getStoredUser, signOut } from './lib/supabase';
import { fetchProfiles, setProfileOverride, effectiveCount, type UserProfile } from './lib/profiles';
import { getTier, TIERS } from './lib/gamification';
import {
  fetchSetting, updateSetting, isCurrentlyOpen,
  type MondaySmashConfig, type PriceOverrides, type OpeningHours, type DayKey,
} from './lib/settings';
import { BURGERS, FRIES, ALL_EXTRAS } from './menuData';
import FoodCostTab from './FoodCostTab';

const PRIMARY_ADMIN = 'prrsmn91@gmail.com';
type Tab = 'ordini' | 'statistiche' | 'menu' | 'smash' | 'orari' | 'profili' | 'foodcost';

const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Lunedì', tue: 'Martedì', wed: 'Mercoledì', thu: 'Giovedì',
  fri: 'Venerdì', sat: 'Sabato', sun: 'Domenica',
};
const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const NON_DISABLEABLE = [
  'Brioche bun', 'Bun classico', 'Piadina', 'Hamburger di manzo',
  'Hamburger vegetale', 'Spalla di maiale sfilacciata', 'Petto di pollo',
  'Hamburger di pollo', 'Cotoletta di pollo croccante',
];
const ALL_INGREDIENTS = Array.from(new Set([
  ...BURGERS.flatMap(b => b.ingredients), ...ALL_EXTRAS,
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
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

function sendBrowserNotification(count: number) {
  if (Notification.permission !== 'granted') return;
  new Notification(`🍔 ${count} nuovo${count > 1 ? 'i' : ''} ordine${count > 1 ? 'i' : ''}!`, {
    body: 'Nuovo ordine ricevuto su Public Burger',
    icon: '/logo-public-burger.png',
  });
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function fmtTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

function printOrder(order: Order) {
  const items = order.items.map(i =>
    `<tr><td>${i.name}${i.size ? ` (${i.size})` : ''}${i.qty && i.qty > 1 ? ` ×${i.qty}` : ''}</td><td style="text-align:right">€${i.price.toFixed(2)}</td></tr>`
    + (i.removed?.length ? `<tr><td colspan="2" style="font-size:11px;color:#666">Senza: ${i.removed.join(', ')}</td></tr>` : '')
    + (i.extras?.length ? `<tr><td colspan="2" style="font-size:11px;color:#CF6990">+ ${i.extras.join(', ')}</td></tr>` : '')
  ).join('');
  const w = window.open('', '_blank', 'width=400,height=600');
  if (!w) return;
  w.document.write(`<html><head><title>Ordine ${order.customer_name}</title>
    <style>body{font-family:monospace;padding:20px;font-size:13px}h2{margin:0 0 4px}table{width:100%;border-collapse:collapse}td{padding:4px 0}hr{border:none;border-top:1px dashed #ccc;margin:10px 0}.total{font-weight:bold;font-size:15px}</style>
    </head><body>
    <h2>${order.customer_name}</h2>
    <p style="margin:0;color:#666;font-size:11px">${fmtDate(order.created_at)} · ${order.order_type.toUpperCase()}</p>
    <hr/><table>${items}</table><hr/>
    <table><tr class="total"><td>TOTALE</td><td style="text-align:right">€${order.total.toFixed(2)}</td></tr></table>
    ${order.notes ? `<p style="font-size:11px;color:#666;margin-top:8px">Note: ${order.notes}</p>` : ''}
    ${order.admin_notes ? `<p style="font-size:11px;color:#CF6990;margin-top:4px">Admin: ${order.admin_notes}</p>` : ''}
    <script>window.onload=()=>{window.print();window.close()}</script></body></html>`);
  w.document.close();
}

function StatusBadge({ status }: { status?: string }) {
  const s = ORDER_STATUSES.find(x => x.value === (status ?? 'nuovo')) ?? ORDER_STATUSES[0];
  return <span className={`text-[10px] uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>;
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    asporto: 'bg-blue-50 text-blue-600 border-blue-200',
    domicilio: 'bg-orange-50 text-orange-600 border-orange-200',
    tavolo: 'bg-green-50 text-green-600 border-green-200',
  };
  return <span className={`text-[10px] uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full border ${colors[type] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>{type}</span>;
}

function Toggle({ on, onToggle, disabled = false }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button onClick={onToggle} disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-[#CF6990]' : 'bg-black/15'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${on ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

function Spinner() {
  return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-[#CF6990] border-t-transparent rounded-full animate-spin" /></div>;
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────
interface DailyStat { giorno: string; totale_ordini: number; fatturato: number }

function StatisticheTab({ orders, adminToken }: { orders: Order[]; adminToken: string }) {
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);

  useEffect(() => {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
    const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_stats_daily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}` },
      body: '{}',
    }).then(r => r.ok ? r.json() : []).then(setDailyStats).catch(() => {});
  }, [adminToken]);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekAgo  = new Date(now.getTime() -  7 * 86400000).toISOString().slice(0, 10);
  const twoWeeks = new Date(now.getTime() - 14 * 86400000).toISOString().slice(0, 10);
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

  const rev = (from: string, to?: string) => orders
    .filter(o => o.created_at.slice(0, 10) >= from && (!to || o.created_at.slice(0, 10) < to))
    .reduce((s, o) => s + o.total, 0);
  const cnt = (from: string, to?: string) => orders
    .filter(o => o.created_at.slice(0, 10) >= from && (!to || o.created_at.slice(0, 10) < to)).length;

  const thisWeekRev  = rev(weekAgo);
  const prevWeekRev  = rev(twoWeeks, weekAgo);
  const thisWeekCnt  = cnt(weekAgo);
  const prevWeekCnt  = cnt(twoWeeks, weekAgo);

  const pct = (curr: number, prev: number) => {
    if (prev === 0) return null;
    const p = ((curr - prev) / prev * 100);
    return { val: Math.abs(p).toFixed(0), up: p >= 0 };
  };
  const weekRevPct = pct(thisWeekRev, prevWeekRev);
  const weekCntPct = pct(thisWeekCnt, prevWeekCnt);

  const productCount: Record<string, number> = {};
  for (const o of orders) for (const item of o.items)
    productCount[item.name] = (productCount[item.name] ?? 0) + (item.qty ?? 1);
  const topProducts = Object.entries(productCount).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const maxProd = topProducts[0]?.[1] ?? 1;

  const hourCount = new Array(24).fill(0);
  for (const o of orders) hourCount[new Date(o.created_at).getHours()]++;
  const peakHours = Array.from({ length: 24 }, (_, h) => ({ h, count: hourCount[h] })).filter(x => x.h >= 17 || x.count > 0);
  const maxHour = Math.max(...hourCount, 1);

  const typeCount: Record<string, number> = {};
  for (const o of orders) typeCount[o.order_type] = (typeCount[o.order_type] ?? 0) + 1;
  const total = orders.length || 1;

  function printReport() {
    window.print();
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-16 space-y-4 print:p-0">
      <div className="flex justify-end print:hidden">
        <button onClick={printReport}
          className="px-4 py-2 border border-black/12 rounded-xl text-[10px] uppercase tracking-wider text-black/50 hover:border-[#CF6990] hover:text-[#CF6990] transition-colors">
          🖨 Stampa report
        </button>
      </div>

      {/* Revenue + week comparison */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Oggi', value: rev(today), sub: null },
          { label: 'Ultimi 30 giorni', value: rev(monthAgo), sub: null },
          { label: 'Questa settimana', value: thisWeekRev, sub: weekRevPct ? `${weekRevPct.up ? '▲' : '▼'} ${weekRevPct.val}% vs sett. prec.` : null, up: weekRevPct?.up },
          { label: 'Ordini settimana', value: thisWeekCnt, isCnt: true, sub: weekCntPct ? `${weekCntPct.up ? '▲' : '▼'} ${weekCntPct.val}% vs sett. prec.` : null, up: weekCntPct?.up },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-black/6 p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-black/30 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-[#1a0a10]">{s.isCnt ? s.value : `€${(s.value as number).toFixed(0)}`}</p>
            {s.sub && <p className={`text-[10px] mt-1 font-medium ${s.up ? 'text-green-500' : 'text-red-400'}`}>{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Type split */}
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

      {/* Top products */}
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

      {/* Peak hours */}
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

      {/* Fatturato giornaliero (ultimi 30 giorni) */}
      {dailyStats.length > 0 && (() => {
        const maxFat = Math.max(...dailyStats.map(d => Number(d.fatturato)), 1);
        const shown = [...dailyStats].reverse().slice(-14);
        return (
          <div className="bg-white rounded-2xl border border-black/6 p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-black/30 mb-4">Fatturato giornaliero — ultimi 14 giorni</p>
            <div className="flex items-end gap-1 h-24">
              {shown.map((d) => {
                const label = new Date(d.giorno).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
                return (
                  <div key={d.giorno} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full rounded-t bg-[#A8456B]/70 group-hover:bg-[#CF6990] transition-colors cursor-default"
                      style={{ height: `${(Number(d.fatturato) / maxFat) * 80}px`, minHeight: 3 }}
                    />
                    <span className="text-[7px] text-black/25 rotate-0">{label}</span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#1a0a10] text-white text-[9px] px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      €{Number(d.fatturato).toFixed(0)} · {d.totale_ordini} ordini
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Menu Tab ─────────────────────────────────────────────────────────────────
function MenuTab({ adminToken }: { adminToken: string }) {
  const [disabledProducts,    setDisabledProducts]    = useState<string[]>([]);
  const [disabledIngredients, setDisabledIngredients] = useState<string[]>([]);
  const [priceOverrides,      setPriceOverrides]      = useState<PriceOverrides>({});
  const [savingProd, setSavingProd] = useState<string | null>(null);
  const [savingIng,  setSavingIng]  = useState<string | null>(null);
  const [savingPrice, setSavingPrice] = useState<string | null>(null);
  const [editPrices, setEditPrices] = useState<Record<string, Record<string, string>>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchSetting<string[]>('disabled_products'),
      fetchSetting<string[]>('disabled_ingredients'),
      fetchSetting<PriceOverrides>('price_overrides'),
    ]).then(([prods, ings, prices]) => {
      setDisabledProducts(prods ?? []);
      setDisabledIngredients(ings ?? []);
      const po = prices ?? {};
      setPriceOverrides(po);
      const ep: Record<string, Record<string, string>> = {};
      for (const b of BURGERS) {
        if (b.prices) {
          ep[b.name] = {
            single: String(po[b.name]?.single ?? b.prices.single),
            double: String(po[b.name]?.double ?? b.prices.double),
            triple: String(po[b.name]?.triple ?? b.prices.triple),
          };
        } else {
          ep[b.name] = { fixed: String(po[b.name]?.fixed ?? b.fixedPrice ?? 0) };
        }
      }
      setEditPrices(ep);
      setLoaded(true);
    });
  }, []);

  async function toggleProduct(name: string) {
    const next = disabledProducts.includes(name) ? disabledProducts.filter(x => x !== name) : [...disabledProducts, name];
    setSavingProd(name);
    try { await updateSetting(adminToken, 'disabled_products', next); setDisabledProducts(next); }
    catch { alert('Errore nel salvataggio'); }
    setSavingProd(null);
  }

  async function toggleIngredient(name: string) {
    const next = disabledIngredients.includes(name) ? disabledIngredients.filter(x => x !== name) : [...disabledIngredients, name];
    setSavingIng(name);
    try { await updateSetting(adminToken, 'disabled_ingredients', next); setDisabledIngredients(next); }
    catch { alert('Errore nel salvataggio'); }
    setSavingIng(null);
  }

  async function savePrice(burgerName: string) {
    const ep = editPrices[burgerName];
    if (!ep) return;
    const entry: PriceOverrides[string] = {};
    if (ep.fixed !== undefined) entry.fixed = parseFloat(ep.fixed);
    else { entry.single = parseFloat(ep.single); entry.double = parseFloat(ep.double); entry.triple = parseFloat(ep.triple); }
    if (Object.values(entry).some(isNaN)) return;
    const next = { ...priceOverrides, [burgerName]: entry };
    setSavingPrice(burgerName);
    try { await updateSetting(adminToken, 'price_overrides', next); setPriceOverrides(next); }
    catch { alert('Errore nel salvataggio prezzi'); }
    setSavingPrice(null);
  }

  async function resetPrice(burgerName: string) {
    const b = BURGERS.find(x => x.name === burgerName);
    if (!b) return;
    const next = { ...priceOverrides };
    delete next[burgerName];
    setSavingPrice(burgerName);
    try {
      await updateSetting(adminToken, 'price_overrides', next);
      setPriceOverrides(next);
      if (b.prices) setEditPrices(p => ({ ...p, [burgerName]: { single: String(b.prices!.single), double: String(b.prices!.double), triple: String(b.prices!.triple) } }));
      else setEditPrices(p => ({ ...p, [burgerName]: { fixed: String(b.fixedPrice ?? 0) } }));
    } catch { alert('Errore nel reset'); }
    setSavingPrice(null);
  }

  if (!loaded) return <Spinner />;

  return (
    <div className="p-4 max-w-2xl mx-auto pb-16 space-y-5">
      <div className="bg-[#FBE8EF]/60 rounded-2xl px-4 py-3 text-[11px] text-[#a8456b]">
        Prodotti, ingredienti e prezzi — le modifiche sono immediate.
      </div>

      {/* Prodotti */}
      <p className="text-[10px] uppercase tracking-[0.25em] text-black/30 px-1">Prodotti</p>
      {[{ label: 'Burger', items: BURGERS.map(b => b.name) }, { label: 'Fries / Appetizer', items: FRIES.map(f => f.name) }].map(({ label, items }) => (
        <div key={label} className="bg-white rounded-2xl border border-black/6 shadow-sm overflow-hidden">
          <p className="px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-[#CF6990] font-bold border-b border-black/6">{label}</p>
          {items.map(name => {
            const isOff = disabledProducts.includes(name);
            return (
              <div key={name} className="flex items-center justify-between px-4 py-3 border-b border-black/4 last:border-0">
                <span className={`text-sm font-medium ${isOff ? 'text-black/30 line-through' : 'text-[#1a0a10]'}`}>{name}</span>
                <Toggle on={!isOff} onToggle={() => toggleProduct(name)} disabled={savingProd === name} />
              </div>
            );
          })}
        </div>
      ))}

      {/* Prezzi */}
      <p className="text-[10px] uppercase tracking-[0.25em] text-black/30 px-1 pt-2">Prezzi</p>
      <div className="space-y-3">
        {BURGERS.map(b => {
          const ep = editPrices[b.name] ?? {};
          const hasOverride = !!priceOverrides[b.name];
          const isSaving = savingPrice === b.name;
          return (
            <div key={b.name} className="bg-white rounded-2xl border border-black/6 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#1a0a10]">{b.name}</p>
                {hasOverride && (
                  <button onClick={() => resetPrice(b.name)} disabled={isSaving}
                    className="text-[9px] uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors">
                    Reset
                  </button>
                )}
              </div>
              {b.prices ? (
                <div className="grid grid-cols-3 gap-2">
                  {(['single', 'double', 'triple'] as const).map(s => (
                    <div key={s}>
                      <p className="text-[9px] uppercase tracking-widest text-black/30 mb-1">{s === 'single' ? 'Singolo' : s === 'double' ? 'Doppio' : 'Triplo'}</p>
                      <div className="flex items-center border border-black/12 rounded-xl overflow-hidden focus-within:border-[#CF6990] bg-[#fdf5f8]">
                        <span className="px-2 text-black/30 text-sm">€</span>
                        <input type="number" step="0.5" min="0" value={ep[s] ?? ''}
                          onChange={e => setEditPrices(p => ({ ...p, [b.name]: { ...p[b.name], [s]: e.target.value } }))}
                          className="flex-1 py-2 pr-2 text-sm focus:outline-none bg-transparent w-0 min-w-0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center border border-black/12 rounded-xl overflow-hidden focus-within:border-[#CF6990] bg-[#fdf5f8] max-w-[120px]">
                  <span className="px-2 text-black/30 text-sm">€</span>
                  <input type="number" step="0.5" min="0" value={ep.fixed ?? ''}
                    onChange={e => setEditPrices(p => ({ ...p, [b.name]: { fixed: e.target.value } }))}
                    className="flex-1 py-2 pr-2 text-sm focus:outline-none bg-transparent w-0 min-w-0"
                  />
                </div>
              )}
              <button onClick={() => savePrice(b.name)} disabled={isSaving}
                className="mt-3 w-full py-2 bg-[#1a0a10] text-white text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">
                {isSaving ? 'Salvataggio…' : 'Salva prezzi'}
              </button>
            </div>
          );
        })}
      </div>

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
              <Toggle on={!isOff} onToggle={() => toggleIngredient(name)} disabled={savingIng === name} />
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
    try { await updateSetting(adminToken, 'monday_smash', config); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch { alert('Errore nel salvataggio'); }
    setSaving(false);
  }

  if (!config) return <Spinner />;

  return (
    <div className="p-4 max-w-2xl mx-auto pb-16 space-y-4">
      <div className="bg-white rounded-2xl border border-black/6 shadow-sm px-4 py-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-[#1a0a10] text-sm">Popup Monday Smash</p>
          <p className="text-[11px] text-black/35 mt-0.5">{config.active ? 'Visibile agli utenti' : 'Nascosto'}</p>
        </div>
        <Toggle on={config.active} onToggle={() => setConfig(c => c ? { ...c, active: !c.active } : c)} />
      </div>
      <p className="text-[10px] uppercase tracking-[0.25em] text-black/30 px-1">Burger in lista</p>
      {config.burgers.map((b, i) => (
        <div key={i} className="bg-white rounded-2xl border border-black/6 shadow-sm p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-[#CF6990] font-bold">Burger {i + 1}</p>
          {(['name', 'desc', 'price'] as const).map(field => (
            <input key={field} value={b[field]}
              onChange={e => setConfig(c => { if (!c) return c; const bs = [...c.burgers]; bs[i] = { ...bs[i], [field]: e.target.value }; return { ...c, burgers: bs }; })}
              placeholder={field === 'name' ? 'Nome' : field === 'desc' ? 'Ingredienti' : 'Prezzo (es. da €9)'}
              className="w-full border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
            />
          ))}
        </div>
      ))}
      <button onClick={save} disabled={saving}
        className="w-full py-4 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.25em] font-semibold rounded-2xl hover:bg-[#CF6990] transition-colors disabled:opacity-50">
        {saved ? '✓ Salvato' : saving ? 'Salvataggio…' : 'Salva modifiche'}
      </button>
    </div>
  );
}

// ─── Orari Tab ────────────────────────────────────────────────────────────────
function OrariTab({ adminToken }: { adminToken: string }) {
  const [config, setConfig] = useState<OpeningHours | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSetting<OpeningHours>('opening_hours').then(v => { if (v) setConfig(v); });
  }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    try { await updateSetting(adminToken, 'opening_hours', config); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch { alert('Errore nel salvataggio'); }
    setSaving(false);
  }

  if (!config) return <Spinner />;

  const open = isCurrentlyOpen(config);

  return (
    <div className="p-4 max-w-2xl mx-auto pb-16 space-y-4">
      {/* Stato attuale */}
      <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${open ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <span className="text-2xl">{open ? '🟢' : '🔴'}</span>
        <div>
          <p className={`text-sm font-bold ${open ? 'text-green-700' : 'text-red-600'}`}>
            Il locale è attualmente {open ? 'APERTO' : 'CHIUSO'}
          </p>
          <p className="text-[11px] text-black/40 mt-0.5">{!config.enabled ? 'Controllo orari disabilitato' : config.manual_close ? 'Chiusura manuale attiva' : 'Basato sugli orari impostati'}</p>
        </div>
      </div>

      {/* Toggle abilita */}
      <div className="bg-white rounded-2xl border border-black/6 shadow-sm px-4 py-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-[#1a0a10] text-sm">Abilita controllo orari</p>
          <p className="text-[11px] text-black/35 mt-0.5">Mostra banner "siamo chiusi" fuori orario</p>
        </div>
        <Toggle on={config.enabled} onToggle={() => setConfig(c => c ? { ...c, enabled: !c.enabled } : c)} />
      </div>

      {/* Chiusura manuale */}
      <div className="bg-white rounded-2xl border border-black/6 shadow-sm px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1a0a10] text-sm">Chiudi manualmente adesso</p>
            <p className="text-[11px] text-black/35 mt-0.5">Override immediato indipendente dagli orari</p>
          </div>
          <Toggle on={config.manual_close} onToggle={() => setConfig(c => c ? { ...c, manual_close: !c.manual_close } : c)} />
        </div>
        <input value={config.manual_close_message}
          onChange={e => setConfig(c => c ? { ...c, manual_close_message: e.target.value } : c)}
          placeholder="Messaggio di chiusura…"
          className="w-full border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
        />
      </div>

      {/* Orari per giorno */}
      <p className="text-[10px] uppercase tracking-[0.25em] text-black/30 px-1">Orari per giorno</p>
      <div className="bg-white rounded-2xl border border-black/6 shadow-sm overflow-hidden">
        {DAY_ORDER.map(day => {
          const d = config.hours[day];
          return (
            <div key={day} className="px-4 py-3 border-b border-black/4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-semibold ${d.closed ? 'text-black/30' : 'text-[#1a0a10]'}`}>{DAY_LABELS[day]}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-black/35">{d.closed ? 'Chiuso' : 'Aperto'}</span>
                  <Toggle on={!d.closed} onToggle={() => setConfig(c => {
                    if (!c) return c;
                    return { ...c, hours: { ...c.hours, [day]: { ...c.hours[day], closed: !d.closed } } };
                  })} />
                </div>
              </div>
              {!d.closed && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-black/30">Apertura</span>
                    <input type="time" value={d.open}
                      onChange={e => setConfig(c => c ? { ...c, hours: { ...c.hours, [day]: { ...c.hours[day], open: e.target.value } } } : c)}
                      className="border border-black/12 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-black/30">Chiusura</span>
                    <input type="time" value={d.close}
                      onChange={e => setConfig(c => c ? { ...c, hours: { ...c.hours, [day]: { ...c.hours[day], close: e.target.value } } } : c)}
                      className="border border-black/12 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={save} disabled={saving}
        className="w-full py-4 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.25em] font-semibold rounded-2xl hover:bg-[#CF6990] transition-colors disabled:opacity-50">
        {saved ? '✓ Salvato' : saving ? 'Salvataggio…' : 'Salva orari'}
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const loggedUser = getStoredUser();

  // Validate token on mount — if expired Supabase returns 401 and orders silently come back []
  useEffect(() => {
    if (!loggedUser?.access_token) return;
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
    const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${loggedUser.access_token}`, apikey: SUPABASE_KEY },
    }).then(r => { if (r.status === 401) { signOut(); } }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [adminEmailsLoaded, setAdminEmailsLoaded] = useState(false);

  useEffect(() => {
    fetchSetting<string[]>('admin_emails').then(v => { setAdminEmails(v ?? []); setAdminEmailsLoaded(true); });
  }, []);

  const isPrimaryAdmin = loggedUser?.email === PRIMARY_ADMIN;
  const isAdmin = isPrimaryAdmin || adminEmails.includes(loggedUser?.email ?? '');

  const [tab, setTab] = useState<Tab>('ordini');
  const [orders, setOrders] = useState<Order[]>([]);
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
  const tokenRef = useRef<string | null>(loggedUser?.access_token ?? null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [savingAdmins, setSavingAdmins] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  useEffect(() => {
    if ('Notification' in window) setNotifPerm(Notification.permission);
  }, []);

  const loadData = async () => {
    const token = tokenRef.current;
    if (!token) return;
    setLoading(true);
    try {
      const [ordersData, profilesData] = await Promise.all([
        fetchOrders(token),
        fetchProfiles(token),
      ]);
      setOrders(ordersData);
      if (lastOrderId.current && ordersData[0]?.id !== lastOrderId.current) {
        const count = ordersData.findIndex(o => o.id === lastOrderId.current);
        if (count > 0) { setNewOrderCount(c => c + count); playBeep(); sendBrowserNotification(count); }
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

    // Realtime WebSocket — notifica immediata su nuovi ordini
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
    const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const host = SUPABASE_URL.replace('https://', '');
    let ws: WebSocket | null = null;
    let heartbeat: ReturnType<typeof setInterval>;

    try {
      ws = new WebSocket(`wss://${host}/realtime/v1/websocket?apikey=${SUPABASE_KEY}&vsn=1.0.0`);
      ws.onopen = () => {
        ws!.send(JSON.stringify({
          topic: 'realtime:public:orders',
          event: 'phx_join',
          payload: {
            config: {
              broadcast: { self: false },
              presence: { key: '' },
              postgres_changes: [{ event: 'INSERT', schema: 'public', table: 'orders' }],
            },
          },
          ref: '1',
        }));
        heartbeat = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN)
            ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: null }));
        }, 30000);
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.event === 'postgres_changes' && msg.payload?.data?.type === 'INSERT') {
            loadData();
          }
        } catch {}
      };
    } catch {}

    // Fallback polling ogni 2 minuti
    const interval = setInterval(loadData, 120000);
    return () => {
      clearInterval(heartbeat);
      clearInterval(interval);
      ws?.close();
    };
  }, [isAdmin, adminEmailsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => orders.filter(o => {
    const matchSearch = !search || o.customer_name.toLowerCase().includes(search.toLowerCase()) || (o.user_email ?? '').toLowerCase().includes(search.toLowerCase());
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
    try { await updateSetting(loggedUser!.access_token, 'admin_emails', next); setAdminEmails(next); }
    catch { alert('Errore nel salvataggio'); }
    setSavingAdmins(false);
  }

  async function requestNotifPermission() {
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
  }

  // ── Gates ──
  if (!loggedUser) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a0a10]">
      <div className="text-center px-8">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-white text-xl font-bold mb-2">Area riservata</h1>
        <p className="text-white/40 text-sm mb-8">Accedi con l'account admin per continuare.</p>
        <a href="/login" className="inline-block px-6 py-3 bg-[#CF6990] text-white text-[11px] uppercase tracking-[0.25em] font-semibold rounded-2xl hover:bg-white hover:text-[#1a0a10] transition-colors">Accedi</a>
      </div>
    </div>
  );

  if (!adminEmailsLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a0a10]">
      <div className="w-8 h-8 border-2 border-[#CF6990] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a0a10]">
      <div className="text-center px-8">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-white text-xl font-bold mb-2">Accesso negato</h1>
        <p className="text-white/40 text-sm mb-8">L'account <span className="text-white/60">{loggedUser.email}</span> non ha i permessi admin.</p>
        <a href="/" className="text-[#CF6990] text-[11px] uppercase tracking-[0.25em] hover:text-white transition-colors">← Torna al sito</a>
      </div>
    </div>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ordini',      label: `Ordini${newOrderCount > 0 ? ` 🔴${newOrderCount}` : ` (${filtered.length})`}` },
    { key: 'statistiche', label: 'Stats' },
    { key: 'menu',        label: 'Menu' },
    { key: 'smash',       label: 'Smash' },
    { key: 'orari',       label: 'Orari' },
    { key: 'profili',     label: `Profili (${profiles.length})` },
    { key: 'foodcost',    label: 'Food Cost' },
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
        <div className="flex items-center gap-3">
          {/* Notifiche */}
          {'Notification' in window && notifPerm !== 'granted' && (
            <button onClick={requestNotifPermission}
              className="text-[9px] uppercase tracking-[0.15em] text-white/35 border border-white/15 rounded-lg px-2 py-1 hover:border-[#CF6990] hover:text-[#CF6990] transition-colors">
              🔔 Notifiche
            </button>
          )}
          {notifPerm === 'granted' && <span className="text-[9px] text-[#CF6990]">🔔</span>}
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
            className={`flex-1 min-w-fit py-3 px-2 text-[10px] uppercase tracking-[0.15em] font-semibold whitespace-nowrap transition-colors ${
              tab === t.key ? 'text-[#CF6990] border-b-2 border-[#CF6990]' : 'text-black/30 hover:text-black/60'
            }`}>
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
              className="border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]">
              {['tutti', 'asporto', 'domicilio', 'tavolo'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
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
            {!loading && !err && filtered.length === 0 && <p className="text-center text-black/30 py-16 text-sm uppercase tracking-wider">Nessun ordine trovato</p>}

            <AnimatePresence>
              {filtered.map((order, idx) => (
                <motion.div key={order.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: idx * 0.02 }}
                  className="bg-white rounded-2xl border border-black/6 overflow-hidden shadow-sm">

                  <button className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left"
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <TypeBadge type={order.order_type} />
                        <StatusBadge status={order.status} />
                        <span className="text-[10px] text-black/30">{fmtDate(order.created_at)}</span>
                      </div>
                      <p className="font-semibold text-sm text-[#1a0a10] truncate">{order.customer_name}</p>
                      {order.user_email && <p className="text-[11px] text-black/35 truncate">{order.user_email}</p>}
                      {order.admin_notes && <p className="text-[10px] text-[#CF6990] truncate mt-0.5">📝 {order.admin_notes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#CF6990] text-base">€{order.total.toFixed(2)}</p>
                      <p className="text-[10px] text-black/30">{order.items.length} art.</p>
                    </div>
                    <motion.span animate={{ rotate: expanded === order.id ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-black/25 text-sm shrink-0">▾</motion.span>
                  </button>

                  <AnimatePresence>
                    {expanded === order.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                        <div className="border-t border-black/6 px-5 py-4 space-y-4 bg-[#fdf5f8]/60">

                          {/* Status */}
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-black/30 mb-2">Stato ordine</p>
                            <div className="flex flex-wrap gap-2">
                              {ORDER_STATUSES.map(s => (
                                <button key={s.value}
                                  onClick={async () => {
                                    try {
                                      await updateOrderStatus(loggedUser.access_token, order.id, s.value, order.status_history ?? []);
                                      setOrders(prev => prev.map(o => o.id === order.id ? {
                                        ...o, status: s.value,
                                        status_history: [...(o.status_history ?? []), { status: s.value, at: new Date().toISOString() }],
                                      } : o));
                                    } catch { alert('Errore aggiornamento stato'); }
                                  }}
                                  className={`text-[10px] px-3 py-1.5 rounded-full border font-semibold uppercase tracking-wider transition-all ${
                                    (order.status ?? 'nuovo') === s.value ? s.color : 'border-black/10 text-black/30 hover:border-black/25'
                                  }`}>
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Storico stati */}
                          {order.status_history && order.status_history.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-black/30 mb-2">Storico</p>
                              <div className="space-y-1">
                                {order.status_history.map((h, i) => {
                                  const sc = ORDER_STATUSES.find(x => x.value === h.status);
                                  return (
                                    <div key={i} className="flex items-center gap-2">
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${sc?.color ?? 'border-black/10 text-black/30'}`}>{sc?.label ?? h.status}</span>
                                      <span className="text-[9px] text-black/25">{fmtTime(h.at)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Items — raggruppati per categoria */}
                          {(() => {
                            const burgerNames = new Set(BURGERS.map(b => b.name));
                            const friesNames  = new Set(FRIES.map(f => f.name));
                            const categories: { label: string; items: typeof order.items }[] = [];
                            const byLabel: Record<string, typeof order.items> = {};
                            for (const item of order.items) {
                              const cat = burgerNames.has(item.name) ? 'Burger' : friesNames.has(item.name) ? 'Fries / Antipasti' : 'Extra';
                              if (!byLabel[cat]) { byLabel[cat] = []; categories.push({ label: cat, items: byLabel[cat] }); }
                              byLabel[cat].push(item);
                            }
                            const sizeLabel: Record<string, string> = { single: 'Singolo', double: 'Doppio', triple: 'Triplo' };
                            return (
                              <div className="space-y-3">
                                {categories.map(({ label, items }) => (
                                  <div key={label}>
                                    <p className="text-[9px] uppercase tracking-[0.25em] text-[#CF6990] font-bold mb-1.5">{label}</p>
                                    <div className="space-y-2">
                                      {items.map((item, i) => (
                                        <div key={i} className="bg-white rounded-xl border border-black/6 px-3 py-2.5">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                                <span className="text-[10px] font-bold text-black/30">{item.qty ?? 1}×</span>
                                                <span className="text-sm font-semibold text-[#1a0a10]">{item.name}</span>
                                                {item.size && (
                                                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-black/5 text-black/40 font-semibold">
                                                    {sizeLabel[item.size] ?? item.size}
                                                  </span>
                                                )}
                                              </div>
                                              {item.combo && (
                                                <div className="flex items-center gap-1 mt-1">
                                                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-200 font-semibold">
                                                    Combo{item.drink ? `: ${item.drink}` : ''}
                                                  </span>
                                                </div>
                                              )}
                                              {item.removed?.map((r, ri) => (
                                                <div key={ri} className="flex items-center gap-1 mt-1">
                                                  <span className="text-[11px] font-bold text-black/30">−</span>
                                                  <span className="text-[11px] text-black/40">{r}</span>
                                                </div>
                                              ))}
                                              {item.extras?.map((e, ei) => (
                                                <div key={ei} className="flex items-center gap-1 mt-1">
                                                  <span className="text-[11px] font-bold text-[#CF6990]">+</span>
                                                  <span className="text-[11px] text-[#CF6990]">{e}</span>
                                                </div>
                                              ))}
                                            </div>
                                            <span className="text-sm font-bold text-[#1a0a10] shrink-0 tabular-nums">€{item.price.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}

                          {(order.pickup_time || order.notes) && (
                            <p className="text-[11px] text-black/40 pt-2 border-t border-black/6 italic">
                              ⏱ {order.pickup_time || order.notes}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-black/10">
                            <span className="text-sm font-bold text-black/60">Totale</span>
                            <span className="text-sm font-bold text-[#CF6990]">€{order.total.toFixed(2)}</span>
                          </div>

                          {/* Note admin */}
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-black/30 mb-2">Note interne</p>
                            {editingNoteId === order.id ? (
                              <div className="space-y-2">
                                <textarea value={noteValue}
                                  onChange={e => setNoteValue(e.target.value)}
                                  placeholder="Nota visibile solo all'admin…"
                                  rows={2}
                                  className="w-full border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-white resize-none"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button onClick={async () => {
                                    setSavingNoteId(order.id);
                                    try {
                                      await updateOrderNotes(loggedUser.access_token, order.id, noteValue);
                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, admin_notes: noteValue } : o));
                                      setEditingNoteId(null);
                                    } catch { alert('Errore nel salvataggio nota'); }
                                    setSavingNoteId(null);
                                  }} disabled={savingNoteId === order.id}
                                    className="px-3 py-1.5 bg-[#1a0a10] text-white text-[10px] uppercase tracking-wider rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">
                                    {savingNoteId === order.id ? 'Salvataggio…' : 'Salva'}
                                  </button>
                                  <button onClick={() => setEditingNoteId(null)}
                                    className="px-3 py-1.5 border border-black/12 text-black/40 text-[10px] uppercase tracking-wider rounded-xl hover:border-black/25 transition-colors">
                                    Annulla
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingNoteId(order.id); setNoteValue(order.admin_notes ?? ''); }}
                                className="w-full text-left px-3 py-2.5 rounded-xl border border-dashed border-black/15 text-[11px] text-black/35 hover:border-[#CF6990] hover:text-[#CF6990] transition-colors">
                                {order.admin_notes || '+ Aggiungi nota interna…'}
                              </button>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => printOrder(order)}
                              className="flex-1 py-2.5 rounded-xl border border-black/12 text-black/40 text-[10px] uppercase tracking-[0.15em] font-semibold hover:border-black/30 hover:text-black/60 transition-colors">
                              🖨 Stampa
                            </button>
                            <button onClick={() => handleDeleteOrder(order.id)} disabled={deletingId === order.id}
                              className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-400 text-[10px] uppercase tracking-[0.15em] font-semibold hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-40">
                              {deletingId === order.id ? 'Eliminazione…' : '🗑 Elimina'}
                            </button>
                          </div>
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

      {tab === 'statistiche' && <StatisticheTab orders={orders} adminToken={loggedUser.access_token} />}
      {tab === 'menu'        && <MenuTab adminToken={loggedUser.access_token} />}
      {tab === 'smash'       && <SmashTab adminToken={loggedUser.access_token} />}
      {tab === 'orari'       && <OrariTab adminToken={loggedUser.access_token} />}
      {tab === 'foodcost'    && <FoodCostTab adminToken={loggedUser.access_token} />}

      {/* ── Profili ── */}
      {tab === 'profili' && (
        <div className="p-4 space-y-4 max-w-2xl mx-auto pb-16">
          {isPrimaryAdmin && (
            <div className="bg-white rounded-2xl border border-black/6 shadow-sm overflow-hidden">
              <p className="px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-[#CF6990] font-bold border-b border-black/6">Amministratori</p>
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/4">
                <div>
                  <p className="text-sm font-semibold text-[#1a0a10]">{PRIMARY_ADMIN}</p>
                  <p className="text-[10px] text-black/30 mt-0.5">Admin principale</p>
                </div>
                <span className="text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#FBE8EF] text-[#CF6990] border border-[#CF6990]/20 font-semibold">Owner</span>
              </div>
              {adminEmails.map(email => (
                <div key={email} className="flex items-center justify-between px-4 py-3 border-b border-black/4 last:border-0">
                  <p className="text-sm text-[#1a0a10]">{email}</p>
                  <button onClick={async () => saveAdminEmails(adminEmails.filter(e => e !== email))}
                    className="text-[10px] text-red-400 hover:text-red-600 uppercase tracking-wider transition-colors">Rimuovi</button>
                </div>
              ))}
              <div className="px-4 py-3 flex gap-2">
                <input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newAdminEmail.includes('@')) { saveAdminEmails([...new Set([...adminEmails, newAdminEmail.trim().toLowerCase()])]).then(() => setNewAdminEmail('')); } }}
                  placeholder="Aggiungi email admin…"
                  className="flex-1 border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
                />
                <button onClick={async () => { if (!newAdminEmail.includes('@')) return; await saveAdminEmails([...new Set([...adminEmails, newAdminEmail.trim().toLowerCase()])]); setNewAdminEmail(''); }}
                  disabled={savingAdmins || !newAdminEmail.includes('@')}
                  className="px-4 py-2 bg-[#1a0a10] text-white text-[10px] uppercase tracking-wider rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">+</button>
              </div>
            </div>
          )}

          {profilesLoading && <Spinner />}
          {!profilesLoading && profiles.length === 0 && <p className="text-center text-black/30 py-16 text-sm uppercase tracking-wider">Nessun profilo ancora</p>}

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
                      {isExtraAdmin && <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#FBE8EF] text-[#CF6990] border border-[#CF6990]/20 font-semibold shrink-0">Admin</span>}
                    </div>
                    <p className="text-[11px] text-black/35 truncate">{p.email}</p>
                    <p className="text-[10px] text-black/25 mt-0.5">Prima visita: {new Date(p.first_seen).toLocaleDateString('it-IT')}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {tier ? <p className="text-[11px] font-bold" style={{ color: tier.color }}>{tier.name}</p>
                      : nextTier ? <p className="text-[10px] text-black/25">→ {nextTier.name}</p> : null}
                    <p className="text-xl font-bold text-[#1a0a10]">{count}</p>
                    <p className="text-[9px] text-black/25 uppercase tracking-wide">ordini</p>
                    {p.order_count_override !== null && <p className="text-[9px] text-[#CF6990]">override</p>}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-black/6 flex items-center justify-between gap-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="number" min="0" value={editValue} onChange={e => setEditValue(e.target.value)}
                        placeholder="Override…"
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
                      }} className="px-3 py-2 bg-[#1a0a10] text-white text-[10px] uppercase tracking-wider rounded-xl hover:bg-[#CF6990] transition-colors">Salva</button>
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

                  {isPrimaryAdmin && p.email !== PRIMARY_ADMIN && (
                    <button onClick={async () => {
                      const next = isExtraAdmin ? adminEmails.filter(e => e !== p.email) : [...adminEmails, p.email];
                      await saveAdminEmails(next);
                    }} disabled={savingAdmins}
                      className={`text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-xl border font-semibold transition-colors shrink-0 ${
                        isExtraAdmin
                          ? 'border-[#CF6990]/30 text-[#CF6990] hover:bg-red-50 hover:border-red-300 hover:text-red-400'
                          : 'border-black/12 text-black/30 hover:border-[#CF6990] hover:text-[#CF6990]'
                      }`}>
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
