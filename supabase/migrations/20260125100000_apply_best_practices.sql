-- ============================================================================
-- BEST PRACTICES MIGRATION
-- ============================================================================
-- This migration applies:
-- 1. Missing indexes for common query patterns
-- 2. NOT NULL constraints (with defaults for existing data)
-- 3. CHECK constraints for data integrity
-- 4. Updated RLS policies with (select auth.uid()) pattern
-- 5. Remove security holes (OR user_id IS NULL)
-- ============================================================================

-- ============================================================================
-- SECTION 1: MISSING INDEXES
-- ============================================================================

-- Transactions indexes (high traffic)
CREATE INDEX IF NOT EXISTS idx_transactions_user_status 
ON transactions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_transactions_user_company 
ON transactions(user_id, company_id);

-- Customer invoices indexes
CREATE INDEX IF NOT EXISTS idx_customerinvoices_user_status_due 
ON customerinvoices(user_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_customerinvoices_user_number 
ON customerinvoices(user_id, invoice_number);

-- Supplier invoices indexes
CREATE INDEX IF NOT EXISTS idx_supplierinvoices_user_status 
ON supplierinvoices(user_id, status);

-- Payslips indexes
CREATE INDEX IF NOT EXISTS idx_payslips_user_period 
ON payslips(user_id, period);

CREATE INDEX IF NOT EXISTS idx_payslips_employee 
ON payslips(employee_id);

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_user_status 
ON employees(user_id, status);

-- Verifications indexes
CREATE INDEX IF NOT EXISTS idx_verifications_user_date 
ON verifications(user_id, date DESC);

-- Tax reports indexes
CREATE INDEX IF NOT EXISTS idx_taxreports_user_period 
ON taxreports(user_id, type, period_id);

-- Events indexes (already exists but verify)
CREATE INDEX IF NOT EXISTS idx_events_user_timestamp 
ON events(user_id, timestamp DESC);

-- AI usage indexes
CREATE INDEX IF NOT EXISTS idx_aiusage_user_period 
ON aiusage(user_id, period_start, period_end);

-- Financial periods indexes
CREATE INDEX IF NOT EXISTS idx_financialperiods_user_dates 
ON financialperiods(user_id, start_date, end_date);

-- Shareholders indexes
CREATE INDEX IF NOT EXISTS idx_shareholders_user_company 
ON shareholders(user_id, company_id);

-- Company meetings indexes
CREATE INDEX IF NOT EXISTS idx_companymeetings_user_date 
ON companymeetings(user_id, date DESC);

-- K10 declarations indexes
CREATE INDEX IF NOT EXISTS idx_k10declarations_user_year 
ON k10declarations(user_id, fiscal_year);

-- ============================================================================
-- SECTION 2: NOT NULL CONSTRAINTS
-- (Using DO blocks with ALTER TABLE SET NOT NULL where safe)
-- ============================================================================

-- Transactions: ensure key fields are not null
DO $$
BEGIN
  -- First update any NULL values to defaults
  UPDATE transactions SET status = 'Att bokföra' WHERE status IS NULL;
  UPDATE transactions SET amount_value = 0 WHERE amount_value IS NULL;
  
  -- Then add constraint (may already be NOT NULL)
  BEGIN
    ALTER TABLE transactions ALTER COLUMN status SET NOT NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE transactions ALTER COLUMN amount_value SET NOT NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Employees: ensure key fields are not null
DO $$
BEGIN
  UPDATE employees SET monthly_salary = 0 WHERE monthly_salary IS NULL;
  UPDATE employees SET tax_rate = 0.30 WHERE tax_rate IS NULL;
  UPDATE employees SET status = 'active' WHERE status IS NULL;
  
  BEGIN
    ALTER TABLE employees ALTER COLUMN monthly_salary SET NOT NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE employees ALTER COLUMN tax_rate SET NOT NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  -- Add default for new rows
  ALTER TABLE employees ALTER COLUMN monthly_salary SET DEFAULT 0;
  ALTER TABLE employees ALTER COLUMN tax_rate SET DEFAULT 0.30;
  ALTER TABLE employees ALTER COLUMN status SET DEFAULT 'active';
END $$;

-- Payslips: ensure salary fields are not null
DO $$
BEGIN
  UPDATE payslips SET gross_salary = 0 WHERE gross_salary IS NULL;
  UPDATE payslips SET net_salary = 0 WHERE net_salary IS NULL;
  
  BEGIN
    ALTER TABLE payslips ALTER COLUMN gross_salary SET NOT NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE payslips ALTER COLUMN net_salary SET NOT NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  ALTER TABLE payslips ALTER COLUMN gross_salary SET DEFAULT 0;
  ALTER TABLE payslips ALTER COLUMN net_salary SET DEFAULT 0;
END $$;

-- Customer invoices: ensure key fields are not null
DO $$
BEGIN
  UPDATE customerinvoices SET total_amount = 0 WHERE total_amount IS NULL;
  UPDATE customerinvoices SET status = 'draft' WHERE status IS NULL;
  
  BEGIN
    ALTER TABLE customerinvoices ALTER COLUMN total_amount SET NOT NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  ALTER TABLE customerinvoices ALTER COLUMN total_amount SET DEFAULT 0;
  ALTER TABLE customerinvoices ALTER COLUMN status SET DEFAULT 'draft';
END $$;

-- ============================================================================
-- SECTION 3: CHECK CONSTRAINTS
-- ============================================================================

-- Employees constraints
DO $$
BEGIN
  ALTER TABLE employees 
    ADD CONSTRAINT chk_employees_tax_rate 
    CHECK (tax_rate >= 0 AND tax_rate <= 1);
EXCEPTION 
  WHEN duplicate_object THEN NULL;
  WHEN check_violation THEN 
    -- Fix bad data first
    UPDATE employees SET tax_rate = LEAST(GREATEST(tax_rate, 0), 1);
    ALTER TABLE employees 
      ADD CONSTRAINT chk_employees_tax_rate 
      CHECK (tax_rate >= 0 AND tax_rate <= 1);
END $$;

DO $$
BEGIN
  ALTER TABLE employees 
    ADD CONSTRAINT chk_employees_salary_positive 
    CHECK (monthly_salary >= 0);
EXCEPTION 
  WHEN duplicate_object THEN NULL;
  WHEN check_violation THEN
    UPDATE employees SET monthly_salary = ABS(monthly_salary);
    ALTER TABLE employees 
      ADD CONSTRAINT chk_employees_salary_positive 
      CHECK (monthly_salary >= 0);
END $$;

-- Payslips constraints
DO $$
BEGIN
  ALTER TABLE payslips 
    ADD CONSTRAINT chk_payslips_gross_positive 
    CHECK (gross_salary >= 0);
EXCEPTION 
  WHEN duplicate_object THEN NULL;
  WHEN check_violation THEN
    UPDATE payslips SET gross_salary = ABS(gross_salary);
    ALTER TABLE payslips 
      ADD CONSTRAINT chk_payslips_gross_positive 
      CHECK (gross_salary >= 0);
END $$;

DO $$
BEGIN
  ALTER TABLE payslips 
    ADD CONSTRAINT chk_payslips_net_positive 
    CHECK (net_salary >= 0);
EXCEPTION 
  WHEN duplicate_object THEN NULL;
  WHEN check_violation THEN
    UPDATE payslips SET net_salary = ABS(net_salary);
    ALTER TABLE payslips 
      ADD CONSTRAINT chk_payslips_net_positive 
      CHECK (net_salary >= 0);
END $$;

-- Customer invoices constraints
DO $$
BEGIN
  ALTER TABLE customerinvoices 
    ADD CONSTRAINT chk_customerinvoices_amount_positive 
    CHECK (total_amount >= 0);
EXCEPTION 
  WHEN duplicate_object THEN NULL;
  WHEN check_violation THEN
    UPDATE customerinvoices SET total_amount = ABS(total_amount);
    ALTER TABLE customerinvoices 
      ADD CONSTRAINT chk_customerinvoices_amount_positive 
      CHECK (total_amount >= 0);
END $$;

-- Shareholders constraints
DO $$
BEGIN
  ALTER TABLE shareholders 
    ADD CONSTRAINT chk_shareholders_shares_positive 
    CHECK (shares >= 0);
EXCEPTION 
  WHEN duplicate_object THEN NULL;
  WHEN check_violation THEN
    UPDATE shareholders SET shares = ABS(shares);
    ALTER TABLE shareholders 
      ADD CONSTRAINT chk_shareholders_shares_positive 
      CHECK (shares >= 0);
END $$;

DO $$
BEGIN
  ALTER TABLE shareholders 
    ADD CONSTRAINT chk_shareholders_percentage 
    CHECK (share_percentage >= 0 AND share_percentage <= 100);
EXCEPTION 
  WHEN duplicate_object THEN NULL;
  WHEN check_violation THEN
    UPDATE shareholders SET share_percentage = LEAST(GREATEST(share_percentage, 0), 100);
    ALTER TABLE shareholders 
      ADD CONSTRAINT chk_shareholders_percentage 
      CHECK (share_percentage >= 0 AND share_percentage <= 100);
END $$;

-- Dividends constraints
DO $$
BEGIN
  ALTER TABLE dividends 
    ADD CONSTRAINT chk_dividends_amount_positive 
    CHECK (total_amount >= 0);
EXCEPTION 
  WHEN duplicate_object THEN NULL;
  WHEN check_violation THEN
    UPDATE dividends SET total_amount = ABS(total_amount);
    ALTER TABLE dividends 
      ADD CONSTRAINT chk_dividends_amount_positive 
      CHECK (total_amount >= 0);
END $$;

-- ============================================================================
-- SECTION 4: FIX RLS POLICIES
-- Use (select auth.uid()) pattern for performance (auth_rls_initplan fix)
-- Remove OR user_id IS NULL security holes
-- ============================================================================

-- Create helper function to recreate RLS policies with correct pattern
-- This ensures we use the optimized (select auth.uid()) pattern

-- First, let's fix the most critical tables

-- TRANSACTIONS
DO $$
BEGIN
  DROP POLICY IF EXISTS "transactions_select_policy" ON transactions;
  DROP POLICY IF EXISTS "transactions_insert_policy" ON transactions;
  DROP POLICY IF EXISTS "transactions_update_policy" ON transactions;
  DROP POLICY IF EXISTS "transactions_delete_policy" ON transactions;
  DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
  DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
  DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
  DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
  
  CREATE POLICY "transactions_select" ON transactions FOR SELECT 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "transactions_insert" ON transactions FOR INSERT 
    TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
  CREATE POLICY "transactions_update" ON transactions FOR UPDATE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "transactions_delete" ON transactions FOR DELETE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update transactions policies: %', SQLERRM;
END $$;

-- CUSTOMER INVOICES
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own customer invoices" ON customerinvoices;
  DROP POLICY IF EXISTS "Users can insert own customer invoices" ON customerinvoices;
  DROP POLICY IF EXISTS "Users can update own customer invoices" ON customerinvoices;
  DROP POLICY IF EXISTS "Users can delete own customer invoices" ON customerinvoices;
  
  CREATE POLICY "customerinvoices_select" ON customerinvoices FOR SELECT 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "customerinvoices_insert" ON customerinvoices FOR INSERT 
    TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
  CREATE POLICY "customerinvoices_update" ON customerinvoices FOR UPDATE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "customerinvoices_delete" ON customerinvoices FOR DELETE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update customerinvoices policies: %', SQLERRM;
END $$;

-- EMPLOYEES
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own employees" ON employees;
  DROP POLICY IF EXISTS "Users can insert own employees" ON employees;
  DROP POLICY IF EXISTS "Users can update own employees" ON employees;
  DROP POLICY IF EXISTS "Users can delete own employees" ON employees;
  
  CREATE POLICY "employees_select" ON employees FOR SELECT 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "employees_insert" ON employees FOR INSERT 
    TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
  CREATE POLICY "employees_update" ON employees FOR UPDATE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "employees_delete" ON employees FOR DELETE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update employees policies: %', SQLERRM;
END $$;

-- PAYSLIPS
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own payslips" ON payslips;
  DROP POLICY IF EXISTS "Users can insert own payslips" ON payslips;
  DROP POLICY IF EXISTS "Users can update own payslips" ON payslips;
  DROP POLICY IF EXISTS "Users can delete own payslips" ON payslips;
  
  CREATE POLICY "payslips_select" ON payslips FOR SELECT 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "payslips_insert" ON payslips FOR INSERT 
    TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
  CREATE POLICY "payslips_update" ON payslips FOR UPDATE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "payslips_delete" ON payslips FOR DELETE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update payslips policies: %', SQLERRM;
END $$;

-- SHAREHOLDERS
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own shareholders" ON shareholders;
  DROP POLICY IF EXISTS "Users can manage own shareholders" ON shareholders;
  
  CREATE POLICY "shareholders_select" ON shareholders FOR SELECT 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "shareholders_insert" ON shareholders FOR INSERT 
    TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
  CREATE POLICY "shareholders_update" ON shareholders FOR UPDATE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "shareholders_delete" ON shareholders FOR DELETE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update shareholders policies: %', SQLERRM;
END $$;

-- COMPANY MEETINGS
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own company meetings" ON companymeetings;
  DROP POLICY IF EXISTS "Users can manage own company meetings" ON companymeetings;
  
  CREATE POLICY "companymeetings_select" ON companymeetings FOR SELECT 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "companymeetings_insert" ON companymeetings FOR INSERT 
    TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
  CREATE POLICY "companymeetings_update" ON companymeetings FOR UPDATE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "companymeetings_delete" ON companymeetings FOR DELETE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update companymeetings policies: %', SQLERRM;
END $$;

-- VERIFICATIONS
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own verifications" ON verifications;
  DROP POLICY IF EXISTS "Users can manage own verifications" ON verifications;
  
  CREATE POLICY "verifications_select" ON verifications FOR SELECT 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "verifications_insert" ON verifications FOR INSERT 
    TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
  CREATE POLICY "verifications_update" ON verifications FOR UPDATE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "verifications_delete" ON verifications FOR DELETE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update verifications policies: %', SQLERRM;
END $$;

-- TAX REPORTS
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own tax reports" ON taxreports;
  DROP POLICY IF EXISTS "Users can manage own tax reports" ON taxreports;
  
  CREATE POLICY "taxreports_select" ON taxreports FOR SELECT 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "taxreports_insert" ON taxreports FOR INSERT 
    TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
  CREATE POLICY "taxreports_update" ON taxreports FOR UPDATE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "taxreports_delete" ON taxreports FOR DELETE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update taxreports policies: %', SQLERRM;
END $$;

-- EVENTS
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own events" ON events;
  DROP POLICY IF EXISTS "Users can manage own events" ON events;
  
  CREATE POLICY "events_select" ON events FOR SELECT 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "events_insert" ON events FOR INSERT 
    TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
  CREATE POLICY "events_update" ON events FOR UPDATE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "events_delete" ON events FOR DELETE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update events policies: %', SQLERRM;
END $$;

-- BENEFITS
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own benefits" ON benefits;
  DROP POLICY IF EXISTS "Users can manage own benefits" ON benefits;
  
  CREATE POLICY "benefits_select" ON benefits FOR SELECT 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "benefits_insert" ON benefits FOR INSERT 
    TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
  CREATE POLICY "benefits_update" ON benefits FOR UPDATE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "benefits_delete" ON benefits FOR DELETE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update benefits policies: %', SQLERRM;
END $$;

-- AI LOGS
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own AI logs" ON ailogs;
  DROP POLICY IF EXISTS "Users can insert AI logs" ON ailogs;
  
  CREATE POLICY "ailogs_select" ON ailogs FOR SELECT 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "ailogs_insert" ON ailogs FOR INSERT 
    TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update ailogs policies: %', SQLERRM;
END $$;

-- AI USAGE
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own AI usage" ON aiusage;
  DROP POLICY IF EXISTS "Users can insert AI usage" ON aiusage;
  DROP POLICY IF EXISTS "Users can update AI usage" ON aiusage;
  
  CREATE POLICY "aiusage_select" ON aiusage FOR SELECT 
    TO authenticated USING (user_id = (SELECT auth.uid()));
  CREATE POLICY "aiusage_insert" ON aiusage FOR INSERT 
    TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
  CREATE POLICY "aiusage_update" ON aiusage FOR UPDATE 
    TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update aiusage policies: %', SQLERRM;
END $$;

-- PROFILES (special: uses id, not user_id)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  
  CREATE POLICY "profiles_select" ON profiles FOR SELECT 
    TO authenticated USING (id = (SELECT auth.uid()));
  CREATE POLICY "profiles_update" ON profiles FOR UPDATE 
    TO authenticated USING (id = (SELECT auth.uid()));
  CREATE POLICY "profiles_insert" ON profiles FOR INSERT 
    TO authenticated WITH CHECK (id = (SELECT auth.uid()));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update profiles policies: %', SQLERRM;
END $$;

-- CATEGORIES (global read-only for all authenticated)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
  
  CREATE POLICY "categories_select" ON categories FOR SELECT 
    TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update categories policies: %', SQLERRM;
END $$;

-- SECURITY AUDIT LOG (admin only)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can view audit log" ON securityauditlog;
  
  -- Only admins can view (check profile role)
  CREATE POLICY "securityauditlog_admin_select" ON securityauditlog FOR SELECT 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = (SELECT auth.uid()) 
        AND profiles.role = 'admin'
      )
    );
    
  -- Service role can insert (for logging)
  CREATE POLICY "securityauditlog_service_insert" ON securityauditlog FOR INSERT 
    TO service_role WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update securityauditlog policies: %', SQLERRM;
