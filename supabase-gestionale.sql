-- ═══════════════════════════════════════════════════════════════════════════
-- GESTIONALE PUBLIC BURGER — schema completo
-- Eseguire una sola volta nel SQL Editor di Supabase.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Helper: chi è admin ────────────────────────────────────────────────────
-- Admin primario hardcoded + eventuali email in settings.admin_emails
create or replace function is_admin()
returns boolean
language sql
stable
security definer
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = 'prrsmn91@gmail.com'
    or exists (
      select 1
      from settings s,
           jsonb_array_elements_text(s.value) as e(email)
      where s.key = 'admin_emails'
        and lower(e.email) = lower(auth.jwt() ->> 'email')
    ),
    false
  );
$$;

-- ── Fornitori ──────────────────────────────────────────────────────────────
create table if not exists suppliers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  vat_number     text,
  category       text,
  contact        text,
  phone          text,
  email          text,
  payment_terms  text,
  iban           text,
  notes          text,
  created_at     timestamptz not null default now()
);
create unique index if not exists suppliers_name_key on suppliers (lower(name));

-- ── Acquisti / Fatture ─────────────────────────────────────────────────────
create table if not exists purchases (
  id             uuid primary key default gen_random_uuid(),
  date           date not null,
  supplier_id    uuid references suppliers(id) on delete set null,
  supplier_name  text not null,
  category       text,
  doc_number     text,
  taxable        numeric(12,2) not null default 0,   -- imponibile totale
  vat_rate       numeric(5,2)  not null default 0,   -- aliquota prevalente
  vat_amount     numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  -- Dettaglio per aliquota: [{"rate":10,"taxable":100,"vat":10}, …]
  vat_lines      jsonb,
  payment_method text,
  due_date       date,
  paid           boolean not null default false,
  paid_date      date,
  notes          text,
  created_at     timestamptz not null default now()
);
-- Migrazione per installazioni precedenti alla multi-aliquota
alter table purchases add column if not exists vat_lines jsonb;

create index if not exists purchases_date_idx     on purchases (date desc);
create index if not exists purchases_supplier_idx on purchases (supplier_id);
create index if not exists purchases_unpaid_idx   on purchases (paid, due_date);

-- ── Vendite giornaliere (corrispettivi per canale) ─────────────────────────
create table if not exists daily_sales (
  id             uuid primary key default gen_random_uuid(),
  date           date not null unique,
  cash           numeric(12,2) not null default 0,   -- contanti
  pos            numeric(12,2) not null default 0,   -- POS / SumUp
  takeaway       numeric(12,2) not null default 0,   -- asporto in sede
  delivery       numeric(12,2) not null default 0,   -- consegne proprie
  deliveroo      numeric(12,2) not null default 0,
  justeat        numeric(12,2) not null default 0,
  num_orders     integer       not null default 0,
  fiscal_total   numeric(12,2) not null default 0,   -- corrispettivi fiscali
  proforma_total numeric(12,2) not null default 0,
  notes          text,
  created_at     timestamptz not null default now()
);
create index if not exists daily_sales_date_idx on daily_sales (date desc);

-- ── Costi fissi ricorrenti ─────────────────────────────────────────────────
create table if not exists fixed_costs (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  monthly_amount numeric(12,2) not null default 0,
  due_day        integer check (due_day between 1 and 31),
  active         boolean not null default true,
  notes          text,
  created_at     timestamptz not null default now()
);

-- ── Utenze (bollette una tantum) ───────────────────────────────────────────
create table if not exists utilities (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  type       text not null,
  amount     numeric(12,2) not null default 0,
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists utilities_date_idx on utilities (date desc);

-- ── Dipendenti ─────────────────────────────────────────────────────────────
create table if not exists employees (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  daily_pay  numeric(10,2) not null default 0,
  active     boolean not null default true,
  notes      text,
  created_at timestamptz not null default now()
);

-- ── Pagamenti al personale ─────────────────────────────────────────────────
create table if not exists staff_payments (
  id            uuid primary key default gen_random_uuid(),
  date          date not null,
  employee_id   uuid references employees(id) on delete set null,
  employee_name text not null,
  days          numeric(5,2) not null default 1,
  amount        numeric(12,2) not null default 0,
  paid          boolean not null default true,
  notes         text,
  created_at    timestamptz not null default now()
);
create index if not exists staff_payments_date_idx on staff_payments (date desc);

-- ── RLS: solo admin ────────────────────────────────────────────────────────
alter table suppliers      enable row level security;
alter table purchases      enable row level security;
alter table daily_sales    enable row level security;
alter table fixed_costs    enable row level security;
alter table utilities      enable row level security;
alter table employees      enable row level security;
alter table staff_payments enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'suppliers','purchases','daily_sales','fixed_costs',
    'utilities','employees','staff_payments'
  ]
  loop
    execute format('drop policy if exists admin_all on %I', t);
    execute format(
      'create policy admin_all on %I for all using (is_admin()) with check (is_admin())', t
    );
  end loop;
end $$;

-- ── Conteggio ordini confermati per cliente (per la scheda clienti) ────────
create or replace function admin_customer_stats()
returns table (
  email          text,
  orders_count   bigint,
  confirmed_count bigint,
  total_spent    numeric,
  avg_ticket     numeric,
  first_order    timestamptz,
  last_order     timestamptz
)
language sql
stable
security definer
as $$
  select
    o.user_email                                        as email,
    count(*)                                            as orders_count,
    count(*) filter (where o.status = 'confermato')     as confirmed_count,
    coalesce(sum(o.total), 0)                           as total_spent,
    coalesce(avg(o.total), 0)                           as avg_ticket,
    min(o.created_at)                                   as first_order,
    max(o.created_at)                                   as last_order
  from orders o
  where o.user_email is not null
    and is_admin()
  group by o.user_email;
$$;
