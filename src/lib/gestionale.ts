const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ─── Tipi ─────────────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  vat_number: string | null;
  category: string | null;
  contact: string | null;
  phone: string | null;
  email: string | null;
  payment_terms: string | null;
  iban: string | null;
  notes: string | null;
}

/** Riga di dettaglio IVA di una fattura (una per aliquota). */
export interface VatLine {
  rate: number;
  taxable: number;
  vat: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplier_id: string | null;
  supplier_name: string;
  category: string | null;
  doc_number: string | null;
  taxable: number;
  /** Aliquota prevalente; per fatture multi-aliquota vedi vat_lines. */
  vat_rate: number;
  vat_amount: number;
  total: number;
  /** Dettaglio per aliquota. Null sulle fatture a IVA singola. */
  vat_lines: VatLine[] | null;
  payment_method: string | null;
  due_date: string | null;
  paid: boolean;
  paid_date: string | null;
  notes: string | null;
}

export interface DailySale {
  id: string;
  date: string;
  cash: number;
  pos: number;
  takeaway: number;
  delivery: number;
  deliveroo: number;
  justeat: number;
  num_orders: number;
  fiscal_total: number;
  proforma_total: number;
  notes: string | null;
}

export interface FixedCost {
  id: string;
  name: string;
  monthly_amount: number;
  due_day: number | null;
  active: boolean;
  notes: string | null;
}

export interface Utility {
  id: string;
  date: string;
  type: string;
  amount: number;
  notes: string | null;
}

export interface Employee {
  id: string;
  name: string;
  daily_pay: number;
  active: boolean;
  notes: string | null;
}

export interface StaffPayment {
  id: string;
  date: string;
  employee_id: string | null;
  employee_name: string;
  days: number;
  amount: number;
  paid: boolean;
  notes: string | null;
}

export interface CustomerStat {
  email: string;
  orders_count: number;
  confirmed_count: number;
  total_spent: number;
  avg_ticket: number;
  first_order: string;
  last_order: string;
}

export type TableName =
  | 'suppliers' | 'purchases' | 'daily_sales' | 'fixed_costs'
  | 'utilities' | 'employees' | 'staff_payments';

// ─── CRUD generico ────────────────────────────────────────────────────────────

function authHeaders(token: string, extra: Record<string, string> = {}) {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

export async function fetchTable<T>(
  token: string,
  table: TableName,
  query = '',
): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Caricamento ${table} fallito (${res.status})`);
  return res.json();
}

export async function insertRow<T>(
  token: string,
  table: TableName,
  row: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: authHeaders(token, { Prefer: 'return=representation' }),
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data[0];
}

export async function updateRow<T>(
  token: string,
  table: TableName,
  id: string,
  patch: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: authHeaders(token, { Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data[0];
}

export async function upsertRow<T>(
  token: string,
  table: TableName,
  row: Record<string, unknown>,
  onConflict: string,
): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: authHeaders(token, {
      Prefer: 'resolution=merge-duplicates,return=representation',
    }),
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data[0];
}

export async function deleteRow(token: string, table: TableName, id: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: authHeaders(token, { Prefer: 'return=minimal' }),
  });
  if (!res.ok) throw new Error(`Eliminazione fallita (${res.status})`);
}

export async function fetchCustomerStats(token: string): Promise<CustomerStat[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_customer_stats`, {
    method: 'POST',
    headers: authHeaders(token),
    body: '{}',
  });
  if (!res.ok) return [];
  return res.json();
}

// ─── Costanti di dominio ──────────────────────────────────────────────────────

export const PURCHASE_CATEGORIES = [
  'Carne', 'Pane', 'Alimentari vari', 'Verdura/Frutta', 'Bevande',
  'Packaging/Materiale usa e getta', 'Pulizia', 'Attrezzatura', 'Altro',
];

export const PAYMENT_METHODS = [
  'Contanti', 'Bonifico', 'POS', 'RiBa', 'Assegno', 'Altro',
];

export const UTILITY_TYPES = [
  'Energia elettrica', 'Gas', 'Acqua', 'Internet/Telefono', 'Rifiuti', 'Altro',
];

export const VAT_RATES = [0, 4, 5, 10, 22];

// ─── Helper di calcolo ────────────────────────────────────────────────────────

export const eur = (n: number) =>
  `€${n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const monthKey = (d: string) => d.slice(0, 7);

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
}

/** Totale incassato in una giornata, proforma inclusa. */
export function saleTotal(s: DailySale): number {
  return Number(s.fiscal_total) + Number(s.proforma_total);
}

/** Scontrino medio della giornata. */
export function avgTicket(s: DailySale): number {
  return s.num_orders > 0 ? saleTotal(s) / s.num_orders : 0;
}