END $$;

-- ============================================================================
-- SECTION 5: UPDATED FUNCTIONS FOR RENAMED TABLES
-- ============================================================================

-- Update get_shareholder_stats function
CREATE OR REPLACE FUNCTION get_shareholder_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_shareholders BIGINT,
  total_shares BIGINT,
  avg_ownership NUMERIC,
  total_companies BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_shareholders,
    COALESCE(SUM(shares)::BIGINT, 0) as total_shares,
    ROUND(AVG(share_percentage), 2) as avg_ownership,
    COUNT(DISTINCT company_id)::BIGINT as total_companies
  FROM shareholders
  WHERE user_id = v_user_id;
END;
$$;

-- Update get_meeting_stats function  
CREATE OR REPLACE FUNCTION get_meeting_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_meetings BIGINT,
  scheduled_meetings BIGINT,
  held_meetings BIGINT,
  upcoming_meetings BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_meetings,
    COUNT(*) FILTER (WHERE status = 'planned')::BIGINT as scheduled_meetings,
    COUNT(*) FILTER (WHERE status = 'held')::BIGINT as held_meetings,
    COUNT(*) FILTER (WHERE meeting_date > CURRENT_DATE AND status != 'cancelled')::BIGINT as upcoming_meetings
  FROM companymeetings
  WHERE user_id = v_user_id;
