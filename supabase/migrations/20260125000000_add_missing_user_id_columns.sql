-- ============================================
-- CRITICAL SECURITY FIX: Add user_id to all tables
-- This ensures RLS can properly isolate user data
-- ============================================

-- Helper function to add user_id if missing
CREATE OR REPLACE FUNCTION add_user_id_if_missing(p_table_name TEXT)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name 
        AND column_name = 'user_id'
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE', p_table_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_user_id ON %I(user_id)', p_table_name, p_table_name);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 1: Add user_id columns to all tables that need them
-- ============================================

-- Tax & Financial Reports
SELECT add_user_id_if_missing('tax_reports');
SELECT add_user_id_if_missing('agi_reports');
SELECT add_user_id_if_missing('vat_declarations');
SELECT add_user_id_if_missing('income_declarations');
SELECT add_user_id_if_missing('k10_declarations');
SELECT add_user_id_if_missing('ne_appendices');
SELECT add_user_id_if_missing('annual_closings');
SELECT add_user_id_if_missing('annual_reports');
-- SELECT add_user_id_if_missing('month_closings'); -- Dropped in previous migration
SELECT add_user_id_if_missing('financial_periods');

-- Accounting
SELECT add_user_id_if_missing('verifications');
SELECT add_user_id_if_missing('assets');

-- Company & Ownership
SELECT add_user_id_if_missing('companies');
SELECT add_user_id_if_missing('company_meetings');
SELECT add_user_id_if_missing('board_minutes');

-- Employees & Benefits
SELECT add_user_id_if_missing('employees');
SELECT add_user_id_if_missing('benefits');
SELECT add_user_id_if_missing('employee_benefits');

-- Communication & Events
SELECT add_user_id_if_missing('inbox_items');
SELECT add_user_id_if_missing('events');

-- AI & System Logs
SELECT add_user_id_if_missing('ai_logs');

-- Drop helper function
DROP FUNCTION add_user_id_if_missing;

-- ============================================
-- STEP 2: Create/Update RLS policies for all tables
-- ============================================

-- Helper to create standard user RLS policy
DO $$
DECLARE
    tbl TEXT;
    tables_to_secure TEXT[] := ARRAY[
        'tax_reports', 'agi_reports', 'vat_declarations', 'income_declarations',
        'k10_declarations', 'ne_appendices', 'annual_closings', 'annual_reports',
        'financial_periods', 'verifications', 'assets',
        'companies', 'company_meetings', 'board_minutes', 'employees',
        'benefits', 'employee_benefits', 'inbox_items', 'events', 'ai_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables_to_secure LOOP
        -- Enable RLS if not already
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        
        -- Drop old policies
        EXECUTE format('DROP POLICY IF EXISTS "Users can view own %s" ON %I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own %s" ON %I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Enable read access for own %s" ON %I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Enable insert access for own %s" ON %I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Enable update access for own %s" ON %I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Enable delete access for own %s" ON %I', tbl, tbl);
        
        -- Create single consolidated policy using optimized auth check
        EXECUTE format('
            CREATE POLICY "Users can manage own %s" ON %I FOR ALL
            USING (user_id = (select auth.uid()))
            WITH CHECK (user_id = (select auth.uid()))', 
            tbl, tbl
        );
    END LOOP;
END $$;

-- ============================================
-- STEP 3: Special cases
-- ============================================

-- categories: Global lookup table, read-only for all authenticated users
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_read_policy" ON categories;
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
CREATE POLICY "Authenticated users can read categories" ON categories 
    FOR SELECT USING (auth.role() = 'authenticated');

-- rate_limits: System table, no user access needed
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rate_limits_policy" ON rate_limits;
-- Service role only - no policy needed for regular users

-- rate_limits_sliding: System table, no user access needed  
ALTER TABLE rate_limits_sliding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rate_limits_sliding_policy" ON rate_limits_sliding;
-- Service role only - no policy needed for regular users

-- ============================================
-- STEP 4: Verification
-- ============================================

-- Create a function to check RLS status
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(table_name TEXT, has_rls BOOLEAN, has_user_id BOOLEAN, policy_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity,
        EXISTS(
            SELECT 1 FROM information_schema.columns c 
            WHERE c.table_schema = 'public' 
            AND c.table_name = t.tablename 
            AND c.column_name = 'user_id'
        ),
        (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename)
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- You can run this to verify: SELECT * FROM check_rls_status();

COMMENT ON FUNCTION check_rls_status IS 'Check RLS and user_id status for all public tables';
