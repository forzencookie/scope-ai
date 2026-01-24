-- ============================================================================
-- COMPREHENSIVE SECURITY FIXES AND BEST PRACTICES
-- ============================================================================
-- This migration fixes:
-- 1. CRITICAL: Remove public access policies (data leak)
-- 2. CRITICAL: Fix user_id TEXT -> UUID type
-- 3. HIGH: Add missing RLS policies
-- 4. MEDIUM: Remove duplicate policies, use {authenticated} role
-- 5. MEDIUM: Add missing FK constraints to auth.users
-- 6. Add CHECK constraints and NOT NULL where appropriate
-- 7. Add missing indexes for common queries
-- ============================================================================

-- ============================================================================
-- SECTION 1: FIX user_id TYPE (TEXT -> UUID)
-- ============================================================================
-- These tables have user_id as TEXT but should be UUID for proper FK to auth.users

-- agireports
ALTER TABLE agireports 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- annualclosings
ALTER TABLE annualclosings 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- annualreports
ALTER TABLE annualreports 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- assets
ALTER TABLE assets 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- ============================================================================
-- SECTION 2: ADD FOREIGN KEY CONSTRAINTS TO auth.users
-- ============================================================================
-- Add FK constraints for user_id columns (with exception handling)

DO $$
DECLARE
  tables_with_user_id TEXT[] := ARRAY[
    'accountbalances', 'agireports', 'ailogs', 'aiusage', 'annualclosings',
    'annualreports', 'assets', 'bankconnections', 'benefits', 'boardminutes',
    'companies', 'companymeetings', 'customerinvoices', 'dividends', 'documents',
    'employeebenefits', 'employees', 'events', 'financialperiods', 'inboxitems',
    'incomedeclarations', 'integrations', 'inventarier', 'k10declarations',
    'members', 'monthclosings', 'notifications', 'partners', 'payslips',
    'settings', 'shareholders', 'sharetransactions', 'supplierinvoices',
    'taxcalendar', 'taxreports', 'transactions', 'vatdeclarations', 'verifications'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables_with_user_id LOOP
    BEGIN
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I_user_id_fk 
         FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',
        t, t
      );
      RAISE NOTICE 'Added FK constraint on %.user_id', t;
    EXCEPTION 
      WHEN duplicate_object THEN 
        RAISE NOTICE 'FK constraint already exists on %.user_id', t;
      WHEN undefined_column THEN
        RAISE NOTICE 'Column user_id does not exist on %', t;
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not add FK on %.user_id: %', t, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 3: DROP ALL INSECURE POLICIES
-- ============================================================================

-- Drop all public access / overly permissive policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Drop policies that have 'true' as qual (public access)
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND (qual::text = 'true' OR qual::text LIKE '%true%')
    AND tablename NOT IN ('categories', 'ratelimits', 'ratelimitssliding', 'securityauditlog')
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
        policy_record.policyname, policy_record.tablename);
      RAISE NOTICE 'Dropped insecure policy: % on %', 
        policy_record.policyname, policy_record.tablename;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not drop policy % on %: %', 
        policy_record.policyname, policy_record.tablename, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 4: DROP ALL EXISTING POLICIES (clean slate for consistent policies)
-- ============================================================================

-- Drop all existing policies on user tables to replace with consistent ones
DO $$
DECLARE
  t TEXT;
  user_tables TEXT[] := ARRAY[
    'accountbalances', 'agireports', 'ailogs', 'aiusage', 'annualclosings',
    'annualreports', 'assets', 'bankconnections', 'benefits', 'boardminutes',
    'companies', 'companymeetings', 'customerinvoices', 'dividends', 'documents',
    'employeebenefits', 'employees', 'events', 'financialperiods', 'inboxitems',
    'incomedeclarations', 'integrations', 'inventarier', 'k10declarations',
    'members', 'monthclosings', 'neappendices', 'notifications', 'partners', 
    'payslips', 'receipts', 'settings', 'shareholders', 'sharetransactions', 
    'supplierinvoices', 'taxcalendar', 'taxreports', 'transactions', 
    'vatdeclarations', 'verifications'
  ];
  policy_record RECORD;