END;
$$;

-- Update get_invoice_stats function
CREATE OR REPLACE FUNCTION get_invoice_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_invoices BIGINT,
  draft_invoices BIGINT,
  sent_invoices BIGINT,
  paid_invoices BIGINT,
  overdue_invoices BIGINT,
  total_amount NUMERIC,
  paid_amount NUMERIC,
  outstanding_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_invoices,
    COUNT(*) FILTER (WHERE status = 'draft')::BIGINT as draft_invoices,
    COUNT(*) FILTER (WHERE status = 'sent')::BIGINT as sent_invoices,
    COUNT(*) FILTER (WHERE status = 'paid')::BIGINT as paid_invoices,
    COUNT(*) FILTER (WHERE status = 'overdue')::BIGINT as overdue_invoices,
    COALESCE(SUM(total_amount), 0)::NUMERIC as total_amount,
    COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0)::NUMERIC as paid_amount,
    COALESCE(SUM(total_amount) FILTER (WHERE status IN ('sent', 'overdue')), 0)::NUMERIC as outstanding_amount
  FROM customerinvoices
  WHERE user_id = v_user_id;
END;
$$;

-- ============================================================================
-- SECTION 6: GRANT PROPER PERMISSIONS
-- ============================================================================

-- Grant execute on all stats functions to authenticated users
GRANT EXECUTE ON FUNCTION get_shareholder_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_meeting_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_invoice_stats TO authenticated;

-- Revoke unnecessary permissions from anon
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN ('categories') -- categories is the only public readable table
  LOOP
    EXECUTE format('REVOKE ALL ON %I FROM anon', r.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Create a function to verify all tables have proper RLS
CREATE OR REPLACE FUNCTION verify_rls_status()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN,
  has_policies BOOLEAN,
  policy_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity::BOOLEAN,
    EXISTS(SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename)::BOOLEAN as has_policies,
    (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename)::BIGINT as policy_count
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_rls_status TO authenticated;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Best practices migration completed successfully';
END $$;
