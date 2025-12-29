-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Companies (Stores settings and basic info)
create table if not exists companies (
  id text primary key default 'demo-company',
  name text not null,
  org_number text,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Transactions (Bank Transactions)
create table if not exists transactions (
  id text primary key, -- Keeping text ID to match JSON for now, eventually UUID
  date date not null,
  description text not null,
  amount numeric(20, 2) not null,
  currency text default 'SEK',
  status text default 'pending', -- 'pending', 'booked', 'ignored'
  category text, 
  vat_amount numeric(20, 2),
  receipt_id text, -- Link to receipt
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Receipts (Kvitton)
create table if not exists receipts (
  id text primary key,
  date date not null,
  supplier text not null,
  amount numeric(20, 2) not null,
  vat_amount numeric(20, 2),
  category text,
  status text default 'mottagen', -- 'mottagen', 'behandlas', 'bokförd'
  image_url text,
  linked_transaction_id text references transactions(id),
  created_at timestamptz default now()
);

-- Supplier Invoices (Leverantörsfakturor)
create table if not exists supplier_invoices (
  id text primary key,
  invoice_number text,
  supplier_name text not null,
  amount numeric(20, 2) not null,
  vat_amount numeric(20, 2),
  total_amount numeric(20, 2) not null, -- Often redundant but useful for caching
  due_date date,
  issue_date date,
  status text default 'mottagen', -- 'mottagen', 'attesterad', 'betald', 'bokförd'
  ocr text,
  document_url text,
  created_at timestamptz default now()
);

-- Verifications (Journal Entries / Verifikationer)
create table if not exists verifications (
  id text primary key, -- e.g., 'A-1', 'A-2'
  series text default 'A',
  number integer,
  date date not null,
  description text not null,
  rows jsonb not null, -- Array of { account, debit, credit }
  created_at timestamptz default now()
);

-- =============================================================================
-- AI TOOLS: Tax Optimization
-- =============================================================================

-- Periodiseringsfonder (Tax Allocation Reserves)
create table if not exists periodiseringsfonder (
  id uuid primary key default uuid_generate_v4(),
  company_id text references companies(id) default 'demo-company',
  year integer not null, -- Tax year the fond was created for
  amount numeric(20, 2) not null,
  dissolved_amount numeric(20, 2) default 0, -- Amount dissolved so far
  expires_at date not null, -- 6 years from creation
  status text default 'active', -- 'active', 'partially_dissolved', 'dissolved'
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================================================
-- AI TOOLS: Employee Benefits (Förmåner)
-- =============================================================================

-- Förmåner Catalog (All available Swedish benefits)
create table if not exists formaner_catalog (
  id text primary key, -- e.g., 'friskvard', 'tjanstebil'
  name text not null,
  category text not null, -- 'tax_free', 'taxable', 'salary_sacrifice'
  max_amount numeric(20, 2), -- NULL if no limit
  tax_free boolean default false,
  formansvarde_calculation text, -- How to calculate taxable value
  description text,
  rules jsonb, -- Detailed rules per company type
  bas_account text, -- Related BAS account
  created_at timestamptz default now()
);

-- Employee Benefits (Assigned benefits)
create table if not exists employee_benefits (
  id uuid primary key default uuid_generate_v4(),
  company_id text references companies(id) default 'demo-company',
  employee_name text not null, -- For now, simple name. Later: employee_id FK
  benefit_type text references formaner_catalog(id),
  amount numeric(20, 2), -- Amount used
  year integer not null,
  month integer, -- Optional, for monthly tracking
  formansvarde numeric(20, 2), -- Calculated taxable value
  notes text,
  created_at timestamptz default now()
);

-- =============================================================================
-- AI TOOLS: Investments
-- =============================================================================

-- Properties (Fastigheter)
create table if not exists properties (
  id uuid primary key default uuid_generate_v4(),
  company_id text references companies(id) default 'demo-company',
  name text not null, -- e.g., "Kontorsfastighet Storgatan 1"
  property_type text, -- 'building', 'land', 'investment_property'
  address text,
  purchase_date date,
  purchase_price numeric(20, 2),
  land_value numeric(20, 2), -- Separate from building for depreciation
  building_value numeric(20, 2),
  depreciation_rate numeric(5, 2) default 2.0, -- Typically 2-4% for buildings
  current_value numeric(20, 2), -- Book value after depreciation
  bas_account text default '1110', -- Buildings account
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Share Holdings (Aktieinnehav)
create table if not exists share_holdings (
  id uuid primary key default uuid_generate_v4(),
  company_id text references companies(id) default 'demo-company',
  company_name text not null, -- The company whose shares we hold
  org_number text, -- Optional org number of held company
  holding_type text default 'other', -- 'subsidiary', 'associated', 'other'
  shares_count integer,
  purchase_date date,
  purchase_price numeric(20, 2), -- Total acquisition cost
  current_value numeric(20, 2), -- Current valuation
  dividend_received numeric(20, 2) default 0, -- Total dividends received
  bas_account text default '1350', -- Shares account
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Crypto Holdings
create table if not exists crypto_holdings (
  id uuid primary key default uuid_generate_v4(),
  company_id text references companies(id) default 'demo-company',
  coin text not null, -- 'BTC', 'ETH', etc.
  amount numeric(20, 8) not null, -- Crypto uses 8 decimals
  purchase_date date,
  purchase_price_sek numeric(20, 2), -- Cost in SEK
  current_price_sek numeric(20, 2),
  bas_account text default '1350',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Crypto Transactions (for FIFO calculation)
create table if not exists crypto_transactions (
  id uuid primary key default uuid_generate_v4(),
  company_id text references companies(id) default 'demo-company',
  coin text not null,
  transaction_type text not null, -- 'buy', 'sell', 'swap'
  amount numeric(20, 8) not null,
  price_sek numeric(20, 2) not null, -- Price per unit at time of transaction
  total_sek numeric(20, 2) not null,
  transaction_date date not null,
  notes text,
  created_at timestamptz default now()
);

-- =============================================================================
-- AI CHAT PERSISTENCE
-- =============================================================================

create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id text, -- link to auth user eventually
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null, -- 'user', 'assistant', 'system', 'data'
  content text,
  tool_calls jsonb, -- Store tool calls if any
  tool_results jsonb, -- Store tool results if any
  created_at timestamptz default now()
);

-- Enable RLS (Row Level Security) - Basic Setup
alter table companies enable row level security;
alter table transactions enable row level security;
alter table receipts enable row level security;
alter table supplier_invoices enable row level security;
alter table verifications enable row level security;
alter table periodiseringsfonder enable row level security;
alter table formaner_catalog enable row level security;
alter table employee_benefits enable row level security;
alter table properties enable row level security;
alter table share_holdings enable row level security;
alter table crypto_holdings enable row level security;
alter table crypto_transactions enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- Create policies (Allow all for anon for now purely for migration/demo dev speed)
-- IN PRODUCTION: Only authenticated users should access.
create policy "Allow public access" on companies for all using (true);
create policy "Allow public access" on transactions for all using (true);
create policy "Allow public access" on receipts for all using (true);
create policy "Allow public access" on supplier_invoices for all using (true);
create policy "Allow public access" on verifications for all using (true);
create policy "Allow public access" on periodiseringsfonder for all using (true);
create policy "Allow public access" on formaner_catalog for all using (true);
create policy "Allow public access" on employee_benefits for all using (true);
create policy "Allow public access" on properties for all using (true);
create policy "Allow public access" on share_holdings for all using (true);
create policy "Allow public access" on crypto_holdings for all using (true);
create policy "Allow public access" on crypto_transactions for all using (true);
create policy "Allow public access" on conversations for all using (true);
create policy "Allow public access" on messages for all using (true);
