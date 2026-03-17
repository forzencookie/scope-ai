-- =============================================================================
-- Scope AI — Complete Schema Migration
-- Swedish accounting platform (BAS 2024, BFL, ABL, Semesterlagen)
-- =============================================================================
-- NOTE: No BEGIN/COMMIT — Supabase CLI handles transactions.

-- ---------------------------------------------------------------------------
-- 0. Utility: updated_at trigger function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 0b. Enums for events table
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE event_source AS ENUM ('ai', 'user', 'system', 'document', 'authority');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_category AS ENUM ('bokföring', 'skatt', 'rapporter', 'parter', 'löner', 'dokument', 'system', 'bolagsåtgärd');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('draft', 'pending_signature', 'ready_to_send', 'submitted', 'registered');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================================================
-- 1. companies (root table — id is TEXT)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  org_number TEXT,
  company_type TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  zip_code TEXT,
  registration_date TEXT,
  fiscal_year_end TEXT,
  accounting_method TEXT,
  has_employees BOOLEAN,
  has_f_skatt BOOLEAN,
  has_moms_registration BOOLEAN,
  is_closely_held BOOLEAN,
  vat_number TEXT,
  vat_frequency TEXT,
  share_capital NUMERIC,
  total_shares INTEGER,
  logo_url TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT,
  subscription_ends_at TIMESTAMPTZ,
  openai_thread_id TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_org_number ON companies(org_number);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_select" ON companies FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "companies_insert" ON companies FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "companies_update" ON companies FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "companies_delete" ON companies FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 2. profiles
-- ===========================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  avatar_emoji TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'owner')),
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()));
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================================================
-- 3. company_members
-- ===========================================================================
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);

ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_members_select" ON company_members FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "company_members_insert" ON company_members FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "company_members_update" ON company_members FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "company_members_delete" ON company_members FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER company_members_updated_at
  BEFORE UPDATE ON company_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 4. verifications (bokföringsverifikationer)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  date DATE,
  description TEXT,
  rows JSONB DEFAULT '[]'::jsonb,
  number INTEGER,
  series TEXT DEFAULT 'A',
  fiscal_year INTEGER,
  is_locked BOOLEAN DEFAULT false,
  total_amount NUMERIC,
  source_type TEXT,
  source_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, series, number)
);

CREATE INDEX IF NOT EXISTS idx_verifications_user ON verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_company ON verifications(company_id);
CREATE INDEX IF NOT EXISTS idx_verifications_date ON verifications(date);
CREATE INDEX IF NOT EXISTS idx_verifications_series_number ON verifications(series, number);
CREATE INDEX IF NOT EXISTS idx_verifications_fiscal_year ON verifications(fiscal_year);

ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verifications_select" ON verifications FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "verifications_insert" ON verifications FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "verifications_update" ON verifications FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "verifications_delete" ON verifications FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Prevent modification of locked verifications
CREATE OR REPLACE FUNCTION prevent_locked_verification_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.is_locked = true THEN
    RAISE EXCEPTION 'Cannot modify a locked verification (id: %)', OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER verifications_lock_guard
  BEFORE UPDATE ON verifications
  FOR EACH ROW EXECUTE FUNCTION prevent_locked_verification_update();

CREATE OR REPLACE FUNCTION prevent_locked_verification_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.is_locked = true THEN
    RAISE EXCEPTION 'Cannot delete a locked verification (id: %)', OLD.id;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER verifications_lock_guard_delete
  BEFORE DELETE ON verifications
  FOR EACH ROW EXECUTE FUNCTION prevent_locked_verification_delete();

-- ===========================================================================
-- 5. verification_lines
-- ===========================================================================
CREATE TABLE IF NOT EXISTS verification_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id TEXT NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_id TEXT,
  account_number INTEGER NOT NULL,
  account_name TEXT,
  description TEXT,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_lines_verification ON verification_lines(verification_id);
