-- ============================================
-- Fix Supabase Linter Issues (87 total)
-- 1. auth_rls_initplan - Use (select auth.uid()) for performance
-- 2. multiple_permissive_policies - Consolidate duplicate policies
-- 3. unindexed_foreign_keys - Add missing indexes
-- 4. unused_index - Drop unused indexes (optional, commented out)
-- ============================================

-- =============================================
-- PART 1: Fix auth_rls_initplan issues
-- Replace auth.uid() with (select auth.uid()) in all RLS policies
-- Only for tables that exist and have user_id column
-- =============================================

-- shareholders (has user_id)
DROP POLICY IF EXISTS "Users can view own shareholders" ON public.shareholders;
DROP POLICY IF EXISTS "Users can manage own shareholders" ON public.shareholders;

CREATE POLICY "Users can manage own shareholders"
    ON public.shareholders FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- company_meetings (has user_id)
DROP POLICY IF EXISTS "Users can view own meetings" ON public.company_meetings;
DROP POLICY IF EXISTS "Users can manage own meetings" ON public.company_meetings;

CREATE POLICY "Users can manage own meetings"
    ON public.company_meetings FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- dividends (has user_id)
DROP POLICY IF EXISTS "Users can view own dividends" ON public.dividends;
DROP POLICY IF EXISTS "Users can manage own dividends" ON public.dividends;

CREATE POLICY "Users can manage own dividends"
    ON public.dividends FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- board_minutes (has user_id)
DROP POLICY IF EXISTS "Users can view own board minutes" ON public.board_minutes;
DROP POLICY IF EXISTS "Users can manage own board minutes" ON public.board_minutes;

CREATE POLICY "Users can manage own board minutes"
    ON public.board_minutes FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- customer_invoices (has user_id)
DROP POLICY IF EXISTS "Users can view own customer invoices" ON public.customer_invoices;
DROP POLICY IF EXISTS "Users can manage own customer invoices" ON public.customer_invoices;

CREATE POLICY "Users can manage own customer invoices"
    ON public.customer_invoices FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- k10_declarations (has user_id)
DROP POLICY IF EXISTS "Users can view own k10" ON public.k10_declarations;
DROP POLICY IF EXISTS "Users can manage own k10" ON public.k10_declarations;

CREATE POLICY "Users can manage own k10"
    ON public.k10_declarations FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- profiles (uses id = auth.uid(), not user_id)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = (select auth.uid()))
    WITH CHECK (id = (select auth.uid()));

-- ai_usage (has user_id)
DROP POLICY IF EXISTS "Users can view own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "System can manage usage" ON public.ai_usage;

CREATE POLICY "Users can view own usage"
    ON public.ai_usage FOR SELECT
    USING (user_id = (select auth.uid()));

-- security_audit_log (has user_id, but admin-only view)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.security_audit_log;

CREATE POLICY "Admins can view audit logs"
    ON public.security_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (select auth.uid()) 
            AND role = 'admin'
        )
    );

-- events (has user_id)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'user_id') THEN
        ALTER TABLE events ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'company_id') THEN
        ALTER TABLE events ADD COLUMN company_id TEXT;
    END IF;
END $$;

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.events;
DROP POLICY IF EXISTS "Enable read access for own events" ON public.events;
DROP POLICY IF EXISTS "Users can read own events" ON public.events;
DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;

CREATE POLICY "Users can manage own events"
    ON public.events FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- categories (if exists - global table, no user_id)
-- Only update if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
        DROP POLICY IF EXISTS "categories_admin_write" ON public.categories;
        DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
        DROP POLICY IF EXISTS "categories_read_policy" ON public.categories;
        DROP POLICY IF EXISTS "categories_write_policy" ON public.categories;
        
        EXECUTE 'CREATE POLICY "categories_read_policy" ON public.categories FOR SELECT USING (true)';
    END IF;
END $$;

-- =============================================
-- PART 2: Add missing foreign key indexes
-- =============================================

-- board_minutes
CREATE INDEX IF NOT EXISTS idx_board_minutes_company_id ON public.board_minutes(company_id);
CREATE INDEX IF NOT EXISTS idx_board_minutes_meeting_id ON public.board_minutes(meeting_id);

-- customer_invoices
CREATE INDEX IF NOT EXISTS idx_customer_invoices_company_id ON public.customer_invoices(company_id);

-- dividends
CREATE INDEX IF NOT EXISTS idx_dividends_meeting_id ON public.dividends(meeting_id);

-- employee_benefits
CREATE INDEX IF NOT EXISTS idx_employee_benefits_benefit_id ON public.employee_benefits(benefit_id);
CREATE INDEX IF NOT EXISTS idx_employee_benefits_employee_id ON public.employee_benefits(employee_id);

