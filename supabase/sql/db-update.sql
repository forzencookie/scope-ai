-- Copy and paste this into your Supabase SQL Editor to update your database.

-- 1. Create the customer_invoices table
create table if not exists customer_invoices (
  id text primary key,
  company_id text references companies(id) default 'demo-company',
  invoice_number text,
  customer_name text not null,
  customer_email text,
  amount numeric(20, 2) not null, -- Excl VAT
  vat_amount numeric(20, 2),
  total_amount numeric(20, 2) not null, -- Incl VAT
  due_date date,
  issue_date date,
  status text default 'utkast', -- 'utkast', 'skickad', 'betald', 'förfallen'
  ocr text,
  document_url text,
  created_at timestamptz default now()
);

-- 2. Enable Row Level Security (RLS)
alter table customer_invoices enable row level security;

-- 3. Add security policy (allows access to your own company's invoices)
create policy "Access own company customer_invoices" on customer_invoices
  for all using (is_company_member(company_id));