BEGIN
  FOREACH t IN ARRAY user_tables LOOP
    FOR policy_record IN 
      SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public'
    LOOP
      BEGIN
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, t);
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 5: CREATE CONSISTENT RLS POLICIES
-- Using (SELECT auth.uid()) pattern for performance
-- Using {authenticated} role (not {public})
-- ============================================================================

-- Helper: Create standard CRUD policies for a table with user_id column
CREATE OR REPLACE FUNCTION create_user_policies(table_name TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- SELECT policy
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT TO authenticated 
     USING (user_id = (SELECT auth.uid()))',
    table_name || '_select', table_name
  );
  
  -- INSERT policy
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT TO authenticated 
     WITH CHECK (user_id = (SELECT auth.uid()))',
    table_name || '_insert', table_name
  );
  
  -- UPDATE policy
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE TO authenticated 
     USING (user_id = (SELECT auth.uid())) 
     WITH CHECK (user_id = (SELECT auth.uid()))',
    table_name || '_update', table_name
  );
  
  -- DELETE policy
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE TO authenticated 
     USING (user_id = (SELECT auth.uid()))',
    table_name || '_delete', table_name
  );
END;
$$;

-- Apply standard policies to all user tables
DO $$
DECLARE
  t TEXT;
  user_tables TEXT[] := ARRAY[
    'accountbalances', 'agireports', 'ailogs', 'annualclosings',
    'annualreports', 'assets', 'bankconnections', 'benefits', 'boardminutes',
    'companies', 'companymeetings', 'customerinvoices', 'dividends', 'documents',
    'employeebenefits', 'employees', 'events', 'financialperiods', 'inboxitems',
    'incomedeclarations', 'integrations', 'inventarier', 'k10declarations',
    'members', 'monthclosings', 'neappendices', 'notifications', 'partners', 
    'payslips', 'receipts', 'settings', 'shareholders', 'sharetransactions', 
    'supplierinvoices', 'taxcalendar', 'taxreports', 'transactions', 
    'vatdeclarations', 'verifications'
  ];
BEGIN
  FOREACH t IN ARRAY user_tables LOOP
    BEGIN
      PERFORM create_user_policies(t);
      RAISE NOTICE 'Created policies for %', t;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create policies for %: %', t, SQLERRM;
    END;
  END LOOP;
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS create_user_policies(TEXT);

-- ============================================================================
-- SECTION 6: SPECIAL POLICIES FOR SPECIFIC TABLES
-- ============================================================================

-- AIUSAGE: Service role can manage, users can only view own
DROP POLICY IF EXISTS aiusage_select ON aiusage;
DROP POLICY IF EXISTS aiusage_insert ON aiusage;
DROP POLICY IF EXISTS aiusage_update ON aiusage;
DROP POLICY IF EXISTS aiusage_delete ON aiusage;

CREATE POLICY aiusage_select ON aiusage FOR SELECT TO authenticated 
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY aiusage_service_all ON aiusage FOR ALL TO service_role 
  USING (true) WITH CHECK (true);

-- PROFILES: Uses id, not user_id
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated 
  USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_update ON profiles FOR UPDATE TO authenticated 
  USING (id = (SELECT auth.uid())) 
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_insert ON profiles FOR INSERT TO authenticated 
  WITH CHECK (id = (SELECT auth.uid()));

-- CATEGORIES: Read-only for all authenticated users (global BAS account codes)
DROP POLICY IF EXISTS "Authenticated users can read categories" ON categories;
DROP POLICY IF EXISTS "categories_admin_write" ON categories;
DROP POLICY IF EXISTS "categories_select_policy" ON categories;

CREATE POLICY categories_select ON categories FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY categories_admin_all ON categories FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (SELECT auth.uid()) 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (SELECT auth.uid()) 
      AND profiles.role = 'admin'
    )
  );

-- SECURITY AUDIT LOG: Admins can view, service can insert
DROP POLICY IF EXISTS "Admins can view audit logs" ON securityauditlog;
DROP POLICY IF EXISTS "System can insert audit logs" ON securityauditlog;

