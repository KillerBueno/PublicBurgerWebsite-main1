const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface OrderItem {
  type: 'burger' | 'fry' | 'extra';
  name: string;
  qty?: number;
  size?: string;
  removed?: string[];
  extras?: string[];
  combo?: boolean;
  drink?: string;
  price: number;
}

export interface StatusEntry {
  status: string;
  at: string;
}

export interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  order_type: 'asporto' | 'tavolo' | 'domicilio';
  items: OrderItem[];
  total: number;
  user_email: string | null;
  user_name: string | null;
  notes: string | null;
  status?: string;
  status_history?: StatusEntry[];
  admin_notes?: string | null;
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=minimal',
  };
}

export async function saveOrder(order: Omit<Order, 'id' | 'created_at' | 'status' | 'status_history' | 'admin_notes'>) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(order),
    });
  } catch (e) {
    console.warn('Order save failed', e);
  }
}

export async function updateOrderStatus(
  adminToken: string,
  orderId: string,
  status: string,
  currentHistory: StatusEntry[] = [],
): Promise<void> {
  const history: StatusEntry[] = [...currentHistory, { status, at: new Date().toISOString() }];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${adminToken}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ status, status_history: history }),
  });
  if (!res.ok) throw new Error(`Status update failed: ${res.status}`);
}

export async function updateOrderNotes(
  adminToken: string,
  orderId: string,
  admin_notes: string,
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${adminToken}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ admin_notes }),
  });
  if (!res.ok) throw new Error(`Notes update failed: ${res.status}`);
}

export function exportOrdersCSV(orders: Order[]) {
  const fmt = (d: string) => new Date(d).toLocaleString('it-IT');
  const header = ['Data', 'Cliente', 'Email', 'Tipo', 'Articoli', 'Totale (€)', 'Stato', 'Note cliente', 'Note admin'];
  const rows = orders.map(o => [
    fmt(o.created_at),
    o.customer_name,
    o.user_email ?? '',
    o.order_type,
    o.items.map(i => `${i.name}${i.size ? ` (${i.size})` : ''}${i.qty && i.qty > 1 ? ` x${i.qty}` : ''}`).join(' | '),
    o.total.toFixed(2),
    o.status ?? 'nuovo',
    o.notes ?? '',
    o.admin_notes ?? '',
  ]);
  const csv = [header, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ordini-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function deleteOrder(adminToken: string, orderId: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${adminToken}`,
      Prefer: 'return=minimal',
    },
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}

export async function fetchOrders(adminToken: string): Promise<Order[]> {
  const tryFetch = (token: string) =>
    fetch(`${SUPABASE_URL}/rest/v1/orders?order=created_at.desc&limit=500`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
    });
  let res = await tryFetch(adminToken);
  console.log('[fetchOrders] user token status:', res.status);
  if (!res.ok) {
    res = await tryFetch(SUPABASE_KEY);
    console.log('[fetchOrders] anon key status:', res.status);
  }
  if (!res.ok) throw new Error('Unauthorized');
  const data = await res.json();
  console.log('[fetchOrders] rows returned:', data.length);
  return data;
}
