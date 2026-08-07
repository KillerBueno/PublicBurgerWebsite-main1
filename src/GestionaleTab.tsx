import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchTable, insertRow, updateRow, upsertRow, deleteRow, renameSupplierOnPurchases,
  insertProductPrices, productKey,
  PURCHASE_CATEGORIES, PAYMENT_METHODS, UTILITY_TYPES, VAT_RATES,
  eur, monthKey, monthLabel, todayISO, saleTotal, avgTicket,
  type Supplier, type Purchase, type DailySale, type FixedCost,
  type Utility, type Employee, type StaffPayment, type ProductPrice,
} from './lib/gestionale';
import { fetchSetting, updateSetting } from './lib/settings';
import { parseInvoiceFiles, type ParsedInvoice, type ParseError } from './lib/fatturapa';

type Section = 'dashboard' | 'vendite' | 'acquisti' | 'fornitori' | 'prezzi' | 'costi' | 'primanota' | 'iva';

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard',  icon: '📊' },
  { key: 'vendite',   label: 'Vendite',    icon: '💶' },
  { key: 'acquisti',  label: 'Acquisti',   icon: '🧾' },
  { key: 'fornitori', label: 'Fornitori',  icon: '🚚' },
  { key: 'prezzi',    label: 'Prezzi',     icon: '📈' },
  { key: 'costi',     label: 'Costi',      icon: '🏠' },
  { key: 'primanota', label: 'Prima Nota', icon: '📒' },
  { key: 'iva',       label: 'IVA',        icon: '🏛' },
];

const num = (v: string | number): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });

// ─── UI primitives ────────────────────────────────────────────────────────────

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? 'col-span-2' : ''}>
      <span className="block text-[9px] uppercase tracking-widest text-black/35 mb-1">{label}</span>
      {children}
    </label>
  );
}

// Base senza larghezza: da usare quando il campo sta in una riga flex
const inputBase =
  'border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-white';
const inputCls = `w-full ${inputBase}`;

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-black/6 shadow-sm ${className}`}>{children}</div>
  );
}

function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-black/45">{children}</h3>
      {action}
    </div>
  );
}

function KpiGrid({ items }: { items: { label: string; value: string; hint?: string; tone?: 'good' | 'bad' }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map(k => (
        <Card key={k.label} className="px-3 py-3">
          <p className="text-[9px] uppercase tracking-widest text-black/35">{k.label}</p>
          <p
            className={`text-lg font-bold tabular-nums mt-0.5 ${
              k.tone === 'good' ? 'text-green-600' : k.tone === 'bad' ? 'text-red-500' : 'text-[#1a0a10]'
            }`}
          >
            {k.value}
          </p>
          {k.hint && <p className="text-[9px] text-black/30 mt-0.5">{k.hint}</p>}
        </Card>
      ))}
    </div>
  );
}

function AddButton({ open, onClick, label }: { open: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-colors ${
        open ? 'border border-black/12 text-black/40 hover:border-black/25' : 'bg-[#1a0a10] text-white hover:bg-[#CF6990]'
      }`}
    >
      {open ? 'Annulla' : `+ ${label}`}
    </button>
  );
}