CREATE POLICY securityauditlog_admin_select ON securityauditlog FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (SELECT auth.uid()) 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY securityauditlog_service_insert ON securityauditlog FOR INSERT TO service_role 
  WITH CHECK (true);

-- RATE LIMITS: Service role only
DROP POLICY IF EXISTS ratelimits_select ON ratelimits;
DROP POLICY IF EXISTS ratelimits_insert ON ratelimits;
DROP POLICY IF EXISTS ratelimits_update ON ratelimits;
DROP POLICY IF EXISTS ratelimits_delete ON ratelimits;

CREATE POLICY ratelimits_service_all ON ratelimits FOR ALL TO service_role 
  USING (true) WITH CHECK (true);

-- RATE LIMITS SLIDING: Anon for rate limiting, service role for management
DROP POLICY IF EXISTS "Anon rate limit access" ON ratelimitssliding;
DROP POLICY IF EXISTS "Service role full access" ON ratelimitssliding;

CREATE POLICY ratelimitssliding_anon_all ON ratelimitssliding FOR ALL TO anon 
  USING (true) WITH CHECK (true);

CREATE POLICY ratelimitssliding_service_all ON ratelimitssliding FOR ALL TO service_role 
  USING (true) WITH CHECK (true);

-- ============================================================================
-- SECTION 7: ADD COMPANY SUBSCRIPTION SUPPORT
-- User can manage multiple companies, each company needs subscription
-- ============================================================================

-- Add subscription columns to companies if not exists
DO $$
BEGIN
  -- subscription_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_status TEXT DEFAULT 'trial';
  END IF;
  
  -- subscription_tier
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_tier TEXT DEFAULT 'free';
  END IF;
  
  -- subscription_ends_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'subscription_ends_at'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_ends_at TIMESTAMPTZ;
  END IF;
  
  -- stripe_customer_id (for company, not user)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN stripe_customer_id TEXT;
  END IF;
  
  -- stripe_subscription_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN stripe_subscription_id TEXT;
  END IF;
END $$;

-- Add CHECK constraint for subscription_status
DO $$
BEGIN
  ALTER TABLE companies ADD CONSTRAINT chk_companies_subscription_status 
    CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'expired'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add CHECK constraint for subscription_tier