CREATE INDEX IF NOT EXISTS idx_verification_lines_user ON verification_lines(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_lines_account ON verification_lines(account_number);

ALTER TABLE verification_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verification_lines_select" ON verification_lines FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "verification_lines_insert" ON verification_lines FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "verification_lines_update" ON verification_lines FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "verification_lines_delete" ON verification_lines FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ===========================================================================
-- 6. transactions (bank transactions)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  amount TEXT NOT NULL,
  amount_value NUMERIC NOT NULL,
  currency TEXT DEFAULT 'SEK',
  status TEXT DEFAULT 'Att bokföra',
  category TEXT,
  category_id TEXT,
  account TEXT,
  merchant TEXT,
  icon_name TEXT,
  icon_color TEXT,
  ai_category TEXT,
  ai_account TEXT,
  ai_confidence NUMERIC,
  ai_reasoning TEXT,
  source TEXT,
  external_id TEXT,
  external_reference TEXT,
  voucher_id TEXT,
  receipt_id TEXT,
  attachments TEXT[],
  vat_amount NUMERIC,
  is_demo_data BOOLEAN DEFAULT false,
  metadata JSONB,
  created_by TEXT,
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_select" ON transactions FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "transactions_insert" ON transactions FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "transactions_update" ON transactions FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "transactions_delete" ON transactions FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 7. account_balances
-- ===========================================================================
CREATE TABLE IF NOT EXISTS account_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  period TEXT,
  year INTEGER DEFAULT EXTRACT(YEAR FROM now()),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, company_id, account_number, year, period)
);

CREATE INDEX IF NOT EXISTS idx_account_balances_user ON account_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_account_balances_company ON account_balances(company_id);
CREATE INDEX IF NOT EXISTS idx_account_balances_account ON account_balances(account_number);

ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "account_balances_select" ON account_balances FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "account_balances_insert" ON account_balances FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "account_balances_update" ON account_balances FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "account_balances_delete" ON account_balances FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER account_balances_updated_at
  BEFORE UPDATE ON account_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 8. financial_periods
