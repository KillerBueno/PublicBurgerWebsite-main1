const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface OrderItem {
  type: 'burger' | 'fry' | 'extra';
  name: string;
  qty?: number;
  size?: string;
  removed?: string[];
  extras?: string[];
  price: number;
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
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=minimal',
  };
}

export async function saveOrder(order: Omit<Order, 'id' | 'created_at'>) {
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

export async function fetchOrders(adminToken: string): Promise<Order[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?order=created_at.desc&limit=500`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${adminToken}`,
      },
    }
  );
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}