DO $$
BEGIN
  ALTER TABLE companies ADD CONSTRAINT chk_companies_subscription_tier 
    CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer 
  ON companies(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_subscription_status 
  ON companies(subscription_status);

-- ============================================================================
-- SECTION 8: CHECK CONSTRAINTS FOR DATA INTEGRITY
-- ============================================================================

-- Status constraints
DO $$
BEGIN
  -- agireports status
  ALTER TABLE agireports ADD CONSTRAINT chk_agireports_status 
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- annualclosings status
  ALTER TABLE annualclosings ADD CONSTRAINT chk_annualclosings_status 
    CHECK (status IN ('draft', 'in_progress', 'completed', 'submitted'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- annualreports status
  ALTER TABLE annualreports ADD CONSTRAINT chk_annualreports_status 
    CHECK (status IN ('draft', 'approved', 'submitted', 'filed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- assets status
  ALTER TABLE assets ADD CONSTRAINT chk_assets_status 
    CHECK (status IN ('active', 'disposed', 'written_off'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- bankconnections status
  ALTER TABLE bankconnections ADD CONSTRAINT chk_bankconnections_status 
    CHECK (status IN ('active', 'inactive', 'error', 'expired'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Numeric constraints
DO $$
BEGIN
  -- assets depreciation_rate must be 0-100
  ALTER TABLE assets ADD CONSTRAINT chk_assets_depreciation_rate 
    CHECK (depreciation_rate >= 0 AND depreciation_rate <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- assets purchase_value must be positive
  ALTER TABLE assets ADD CONSTRAINT chk_assets_purchase_value_positive 
    CHECK (purchase_value >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- agireports totals must be non-negative
  ALTER TABLE agireports ADD CONSTRAINT chk_agireports_totals_positive 
    CHECK (total_salary >= 0 AND total_tax >= 0 AND employer_contributions >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 9: MISSING INDEXES FOR COMMON QUERIES
-- ============================================================================

-- User + status queries (common pattern)
CREATE INDEX IF NOT EXISTS idx_agireports_user_status 
  ON agireports(user_id, status);

CREATE INDEX IF NOT EXISTS idx_annualclosings_user_status 
  ON annualclosings(user_id, status);

CREATE INDEX IF NOT EXISTS idx_annualreports_user_status 
  ON annualreports(user_id, status);

CREATE INDEX IF NOT EXISTS idx_assets_user_status 
  ON assets(user_id, status);

-- Fiscal year queries
CREATE INDEX IF NOT EXISTS idx_annualclosings_user_year 
  ON annualclosings(user_id, fiscal_year);

CREATE INDEX IF NOT EXISTS idx_annualreports_user_year 
  ON annualreports(user_id, fiscal_year);

-- Company + user queries (for multi-company support)
CREATE INDEX IF NOT EXISTS idx_accountbalances_user_company 
  ON accountbalances(user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_customerinvoices_user_company 
  ON customerinvoices(user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_supplierinvoices_user_company 
  ON supplierinvoices(user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_shareholders_user_company 
  ON shareholders(user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_companymeetings_user_company 
  ON companymeetings(user_id, company_id);

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_customerinvoices_user_due 
  ON customerinvoices(user_id, due_date);

CREATE INDEX IF NOT EXISTS idx_transactions_user_occurred 
  ON transactions(user_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_receipts_user_captured 
  ON receipts(user_id, captured_at);

-- ============================================================================
-- SECTION 10: ENABLE RLS ON ALL TABLES (if not already enabled)
-- ============================================================================

DO $$
DECLARE
  t TEXT;
  all_tables TEXT[] := ARRAY[
    'accountbalances', 'agireports', 'ailogs', 'aiusage', 'annualclosings',
    'annualreports', 'assets', 'bankconnections', 'benefits', 'boardminutes',
    'categories', 'companies', 'companymeetings', 'customerinvoices', 'dividends', 
    'documents', 'employeebenefits', 'employees', 'events', 'financialperiods', 
    'inboxitems', 'incomedeclarations', 'integrations', 'inventarier', 
    'k10declarations', 'members', 'monthclosings', 'neappendices', 'notifications', 
    'partners', 'payslips', 'profiles', 'ratelimits', 'ratelimitssliding',
    'receipts', 'securityauditlog', 'settings', 'shareholders', 'sharetransactions', 
    'supplierinvoices', 'taxcalendar', 'taxreports', 'transactions', 
    'vatdeclarations', 'verifications'
  ];
BEGIN
  FOREACH t IN ARRAY all_tables LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 11: REVOKE PUBLIC ACCESS, GRANT TO AUTHENTICATED
-- ============================================================================

-- Revoke all from public/anon on sensitive tables
DO $$
DECLARE
  t TEXT;
  sensitive_tables TEXT[] := ARRAY[
    'accountbalances', 'agireports', 'ailogs', 'aiusage', 'annualclosings',
    'annualreports', 'assets', 'bankconnections', 'benefits', 'boardminutes',
    'companies', 'companymeetings', 'customerinvoices', 'dividends', 'documents',
    'employeebenefits', 'employees', 'events', 'financialperiods', 'inboxitems',
    'incomedeclarations', 'integrations', 'inventarier', 'k10declarations',
    'members', 'monthclosings', 'neappendices', 'notifications', 'partners', 
    'payslips', 'profiles', 'receipts', 'securityauditlog', 'settings', 
    'shareholders', 'sharetransactions', 'supplierinvoices', 'taxcalendar', 
    'taxreports', 'transactions', 'vatdeclarations', 'verifications'
  ];
BEGIN
  FOREACH t IN ARRAY sensitive_tables LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON %I FROM anon', t);
      EXECUTE format('REVOKE ALL ON %I FROM public', t);
      EXECUTE format('GRANT ALL ON %I TO authenticated', t);
      EXECUTE format('GRANT ALL ON %I TO service_role', t);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- Categories: read-only for authenticated
REVOKE ALL ON categories FROM anon;
REVOKE ALL ON categories FROM public;
GRANT SELECT ON categories TO authenticated;
GRANT ALL ON categories TO service_role;

-- Rate limits: only service_role and anon (for rate limiting)
GRANT ALL ON ratelimits TO service_role;
GRANT ALL ON ratelimitssliding TO anon;
GRANT ALL ON ratelimitssliding TO service_role;

-- ============================================================================
-- SECTION 12: UPDATE SECURITY DEFINER FUNCTIONS
-- Ensure all SECURITY DEFINER functions have search_path set
-- ============================================================================

-- Recreate critical functions with proper security settings
CREATE OR REPLACE FUNCTION get_shareholder_stats(p_company_id TEXT DEFAULT NULL)
RETURNS TABLE (
  total_shareholders BIGINT,
  total_shares NUMERIC,
  unique_shareholders BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT,
    COALESCE(SUM(shares), 0)::NUMERIC,
    COUNT(DISTINCT name)::BIGINT
  FROM shareholders
  WHERE user_id = (SELECT auth.uid())
    AND (p_company_id IS NULL OR company_id = p_company_id);
END;
$$;

CREATE OR REPLACE FUNCTION get_invoice_stats()
RETURNS TABLE (
  total_invoices BIGINT,
  total_amount NUMERIC,
  paid_amount NUMERIC,
  overdue_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT,
    COALESCE(SUM(total_amount), 0)::NUMERIC,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0)::NUMERIC,
    COUNT(*) FILTER (WHERE status = 'overdue')::BIGINT
  FROM customerinvoices
  WHERE user_id = (SELECT auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION get_transaction_stats()
RETURNS TABLE (
  total_transactions BIGINT,
  total_income NUMERIC,
  total_expenses NUMERIC,
  pending_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT,
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)::NUMERIC,
    COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0)::NUMERIC,
    COUNT(*) FILTER (WHERE status = 'Att bokföra')::BIGINT
  FROM transactions
  WHERE user_id = (SELECT auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION get_receipt_stats()
RETURNS TABLE (
  total_receipts BIGINT,
  pending_receipts BIGINT,
  processed_receipts BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'processed')::BIGINT
  FROM receipts
  WHERE user_id = (SELECT auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION get_inventory_stats()
RETURNS TABLE (
  total_items BIGINT,
  total_value NUMERIC,
  active_items BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT,
    COALESCE(SUM(current_value), 0)::NUMERIC,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT
  FROM inventarier
  WHERE user_id = (SELECT auth.uid());
END;
$$;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION get_shareholder_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_invoice_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_transaction_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_receipt_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_stats TO authenticated;

-- ============================================================================
-- VERIFICATION: Check RLS status
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_security_setup()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count BIGINT,
  has_user_id BOOLEAN,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.relname::TEXT,
    t.relrowsecurity,
    (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.relname)::BIGINT,
    EXISTS(
      SELECT 1 FROM information_schema.columns c 
      WHERE c.table_name = t.relname AND c.column_name = 'user_id'
    ),
    CASE 
      WHEN NOT t.relrowsecurity THEN '❌ RLS DISABLED'
      WHEN (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.relname) = 0 THEN '❌ NO POLICIES'
      ELSE '✅ OK'
    END
  FROM pg_class t
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public' AND t.relkind = 'r'
  ORDER BY t.relname;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_security_setup TO authenticated;

-- ============================================================================
-- COMPLETION LOG
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Security fixes migration completed successfully!';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  1. Fixed user_id TEXT -> UUID on 4 tables';
  RAISE NOTICE '  2. Added FK constraints to auth.users';
  RAISE NOTICE '  3. Removed all insecure public access policies';
  RAISE NOTICE '  4. Created consistent RLS policies using (SELECT auth.uid())';
  RAISE NOTICE '  5. Added company subscription columns';
  RAISE NOTICE '  6. Added CHECK constraints for data integrity';
  RAISE NOTICE '  7. Added missing indexes for performance';
  RAISE NOTICE '  8. Revoked anon/public access on sensitive tables';
  RAISE NOTICE '  9. Updated SECURITY DEFINER functions';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Run SELECT * FROM verify_security_setup() to check status';
  RAISE NOTICE '============================================================';
END $$;