-- ===========================================================================
CREATE TABLE IF NOT EXISTS financial_periods (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT,
  type TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'open',
  reconciliation_checks JSONB,
  locked_at TIMESTAMPTZ,
  locked_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_periods_user ON financial_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_periods_company ON financial_periods(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_periods_status ON financial_periods(status);

ALTER TABLE financial_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "financial_periods_select" ON financial_periods FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "financial_periods_insert" ON financial_periods FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "financial_periods_update" ON financial_periods FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "financial_periods_delete" ON financial_periods FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER financial_periods_updated_at
  BEFORE UPDATE ON financial_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 9. receipts
-- ===========================================================================
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  date TEXT,
  supplier TEXT,
  category TEXT,
  amount NUMERIC,
  total_amount NUMERIC,
  vat_amount NUMERIC,
  status TEXT DEFAULT 'pending',
  source TEXT,
  image_url TEXT,
  file_url TEXT,
  metadata JSONB,
  created_by TEXT,
  captured_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_company ON receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receipts_select" ON receipts FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "receipts_insert" ON receipts FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "receipts_update" ON receipts FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "receipts_delete" ON receipts FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 10. customer_invoices
-- ===========================================================================
CREATE TABLE IF NOT EXISTS customer_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  customer_name TEXT,
  customer_org_number TEXT,
  customer_email TEXT,
  customer_address TEXT,
  subtotal NUMERIC,
  vat_rate NUMERIC,
  vat_amount NUMERIC,
  total_amount NUMERIC,
  items JSONB,
  status TEXT DEFAULT 'draft',
  ocr_reference TEXT,
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC,
  payment_reference TEXT,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_invoices_user ON customer_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_invoices_company ON customer_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_invoices_status ON customer_invoices(status);
CREATE INDEX IF NOT EXISTS idx_customer_invoices_due_date ON customer_invoices(due_date);

ALTER TABLE customer_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_invoices_select" ON customer_invoices FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "customer_invoices_insert" ON customer_invoices FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "customer_invoices_update" ON customer_invoices FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "customer_invoices_delete" ON customer_invoices FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER customer_invoices_updated_at
  BEFORE UPDATE ON customer_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 11. supplier_invoices
-- ===========================================================================
CREATE TABLE IF NOT EXISTS supplier_invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  supplier_name TEXT,
  invoice_number TEXT,
  category TEXT,
  amount NUMERIC,
  total_amount NUMERIC,
  vat_amount NUMERIC,
  due_date DATE,
  issue_date DATE,
  ocr TEXT,
  document_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_user ON supplier_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_company ON supplier_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON supplier_invoices(status);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_due_date ON supplier_invoices(due_date);

ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplier_invoices_select" ON supplier_invoices FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "supplier_invoices_insert" ON supplier_invoices FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "supplier_invoices_update" ON supplier_invoices FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "supplier_invoices_delete" ON supplier_invoices FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER supplier_invoices_updated_at
  BEFORE UPDATE ON supplier_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 12. employees
-- ===========================================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  personal_number TEXT,
  phone TEXT,
  address TEXT,
  kommun TEXT,
  monthly_salary NUMERIC,
  hourly_rate NUMERIC,
  tax_rate NUMERIC,
  tax_table_number INTEGER,
  tax_column INTEGER DEFAULT 1,
  employment_type TEXT DEFAULT 'permanent',
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees_select" ON employees FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "employees_insert" ON employees FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "employees_update" ON employees FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "employees_delete" ON employees FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 13. payslips
-- ===========================================================================
CREATE TABLE IF NOT EXISTS payslips (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  period TEXT,
  gross_salary NUMERIC,
  tax_deduction NUMERIC,
  net_salary NUMERIC,
  bonuses NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  benefits JSONB DEFAULT '[]'::jsonb,
  employer_contributions NUMERIC DEFAULT 0,
  vacation_pay NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payslips_user ON payslips(user_id);
CREATE INDEX IF NOT EXISTS idx_payslips_company ON payslips(company_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(period);
CREATE INDEX IF NOT EXISTS idx_payslips_status ON payslips(status);

ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payslips_select" ON payslips FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "payslips_insert" ON payslips FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "payslips_update" ON payslips FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "payslips_delete" ON payslips FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER payslips_updated_at
  BEFORE UPDATE ON payslips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 14. benefits
-- ===========================================================================
CREATE TABLE IF NOT EXISTS benefits (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT,
  type TEXT,
  taxable_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_benefits_user ON benefits(user_id);
CREATE INDEX IF NOT EXISTS idx_benefits_company ON benefits(company_id);

ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "benefits_select" ON benefits FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "benefits_insert" ON benefits FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "benefits_update" ON benefits FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "benefits_delete" ON benefits FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER benefits_updated_at
  BEFORE UPDATE ON benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 15. shareholders (AB aktiebok)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS shareholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  personal_number TEXT,
  ssn_org_nr TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  shares INTEGER DEFAULT 0,
  share_class TEXT DEFAULT 'A',
  share_number_from INTEGER,
  share_number_to INTEGER,
  share_percentage NUMERIC DEFAULT 0,
  ownership_percentage NUMERIC DEFAULT 0,
  voting_percentage NUMERIC,
  voting_rights NUMERIC,
  acquisition_date DATE,
  acquisition_price NUMERIC,
  board_role TEXT,
  is_board_member BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  is_demo_data BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shareholders_user ON shareholders(user_id);
CREATE INDEX IF NOT EXISTS idx_shareholders_company ON shareholders(company_id);
CREATE INDEX IF NOT EXISTS idx_shareholders_status ON shareholders(status);

ALTER TABLE shareholders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shareholders_select" ON shareholders FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "shareholders_insert" ON shareholders FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "shareholders_update" ON shareholders FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "shareholders_delete" ON shareholders FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER shareholders_updated_at
  BEFORE UPDATE ON shareholders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 16. share_transactions
-- ===========================================================================
CREATE TABLE IF NOT EXISTS share_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  transaction_date DATE,
  registration_date DATE,
  transaction_type TEXT,
  from_shareholder_id UUID,
  to_shareholder_id UUID,
  from_name TEXT,
  to_name TEXT,
  shares INTEGER,
  share_count INTEGER,
  share_class TEXT DEFAULT 'B',
  price_per_share NUMERIC,
  total_price NUMERIC,
  total_amount NUMERIC,
  verification_id UUID,
  notes TEXT,
  document_reference TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_transactions_user ON share_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_share_transactions_company ON share_transactions(company_id);

ALTER TABLE share_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "share_transactions_select" ON share_transactions FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "share_transactions_insert" ON share_transactions FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "share_transactions_update" ON share_transactions FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "share_transactions_delete" ON share_transactions FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER share_transactions_updated_at
  BEFORE UPDATE ON share_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 17. shareholdings (investments in OTHER companies)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS shareholdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  company_name TEXT,
  org_number TEXT,
  holding_type TEXT DEFAULT 'unlisted',
  shares_count INTEGER,
  purchase_date DATE,
  purchase_price NUMERIC,
  current_value NUMERIC,
  dividend_received NUMERIC DEFAULT 0,
  bas_account TEXT DEFAULT '1350',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shareholdings_user ON shareholdings(user_id);
CREATE INDEX IF NOT EXISTS idx_shareholdings_company ON shareholdings(company_id);

ALTER TABLE shareholdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shareholdings_select" ON shareholdings FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "shareholdings_insert" ON shareholdings FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "shareholdings_update" ON shareholdings FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "shareholdings_delete" ON shareholdings FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER shareholdings_updated_at
  BEFORE UPDATE ON shareholdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 18. partners (HB/KB — no FK to companies due to UUID/TEXT mismatch)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id UUID,
  name TEXT NOT NULL,
  personal_number TEXT,
  type TEXT NOT NULL,
  ownership_percentage NUMERIC,
  profit_share_percentage NUMERIC,
  capital_contribution NUMERIC,
  current_capital_balance NUMERIC,
  join_date DATE,
  is_limited_liability BOOLEAN DEFAULT false,
  is_demo_data BOOLEAN DEFAULT false,
  email TEXT,
  phone TEXT,
  board_role TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_user ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_company ON partners(company_id);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners_select" ON partners FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "partners_insert" ON partners FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "partners_update" ON partners FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "partners_delete" ON partners FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ===========================================================================
-- 19. members (Förening — no FK to companies due to UUID/TEXT mismatch)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  member_number TEXT,
  join_date DATE NOT NULL,
  status TEXT DEFAULT 'aktiv',
  membership_type TEXT DEFAULT 'ordinarie',
  last_paid_year INTEGER,
  roles TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_company ON members(company_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select" ON members FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "members_insert" ON members FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "members_update" ON members FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "members_delete" ON members FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ===========================================================================
-- 20. meetings
-- ===========================================================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('board', 'annual_general', 'extraordinary', 'partner_meeting', 'association_annual')),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'held', 'signed')),
  attendees JSONB DEFAULT '[]'::jsonb,
  agenda_items JSONB DEFAULT '[]'::jsonb,
  decisions JSONB DEFAULT '[]'::jsonb,
  signatures JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_user ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_company ON meetings(company_id);
CREATE INDEX IF NOT EXISTS idx_meetings_type ON meetings(type);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meetings_select" ON meetings FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "meetings_insert" ON meetings FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "meetings_update" ON meetings FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "meetings_delete" ON meetings FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 21. dividends (AB only)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS dividends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  year INTEGER NOT NULL,
  date DATE NOT NULL,
  recipient_name TEXT,
  withholding_tax NUMERIC NOT NULL CHECK (withholding_tax >= 0),
  net_payout NUMERIC NOT NULL CHECK (net_payout >= 0),
  verification_id TEXT REFERENCES verifications(id),
  status TEXT NOT NULL DEFAULT 'decided' CHECK (status IN ('decided', 'paid', 'reported')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dividends_user ON dividends(user_id);
CREATE INDEX IF NOT EXISTS idx_dividends_company ON dividends(company_id);
CREATE INDEX IF NOT EXISTS idx_dividends_year ON dividends(year);
CREATE INDEX IF NOT EXISTS idx_dividends_status ON dividends(status);

ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dividends_select" ON dividends FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "dividends_insert" ON dividends FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "dividends_update" ON dividends FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "dividends_delete" ON dividends FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ===========================================================================
-- 22. pending_bookings
-- ===========================================================================
CREATE TABLE IF NOT EXISTS pending_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  item_id TEXT,
  item_type TEXT,
  account_debit TEXT,
  account_credit TEXT,
  amount NUMERIC,
  description TEXT,
  status TEXT DEFAULT 'pending',
  source_type TEXT,
  source_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_bookings_user ON pending_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_bookings_company ON pending_bookings(company_id);
CREATE INDEX IF NOT EXISTS idx_pending_bookings_status ON pending_bookings(status);

ALTER TABLE pending_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pending_bookings_select" ON pending_bookings FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "pending_bookings_insert" ON pending_bookings FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "pending_bookings_update" ON pending_bookings FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "pending_bookings_delete" ON pending_bookings FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ===========================================================================
-- 23. events
-- ===========================================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  timestamp TIMESTAMPTZ DEFAULT now(),
  source event_source,
  category event_category,
  status event_status DEFAULT 'draft',
  action TEXT,
  title TEXT,
  description TEXT,
  actor_type TEXT,
  actor_id TEXT,
  actor_name TEXT,
  metadata JSONB,
  related_to JSONB,
  proof JSONB,
  corporate_action_type TEXT,
  hash TEXT,
  previous_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_company ON events(company_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select" ON events FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "events_insert" ON events FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "events_update" ON events FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "events_delete" ON events FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ===========================================================================
-- 24. activity_log
-- ===========================================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT,
  changes JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_company ON activity_log(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_log_select" ON activity_log FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "activity_log_insert" ON activity_log FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "activity_log_update" ON activity_log FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "activity_log_delete" ON activity_log FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ===========================================================================
-- 25. integrations
-- ===========================================================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_id TEXT,
  integration_id TEXT,
  name TEXT,
  type TEXT,
  service TEXT,
  provider TEXT,
  status TEXT DEFAULT 'inactive',
  connected BOOLEAN DEFAULT false,
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  credentials JSONB,
  settings JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, integration_id)
);

CREATE INDEX IF NOT EXISTS idx_integrations_user ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations_select" ON integrations FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "integrations_insert" ON integrations FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "integrations_update" ON integrations FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "integrations_delete" ON integrations FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 26. settings
-- ===========================================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT,
  key TEXT NOT NULL,
  value TEXT,
  scope TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select" ON settings FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "settings_insert" ON settings FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "settings_update" ON settings FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "settings_delete" ON settings FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 27. inventarier (fixed assets)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS inventarier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  namn TEXT,
  kategori TEXT,
  beskrivning TEXT,
  inkopsdatum DATE,
  inkopspris NUMERIC,
  leverantor TEXT,
  fakturanummer TEXT,
  livslangd_ar INTEGER DEFAULT 5,
  avskrivningsmetod TEXT DEFAULT 'linear',
  restvarde NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'aktiv',
  forsaljningsdatum DATE,
  forsaljningspris NUMERIC,
  serienummer TEXT,
  placering TEXT,
  anteckningar TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventarier_user ON inventarier(user_id);
CREATE INDEX IF NOT EXISTS idx_inventarier_company ON inventarier(company_id);
CREATE INDEX IF NOT EXISTS idx_inventarier_status ON inventarier(status);

ALTER TABLE inventarier ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventarier_select" ON inventarier FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "inventarier_insert" ON inventarier FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "inventarier_update" ON inventarier FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "inventarier_delete" ON inventarier FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER inventarier_updated_at
  BEFORE UPDATE ON inventarier
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 28. tax_calendar
-- ===========================================================================
CREATE TABLE IF NOT EXISTS tax_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  due_date DATE,
  deadline_type TEXT,
  status TEXT DEFAULT 'pending',
  period TEXT,
  year INTEGER,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  reminder_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_calendar_user ON tax_calendar(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_calendar_company ON tax_calendar(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_calendar_due_date ON tax_calendar(due_date);
CREATE INDEX IF NOT EXISTS idx_tax_calendar_status ON tax_calendar(status);

ALTER TABLE tax_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tax_calendar_select" ON tax_calendar FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "tax_calendar_insert" ON tax_calendar FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "tax_calendar_update" ON tax_calendar FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "tax_calendar_delete" ON tax_calendar FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER tax_calendar_updated_at
  BEFORE UPDATE ON tax_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 29. tax_reports
-- ===========================================================================
CREATE TABLE IF NOT EXISTS tax_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  report_type TEXT,
  period TEXT,
  period_id TEXT REFERENCES financial_periods(id),
  year INTEGER,
  start_date DATE,
  end_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'upcoming',
  output_vat NUMERIC DEFAULT 0,
  input_vat NUMERIC DEFAULT 0,
  net_vat NUMERIC DEFAULT 0,
  data JSONB,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_reports_user ON tax_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_reports_company ON tax_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_reports_status ON tax_reports(status);
CREATE INDEX IF NOT EXISTS idx_tax_reports_due_date ON tax_reports(due_date);

ALTER TABLE tax_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tax_reports_select" ON tax_reports FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "tax_reports_insert" ON tax_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "tax_reports_update" ON tax_reports FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "tax_reports_delete" ON tax_reports FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER tax_reports_updated_at
  BEFORE UPDATE ON tax_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 30. vat_declarations
-- ===========================================================================
CREATE TABLE IF NOT EXISTS vat_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  period_type TEXT DEFAULT 'monthly',
  year INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  due_date DATE,
  output_vat NUMERIC DEFAULT 0,
  input_vat NUMERIC DEFAULT 0,
  net_vat NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'upcoming',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vat_declarations_user ON vat_declarations(user_id);
CREATE INDEX IF NOT EXISTS idx_vat_declarations_company ON vat_declarations(company_id);
CREATE INDEX IF NOT EXISTS idx_vat_declarations_status ON vat_declarations(status);
CREATE INDEX IF NOT EXISTS idx_vat_declarations_due_date ON vat_declarations(due_date);

ALTER TABLE vat_declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vat_declarations_select" ON vat_declarations FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "vat_declarations_insert" ON vat_declarations FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "vat_declarations_update" ON vat_declarations FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "vat_declarations_delete" ON vat_declarations FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER vat_declarations_updated_at
  BEFORE UPDATE ON vat_declarations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 31. agi_reports
-- ===========================================================================
CREATE TABLE IF NOT EXISTS agi_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agi_reports_user ON agi_reports(user_id);

ALTER TABLE agi_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agi_reports_select" ON agi_reports FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "agi_reports_insert" ON agi_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "agi_reports_update" ON agi_reports FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "agi_reports_delete" ON agi_reports FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ===========================================================================
-- 32. income_declarations
-- ===========================================================================
CREATE TABLE IF NOT EXISTS income_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_income_declarations_user ON income_declarations(user_id);

ALTER TABLE income_declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "income_declarations_select" ON income_declarations FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "income_declarations_insert" ON income_declarations FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "income_declarations_update" ON income_declarations FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "income_declarations_delete" ON income_declarations FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ===========================================================================
-- 33. ne_appendices
-- ===========================================================================
CREATE TABLE IF NOT EXISTS ne_appendices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ne_appendices_user ON ne_appendices(user_id);

ALTER TABLE ne_appendices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ne_appendices_select" ON ne_appendices FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "ne_appendices_insert" ON ne_appendices FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "ne_appendices_update" ON ne_appendices FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "ne_appendices_delete" ON ne_appendices FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ===========================================================================
-- 34. annual_reports
-- ===========================================================================
CREATE TABLE IF NOT EXISTS annual_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_annual_reports_user ON annual_reports(user_id);

ALTER TABLE annual_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "annual_reports_select" ON annual_reports FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "annual_reports_insert" ON annual_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "annual_reports_update" ON annual_reports FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "annual_reports_delete" ON annual_reports FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ===========================================================================
-- 35. annual_closings
-- ===========================================================================
CREATE TABLE IF NOT EXISTS annual_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  year INTEGER,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_annual_closings_user ON annual_closings(user_id);
CREATE INDEX IF NOT EXISTS idx_annual_closings_company ON annual_closings(company_id);
CREATE INDEX IF NOT EXISTS idx_annual_closings_year ON annual_closings(year);

ALTER TABLE annual_closings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "annual_closings_select" ON annual_closings FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "annual_closings_insert" ON annual_closings FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "annual_closings_update" ON annual_closings FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "annual_closings_delete" ON annual_closings FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER annual_closings_updated_at
  BEFORE UPDATE ON annual_closings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 36. periodiseringsfonder
-- ===========================================================================
CREATE TABLE IF NOT EXISTS periodiseringsfonder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  dissolved_amount NUMERIC DEFAULT 0,
  utilized_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC,
  expires_at DATE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_periodiseringsfonder_user ON periodiseringsfonder(user_id);
CREATE INDEX IF NOT EXISTS idx_periodiseringsfonder_company ON periodiseringsfonder(company_id);
CREATE INDEX IF NOT EXISTS idx_periodiseringsfonder_year ON periodiseringsfonder(year);
CREATE INDEX IF NOT EXISTS idx_periodiseringsfonder_status ON periodiseringsfonder(status);

ALTER TABLE periodiseringsfonder ENABLE ROW LEVEL SECURITY;
CREATE POLICY "periodiseringsfonder_select" ON periodiseringsfonder FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "periodiseringsfonder_insert" ON periodiseringsfonder FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "periodiseringsfonder_update" ON periodiseringsfonder FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "periodiseringsfonder_delete" ON periodiseringsfonder FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER periodiseringsfonder_updated_at
  BEFORE UPDATE ON periodiseringsfonder
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 37. user_memory
-- ===========================================================================
CREATE TABLE IF NOT EXISTS user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  importance TEXT DEFAULT 'medium',
  confidence NUMERIC,
  is_superseded BOOLEAN DEFAULT false,
  superseded_by UUID,
  metadata JSONB,
  source TEXT,
  source_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_memory_user ON user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_company ON user_memory(company_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_category ON user_memory(category);
CREATE INDEX IF NOT EXISTS idx_user_memory_superseded ON user_memory(is_superseded);

ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_memory_select" ON user_memory FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "user_memory_insert" ON user_memory FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "user_memory_update" ON user_memory FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "user_memory_delete" ON user_memory FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER user_memory_updated_at
  BEFORE UPDATE ON user_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 38. user_preferences
-- ===========================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'sv',
  currency TEXT DEFAULT 'SEK',
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_preferences_select" ON user_preferences FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "user_preferences_insert" ON user_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "user_preferences_update" ON user_preferences FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "user_preferences_delete" ON user_preferences FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 39. user_credits
-- ===========================================================================
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  credits_remaining INTEGER DEFAULT 100,
  lifetime_credits_purchased INTEGER DEFAULT 0,
  credits_purchased INTEGER DEFAULT 0,
  stripe_payment_id TEXT,
  price_paid_cents INTEGER,
  currency TEXT DEFAULT 'sek',
  is_active BOOLEAN DEFAULT true,
  purchased_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_refill_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user ON user_credits(user_id);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_credits_select" ON user_credits FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "user_credits_insert" ON user_credits FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "user_credits_update" ON user_credits FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "user_credits_delete" ON user_credits FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 40. conversations
-- ===========================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  openai_thread_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_select" ON conversations FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "conversations_insert" ON conversations FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "conversations_update" ON conversations FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "conversations_delete" ON conversations FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 41. messages
-- ===========================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL,
  content TEXT,
  tool_calls JSONB,
  tool_results JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "messages_update" ON messages FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "messages_delete" ON messages FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ===========================================================================
-- 42. ai_audit_log
-- ===========================================================================
CREATE TABLE IF NOT EXISTS ai_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tool_name TEXT,
  parameters JSONB,
  result JSONB,
  status TEXT DEFAULT 'success',
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_log_user ON ai_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_tool ON ai_audit_log(tool_name);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_created_at ON ai_audit_log(created_at);

ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_audit_log_select" ON ai_audit_log FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "ai_audit_log_insert" ON ai_audit_log FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "ai_audit_log_update" ON ai_audit_log FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "ai_audit_log_delete" ON ai_audit_log FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ===========================================================================
-- 43. ai_usage
-- ===========================================================================
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  model_id TEXT,
  provider TEXT,
  tokens_used INTEGER DEFAULT 0,
  requests_count INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, model_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_period ON ai_usage(period_start, period_end);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_select" ON ai_usage FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "ai_usage_insert" ON ai_usage FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "ai_usage_update" ON ai_usage FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "ai_usage_delete" ON ai_usage FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER ai_usage_updated_at
  BEFORE UPDATE ON ai_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 44. agent_metrics
-- ===========================================================================
CREATE TABLE IF NOT EXISTS agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT,
  conversation_id UUID REFERENCES conversations(id),
  intent TEXT,
  intent_confidence NUMERIC,
  selected_agent TEXT,
  handoffs TEXT[],
  is_multi_agent BOOLEAN DEFAULT false,
  classification_time_ms INTEGER,
  execution_time_ms INTEGER,
  total_time_ms INTEGER,
  tools_called TEXT[],
  tools_succeeded INTEGER DEFAULT 0,
  tools_failed INTEGER DEFAULT 0,
  response_success BOOLEAN,
  has_display BOOLEAN DEFAULT false,
  has_confirmation BOOLEAN DEFAULT false,
  has_navigation BOOLEAN DEFAULT false,
  response_length INTEGER,
  model_id TEXT,
  tokens_estimate INTEGER,
  error TEXT,
  error_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_user ON agent_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_conversation ON agent_metrics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_created_at ON agent_metrics(created_at);

ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_metrics_select" ON agent_metrics FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "agent_metrics_insert" ON agent_metrics FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "agent_metrics_update" ON agent_metrics FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "agent_metrics_delete" ON agent_metrics FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ===========================================================================
-- 45. roadmaps
-- ===========================================================================
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadmaps_user ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_status ON roadmaps(status);

ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roadmaps_select" ON roadmaps FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "roadmaps_insert" ON roadmaps FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "roadmaps_update" ON roadmaps FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "roadmaps_delete" ON roadmaps FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER roadmaps_updated_at
  BEFORE UPDATE ON roadmaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 46. roadmap_steps
-- ===========================================================================
CREATE TABLE IF NOT EXISTS roadmap_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  order_index INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_steps_roadmap ON roadmap_steps(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_steps_user ON roadmap_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_steps_status ON roadmap_steps(status);

ALTER TABLE roadmap_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roadmap_steps_select" ON roadmap_steps FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "roadmap_steps_insert" ON roadmap_steps FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "roadmap_steps_update" ON roadmap_steps FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "roadmap_steps_delete" ON roadmap_steps FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TRIGGER roadmap_steps_updated_at
  BEFORE UPDATE ON roadmap_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 47. system_parameters (reference data — no user-scoped RLS)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS system_parameters (
  key TEXT NOT NULL,
  year INTEGER NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (key, year)
);

ALTER TABLE system_parameters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_parameters_read" ON system_parameters FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER system_parameters_updated_at
  BEFORE UPDATE ON system_parameters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 48. skv_tax_tables (reference data)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS skv_tax_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  table_number INTEGER NOT NULL,
  column_number INTEGER NOT NULL DEFAULT 1,
  income_from INTEGER NOT NULL,
  income_to INTEGER NOT NULL,
  tax_deduction INTEGER NOT NULL,
  UNIQUE(year, table_number, column_number, income_from)
);

ALTER TABLE skv_tax_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skv_tax_tables_read" ON skv_tax_tables FOR SELECT TO authenticated
  USING (true);

-- ===========================================================================
-- 49. formaner_catalog (reference data)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS formaner_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('tax_free', 'taxable', 'salary_sacrifice')),
  max_amount NUMERIC,
  tax_free BOOLEAN NOT NULL DEFAULT false,
  formansvarde_calculation TEXT,
  description TEXT,
  rules JSONB DEFAULT '{}'::jsonb,
  bas_account TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE formaner_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "formaner_catalog_read" ON formaner_catalog FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER formaner_catalog_updated_at
  BEFORE UPDATE ON formaner_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 50. rate_limits
-- ===========================================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  identifier TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  reset_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- service_role bypasses RLS; no policies needed for service-only access.

CREATE TRIGGER rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 51. rate_limits_sliding
-- ===========================================================================
CREATE TABLE IF NOT EXISTS rate_limits_sliding (
  identifier TEXT PRIMARY KEY,
  window_data JSONB,
  last_access TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rate_limits_sliding ENABLE ROW LEVEL SECURITY;
-- anon can select/update for pre-auth rate limiting
CREATE POLICY "rate_limits_sliding_anon_select" ON rate_limits_sliding FOR SELECT TO anon
  USING (true);
CREATE POLICY "rate_limits_sliding_anon_update" ON rate_limits_sliding FOR UPDATE TO anon
  USING (true);

CREATE TRIGGER rate_limits_sliding_updated_at
  BEFORE UPDATE ON rate_limits_sliding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- Global grants
-- ===========================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