-- k10_declarations
CREATE INDEX IF NOT EXISTS idx_k10_declarations_company_id ON public.k10_declarations(company_id);
CREATE INDEX IF NOT EXISTS idx_k10_declarations_shareholder_id ON public.k10_declarations(shareholder_id);

-- payslips
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON public.payslips(employee_id);

-- supplier_invoices
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_user_id ON public.supplier_invoices(user_id);

-- transactions
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'category_id') THEN
        CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
    END IF;
END $$;

-- =============================================
-- PART 3: Unused indexes (optional cleanup)
-- Only uncomment if you want to drop them
-- These are safe to drop as they've never been used
-- =============================================

/*
-- Rate limits (server-side, keep for now)
-- DROP INDEX IF EXISTS idx_rate_limits_reset_time;
-- DROP INDEX IF EXISTS idx_rate_limits_sliding_last_access;
-- DROP INDEX IF EXISTS idx_rate_limits_sliding_window_data;

-- Categories
DROP INDEX IF EXISTS idx_categories_name;
DROP INDEX IF EXISTS idx_categories_parent_id;

-- Receipts
DROP INDEX IF EXISTS idx_receipts_user_captured_at;

-- Transactions
DROP INDEX IF EXISTS idx_transactions_user_occurred_at;
DROP INDEX IF EXISTS idx_transactions_external_reference;

-- Tax reports
DROP INDEX IF EXISTS idx_tax_reports_user_period;
DROP INDEX IF EXISTS idx_tax_reports_user_id;

-- AI logs
DROP INDEX IF EXISTS idx_ai_logs_user_created;
DROP INDEX IF EXISTS idx_ai_logs_model_created;
DROP INDEX IF EXISTS idx_ai_logs_user_id;

-- Other tables
DROP INDEX IF EXISTS idx_agi_reports_period;
DROP INDEX IF EXISTS idx_vat_declarations_period;
DROP INDEX IF EXISTS idx_employees_user_id;
DROP INDEX IF EXISTS idx_payslips_user_id;
DROP INDEX IF EXISTS idx_payslips_period;
DROP INDEX IF EXISTS idx_assets_user_id;
DROP INDEX IF EXISTS idx_benefits_user_id;
DROP INDEX IF EXISTS idx_income_declarations_year;
DROP INDEX IF EXISTS idx_annual_closings_year;
DROP INDEX IF EXISTS idx_annual_reports_year;
DROP INDEX IF EXISTS security_audit_type_idx;
DROP INDEX IF EXISTS security_audit_time_idx;
DROP INDEX IF EXISTS events_source_idx;
DROP INDEX IF EXISTS events_category_idx;
DROP INDEX IF EXISTS events_timestamp_idx;
DROP INDEX IF EXISTS profiles_subscription_tier_idx;
DROP INDEX IF EXISTS profiles_role_idx;
DROP INDEX IF EXISTS profiles_stripe_customer_idx;
DROP INDEX IF EXISTS ai_usage_period_idx;
DROP INDEX IF EXISTS ai_usage_model_idx;
*/

-- =============================================
-- PART 4: Create missing RPC functions
-- Note: Some tables don't have user_id, using auth check where applicable
-- =============================================

-- get_meeting_stats (company_meetings has user_id)
CREATE OR REPLACE FUNCTION get_meeting_stats(p_meeting_type TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COALESCE(COUNT(*), 0),
        'planned', COALESCE(COUNT(*) FILTER (WHERE status = 'planned'), 0),
        'completed', COALESCE(COUNT(*) FILTER (WHERE status = 'held'), 0),
        'upcoming', COALESCE(COUNT(*) FILTER (WHERE meeting_date > CURRENT_DATE), 0)
    )
    INTO result
    FROM company_meetings
    WHERE user_id = (select auth.uid())
      AND (p_meeting_type IS NULL OR meeting_type = p_meeting_type);
    
    RETURN COALESCE(result, '{"total":0,"planned":0,"completed":0,"upcoming":0}'::json);
END;
$$;

