-- ============================================
-- Rename all tables to remove underscores
-- This migration renames tables and updates all references
-- ============================================

-- Step 1: Drop all foreign key constraints that will be affected
-- (We'll recreate them after renaming)

-- Drop FK constraints on tables referencing other tables
ALTER TABLE IF EXISTS employee_benefits DROP CONSTRAINT IF EXISTS employee_benefits_benefit_id_fkey;
ALTER TABLE IF EXISTS employee_benefits DROP CONSTRAINT IF EXISTS employee_benefits_employee_id_fkey;
ALTER TABLE IF EXISTS payslips DROP CONSTRAINT IF EXISTS payslips_employee_id_fkey;
ALTER TABLE IF EXISTS k10_declarations DROP CONSTRAINT IF EXISTS k10_declarations_shareholder_id_fkey;
ALTER TABLE IF EXISTS k10_declarations DROP CONSTRAINT IF EXISTS k10_declarations_company_id_fkey;
ALTER TABLE IF EXISTS dividends DROP CONSTRAINT IF EXISTS dividends_meeting_id_fkey;
ALTER TABLE IF EXISTS dividends DROP CONSTRAINT IF EXISTS dividends_shareholder_id_fkey;
ALTER TABLE IF EXISTS board_minutes DROP CONSTRAINT IF EXISTS board_minutes_meeting_id_fkey;
ALTER TABLE IF EXISTS board_minutes DROP CONSTRAINT IF EXISTS board_minutes_company_id_fkey;
ALTER TABLE IF EXISTS ne_appendices DROP CONSTRAINT IF EXISTS ne_appendices_income_declaration_id_fkey;

-- Step 2: Rename all tables
ALTER TABLE IF EXISTS tax_reports RENAME TO taxreports;
ALTER TABLE IF EXISTS ai_logs RENAME TO ailogs;
ALTER TABLE IF EXISTS rate_limits RENAME TO ratelimits;
ALTER TABLE IF EXISTS rate_limits_sliding RENAME TO ratelimitssliding;
ALTER TABLE IF EXISTS supplier_invoices RENAME TO supplierinvoices;
ALTER TABLE IF EXISTS inbox_items RENAME TO inboxitems;
ALTER TABLE IF EXISTS agi_reports RENAME TO agireports;
ALTER TABLE IF EXISTS vat_declarations RENAME TO vatdeclarations;
ALTER TABLE IF EXISTS employee_benefits RENAME TO employeebenefits;
ALTER TABLE IF EXISTS income_declarations RENAME TO incomedeclarations;
ALTER TABLE IF EXISTS ne_appendices RENAME TO neappendices;
ALTER TABLE IF EXISTS annual_closings RENAME TO annualclosings;
ALTER TABLE IF EXISTS annual_reports RENAME TO annualreports;
ALTER TABLE IF EXISTS company_meetings RENAME TO companymeetings;
ALTER TABLE IF EXISTS board_minutes RENAME TO boardminutes;
ALTER TABLE IF EXISTS customer_invoices RENAME TO customerinvoices;
ALTER TABLE IF EXISTS k10_declarations RENAME TO k10declarations;
ALTER TABLE IF EXISTS ai_usage RENAME TO aiusage;
ALTER TABLE IF EXISTS security_audit_log RENAME TO securityauditlog;
ALTER TABLE IF EXISTS month_closings RENAME TO monthclosings;
ALTER TABLE IF EXISTS financial_periods RENAME TO financialperiods;

-- Step 3: Recreate foreign key constraints with new table names
-- Using DO blocks to handle cases where columns might not exist

DO $$ BEGIN
    ALTER TABLE employeebenefits 
        ADD CONSTRAINT employeebenefits_benefit_id_fkey 
        FOREIGN KEY (benefit_id) REFERENCES benefits(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_column OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE employeebenefits 
        ADD CONSTRAINT employeebenefits_employee_id_fkey 
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_column OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE payslips 
        ADD CONSTRAINT payslips_employee_id_fkey 
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_column OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE k10declarations 
        ADD CONSTRAINT k10declarations_shareholder_id_fkey 
        FOREIGN KEY (shareholder_id) REFERENCES shareholders(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_column OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE k10declarations 
        ADD CONSTRAINT k10declarations_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_column OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE dividends 
        ADD CONSTRAINT dividends_meeting_id_fkey 
        FOREIGN KEY (meeting_id) REFERENCES companymeetings(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_column OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE dividends 
        ADD CONSTRAINT dividends_shareholder_id_fkey 
        FOREIGN KEY (shareholder_id) REFERENCES shareholders(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_column OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE boardminutes 
        ADD CONSTRAINT boardminutes_meeting_id_fkey 
        FOREIGN KEY (meeting_id) REFERENCES companymeetings(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_column OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE boardminutes 
        ADD CONSTRAINT boardminutes_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_column OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE neappendices 
        ADD CONSTRAINT neappendices_income_declaration_id_fkey 
        FOREIGN KEY (income_declaration_id) REFERENCES incomedeclarations(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_column OR duplicate_object THEN NULL;
END $$;

-- Step 4: Rename indexes to match new table names
ALTER INDEX IF EXISTS idx_tax_reports_user_id RENAME TO idx_taxreports_user_id;
ALTER INDEX IF EXISTS idx_tax_reports_user_period RENAME TO idx_taxreports_user_period;
ALTER INDEX IF EXISTS idx_ai_logs_user_id RENAME TO idx_ailogs_user_id;
ALTER INDEX IF EXISTS idx_ai_logs_user_created RENAME TO idx_ailogs_user_created;
ALTER INDEX IF EXISTS idx_ai_logs_model_created RENAME TO idx_ailogs_model_created;
ALTER INDEX IF EXISTS idx_rate_limits_identifier RENAME TO idx_ratelimits_identifier;
ALTER INDEX IF EXISTS idx_rate_limits_reset_time RENAME TO idx_ratelimits_reset_time;
ALTER INDEX IF EXISTS idx_rate_limits_sliding_identifier RENAME TO idx_ratelimitssliding_identifier;
ALTER INDEX IF EXISTS idx_rate_limits_sliding_last_access RENAME TO idx_ratelimitssliding_last_access;
ALTER INDEX IF EXISTS idx_rate_limits_sliding_window_data RENAME TO idx_ratelimitssliding_window_data;
ALTER INDEX IF EXISTS idx_supplier_invoices_user_id RENAME TO idx_supplierinvoices_user_id;
ALTER INDEX IF EXISTS idx_inbox_items_user_id RENAME TO idx_inboxitems_user_id;
ALTER INDEX IF EXISTS idx_agi_reports_user_id RENAME TO idx_agireports_user_id;
ALTER INDEX IF EXISTS idx_agi_reports_period RENAME TO idx_agireports_period;
ALTER INDEX IF EXISTS idx_vat_declarations_user_id RENAME TO idx_vatdeclarations_user_id;
ALTER INDEX IF EXISTS idx_vat_declarations_period RENAME TO idx_vatdeclarations_period;
ALTER INDEX IF EXISTS idx_employee_benefits_employee_id RENAME TO idx_employeebenefits_employee_id;
ALTER INDEX IF EXISTS idx_employee_benefits_benefit_id RENAME TO idx_employeebenefits_benefit_id;
ALTER INDEX IF EXISTS idx_income_declarations_user_id RENAME TO idx_incomedeclarations_user_id;
ALTER INDEX IF EXISTS idx_income_declarations_year RENAME TO idx_incomedeclarations_year;
ALTER INDEX IF EXISTS idx_ne_appendices_declaration_id RENAME TO idx_neappendices_declaration_id;
ALTER INDEX IF EXISTS idx_annual_closings_user_id RENAME TO idx_annualclosings_user_id;
ALTER INDEX IF EXISTS idx_annual_closings_year RENAME TO idx_annualclosings_year;
ALTER INDEX IF EXISTS idx_annual_reports_user_id RENAME TO idx_annualreports_user_id;
ALTER INDEX IF EXISTS idx_annual_reports_year RENAME TO idx_annualreports_year;
ALTER INDEX IF EXISTS idx_company_meetings_user RENAME TO idx_companymeetings_user;
ALTER INDEX IF EXISTS idx_company_meetings_company RENAME TO idx_companymeetings_company;
ALTER INDEX IF EXISTS idx_board_minutes_user_id RENAME TO idx_boardminutes_user_id;
ALTER INDEX IF EXISTS idx_board_minutes_company_id RENAME TO idx_boardminutes_company_id;
ALTER INDEX IF EXISTS idx_board_minutes_meeting_id RENAME TO idx_boardminutes_meeting_id;
ALTER INDEX IF EXISTS idx_customer_invoices_user_id RENAME TO idx_customerinvoices_user_id;
ALTER INDEX IF EXISTS idx_customer_invoices_company_id RENAME TO idx_customerinvoices_company_id;
ALTER INDEX IF EXISTS idx_k10_declarations_user_id RENAME TO idx_k10declarations_user_id;
ALTER INDEX IF EXISTS idx_k10_declarations_company_id RENAME TO idx_k10declarations_company_id;
ALTER INDEX IF EXISTS idx_k10_declarations_shareholder_id RENAME TO idx_k10declarations_shareholder_id;
ALTER INDEX IF EXISTS idx_ai_usage_user_id RENAME TO idx_aiusage_user_id;
ALTER INDEX IF EXISTS idx_ai_usage_period RENAME TO idx_aiusage_period;
ALTER INDEX IF EXISTS idx_ai_usage_model RENAME TO idx_aiusage_model;
ALTER INDEX IF EXISTS security_audit_user_idx RENAME TO idx_securityauditlog_user;
ALTER INDEX IF EXISTS security_audit_type_idx RENAME TO idx_securityauditlog_type;
ALTER INDEX IF EXISTS security_audit_time_idx RENAME TO idx_securityauditlog_time;
ALTER INDEX IF EXISTS idx_month_closings_user_id RENAME TO idx_monthclosings_user_id;
ALTER INDEX IF EXISTS idx_month_closings_period RENAME TO idx_monthclosings_period;
ALTER INDEX IF EXISTS idx_financial_periods_user_id RENAME TO idx_financialperiods_user_id;

-- Step 5: Update RLS policies (drop old, create new with correct table references)
-- Using DO blocks to handle tables that might not have user_id

-- taxreports
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own tax reports" ON taxreports;
    DROP POLICY IF EXISTS "Users can manage own tax reports" ON taxreports;
    CREATE POLICY "Users can manage own taxreports" ON taxreports FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- ailogs
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own logs" ON ailogs;
    DROP POLICY IF EXISTS "Users can insert own logs" ON ailogs;
    CREATE POLICY "Users can manage own ailogs" ON ailogs FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- supplierinvoices
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own supplier invoices" ON supplierinvoices;
    DROP POLICY IF EXISTS "Users can manage own supplier invoices" ON supplierinvoices;
    CREATE POLICY "Users can manage own supplierinvoices" ON supplierinvoices FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- inboxitems
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own inbox" ON inboxitems;
    DROP POLICY IF EXISTS "Users can manage own inbox" ON inboxitems;
    CREATE POLICY "Users can manage own inboxitems" ON inboxitems FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- agireports
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own AGI reports" ON agireports;
    DROP POLICY IF EXISTS "Users can manage own AGI reports" ON agireports;
    CREATE POLICY "Users can manage own agireports" ON agireports FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- vatdeclarations
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own VAT declarations" ON vatdeclarations;
    DROP POLICY IF EXISTS "Users can manage own VAT declarations" ON vatdeclarations;
    CREATE POLICY "Users can manage own vatdeclarations" ON vatdeclarations FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- employeebenefits (might not have user_id - skip if missing)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own employee benefits" ON employeebenefits;
    DROP POLICY IF EXISTS "Users can manage own employee benefits" ON employeebenefits;
    -- Only create policy if user_id column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employeebenefits' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can manage own employeebenefits" ON employeebenefits FOR ALL
            USING (user_id = (select auth.uid()))
            WITH CHECK (user_id = (select auth.uid()));
    END IF;
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- incomedeclarations
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own income declarations" ON incomedeclarations;
    DROP POLICY IF EXISTS "Users can manage own income declarations" ON incomedeclarations;
    CREATE POLICY "Users can manage own incomedeclarations" ON incomedeclarations FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- neappendices (might not have user_id - skip if missing)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own NE appendices" ON neappendices;
    DROP POLICY IF EXISTS "Users can manage own NE appendices" ON neappendices;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'neappendices' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can manage own neappendices" ON neappendices FOR ALL
            USING (user_id = (select auth.uid()))
            WITH CHECK (user_id = (select auth.uid()));
    END IF;
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- annualclosings
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own annual closings" ON annualclosings;
    DROP POLICY IF EXISTS "Users can manage own annual closings" ON annualclosings;
    CREATE POLICY "Users can manage own annualclosings" ON annualclosings FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- annualreports
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own annual reports" ON annualreports;
    DROP POLICY IF EXISTS "Users can manage own annual reports" ON annualreports;
    CREATE POLICY "Users can manage own annualreports" ON annualreports FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- companymeetings
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own meetings" ON companymeetings;
    DROP POLICY IF EXISTS "Users can manage own meetings" ON companymeetings;
    CREATE POLICY "Users can manage own companymeetings" ON companymeetings FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- boardminutes
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own board minutes" ON boardminutes;
    DROP POLICY IF EXISTS "Users can manage own board minutes" ON boardminutes;
    CREATE POLICY "Users can manage own boardminutes" ON boardminutes FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- customerinvoices
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own customer invoices" ON customerinvoices;
    DROP POLICY IF EXISTS "Users can manage own customer invoices" ON customerinvoices;
    CREATE POLICY "Users can manage own customerinvoices" ON customerinvoices FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- k10declarations
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own k10" ON k10declarations;
    DROP POLICY IF EXISTS "Users can manage own k10" ON k10declarations;
    CREATE POLICY "Users can manage own k10declarations" ON k10declarations FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- aiusage
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own usage" ON aiusage;
    CREATE POLICY "Users can view own aiusage" ON aiusage FOR SELECT
        USING (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- securityauditlog
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins can view audit logs" ON securityauditlog;
    CREATE POLICY "Admins can view securityauditlog" ON securityauditlog FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (select auth.uid()) 
            AND role = 'admin'
        ));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- monthclosings
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own month closings" ON monthclosings;
    DROP POLICY IF EXISTS "Users can manage own month closings" ON monthclosings;
    CREATE POLICY "Users can manage own monthclosings" ON monthclosings FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- financialperiods
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own financial periods" ON financialperiods;
    DROP POLICY IF EXISTS "Users can manage own financial periods" ON financialperiods;
    CREATE POLICY "Users can manage own financialperiods" ON financialperiods FOR ALL
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- Step 6: Update RPC functions to use new table names

CREATE OR REPLACE FUNCTION get_meeting_stats_v2(p_meeting_type TEXT DEFAULT NULL)
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
    FROM companymeetings
    WHERE user_id = (select auth.uid())
      AND (p_meeting_type IS NULL OR meeting_type = p_meeting_type);
    
    RETURN COALESCE(result, '{"total":0,"planned":0,"completed":0,"upcoming":0}'::json);
END;
$$;

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
    FROM customerinvoices
    WHERE user_id = (select auth.uid());
    
    RETURN COALESCE(result, '{"total":0,"pending":0,"paid":0,"overdue":0,"totalAmount":0,"paidAmount":0}'::json);
END;
$$;

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

-- Done!
-- Table name mapping for reference:
-- tax_reports -> taxreports
-- ai_logs -> ailogs
-- rate_limits -> ratelimits
-- rate_limits_sliding -> ratelimitssliding
-- supplier_invoices -> supplierinvoices
-- inbox_items -> inboxitems
-- agi_reports -> agireports
-- vat_declarations -> vatdeclarations
-- employee_benefits -> employeebenefits
-- income_declarations -> incomedeclarations
-- ne_appendices -> neappendices
-- annual_closings -> annualclosings
-- annual_reports -> annualreports
-- company_meetings -> companymeetings
-- board_minutes -> boardminutes
-- customer_invoices -> customerinvoices
-- k10_declarations -> k10declarations
-- ai_usage -> aiusage
-- security_audit_log -> securityauditlog
-- month_closings -> monthclosings
-- financial_periods -> financialperiods
