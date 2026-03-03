-- Grant API access for tables that have RLS policies but were missing GRANT statements.
-- Without GRANT, tables are invisible to PostgREST (Supabase API) and type generation.
-- RLS policies already enforce row-level security; GRANT only makes tables reachable.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'agi_reports',
      'ai_logs',
      'ai_usage',
      'annual_closings',
      'annual_reports',
      'board_minutes',
      'company_meetings',
      'customer_invoices',
      'employee_benefits',
      'financial_periods',
      'inbox_items',
      'income_declarations',
      'k10_declarations',
      'month_closings',
      'ne_appendices',
      'pending_bookings',
      'rate_limits',
      'rate_limits_sliding',
      'security_audit_log',
      'shareholdings',
      'supplier_invoices',
      'vat_declarations'
    ])
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('GRANT ALL ON public.%I TO authenticated, service_role', tbl);
    END IF;
  END LOOP;
END $$;