-- get_member_stats (members table doesn't exist - placeholder)
CREATE OR REPLACE FUNCTION get_member_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Members table doesn't exist yet - return empty stats
    RETURN '{"total":0,"active":0,"inactive":0}'::json;
END;
$$;

-- get_partner_stats (partners table doesn't exist - placeholder)
CREATE OR REPLACE FUNCTION get_partner_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Partners table doesn't exist yet - return empty stats
    RETURN '{"total":0,"komplementar":0,"kommanditdelagare":0,"totalCapital":0}'::json;
END;
$$;

-- get_receipt_stats (receipts has user_id)
CREATE OR REPLACE FUNCTION get_receipt_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COALESCE(COUNT(*), 0),
        'pending', COALESCE(COUNT(*) FILTER (WHERE status = 'pending'), 0),
        'processed', COALESCE(COUNT(*) FILTER (WHERE status = 'processed'), 0),
        'totalAmount', COALESCE(SUM(amount), 0)
    )
    INTO result
    FROM receipts
    WHERE user_id = (select auth.uid());
    
    RETURN COALESCE(result, '{"total":0,"pending":0,"processed":0,"totalAmount":0}'::json);
END;
$$;

-- get_vat_stats (transactions has user_id)
CREATE OR REPLACE FUNCTION get_vat_stats(p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'outputVat', COALESCE(SUM(CASE WHEN amount > 0 THEN amount * 0.25 ELSE 0 END), 0),
        'inputVat', COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) * 0.25 ELSE 0 END), 0),
        'netVat', COALESCE(SUM(amount * 0.25), 0),
        'transactionCount', COALESCE(COUNT(*), 0)
    )
    INTO result
    FROM transactions
    WHERE user_id = (select auth.uid())
      AND EXTRACT(YEAR FROM occurred_at) = p_year;
    
    RETURN COALESCE(result, '{"outputVat":0,"inputVat":0,"netVat":0,"transactionCount":0}'::json);
END;
$$;

-- get_agi_stats (payslips has user_id)
CREATE OR REPLACE FUNCTION get_agi_stats(p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalSalary', COALESCE(SUM(gross_salary), 0),
        'totalTax', COALESCE(SUM(tax_deducted), 0),
        'employeeCount', COALESCE(COUNT(DISTINCT employee_id), 0),
        'periods', COALESCE(COUNT(DISTINCT period), 0)
    )
    INTO result
    FROM payslips
    WHERE user_id = (select auth.uid())
      AND EXTRACT(YEAR FROM period::date) = p_year;
    
    RETURN COALESCE(result, '{"totalSalary":0,"totalTax":0,"employeeCount":0,"periods":0}'::json);
END;
$$;

-- get_invoice_stats (uses customer_invoices table)
CREATE OR REPLACE FUNCTION get_invoice_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COALESCE(COUNT(*), 0),
        'pending', COALESCE(COUNT(*) FILTER (WHERE status = 'pending'), 0),
        'paid', COALESCE(COUNT(*) FILTER (WHERE status = 'paid'), 0),
        'overdue', COALESCE(COUNT(*) FILTER (WHERE status = 'overdue' OR (due_date < CURRENT_DATE AND status = 'pending')), 0),
        'totalAmount', COALESCE(SUM(total_amount), 0),
        'paidAmount', COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0)
    )
    INTO result
    FROM customer_invoices
    WHERE user_id = (select auth.uid());
    
    RETURN COALESCE(result, '{"total":0,"pending":0,"paid":0,"overdue":0,"totalAmount":0,"paidAmount":0}'::json);
END;
$$;

-- get_payroll_stats (payslips has user_id)
CREATE OR REPLACE FUNCTION get_payroll_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalGross', COALESCE(SUM(gross_salary), 0),
        'totalNet', COALESCE(SUM(net_salary), 0),
        'totalTax', COALESCE(SUM(tax_deducted), 0),
        'employeeCount', COALESCE(COUNT(DISTINCT employee_id), 0),
        'payslipCount', COALESCE(COUNT(*), 0)
    )
    INTO result
    FROM payslips
    WHERE user_id = (select auth.uid());
    
    RETURN COALESCE(result, '{"totalGross":0,"totalNet":0,"totalTax":0,"employeeCount":0,"payslipCount":0}'::json);
END;
$$;

-- get_benefit_stats (employees has user_id, benefits may not exist)
-- This is a placeholder - adjust based on actual schema
CREATE OR REPLACE FUNCTION get_benefit_stats(target_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return empty stats since benefits table structure is unknown
    RETURN '{"totalBenefits":0,"totalValue":0,"employeesWithBenefits":0}'::json;
END;
$$;

-- =============================================
-- Done!
-- =============================================
COMMENT ON FUNCTION get_meeting_stats IS 'Get meeting statistics for the current user';
COMMENT ON FUNCTION get_member_stats IS 'Get member statistics for the current user';
COMMENT ON FUNCTION get_partner_stats IS 'Get partner statistics for the current user';
COMMENT ON FUNCTION get_receipt_stats IS 'Get receipt statistics for the current user';
COMMENT ON FUNCTION get_vat_stats IS 'Get VAT statistics for the current user';
COMMENT ON FUNCTION get_agi_stats IS 'Get AGI (employer declaration) statistics for the current user';
COMMENT ON FUNCTION get_invoice_stats IS 'Get invoice statistics for the current user';
COMMENT ON FUNCTION get_payroll_stats IS 'Get payroll statistics for the current user';
COMMENT ON FUNCTION get_benefit_stats IS 'Get benefit statistics for the current user';