function MonthPicker({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={`${inputCls} w-auto py-1.5 text-[11px]`}>
      {options.map(m => (
        <option key={m} value={m}>{monthLabel(m)}</option>
      ))}
    </select>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GestionaleTab({ adminToken }: { adminToken: string }) {
  const [section, setSection] = useState<Section>('dashboard');

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<DailySale[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [staffPayments, setStaffPayments] = useState<StaffPayment[]>([]);
  const [ivaRate, setIvaRate] = useState(10);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sup, pur, sal, fix, uti, emp, stf, rate] = await Promise.all([
          fetchTable<Supplier>(adminToken, 'suppliers', 'order=name.asc'),
          fetchTable<Purchase>(adminToken, 'purchases', 'order=date.desc&limit=2000'),
          fetchTable<DailySale>(adminToken, 'daily_sales', 'order=date.desc&limit=1000'),
          fetchTable<FixedCost>(adminToken, 'fixed_costs', 'order=name.asc'),
          fetchTable<Utility>(adminToken, 'utilities', 'order=date.desc&limit=500'),
          fetchTable<Employee>(adminToken, 'employees', 'order=name.asc'),
          fetchTable<StaffPayment>(adminToken, 'staff_payments', 'order=date.desc&limit=1000'),
          fetchSetting<number>('iva_rate'),
        ]);
        if (cancelled) return;
        setSuppliers(sup); setPurchases(pur); setSales(sal);
        setFixedCosts(fix); setUtilities(uti); setEmployees(emp); setStaffPayments(stf);
        if (rate) setIvaRate(rate);
      } catch (e) {
        if (!cancelled) {
          setErr(
            e instanceof Error && e.message.includes('404')
              ? 'Tabelle non trovate: esegui supabase-gestionale.sql nel SQL Editor di Supabase.'
              : 'Errore nel caricamento. Verifica di aver eseguito supabase-gestionale.sql.',
          );
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [adminToken]);

  // Mesi che contengono davvero movimenti
  const dataMonths = useMemo(() => {
    const set = new Set<string>();
    for (const p of purchases) set.add(monthKey(p.date));
    for (const s of sales) set.add(monthKey(s.date));
    for (const u of utilities) set.add(monthKey(u.date));
    for (const s of staffPayments) set.add(monthKey(s.date));
    return [...set].sort().reverse();
  }, [purchases, sales, utilities, staffPayments]);

  // Nel menu c'è sempre anche il mese corrente, per poterci registrare
  const months = useMemo(
    () => [...new Set([monthKey(todayISO()), ...dataMonths])].sort().reverse(),
    [dataMonths],
  );

  const [month, setMonth] = useState('');
  useEffect(() => {
    if (month && months.includes(month)) return;
    // Si apre sul mese più recente con movimenti: se il corrente è vuoto
    // i dati sembrerebbero spariti
    setMonth(dataMonths[0] ?? monthKey(todayISO()));
  }, [dataMonths, months]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-[#CF6990] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🗄</div>
        <p className="text-sm text-black/60 mb-2 font-semibold">Gestionale non inizializzato</p>
        <p className="text-[12px] text-black/40 leading-relaxed">{err}</p>
      </div>
    );
  }

  const shared = {
    adminToken, month, months, setMonth,
    suppliers, setSuppliers, purchases, setPurchases, sales, setSales,
    fixedCosts, setFixedCosts, utilities, setUtilities,
    employees, setEmployees, staffPayments, setStaffPayments,
    ivaRate, setIvaRate,
  };

  return (
    <div className="pb-20">
      {/* Sub-nav */}
      <div className="flex gap-1 px-3 py-2.5 bg-white border-b border-black/8 overflow-x-auto justify-start md:justify-center">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-colors ${
              section === s.key
                ? 'bg-[#1a0a10] text-white'
                : 'text-black/35 hover:text-black/60 hover:bg-black/4'
            }`}
          >
            <span className="mr-1">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-5">
        {section === 'dashboard' && <DashboardSection {...shared} />}
        {section === 'vendite'   && <VenditeSection {...shared} />}
        {section === 'acquisti'  && <AcquistiSection {...shared} />}
        {section === 'fornitori' && <FornitoriSection {...shared} />}
        {section === 'prezzi'    && <PrezziSection adminToken={adminToken} />}
        {section === 'costi'     && <CostiSection {...shared} />}
        {section === 'primanota' && <PrimaNotaSection {...shared} />}
        {section === 'iva'       && <IvaSection {...shared} />}
      </div>
    </div>
  );
}

// Props condivise fra le sezioni
interface Shared {
  adminToken: string;
  month: string;
  months: string[];
  setMonth: (m: string) => void;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  sales: DailySale[];
  setSales: React.Dispatch<React.SetStateAction<DailySale[]>>;
  fixedCosts: FixedCost[];
  setFixedCosts: React.Dispatch<React.SetStateAction<FixedCost[]>>;
  utilities: Utility[];
  setUtilities: React.Dispatch<React.SetStateAction<Utility[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  staffPayments: StaffPayment[];
  setStaffPayments: React.Dispatch<React.SetStateAction<StaffPayment[]>>;
  ivaRate: number;
  setIvaRate: (r: number) => void;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardSection({ month, months, setMonth, sales, purchases, utilities, staffPayments, fixedCosts }: Shared) {
  const inMonth = <T extends { date: string }>(list: T[]) => list.filter(x => monthKey(x.date) === month);

  const mSales = inMonth(sales);
  const mPurch = inMonth(purchases);
  const mUtil  = inMonth(utilities);
  const mStaff = inMonth(staffPayments);

  const revenue     = mSales.reduce((s, x) => s + saleTotal(x), 0);
  const fiscal      = mSales.reduce((s, x) => s + Number(x.fiscal_total), 0);
  const orders      = mSales.reduce((s, x) => s + x.num_orders, 0);
  const purchTotal  = mPurch.reduce((s, x) => s + Number(x.total), 0);
  const utilTotal   = mUtil.reduce((s, x) => s + Number(x.amount), 0);
  const staffTotal  = mStaff.reduce((s, x) => s + Number(x.amount), 0);
  const fixedTotal  = fixedCosts.filter(c => c.active).reduce((s, x) => s + Number(x.monthly_amount), 0);
  const costs       = purchTotal + utilTotal + staffTotal + fixedTotal;
  const margin      = revenue - costs;

  // Mese precedente
  const prevMonth = (() => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();
  const prevRevenue = sales.filter(s => monthKey(s.date) === prevMonth).reduce((s, x) => s + saleTotal(x), 0);
  const variation = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : null;

  const topSuppliers = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const p of purchases) totals[p.supplier_name] = (totals[p.supplier_name] ?? 0) + Number(p.total);
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [purchases]);

  const unpaid = purchases.filter(p => !p.paid);
  const unpaidTotal = unpaid.reduce((s, p) => s + Number(p.total), 0);
  const overdue = unpaid.filter(p => p.due_date && p.due_date < todayISO());

  const incidence = (v: number) => (revenue > 0 ? `${((v / revenue) * 100).toFixed(1)}% ricavi` : '—');

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#1a0a10]">Riepilogo mensile</h2>
        <MonthPicker value={month} onChange={setMonth} options={months} />
      </div>

      <KpiGrid
        items={[
          { label: 'Incassato', value: eur(revenue), hint: `${mSales.length} giornate` },
          { label: 'Fiscale', value: eur(fiscal) },
          {
            label: 'Var. mese prec.',
            value: variation === null ? '—' : `${variation > 0 ? '+' : ''}${variation.toFixed(1)}%`,
            tone: variation === null ? undefined : variation >= 0 ? 'good' : 'bad',
          },
          { label: 'Scontrino medio', value: orders > 0 ? eur(revenue / orders) : '—', hint: `${orders} ordini` },
        ]}
      />

      <div>
        <SectionTitle>Uscite del mese</SectionTitle>
        <KpiGrid
          items={[
            { label: 'Acquisti', value: eur(purchTotal), hint: incidence(purchTotal) },
            { label: 'Personale', value: eur(staffTotal), hint: incidence(staffTotal) },
            { label: 'Utenze', value: eur(utilTotal), hint: incidence(utilTotal) },
            { label: 'Costi fissi', value: eur(fixedTotal), hint: incidence(fixedTotal) },
          ]}
        />
      </div>

      <Card className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-black/35">Margine stimato</p>
            <p className={`text-2xl font-bold tabular-nums ${margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {eur(margin)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest text-black/35">Costi totali</p>
            <p className="text-sm font-bold text-black/60 tabular-nums">{eur(costs)}</p>
            {revenue > 0 && (
              <p className="text-[10px] text-black/35 mt-0.5">{((costs / revenue) * 100).toFixed(1)}% dei ricavi</p>
            )}
          </div>
        </div>
      </Card>

      {unpaid.length > 0 && (
        <Card className={`px-4 py-3.5 ${overdue.length ? 'border-red-200 bg-red-50/40' : ''}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{overdue.length ? '⚠️' : '⏳'}</span>
            <div className="flex-1">
              <p className="text-[12px] font-bold text-[#1a0a10]">
                {unpaid.length} fattur{unpaid.length > 1 ? 'e' : 'a'} da pagare · {eur(unpaidTotal)}
              </p>
              {overdue.length > 0 && (
                <p className="text-[11px] text-red-500 font-semibold mt-0.5">
                  {overdue.length} già scadut{overdue.length > 1 ? 'e' : 'a'}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {topSuppliers.length > 0 && (
        <div>
          <SectionTitle>Top fornitori (storico)</SectionTitle>
          <Card className="divide-y divide-black/6">
            {topSuppliers.map(([name, total], i) => (
              <div key={name} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-[10px] font-bold text-black/25 w-4">{i + 1}</span>
                <span className="flex-1 text-[12px] text-[#1a0a10] truncate">{name}</span>
                <span className="text-[12px] font-bold text-[#CF6990] tabular-nums">{eur(total)}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </>
  );
}

// ─── Vendite giornaliere ──────────────────────────────────────────────────────

const emptySale = () => ({
  date: todayISO(), cash: '', pos: '', takeaway: '', delivery: '',
  deliveroo: '', justeat: '', num_orders: '', proforma_total: '', notes: '',
});

function VenditeSection({ adminToken, month, months, setMonth, sales, setSales }: Shared) {
  const [form, setForm] = useState(emptySale());
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const mSales = sales.filter(s => monthKey(s.date) === month);
  const totals = mSales.reduce(
    (a, s) => ({
      cash: a.cash + Number(s.cash),
      pos: a.pos + Number(s.pos),
      deliveroo: a.deliveroo + Number(s.deliveroo),
      justeat: a.justeat + Number(s.justeat),
      total: a.total + saleTotal(s),
    }),
    { cash: 0, pos: 0, deliveroo: 0, justeat: 0, total: 0 },
  );

  // Il totale fiscale è la somma dei canali tracciati a scontrino
  const fiscalPreview =
    num(form.cash) + num(form.pos) + num(form.deliveroo) + num(form.justeat);
  const grandPreview = fiscalPreview + num(form.proforma_total);

  async function save() {
    if (!form.date) return alert('Inserisci la data');
    setSaving(true);
    try {
      const row = await upsertRow<DailySale>(adminToken, 'daily_sales', {
        date: form.date,
        cash: num(form.cash),
        pos: num(form.pos),
        takeaway: num(form.takeaway),
        delivery: num(form.delivery),
        deliveroo: num(form.deliveroo),
        justeat: num(form.justeat),
        num_orders: Math.round(num(form.num_orders)),
        fiscal_total: fiscalPreview,
        proforma_total: num(form.proforma_total),
        notes: form.notes || null,
      }, 'date');
      setSales(prev => [row, ...prev.filter(s => s.date !== row.date)].sort((a, b) => b.date.localeCompare(a.date)));
      setForm(emptySale());
      setOpen(false);
    } catch (e) {
      alert(`Errore: ${e instanceof Error ? e.message : 'sconosciuto'}`);
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Eliminare questa giornata?')) return;
    try {
      await deleteRow(adminToken, 'daily_sales', id);
      setSales(prev => prev.filter(s => s.id !== id));
    } catch { alert('Errore eliminazione'); }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <MonthPicker value={month} onChange={setMonth} options={months} />
        <AddButton open={open} onClick={() => setOpen(o => !o)} label="Giornata" />
      </div>

      <KpiGrid
        items={[
          { label: 'Totale mese', value: eur(totals.total) },
          { label: 'Contanti', value: eur(totals.cash) },
          { label: 'POS', value: eur(totals.pos) },
          { label: 'Delivery app', value: eur(totals.deliveroo + totals.justeat) },
        ]}
      />

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <Card className="p-4 space-y-3">
              <p className="text-[11px] text-black/40 leading-relaxed">
                Il fiscale è la somma di contanti, POS, Deliveroo e Just Eat.
                I campi <strong>di cui</strong> sono una ripartizione informativa e non si sommano:
                un asporto pagato in contanti è già dentro i contanti.
                Reinserendo una data già registrata, i valori vengono sovrascritti.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Data"><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} /></Field>
                <Field label="N° ordini"><input type="number" inputMode="numeric" value={form.num_orders} onChange={e => setForm(f => ({ ...f, num_orders: e.target.value }))} className={inputCls} placeholder="0" /></Field>
                <Field label="Contanti"><input type="number" step="0.01" inputMode="decimal" value={form.cash} onChange={e => setForm(f => ({ ...f, cash: e.target.value }))} className={inputCls} placeholder="0,00" /></Field>
                <Field label="POS (SumUp)"><input type="number" step="0.01" inputMode="decimal" value={form.pos} onChange={e => setForm(f => ({ ...f, pos: e.target.value }))} className={inputCls} placeholder="0,00" /></Field>
                <Field label="Deliveroo"><input type="number" step="0.01" inputMode="decimal" value={form.deliveroo} onChange={e => setForm(f => ({ ...f, deliveroo: e.target.value }))} className={inputCls} placeholder="0,00" /></Field>
                <Field label="Just Eat"><input type="number" step="0.01" inputMode="decimal" value={form.justeat} onChange={e => setForm(f => ({ ...f, justeat: e.target.value }))} className={inputCls} placeholder="0,00" /></Field>
                <Field label="Di cui asporto"><input type="number" step="0.01" inputMode="decimal" value={form.takeaway} onChange={e => setForm(f => ({ ...f, takeaway: e.target.value }))} className={inputCls} placeholder="0,00" /></Field>
                <Field label="Di cui consegne"><input type="number" step="0.01" inputMode="decimal" value={form.delivery} onChange={e => setForm(f => ({ ...f, delivery: e.target.value }))} className={inputCls} placeholder="0,00" /></Field>
                <Field label="Proforma (non fiscale)"><input type="number" step="0.01" inputMode="decimal" value={form.proforma_total} onChange={e => setForm(f => ({ ...f, proforma_total: e.target.value }))} className={inputCls} placeholder="0,00" /></Field>
                <Field label="Note"><input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} placeholder="…" /></Field>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#fdf5f8] px-3 py-2.5">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-black/35">Fiscale</p>
                  <p className="text-sm font-bold text-[#1a0a10] tabular-nums">{eur(fiscalPreview)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-widest text-black/35">Totale incassi</p>
                  <p className="text-base font-bold text-[#CF6990] tabular-nums">{eur(grandPreview)}</p>
                </div>
              </div>

              <button onClick={save} disabled={saving}
                className="w-full py-3 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.2em] font-bold rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">
                {saving ? 'Salvataggio…' : 'Salva giornata'}
              </button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="divide-y divide-black/6">
        {mSales.length === 0 && <p className="text-center text-black/25 py-10 text-[12px]">Nessuna giornata registrata</p>}
        {mSales.map(s => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-11 shrink-0">
              <p className="text-[11px] font-bold text-[#1a0a10]">{fmtDay(s.date)}</p>
              <p className="text-[9px] text-black/30 capitalize">
                {new Date(s.date).toLocaleDateString('it-IT', { weekday: 'short' })}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-black/45">
                💵 {eur(Number(s.cash))} · 💳 {eur(Number(s.pos))}
                {Number(s.deliveroo) + Number(s.justeat) > 0 && ` · 🛵 ${eur(Number(s.deliveroo) + Number(s.justeat))}`}
              </p>
              <p className="text-[10px] text-black/30">
                {s.num_orders} ordini · scontrino {avgTicket(s) ? eur(avgTicket(s)) : '—'}
              </p>
            </div>
            <span className="text-[13px] font-bold text-[#1a0a10] tabular-nums shrink-0">{eur(saleTotal(s))}</span>
            <button onClick={() => remove(s.id)} className="text-black/20 hover:text-red-400 text-sm shrink-0">×</button>
          </div>
        ))}
      </Card>
    </>
  );
}

// ─── Acquisti / Fatture ───────────────────────────────────────────────────────

interface FormLine { amount: string; rate: string }

const emptyPurchase = () => ({
  date: todayISO(), supplier_name: '', category: '', doc_number: '',
  lines: [{ amount: '', rate: '0' }] as FormLine[],
  payment_method: '', due_date: '',
  paid: false, notes: '', grossMode: false,
});

/** Scompone una riga: se grossMode l'importo inserito è lordo e va scorporato. */
function calcLine(line: FormLine, grossMode: boolean) {
  const rate = num(line.rate);
  const entered = num(line.amount);
  const taxable = grossMode ? entered / (1 + rate / 100) : entered;
  const vat = taxable * (rate / 100);
  return { rate, taxable, vat, total: taxable + vat };
}

function AcquistiSection({ adminToken, month, months, setMonth, purchases, setPurchases, suppliers, setSuppliers }: Shared) {
  const [form, setForm] = useState(emptyPurchase());
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'tutti' | 'daPagare' | 'pagati'>('tutti');

  const calcLines = form.lines.map(l => calcLine(l, form.grossMode));
  const taxable   = calcLines.reduce((s, l) => s + l.taxable, 0);
  const vatAmount = calcLines.reduce((s, l) => s + l.vat, 0);
  const total     = taxable + vatAmount;
  const multiRate = calcLines.filter(l => l.taxable > 0).length > 1;

  const setLine = (i: number, patch: Partial<FormLine>) =>
    setForm(f => ({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  const addLine = () =>
    setForm(f => ({ ...f, lines: [...f.lines, { amount: '', rate: '22' }] }));
  const removeLine = (i: number) =>
    setForm(f => ({ ...f, lines: f.lines.filter((_, j) => j !== i) }));

  const mPurch = purchases.filter(p => monthKey(p.date) === month);
  const visible = mPurch.filter(p =>
    filter === 'tutti' ? true : filter === 'daPagare' ? !p.paid : p.paid,
  );
  const monthTotal = mPurch.reduce((s, p) => s + Number(p.total), 0);
  const unpaidTotal = mPurch.filter(p => !p.paid).reduce((s, p) => s + Number(p.total), 0);

  // Categoria suggerita dal fornitore già noto
  function onSupplierChange(name: string) {
    const known = suppliers.find(s => s.name.toLowerCase() === name.trim().toLowerCase());
    setForm(f => ({
      ...f,
      supplier_name: name,
      category: known?.category ?? f.category,
      payment_method: known?.payment_terms ?? f.payment_method,
    }));
  }

  async function save() {
    if (!form.supplier_name.trim()) return alert('Inserisci il fornitore');
    if (total <= 0) return alert('Inserisci almeno un importo valido');
    setSaving(true);
    try {
      // Crea il fornitore al volo se non esiste
      let supplier = suppliers.find(
        s => s.name.toLowerCase() === form.supplier_name.trim().toLowerCase(),
      );
      if (!supplier) {
        supplier = await insertRow<Supplier>(adminToken, 'suppliers', {
          name: form.supplier_name.trim(),
          category: form.category || null,
        });
        setSuppliers(prev => [...prev, supplier!].sort((a, b) => a.name.localeCompare(b.name)));
      }

      const row = await insertRow<Purchase>(adminToken, 'purchases', {
        date: form.date,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        category: form.category || null,
        doc_number: form.doc_number || null,
        taxable: Number(taxable.toFixed(2)),
        // Aliquota prevalente = quella con l'imponibile maggiore
        vat_rate: calcLines.reduce((a, b) => (b.taxable > a.taxable ? b : a)).rate,
        vat_amount: Number(vatAmount.toFixed(2)),
        total: Number(total.toFixed(2)),
        vat_lines: calcLines
          .filter(l => l.taxable > 0)
          .map(l => ({
            rate: l.rate,
            taxable: Number(l.taxable.toFixed(2)),
            vat: Number(l.vat.toFixed(2)),
          })),
        payment_method: form.payment_method || null,
        due_date: form.due_date || null,
        paid: form.paid,
        paid_date: form.paid ? form.date : null,
        notes: form.notes || null,
      });
      setPurchases(prev => [row, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
      setForm(emptyPurchase());
      setOpen(false);
    } catch (e) {
      alert(`Errore: ${e instanceof Error ? e.message : 'sconosciuto'}`);
    }
    setSaving(false);
  }

  async function togglePaid(p: Purchase) {
    const next = !p.paid;
    try {
      const row = await updateRow<Purchase>(adminToken, 'purchases', p.id, {
        paid: next,
        paid_date: next ? todayISO() : null,
      });
      setPurchases(prev => prev.map(x => (x.id === p.id ? row : x)));
    } catch { alert('Errore aggiornamento'); }
  }

  async function remove(id: string) {
    if (!confirm('Eliminare questa fattura?')) return;
    try {
      await deleteRow(adminToken, 'purchases', id);
      setPurchases(prev => prev.filter(p => p.id !== id));
    } catch { alert('Errore eliminazione'); }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <MonthPicker value={month} onChange={setMonth} options={months} />
        <div className="flex gap-1.5">
          <button
            onClick={() => { setImportOpen(o => !o); setOpen(false); }}
            className={`px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-colors ${
              importOpen ? 'border border-black/12 text-black/40 hover:border-black/25' : 'border border-[#CF6990] text-[#CF6990] hover:bg-[#FBE8EF]'
            }`}
          >
            {importOpen ? 'Chiudi' : '↥ Importa XML'}
          </button>
          <AddButton open={open} onClick={() => { setOpen(o => !o); setImportOpen(false); }} label="Fattura" />
        </div>
      </div>

      <AnimatePresence>
        {importOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ImportXmlPanel
              adminToken={adminToken}
              suppliers={suppliers}
              setSuppliers={setSuppliers}
              purchases={purchases}
              setPurchases={setPurchases}
              onDone={() => setImportOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <KpiGrid
        items={[
          { label: 'Acquisti mese', value: eur(monthTotal), hint: `${mPurch.length} documenti` },
          { label: 'Da pagare', value: eur(unpaidTotal), tone: unpaidTotal > 0 ? 'bad' : undefined },
          { label: 'IVA credito', value: eur(mPurch.reduce((s, p) => s + Number(p.vat_amount), 0)) },
          { label: 'Fornitori', value: String(new Set(mPurch.map(p => p.supplier_name)).size) },
        ]}
      />

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <Card className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Data documento">
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="N° documento">
                  <input type="text" value={form.doc_number} onChange={e => setForm(f => ({ ...f, doc_number: e.target.value }))} className={inputCls} placeholder="es. 128/A" />
                </Field>

                <Field label="Fornitore" wide>
                  <input
                    type="text" list="suppliers-list" value={form.supplier_name}
                    onChange={e => onSupplierChange(e.target.value)}
                    className={inputCls} placeholder="Scrivi o scegli — se nuovo viene creato"
                  />
                  <datalist id="suppliers-list">
                    {suppliers.map(s => <option key={s.id} value={s.name} />)}
                  </datalist>
                </Field>

                <Field label="Categoria">
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                    <option value="">—</option>
                    {PURCHASE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Pagamento">
                  <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} className={inputCls}>
                    <option value="">—</option>
                    {PAYMENT_METHODS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>

                <Field label="Scadenza">
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Note">
                  <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} placeholder="…" />
                </Field>
              </div>

              {/* Righe per aliquota */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] uppercase tracking-widest text-black/35">
                    {form.grossMode ? 'Importi lordi per aliquota' : 'Imponibili per aliquota'}
                  </span>
                  <button type="button" onClick={addLine}
                    className="text-[10px] uppercase tracking-wider font-bold text-[#CF6990] hover:underline">
                    + Aliquota
                  </button>
                </div>

                <div className="space-y-2">
                  {form.lines.map((line, i) => {
                    const c = calcLines[i];
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="relative flex-1 min-w-0">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 text-sm pointer-events-none">€</span>
                          <input
                            type="number" step="0.01" inputMode="decimal" value={line.amount}
                            onChange={e => setLine(i, { amount: e.target.value })}
                            className={`${inputBase} w-full pl-7 no-spinner`} placeholder="0,00"
                          />
                        </div>
                        <select value={line.rate} onChange={e => setLine(i, { rate: e.target.value })}
                          className={`${inputBase} w-[86px] shrink-0`}>
                          {VAT_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                        <span className="w-16 shrink-0 text-right text-[11px] text-black/40 tabular-nums">
                          {c.vat > 0 ? `+${eur(c.vat)}` : '—'}
                        </span>
                        <button type="button" onClick={() => removeLine(i)}
                          disabled={form.lines.length === 1}
                          className="w-5 shrink-0 text-black/20 hover:text-red-400 disabled:opacity-0 disabled:cursor-default text-base leading-none">×</button>
                      </div>
                    );
                  })}
                </div>

                {multiRate && (
                  <p className="text-[10px] text-black/35 mt-1.5">
                    Fattura multi-aliquota: {calcLines.filter(l => l.taxable > 0).map(l => `${l.rate}%`).join(' + ')}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.grossMode}
                  onChange={e => setForm(f => ({ ...f, grossMode: e.target.checked }))}
                  className="accent-[#CF6990] w-4 h-4" />
                <span className="text-[11px] text-black/50">
                  Gli importi che inserisco sono <strong>lordi</strong> (scorporo l'IVA automaticamente)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.paid}
                  onChange={e => setForm(f => ({ ...f, paid: e.target.checked }))}
                  className="accent-[#CF6990] w-4 h-4" />
                <span className="text-[11px] text-black/50">Già pagata</span>
              </label>

              <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#fdf5f8] px-3 py-2.5 text-center">
                {[
                  { l: 'Imponibile', v: taxable },
                  { l: 'IVA', v: vatAmount },
                  { l: 'Totale', v: total },
                ].map((x, i) => (
                  <div key={x.l}>
                    <p className="text-[9px] uppercase tracking-widest text-black/35">{x.l}</p>
                    <p className={`font-bold tabular-nums ${i === 2 ? 'text-[#CF6990] text-base' : 'text-[#1a0a10] text-sm'}`}>
                      {eur(x.v)}
                    </p>
                  </div>
                ))}
              </div>

              <button onClick={save} disabled={saving}
                className="w-full py-3 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.2em] font-bold rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">
                {saving ? 'Salvataggio…' : 'Registra fattura'}
              </button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-1.5">
        {([
          ['tutti', 'Tutti'],
          ['daPagare', 'Da pagare'],
          ['pagati', 'Pagati'],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-colors ${
              filter === k ? 'bg-[#CF6990] text-white' : 'bg-white border border-black/8 text-black/35 hover:text-black/60'
            }`}>
            {l}
          </button>
        ))}
      </div>

      <Card className="divide-y divide-black/6">
        {visible.length === 0 && <p className="text-center text-black/25 py-10 text-[12px]">Nessuna fattura</p>}
        {visible.map(p => {
          const isOverdue = !p.paid && p.due_date && p.due_date < todayISO();
          return (
            <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${isOverdue ? 'bg-red-50/50' : ''}`}>
              <button onClick={() => togglePaid(p)}
                title={p.paid ? 'Segna come da pagare' : 'Segna come pagata'}
                className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center text-[11px] transition-colors ${
                  p.paid ? 'bg-green-500 border-green-500 text-white' : 'border-black/15 text-transparent hover:border-[#CF6990]'
                }`}>
                ✓
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#1a0a10] truncate">
                  {p.supplier_name}
                  {p.doc_number && <span className="text-black/30 font-normal"> · {p.doc_number}</span>}
                </p>
                <p className="text-[10px] text-black/35">
                  {fmtDay(p.date)}
                  {p.category && ` · ${p.category}`}
                  {p.due_date && !p.paid && (
                    <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
                      {' '}· scade {fmtDay(p.due_date)}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-bold text-[#1a0a10] tabular-nums">{eur(Number(p.total))}</p>
                {Number(p.vat_amount) > 0 && (
                  <p className="text-[9px] text-black/30">
                    iva {eur(Number(p.vat_amount))}
                    {p.vat_lines && p.vat_lines.length > 1 && (
                      <span className="text-[#CF6990]"> · {p.vat_lines.map(l => `${l.rate}%`).join('+')}</span>
                    )}
                  </p>
                )}
              </div>
              <button onClick={() => remove(p.id)} className="text-black/20 hover:text-red-400 text-sm shrink-0">×</button>
            </div>
          );
        })}
      </Card>
    </>
  );
}

// ─── Import XML FatturaPA ─────────────────────────────────────────────────────

const dupKey = (supplier: string, doc: string, date: string) =>
  `${supplier.trim().toLowerCase()}|${(doc ?? '').trim()}|${date}`;

function ImportXmlPanel({
  adminToken, suppliers, setSuppliers, purchases, setPurchases, onDone,
}: {
  adminToken: string;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  onDone: () => void;
}) {
  const [parsed, setParsed] = useState<ParsedInvoice[]>([]);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [skip, setSkip] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  // Doppioni: stesso fornitore, stesso numero, stessa data
  const existing = useMemo(
    () => new Set(purchases.map(p => dupKey(p.supplier_name, p.doc_number ?? '', p.date))),
    [purchases],
  );

  const isDup = (inv: ParsedInvoice) => existing.has(dupKey(inv.supplier_name, inv.doc_number, inv.date));

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true); setDone(null);
    const res = await parseInvoiceFiles(Array.from(list));
    setParsed(res.invoices);
    setErrors(res.errors);
    // I doppioni partono deselezionati
    setSkip(new Set(res.invoices.flatMap((inv, i) => (isDup(inv) ? [i] : []))));
    setBusy(false);
  }

  const selected = parsed.filter((_, i) => !skip.has(i));

  async function runImport() {
    if (!selected.length) return;
    setBusy(true);
    const cache = new Map(suppliers.map(s => [s.name.trim().toLowerCase(), s]));
    const newSuppliers: Supplier[] = [];
    const newPurchases: Purchase[] = [];

    try {
      for (const inv of selected) {
        const key = inv.supplier_name.trim().toLowerCase();
        let supplier = cache.get(key);
        if (!supplier) {
          supplier = await insertRow<Supplier>(adminToken, 'suppliers', {
            name: inv.supplier_name.trim(),
            vat_number: inv.supplier_vat,
          });
          cache.set(key, supplier);
          newSuppliers.push(supplier);
        }

        const row = await insertRow<Purchase>(adminToken, 'purchases', {
          date: inv.date,
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          // Categoria ereditata dall'anagrafica; sui fornitori nuovi resta da assegnare
          category: supplier.category ?? null,
          doc_number: inv.doc_number,
          taxable: inv.taxable,
          vat_rate: inv.vat_lines.reduce(
            (a, b) => (Math.abs(b.taxable) > Math.abs(a.taxable) ? b : a),
            inv.vat_lines[0] ?? { rate: 0, taxable: 0, vat: 0 },
          ).rate,
          vat_amount: inv.vat_amount,
          total: inv.total,
          vat_lines: inv.vat_lines,
          payment_method: inv.payment_method,
          due_date: inv.due_date,
          paid: false,
          notes: inv.is_credit_note ? `Nota di credito ${inv.doc_type}` : null,
        });
        newPurchases.push(row);

        // Storico prezzi: una riga per prodotto della fattura
        const priceRows = inv.lines
          .filter(l => l.unit_price > 0)
          .map(l => ({
            date: inv.date,
            supplier_id: supplier!.id,
            supplier_name: supplier!.name,
            product: l.description,
            product_key: productKey(l.description),
            quantity: l.quantity,
            unit: l.unit,
            unit_price: l.unit_price,
            doc_number: inv.doc_number || '',
          }));
        if (priceRows.length) await insertProductPrices(adminToken, priceRows);
      }

      if (newSuppliers.length) {
        setSuppliers(prev => [...prev, ...newSuppliers].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setPurchases(prev => [...newPurchases, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
      setDone(newPurchases.length);
      setParsed([]); setSkip(new Set());
    } catch (e) {
      alert(`Import interrotto: ${e instanceof Error ? e.message : 'errore'}\n\nLe fatture già importate sono state salvate.`);
      if (newPurchases.length) setPurchases(prev => [...newPurchases, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    }
    setBusy(false);
  }

  const totalSel = selected.reduce((s, i) => s + i.total, 0);

  return (
    <Card className="p-4 space-y-3">
      <div>
        <p className="text-[12px] font-bold text-[#1a0a10] mb-1">Importa fatture elettroniche</p>
        <p className="text-[11px] text-black/40 leading-relaxed">
          Seleziona i file <strong>.xml</strong> scaricati da Fatture e Corrispettivi o dal commercialista.
          Imponibili e aliquote vengono letti dal riepilogo IVA del documento.
        </p>
      </div>

      <input
        type="file" accept=".xml,text/xml,application/xml" multiple disabled={busy}
        onChange={e => onFiles(e.target.files)}
        className="block w-full text-[11px] text-black/50 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:uppercase file:tracking-wider file:font-bold file:bg-[#1a0a10] file:text-white hover:file:bg-[#CF6990] file:cursor-pointer cursor-pointer"
      />

      {busy && <p className="text-[11px] text-black/40 text-center py-2">Elaborazione…</p>}

      {done !== null && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <p className="text-[11px] text-green-700 font-semibold flex-1">
            {done} fattur{done === 1 ? 'a importata' : 'e importate'}
          </p>
          <button onClick={onDone} className="text-[10px] uppercase tracking-wider text-green-700 font-bold hover:underline">
            Chiudi
          </button>
        </div>
      )}

      {errors.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 space-y-1">
          {errors.map(e => (
            <p key={e.fileName} className="text-[10px] text-red-600">
              <strong>{e.fileName}</strong> — {e.message}
            </p>
          ))}
        </div>
      )}

      {parsed.length > 0 && (
        <>
          <div className="border border-black/8 rounded-xl divide-y divide-black/6 max-h-80 overflow-y-auto">
            {parsed.map((inv, i) => {
              const dup = isDup(inv);
              const checked = !skip.has(i);
              return (
                <label key={`${inv.fileName}-${i}`} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-black/2">
                  <input
                    type="checkbox" checked={checked}
                    onChange={() => setSkip(prev => {
                      const next = new Set(prev);
                      if (checked) next.add(i); else next.delete(i);
                      return next;
                    })}
                    className="accent-[#CF6990] w-4 h-4 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-[#1a0a10] truncate">
                      {inv.supplier_name}
                      <span className="text-black/30 font-normal"> · {inv.doc_number}</span>
                    </p>
                    <p className="text-[10px] text-black/35">
                      {inv.date ? fmtDay(inv.date) : '—'}
                      {inv.vat_lines.length > 0 && ` · ${inv.vat_lines.map(l => `${l.rate}%`).join('+')}`}
                      {inv.payment_method && ` · ${inv.payment_method}`}
                      {dup && <span className="text-orange-500 font-semibold"> · già presente</span>}
                      {inv.is_credit_note && <span className="text-[#CF6990] font-semibold"> · nota di credito</span>}
                    </p>
                  </div>
                  <span className={`text-[12px] font-bold tabular-nums shrink-0 ${inv.total < 0 ? 'text-[#CF6990]' : 'text-[#1a0a10]'}`}>
                    {eur(inv.total)}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-black/40">
              {selected.length} di {parsed.length} selezionate
            </span>
            <span className="font-bold text-[#1a0a10] tabular-nums">{eur(totalSel)}</span>
          </div>

          <button
            onClick={runImport} disabled={busy || selected.length === 0}
            className="w-full py-3 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.2em] font-bold rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40"
          >
            {busy ? 'Import in corso…' : `Importa ${selected.length} fattur${selected.length === 1 ? 'a' : 'e'}`}
          </button>
        </>
      )}
    </Card>
  );
}

// ─── Fornitori ────────────────────────────────────────────────────────────────

const emptySupplier = () => ({
  name: '', vat_number: '', category: '', contact: '',
  phone: '', email: '', payment_terms: '', iban: '', notes: '',
});
type SupplierForm = ReturnType<typeof emptySupplier>;

const supplierToForm = (s: Supplier): SupplierForm => ({
  name: s.name,
  vat_number: s.vat_number ?? '',
  category: s.category ?? '',
  contact: s.contact ?? '',
  phone: s.phone ?? '',
  email: s.email ?? '',
  payment_terms: s.payment_terms ?? '',
  iban: s.iban ?? '',
  notes: s.notes ?? '',
});

const formToRow = (f: SupplierForm) => ({
  name: f.name.trim(),
  vat_number: f.vat_number.trim() || null,
  category: f.category || null,
  contact: f.contact.trim() || null,
  phone: f.phone.trim() || null,
  email: f.email.trim() || null,
  payment_terms: f.payment_terms || null,
  iban: f.iban.trim() || null,
  notes: f.notes.trim() || null,
});

/** Campi anagrafica, condivisi fra creazione e modifica. */
function SupplierFields({
  value, onChange,
}: { value: SupplierForm; onChange: (patch: Partial<SupplierForm>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Nome" wide>
        <input type="text" value={value.name} onChange={e => onChange({ name: e.target.value })} className={inputCls} placeholder="Ragione sociale" />
      </Field>
      <Field label="P.IVA / CF">
        <input type="text" value={value.vat_number} onChange={e => onChange({ vat_number: e.target.value })} className={inputCls} />
      </Field>
      <Field label="Categoria">
        <select value={value.category} onChange={e => onChange({ category: e.target.value })} className={inputCls}>
          <option value="">—</option>
          {PURCHASE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Referente">
        <input type="text" value={value.contact} onChange={e => onChange({ contact: e.target.value })} className={inputCls} />
      </Field>
      <Field label="Telefono">
        <input type="tel" value={value.phone} onChange={e => onChange({ phone: e.target.value })} className={inputCls} />
      </Field>
      <Field label="Email" wide>
        <input type="email" value={value.email} onChange={e => onChange({ email: e.target.value })} className={inputCls} />
      </Field>
      <Field label="Condizioni pagamento">
        <select value={value.payment_terms} onChange={e => onChange({ payment_terms: e.target.value })} className={inputCls}>
          <option value="">—</option>
          {PAYMENT_METHODS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="IBAN">
        <input type="text" value={value.iban} onChange={e => onChange({ iban: e.target.value })} className={inputCls} />
      </Field>
      <Field label="Note" wide>
        <input type="text" value={value.notes} onChange={e => onChange({ notes: e.target.value })} className={inputCls} placeholder="…" />
      </Field>
    </div>
  );
}

function FornitoriSection({ adminToken, suppliers, setSuppliers, purchases, setPurchases }: Shared) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptySupplier());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptySupplier());

  const stats = useMemo(() => {
    const map: Record<string, { total: number; count: number; last: string }> = {};
    for (const p of purchases) {
      const cur = map[p.supplier_name] ?? { total: 0, count: 0, last: '' };
      cur.total += Number(p.total);
      cur.count += 1;
      if (p.date > cur.last) cur.last = p.date;
      map[p.supplier_name] = cur;
    }
    return map;
  }, [purchases]);

  const sorted = [...suppliers].sort(
    (a, b) => (stats[b.name]?.total ?? 0) - (stats[a.name]?.total ?? 0),
  );

  const dupMessage = (e: unknown) =>
    e instanceof Error && e.message.includes('duplicate')
      ? 'Esiste già un fornitore con questo nome'
      : `Errore nel salvataggio${e instanceof Error ? `: ${e.message}` : ''}`;

  async function save() {
    if (!form.name.trim()) return alert('Inserisci il nome');
    setSaving(true);
    try {
      const row = await insertRow<Supplier>(adminToken, 'suppliers', formToRow(form));
      setSuppliers(prev => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(emptySupplier());
      setOpen(false);
    } catch (e) {
      alert(dupMessage(e));
    }
    setSaving(false);
  }

  function startEdit(s: Supplier) {
    setEditingId(s.id);
    setEditForm(supplierToForm(s));
    setOpen(false);
  }

  async function saveEdit(original: Supplier) {
    const name = editForm.name.trim();
    if (!name) return alert('Inserisci il nome');
    const renamed = name !== original.name;

    setSaving(true);
    try {
      const row = await updateRow<Supplier>(adminToken, 'suppliers', original.id, formToRow(editForm));
      // Le fatture salvano il nome: senza allinearle lo storico si spezzerebbe
      if (renamed) {
        await renameSupplierOnPurchases(adminToken, original.id, name);
        setPurchases(prev =>
          prev.map(p => (p.supplier_id === original.id ? { ...p, supplier_name: name } : p)),
        );
      }
      setSuppliers(prev =>
        prev.map(s => (s.id === original.id ? row : s)).sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId(null);
    } catch (e) {
      alert(dupMessage(e));
    }
    setSaving(false);
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Eliminare ${name}? Le fatture registrate restano.`)) return;
    try {
      await deleteRow(adminToken, 'suppliers', id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } catch { alert('Errore eliminazione'); }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#1a0a10]">Anagrafica ({suppliers.length})</h2>
        <AddButton open={open} onClick={() => setOpen(o => !o)} label="Fornitore" />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <Card className="p-4 space-y-3">
              <SupplierFields value={form} onChange={patch => setForm(f => ({ ...f, ...patch }))} />
              <button onClick={save} disabled={saving}
                className="w-full py-3 bg-[#1a0a10] text-white text-[11px] uppercase tracking-[0.2em] font-bold rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">
                {saving ? 'Salvataggio…' : 'Salva fornitore'}
              </button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="divide-y divide-black/6">
        {sorted.length === 0 && <p className="text-center text-black/25 py-10 text-[12px]">Nessun fornitore</p>}
        {sorted.map((s, i) => {
          const st = stats[s.name];
          const isEditing = editingId === s.id;
          return (
            <div key={s.id}>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-[10px] font-bold text-black/20 w-4 shrink-0">{i + 1}</span>
                <button
                  onClick={() => (isEditing ? setEditingId(null) : startEdit(s))}
                  className="flex-1 min-w-0 text-left group"
                >
                  <p className="text-[12px] font-semibold text-[#1a0a10] truncate group-hover:text-[#CF6990] transition-colors">
                    {s.name}
                  </p>
                  <p className="text-[10px] text-black/35 truncate">
                    {s.category ?? 'categoria da assegnare'}
                    {s.phone && ` · ${s.phone}`}
                    {st && ` · ${st.count} fatt. · ultima ${fmtDay(st.last)}`}
                  </p>
                </button>
                <span className="text-[12px] font-bold text-[#CF6990] tabular-nums shrink-0">
                  {eur(st?.total ?? 0)}
                </span>
                <button onClick={() => (isEditing ? setEditingId(null) : startEdit(s))}
                  title="Modifica"
                  className={`shrink-0 text-sm transition-colors ${isEditing ? 'text-[#CF6990]' : 'text-black/20 hover:text-[#CF6990]'}`}>
                  ✎
                </button>
                <button onClick={() => remove(s.id, s.name)}
                  title="Elimina"
                  className="text-black/20 hover:text-red-400 text-sm shrink-0">×</button>
              </div>

              <AnimatePresence>
                {isEditing && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 pt-1 space-y-3 bg-[#fdf5f8]/60 border-t border-black/6">
                      <SupplierFields value={editForm} onChange={patch => setEditForm(f => ({ ...f, ...patch }))} />
                      {editForm.name.trim() !== s.name && st && (
                        <p className="text-[10px] text-[#CF6990]">
                          Rinominando il fornitore aggiorno anche le {st.count} fatture già registrate.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(s)} disabled={saving}
                          className="flex-1 py-2.5 bg-[#1a0a10] text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">
                          {saving ? 'Salvataggio…' : 'Salva modifiche'}
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="px-4 py-2.5 border border-black/12 text-black/40 text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl hover:border-black/25 transition-colors">
                          Annulla
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </Card>
    </>
  );
}

// ─── Costi (fissi, utenze, personale) ─────────────────────────────────────────

function CostiSection({
  adminToken, month, months, setMonth,
  fixedCosts, setFixedCosts, utilities, setUtilities,
  employees, setEmployees, staffPayments, setStaffPayments,
}: Shared) {
  const [openForm, setOpenForm] = useState<'fisso' | 'utenza' | 'dipendente' | 'paga' | null>(null);
  const [saving, setSaving] = useState(false);

  const [fixedForm, setFixedForm] = useState({ name: '', monthly_amount: '', due_day: '' });
  const [utilForm, setUtilForm]   = useState({ date: todayISO(), type: UTILITY_TYPES[0], amount: '', notes: '' });
  const [empForm, setEmpForm]     = useState({ name: '', daily_pay: '' });
  const [payForm, setPayForm]     = useState({ date: todayISO(), employee_id: '', days: '1', amount: '' });

  const mUtil  = utilities.filter(u => monthKey(u.date) === month);
  const mStaff = staffPayments.filter(s => monthKey(s.date) === month);
  const fixedTotal = fixedCosts.filter(c => c.active).reduce((s, c) => s + Number(c.monthly_amount), 0);

  const toggle = (f: typeof openForm) => setOpenForm(cur => (cur === f ? null : f));

  async function addFixed() {
    if (!fixedForm.name.trim()) return alert('Inserisci la voce');
    setSaving(true);
    try {
      const row = await insertRow<FixedCost>(adminToken, 'fixed_costs', {
        name: fixedForm.name.trim(),
        monthly_amount: num(fixedForm.monthly_amount),
        due_day: fixedForm.due_day ? Math.round(num(fixedForm.due_day)) : null,
      });
      setFixedCosts(prev => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)));
      setFixedForm({ name: '', monthly_amount: '', due_day: '' });
      setOpenForm(null);
    } catch { alert('Errore nel salvataggio'); }
    setSaving(false);
  }

  async function addUtility() {
    if (num(utilForm.amount) <= 0) return alert('Inserisci un importo valido');
    setSaving(true);
    try {
      const row = await insertRow<Utility>(adminToken, 'utilities', {
        date: utilForm.date,
        type: utilForm.type,
        amount: num(utilForm.amount),
        notes: utilForm.notes || null,
      });
      setUtilities(prev => [row, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
      setUtilForm({ date: todayISO(), type: UTILITY_TYPES[0], amount: '', notes: '' });
      setOpenForm(null);
    } catch { alert('Errore nel salvataggio'); }
    setSaving(false);
  }

  async function addEmployee() {
    if (!empForm.name.trim()) return alert('Inserisci il nome');
    setSaving(true);
    try {
      const row = await insertRow<Employee>(adminToken, 'employees', {
        name: empForm.name.trim(),
        daily_pay: num(empForm.daily_pay),
      });
      setEmployees(prev => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)));
      setEmpForm({ name: '', daily_pay: '' });
      setOpenForm(null);
    } catch { alert('Errore nel salvataggio'); }
    setSaving(false);
  }

  async function addPayment() {
    const emp = employees.find(e => e.id === payForm.employee_id);
    if (!emp) return alert('Scegli un dipendente');
    const amount = payForm.amount ? num(payForm.amount) : Number(emp.daily_pay) * num(payForm.days);
    setSaving(true);
    try {
      const row = await insertRow<StaffPayment>(adminToken, 'staff_payments', {
        date: payForm.date,
        employee_id: emp.id,
        employee_name: emp.name,
        days: num(payForm.days),
        amount,
      });
      setStaffPayments(prev => [row, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
      setPayForm({ date: todayISO(), employee_id: '', days: '1', amount: '' });
      setOpenForm(null);
    } catch { alert('Errore nel salvataggio'); }
    setSaving(false);
  }

  const payPreview = (() => {
    const emp = employees.find(e => e.id === payForm.employee_id);
    if (!emp) return 0;
    return payForm.amount ? num(payForm.amount) : Number(emp.daily_pay) * num(payForm.days);
  })();

  return (
    <>
      <div className="flex items-center justify-between">
        <MonthPicker value={month} onChange={setMonth} options={months} />
      </div>

      <KpiGrid
        items={[
          { label: 'Costi fissi', value: eur(fixedTotal), hint: 'al mese' },
          { label: 'Utenze mese', value: eur(mUtil.reduce((s, u) => s + Number(u.amount), 0)) },
          { label: 'Personale mese', value: eur(mStaff.reduce((s, p) => s + Number(p.amount), 0)) },
          { label: 'Dipendenti', value: String(employees.filter(e => e.active).length) },
        ]}
      />

      {/* Costi fissi */}
      <div>
        <SectionTitle action={<AddButton open={openForm === 'fisso'} onClick={() => toggle('fisso')} label="Voce" />}>
          Costi fissi mensili
        </SectionTitle>
        <AnimatePresence>
          {openForm === 'fisso' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
              <Card className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Voce" wide><input type="text" value={fixedForm.name} onChange={e => setFixedForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="es. Affitto" /></Field>
                  <Field label="Importo mensile"><input type="number" step="0.01" inputMode="decimal" value={fixedForm.monthly_amount} onChange={e => setFixedForm(f => ({ ...f, monthly_amount: e.target.value }))} className={inputCls} placeholder="0,00" /></Field>
                  <Field label="Giorno scadenza"><input type="number" min="1" max="31" value={fixedForm.due_day} onChange={e => setFixedForm(f => ({ ...f, due_day: e.target.value }))} className={inputCls} placeholder="1-31" /></Field>
                </div>
                <button onClick={addFixed} disabled={saving} className="w-full py-2.5 bg-[#1a0a10] text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">
                  {saving ? '…' : 'Aggiungi'}
                </button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        <Card className="divide-y divide-black/6">
          {fixedCosts.length === 0 && <p className="text-center text-black/25 py-8 text-[12px]">Nessun costo fisso</p>}
          {fixedCosts.map(c => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
              <button
                onClick={async () => {
                  try {
                    const row = await updateRow<FixedCost>(adminToken, 'fixed_costs', c.id, { active: !c.active });
                    setFixedCosts(prev => prev.map(x => (x.id === c.id ? row : x)));
                  } catch { alert('Errore'); }
                }}
                className={`w-4 h-4 rounded-full border-2 shrink-0 ${c.active ? 'bg-green-500 border-green-500' : 'border-black/15'}`}
                title={c.active ? 'Attivo' : 'Sospeso'}
              />
              <span className={`flex-1 text-[12px] truncate ${c.active ? 'text-[#1a0a10]' : 'text-black/30 line-through'}`}>
                {c.name}
                {c.due_day && <span className="text-black/30"> · il {c.due_day}</span>}
              </span>
              <span className="text-[12px] font-bold text-[#1a0a10] tabular-nums shrink-0">{eur(Number(c.monthly_amount))}</span>
              <button
                onClick={async () => {
                  if (!confirm(`Eliminare ${c.name}?`)) return;
                  try {
                    await deleteRow(adminToken, 'fixed_costs', c.id);
                    setFixedCosts(prev => prev.filter(x => x.id !== c.id));
                  } catch { alert('Errore'); }
                }}
                className="text-black/20 hover:text-red-400 text-sm shrink-0"
              >×</button>
            </div>
          ))}
        </Card>
      </div>

      {/* Utenze */}
      <div>
        <SectionTitle action={<AddButton open={openForm === 'utenza'} onClick={() => toggle('utenza')} label="Bolletta" />}>
          Utenze
        </SectionTitle>
        <AnimatePresence>
          {openForm === 'utenza' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
              <Card className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Data"><input type="date" value={utilForm.date} onChange={e => setUtilForm(f => ({ ...f, date: e.target.value }))} className={inputCls} /></Field>
                  <Field label="Tipo">
                    <select value={utilForm.type} onChange={e => setUtilForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
                      {UTILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Importo"><input type="number" step="0.01" inputMode="decimal" value={utilForm.amount} onChange={e => setUtilForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} placeholder="0,00" /></Field>
                  <Field label="Note"><input type="text" value={utilForm.notes} onChange={e => setUtilForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} /></Field>
                </div>
                <button onClick={addUtility} disabled={saving} className="w-full py-2.5 bg-[#1a0a10] text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">
                  {saving ? '…' : 'Aggiungi'}
                </button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        <Card className="divide-y divide-black/6">
          {mUtil.length === 0 && <p className="text-center text-black/25 py-8 text-[12px]">Nessuna utenza nel mese</p>}
          {mUtil.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-[10px] text-black/30 w-11 shrink-0">{fmtDay(u.date)}</span>
              <span className="flex-1 text-[12px] text-[#1a0a10] truncate">{u.type}</span>
              <span className="text-[12px] font-bold text-[#1a0a10] tabular-nums shrink-0">{eur(Number(u.amount))}</span>
              <button
                onClick={async () => {
                  try {
                    await deleteRow(adminToken, 'utilities', u.id);
                    setUtilities(prev => prev.filter(x => x.id !== u.id));
                  } catch { alert('Errore'); }
                }}
                className="text-black/20 hover:text-red-400 text-sm shrink-0"
              >×</button>
            </div>
          ))}
        </Card>
      </div>

      {/* Personale */}
      <div>
        <SectionTitle action={
          <div className="flex gap-1.5">
            <AddButton open={openForm === 'dipendente'} onClick={() => toggle('dipendente')} label="Dipendente" />
            {employees.length > 0 && <AddButton open={openForm === 'paga'} onClick={() => toggle('paga')} label="Paga" />}
          </div>
        }>
          Personale
        </SectionTitle>

        <AnimatePresence>
          {openForm === 'dipendente' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
              <Card className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nome"><input type="text" value={empForm.name} onChange={e => setEmpForm(f => ({ ...f, name: e.target.value }))} className={inputCls} /></Field>
                  <Field label="Paga giornaliera"><input type="number" step="0.01" inputMode="decimal" value={empForm.daily_pay} onChange={e => setEmpForm(f => ({ ...f, daily_pay: e.target.value }))} className={inputCls} placeholder="0,00" /></Field>
                </div>
                <button onClick={addEmployee} disabled={saving} className="w-full py-2.5 bg-[#1a0a10] text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">
                  {saving ? '…' : 'Aggiungi'}
                </button>
              </Card>
            </motion.div>
          )}
          {openForm === 'paga' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
              <Card className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Dipendente" wide>
                    <select value={payForm.employee_id} onChange={e => setPayForm(f => ({ ...f, employee_id: e.target.value }))} className={inputCls}>
                      <option value="">Scegli…</option>
                      {employees.filter(e => e.active).map(e => (
                        <option key={e.id} value={e.id}>{e.name} — {eur(Number(e.daily_pay))}/g</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Data"><input type="date" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} className={inputCls} /></Field>
                  <Field label="Giornate"><input type="number" step="0.5" value={payForm.days} onChange={e => setPayForm(f => ({ ...f, days: e.target.value }))} className={inputCls} /></Field>
                  <Field label="Importo (vuoto = calcolato)" wide>
                    <input type="number" step="0.01" inputMode="decimal" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} placeholder={payPreview ? eur(payPreview) : '0,00'} />
                  </Field>
                </div>
                {payPreview > 0 && (
                  <p className="text-[11px] text-black/45 text-center">
                    Verrà registrato: <strong className="text-[#CF6990]">{eur(payPreview)}</strong>
                  </p>
                )}
                <button onClick={addPayment} disabled={saving} className="w-full py-2.5 bg-[#1a0a10] text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl hover:bg-[#CF6990] transition-colors disabled:opacity-40">
                  {saving ? '…' : 'Registra paga'}
                </button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="divide-y divide-black/6 mb-2">
          {employees.length === 0 && <p className="text-center text-black/25 py-8 text-[12px]">Nessun dipendente</p>}
          {employees.map(e => {
            const paidThisMonth = mStaff.filter(p => p.employee_id === e.id).reduce((s, p) => s + Number(p.amount), 0);
            return (
              <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 text-[12px] text-[#1a0a10] truncate">
                  {e.name}
                  <span className="text-black/30"> · {eur(Number(e.daily_pay))}/g</span>
                </span>
                <span className="text-[11px] text-black/40 tabular-nums shrink-0">mese {eur(paidThisMonth)}</span>
                <button
                  onClick={async () => {
                    if (!confirm(`Eliminare ${e.name}?`)) return;
                    try {
                      await deleteRow(adminToken, 'employees', e.id);
                      setEmployees(prev => prev.filter(x => x.id !== e.id));
                    } catch { alert('Errore'); }
                  }}
                  className="text-black/20 hover:text-red-400 text-sm shrink-0"
                >×</button>
              </div>
            );
          })}
        </Card>

        {mStaff.length > 0 && (
          <Card className="divide-y divide-black/6">
            {mStaff.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-[10px] text-black/30 w-11 shrink-0">{fmtDay(p.date)}</span>
                <span className="flex-1 text-[12px] text-[#1a0a10] truncate">
                  {p.employee_name}
                  <span className="text-black/30"> · {p.days}g</span>
                </span>
                <span className="text-[12px] font-bold text-[#1a0a10] tabular-nums shrink-0">{eur(Number(p.amount))}</span>
                <button
                  onClick={async () => {
                    try {
                      await deleteRow(adminToken, 'staff_payments', p.id);
                      setStaffPayments(prev => prev.filter(x => x.id !== p.id));
                    } catch { alert('Errore'); }
                  }}
                  className="text-black/20 hover:text-red-400 text-sm shrink-0"
                >×</button>
              </div>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}

// ─── Prima Nota ───────────────────────────────────────────────────────────────

function PrimaNotaSection({ month, months, setMonth, sales, purchases, utilities, staffPayments, fixedCosts }: Shared) {
  const rows = useMemo(() => {
    const byDay: Record<string, { in: number; purch: number; other: number }> = {};
    const touch = (d: string) => (byDay[d] ??= { in: 0, purch: 0, other: 0 });

    for (const s of sales) if (monthKey(s.date) === month) touch(s.date).in += saleTotal(s);
    for (const p of purchases) if (monthKey(p.date) === month) touch(p.date).purch += Number(p.total);
    for (const u of utilities) if (monthKey(u.date) === month) touch(u.date).other += Number(u.amount);
    for (const s of staffPayments) if (monthKey(s.date) === month) touch(s.date).other += Number(s.amount);

    // Costi fissi ricorrenti, imputati al giorno di scadenza: senza questi il
    // saldo non tornerebbe col margine della Dashboard
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      for (const c of fixedCosts) {
        if (!c.active || Number(c.monthly_amount) === 0) continue;
        const day = Math.min(Math.max(c.due_day ?? 1, 1), lastDay);
        touch(`${month}-${String(day).padStart(2, '0')}`).other += Number(c.monthly_amount);
      }
    }

    let running = 0;
    return Object.entries(byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => {
        const out = v.purch + v.other;
        const balance = v.in - out;
        running += balance;
        return { date, in: v.in, purch: v.purch, other: v.other, out, balance, running };
      });
  }, [month, sales, purchases, utilities, staffPayments, fixedCosts]);

  const totals = rows.reduce(
    (a, r) => ({ in: a.in + r.in, out: a.out + r.out }),
    { in: 0, out: 0 },
  );
  const net = totals.in - totals.out;

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#1a0a10]">Prima Nota</h2>
        <MonthPicker value={month} onChange={setMonth} options={months} />
      </div>

      <KpiGrid
        items={[
          { label: 'Entrate', value: eur(totals.in), tone: 'good' },
          { label: 'Uscite', value: eur(totals.out), tone: 'bad' },
          { label: 'Saldo', value: eur(net), tone: net >= 0 ? 'good' : 'bad' },
          { label: 'Giornate', value: String(rows.length) },
        ]}
      />

      <Card className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-black/8 text-black/35">
              <th className="text-left  px-3 py-2 font-semibold uppercase tracking-wider text-[9px]">Data</th>
              <th className="text-right px-2 py-2 font-semibold uppercase tracking-wider text-[9px]">Entrate</th>
              <th className="text-right px-2 py-2 font-semibold uppercase tracking-wider text-[9px]">Acquisti</th>
              <th className="text-right px-2 py-2 font-semibold uppercase tracking-wider text-[9px]">Altro</th>
              <th className="text-right px-2 py-2 font-semibold uppercase tracking-wider text-[9px]">Saldo</th>
              <th className="text-right px-3 py-2 font-semibold uppercase tracking-wider text-[9px]">Progr.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center text-black/25 py-10">Nessun movimento nel mese</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.date}>
                <td className="px-3 py-2 text-black/50 whitespace-nowrap">{fmtDay(r.date)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-green-600">{r.in ? eur(r.in) : '—'}</td>
                <td className="px-2 py-2 text-right tabular-nums text-black/45">{r.purch ? eur(r.purch) : '—'}</td>
                <td className="px-2 py-2 text-right tabular-nums text-black/45">{r.other ? eur(r.other) : '—'}</td>
                <td className={`px-2 py-2 text-right tabular-nums font-semibold ${r.balance >= 0 ? 'text-[#1a0a10]' : 'text-red-500'}`}>
                  {eur(r.balance)}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums font-bold ${r.running >= 0 ? 'text-[#CF6990]' : 'text-red-500'}`}>
                  {eur(r.running)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-[10px] text-black/35 leading-relaxed">
        <strong>Altro</strong> comprende utenze, personale e costi fissi mensili
        (imputati al giorno di scadenza). Il saldo del mese coincide con il margine della Dashboard.
        Il progressivo riparte da zero a ogni mese.
      </p>
    </>
  );
}

// ─── IVA ──────────────────────────────────────────────────────────────────────

function IvaSection({ adminToken, sales, purchases, ivaRate, setIvaRate }: Shared) {
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const months = new Set<string>();
    for (const s of sales) months.add(monthKey(s.date));
    for (const p of purchases) months.add(monthKey(p.date));

    return [...months].sort().reverse().map(m => {
      const gross = sales
        .filter(s => monthKey(s.date) === m)
        .reduce((sum, s) => sum + Number(s.fiscal_total), 0);
      // Scorporo dell'IVA dai corrispettivi lordi
      const debit = gross - gross / (1 + ivaRate / 100);
      const credit = purchases
        .filter(p => monthKey(p.date) === m)
        .reduce((sum, p) => sum + Number(p.vat_amount), 0);
      return { month: m, gross, debit, credit, due: debit - credit };
    });
  }, [sales, purchases, ivaRate]);

  const yearTotal = rows.reduce((s, r) => s + r.due, 0);

  async function saveRate(v: number) {
    setIvaRate(v);
    setSaving(true);
    try { await updateSetting(adminToken, 'iva_rate', v); } catch { /* non bloccante */ }
    setSaving(false);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[#1a0a10]">Riepilogo IVA</h2>
        <label className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-black/35">Aliquota</span>
          <select value={ivaRate} onChange={e => saveRate(Number(e.target.value))}
            className={`${inputCls} w-auto py-1.5 text-[11px]`} disabled={saving}>
            {VAT_RATES.filter(r => r > 0).map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
        </label>
      </div>

      <Card className="px-4 py-3 bg-amber-50/60 border-amber-200">
        <p className="text-[11px] text-amber-800 leading-relaxed">
          ⚠️ Stima indicativa calcolata scorporando il {ivaRate}% dai corrispettivi fiscali.
          Verifica sempre con il commercialista prima di versare.
        </p>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-black/8 text-black/35">
              <th className="text-left  px-3 py-2 font-semibold uppercase tracking-wider text-[9px]">Mese</th>
              <th className="text-right px-2 py-2 font-semibold uppercase tracking-wider text-[9px]">Corrispettivi</th>
              <th className="text-right px-2 py-2 font-semibold uppercase tracking-wider text-[9px]">A debito</th>
              <th className="text-right px-2 py-2 font-semibold uppercase tracking-wider text-[9px]">A credito</th>
              <th className="text-right px-3 py-2 font-semibold uppercase tracking-wider text-[9px]">Da versare</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.length === 0 && (
              <tr><td colSpan={5} className="text-center text-black/25 py-10">Nessun dato disponibile</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.month}>
                <td className="px-3 py-2 text-black/55 capitalize whitespace-nowrap">{monthLabel(r.month)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-black/45">{eur(r.gross)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-black/45">{eur(r.debit)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-green-600">{eur(r.credit)}</td>
                <td className={`px-3 py-2 text-right tabular-nums font-bold ${r.due > 0 ? 'text-[#CF6990]' : 'text-green-600'}`}>
                  {eur(r.due)}
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-black/10 bg-[#fdf5f8]">
                <td className="px-3 py-2.5 font-bold text-[#1a0a10] text-[10px] uppercase tracking-wider" colSpan={4}>
                  Totale periodo
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-bold text-[#CF6990]">{eur(yearTotal)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </Card>
    </>
  );
}

// ─── Prezzi prodotti ──────────────────────────────────────────────────────────

// Prezzo unitario: fino a 3 decimali, senza zeri finali
const priceFmt = (n: number) =>
  `€${n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`;

interface ProductTrend {
  key: string;
  product: string;
  supplier: string;
  history: ProductPrice[];   // dal più recente
  latest: number;
  previous: number | null;
  deltaPct: number | null;   // null = nessuno storico precedente
}

function buildTrends(rows: ProductPrice[]): ProductTrend[] {
  const groups = new Map<string, ProductPrice[]>();
  for (const r of rows) {
    const g = groups.get(r.product_key) ?? [];
    g.push(r);
    groups.set(r.product_key, g);
  }
  const trends: ProductTrend[] = [];
  for (const [key, list] of groups) {
    // dal più recente: per data, poi per inserimento
    list.sort((a, b) => (b.date.localeCompare(a.date)) || 0);
    const latest = Number(list[0].unit_price);
    const previous = list.length > 1 ? Number(list[1].unit_price) : null;
    const deltaPct = previous && previous !== 0 ? ((latest - previous) / previous) * 100 : null;
    trends.push({
      key,
      product: list[0].product,
      supplier: list[0].supplier_name,
      history: list,
      latest,
      previous,
      deltaPct,
    });
  }
  return trends;
}

function PrezziSection({ adminToken }: { adminToken: string }) {
  const [rows, setRows] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'variazione' | 'nome' | 'recenti'>('variazione');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTable<ProductPrice>(adminToken, 'product_prices', 'order=date.desc&limit=5000')
      .then(d => { if (!cancelled) setRows(d); })
      .catch(() => { if (!cancelled) setErr('Tabella non trovata: esegui l\'aggiornamento SQL del gestionale.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [adminToken]);

  const trends = useMemo(() => buildTrends(rows), [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? trends.filter(t => t.product.toLowerCase().includes(q) || t.supplier.toLowerCase().includes(q)) : trends;
    const out = [...list];
    out.sort((a, b) => {
      if (sort === 'nome') return a.product.localeCompare(b.product);
      if (sort === 'recenti') return b.history[0].date.localeCompare(a.history[0].date);
      // variazione: prima i movimenti più grandi in valore assoluto
      return Math.abs(b.deltaPct ?? 0) - Math.abs(a.deltaPct ?? 0);
    });
    return out;
  }, [trends, search, sort]);

  const kpi = useMemo(() => ({
    prodotti: trends.length,
    aumentati: trends.filter(t => (t.deltaPct ?? 0) > 0.01).length,
    diminuiti: trends.filter(t => (t.deltaPct ?? 0) < -0.01).length,
  }), [trends]);

  if (loading) {
    return <div className="text-center py-16"><div className="w-8 h-8 border-2 border-[#CF6990] border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }
  if (err) {
    return <div className="text-center py-16 px-4"><div className="text-4xl mb-3">📈</div><p className="text-[12px] text-black/45 leading-relaxed">{err}</p></div>;
  }
  if (trends.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="text-4xl mb-3">📈</div>
        <p className="text-[13px] font-semibold text-[#1a0a10] mb-1">Ancora nessun prezzo</p>
        <p className="text-[12px] text-black/40 leading-relaxed">
          Importa le fatture XML in <strong>Acquisti</strong>: i prodotti e i loro prezzi vengono raccolti qui in automatico.
        </p>
      </div>
    );
  }

  return (
    <>
      <KpiGrid
        items={[
          { label: 'Prodotti', value: String(kpi.prodotti) },
          { label: 'In aumento', value: String(kpi.aumentati), tone: kpi.aumentati ? 'bad' : undefined },
          { label: 'In calo', value: String(kpi.diminuiti), tone: kpi.diminuiti ? 'good' : undefined },
          { label: 'Stabili', value: String(kpi.prodotti - kpi.aumentati - kpi.diminuiti) },
        ]}
      />

      <div className="flex gap-2">
        <input
          type="text" value={search} placeholder="🔍  Cerca prodotto o fornitore…"
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-0 border border-black/12 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CF6990] bg-[#fdf5f8]"
        />
        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
          className={`${inputCls} w-auto py-2 text-[11px]`}>
          <option value="variazione">Più variazione</option>
          <option value="recenti">Più recenti</option>
          <option value="nome">Nome A-Z</option>
        </select>
      </div>

      <Card className="divide-y divide-black/6">
        {visible.map(t => {
          const up = (t.deltaPct ?? 0) > 0.01;
          const down = (t.deltaPct ?? 0) < -0.01;
          // Nero stabile, verde in calo, rosso in aumento
          const color = up ? 'text-red-500' : down ? 'text-green-600' : 'text-[#1a0a10]';
          const isOpen = expanded === t.key;
          return (
            <div key={t.key}>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setExpanded(isOpen ? null : t.key)}>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#1a0a10] truncate">{t.product}</p>
                  <p className="text-[10px] text-black/35 truncate">
                    {t.supplier} · {t.history.length} rilev. · ultimo {fmtDay(t.history[0].date)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-[13px] font-bold tabular-nums ${color}`}>{priceFmt(t.latest)}</p>
                  {t.deltaPct !== null && (up || down) ? (
                    <p className={`text-[10px] font-semibold tabular-nums ${color}`}>
                      {up ? '▲' : '▼'} {Math.abs(t.deltaPct).toFixed(1)}%
                      <span className="text-black/30 font-normal"> da {priceFmt(t.previous!)}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-black/30">{t.previous === null ? 'primo prezzo' : 'stabile'}</p>
                  )}
                </div>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-black/25 text-sm shrink-0">▾</motion.span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-3 bg-[#fdf5f8]/50">
                      <div className="space-y-1 pt-1">
                        {t.history.map((h, i) => {
                          const prev = t.history[i + 1];
                          const d = prev ? Number(h.unit_price) - Number(prev.unit_price) : 0;
                          const c = d > 0.001 ? 'text-red-500' : d < -0.001 ? 'text-green-600' : 'text-black/50';
                          return (
                            <div key={h.id} className="flex items-center gap-2 text-[11px]">
                              <span className="text-black/40 w-16 shrink-0">{fmtDay(h.date)}</span>
                              <span className="text-black/30 flex-1 truncate">
                                {h.quantity !== null ? `${h.quantity}${h.unit ? ' ' + h.unit : ''}` : ''}
                              </span>
                              <span className={`font-semibold tabular-nums ${c}`}>{priceFmt(Number(h.unit_price))}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </Card>
    </>
  );
}
