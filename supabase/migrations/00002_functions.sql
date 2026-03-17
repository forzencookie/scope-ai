-- =============================================================================
-- Scope AI — Database Functions & RPCs
-- =============================================================================
-- NOTE: No BEGIN/COMMIT — Supabase CLI handles transactions.

-- ---------------------------------------------------------------------------
-- 1. get_user_credits — returns credits_remaining for a user, default 0
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_credits(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_credits integer;
BEGIN
  SELECT credits_remaining INTO v_credits
  FROM public.user_credits
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_credits, 0);
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. consume_user_credits — deducts credits if sufficient balance exists
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION consume_user_credits(p_user_id uuid, p_amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current integer;
BEGIN
  -- Try to get current credits
  SELECT credits_remaining INTO v_current
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no row exists, create one with default 100 minus the amount
  IF NOT FOUND THEN
    IF 100 >= p_amount THEN
      INSERT INTO public.user_credits (user_id, credits_remaining)
      VALUES (p_user_id, 100 - p_amount);
      RETURN true;
    ELSE
      RETURN false;
    END IF;
  END IF;

  -- Check sufficient balance
  IF v_current < p_amount THEN
    RETURN false;
  END IF;

  UPDATE public.user_credits
  SET credits_remaining = credits_remaining - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. add_user_credits — upserts credits, returns new balance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION add_user_credits(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  INSERT INTO public.user_credits (user_id, credits_remaining)
  VALUES (p_user_id, 100 + p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    credits_remaining = public.user_credits.credits_remaining + p_amount,
    updated_at = now()
  RETURNING credits_remaining INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. get_account_balances — account summary for a date range
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_account_balances(p_date_from date, p_date_to date)
RETURNS TABLE(
  account_number text,
  account_name text,
  debit numeric,
  credit numeric,
  balance numeric
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vl.account_number::text AS account_number,
    COALESCE(vl.account_name, '') AS account_name,
    SUM(COALESCE(vl.debit, 0)) AS debit,
    SUM(COALESCE(vl.credit, 0)) AS credit,
    SUM(COALESCE(vl.debit, 0)) - SUM(COALESCE(vl.credit, 0)) AS balance
  FROM verification_lines vl
  JOIN verifications v ON v.id = vl.verification_id
  WHERE v.user_id = (SELECT auth.uid())
    AND v.date >= p_date_from
    AND v.date <= p_date_to
  GROUP BY vl.account_number, vl.account_name
  ORDER BY vl.account_number;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. get_next_verification_number — sequential gap-free numbering per series
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_next_verification_number(p_user_id uuid, p_series text DEFAULT 'A')
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_next integer;
BEGIN
  SELECT COALESCE(MAX(number), 0) + 1 INTO v_next
  FROM verifications
  WHERE user_id = p_user_id
    AND series = p_series;

  RETURN v_next;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. get_employee_balances — employee listing for the current user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_employee_balances()
RETURNS TABLE(
  id uuid,
  name text,
  role text,
  email text,
  salary numeric,
  status text
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.role,
    e.email,
    e.monthly_salary AS salary,
    e.status
  FROM employees e
  WHERE e.user_id = (SELECT auth.uid())
  ORDER BY e.name;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. get_monthly_cashflow — revenue vs expenses by month for a year
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_monthly_cashflow(p_year integer)
RETURNS TABLE(
  month text,
  revenue numeric,
  expenses numeric,
  result numeric
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(v.date, 'YYYY-MM') AS month,
    SUM(CASE WHEN vl.account_number::text LIKE '3%' THEN COALESCE(vl.credit, 0) ELSE 0 END) AS revenue,
    SUM(CASE WHEN vl.account_number::text SIMILAR TO '[4-7]%' THEN COALESCE(vl.debit, 0) ELSE 0 END) AS expenses,
    SUM(CASE WHEN vl.account_number::text LIKE '3%' THEN COALESCE(vl.credit, 0) ELSE 0 END)
    - SUM(CASE WHEN vl.account_number::text SIMILAR TO '[4-7]%' THEN COALESCE(vl.debit, 0) ELSE 0 END) AS result
  FROM verification_lines vl
  JOIN verifications v ON v.id = vl.verification_id
  WHERE v.user_id = (SELECT auth.uid())
    AND EXTRACT(YEAR FROM v.date) = p_year
  GROUP BY to_char(v.date, 'YYYY-MM')
  ORDER BY month;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. get_dashboard_counts — quick counts for dashboard overview
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_counts()
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_transactions bigint;
  v_verifications bigint;
  v_employees bigint;
  v_receipts bigint;
BEGIN
  SELECT COUNT(*) INTO v_transactions FROM transactions WHERE user_id = (SELECT auth.uid());
  SELECT COUNT(*) INTO v_verifications FROM verifications WHERE user_id = (SELECT auth.uid());
  SELECT COUNT(*) INTO v_employees FROM employees WHERE user_id = (SELECT auth.uid());
  SELECT COUNT(*) INTO v_receipts FROM receipts WHERE user_id = (SELECT auth.uid());

  RETURN json_build_object(
    'transactions', v_transactions,
    'verifications', v_verifications,
    'employees', v_employees,
    'receipts', v_receipts
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 9. get_invoice_stats — invoice summary with optional filters
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_invoice_stats(p_status text DEFAULT NULL, p_year integer DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total_count bigint;
  v_total_amount numeric;
  v_paid_count bigint;
  v_overdue_count bigint;
  v_draft_count bigint;
BEGIN
  SELECT
    COUNT(*),
    COALESCE(SUM(total_amount), 0)
  INTO v_total_count, v_total_amount
  FROM customer_invoices
  WHERE user_id = (SELECT auth.uid())
    AND (p_status IS NULL OR status = p_status)
    AND (p_year IS NULL OR EXTRACT(YEAR FROM invoice_date) = p_year);

  SELECT COUNT(*) INTO v_paid_count
  FROM customer_invoices
  WHERE user_id = (SELECT auth.uid()) AND status = 'paid'
    AND (p_year IS NULL OR EXTRACT(YEAR FROM invoice_date) = p_year);

  SELECT COUNT(*) INTO v_overdue_count
  FROM customer_invoices
  WHERE user_id = (SELECT auth.uid()) AND status = 'sent' AND due_date < CURRENT_DATE
    AND (p_year IS NULL OR EXTRACT(YEAR FROM invoice_date) = p_year);

  SELECT COUNT(*) INTO v_draft_count
  FROM customer_invoices
  WHERE user_id = (SELECT auth.uid()) AND status = 'draft'
    AND (p_year IS NULL OR EXTRACT(YEAR FROM invoice_date) = p_year);

  RETURN json_build_object(
    'total_count', v_total_count,
    'total_amount', v_total_amount,
    'paid_count', v_paid_count,
    'overdue_count', v_overdue_count,
    'draft_count', v_draft_count
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 10. get_receipt_stats — receipt summary with optional year filter
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_receipt_stats(p_year integer DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total_count bigint;
  v_total_amount numeric;
  v_pending_count bigint;
  v_processed_count bigint;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(COALESCE(total_amount, amount)), 0)
  INTO v_total_count, v_total_amount
  FROM receipts
  WHERE user_id = (SELECT auth.uid())
    AND (p_year IS NULL OR EXTRACT(YEAR FROM captured_at) = p_year);

  SELECT COUNT(*) INTO v_pending_count
  FROM receipts
  WHERE user_id = (SELECT auth.uid()) AND status = 'pending'
    AND (p_year IS NULL OR EXTRACT(YEAR FROM captured_at) = p_year);

  SELECT COUNT(*) INTO v_processed_count
  FROM receipts
  WHERE user_id = (SELECT auth.uid()) AND status = 'processed'
    AND (p_year IS NULL OR EXTRACT(YEAR FROM captured_at) = p_year);

  RETURN json_build_object(
    'total_count', v_total_count,
    'total_amount', v_total_amount,
    'pending_count', v_pending_count,
    'processed_count', v_processed_count
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 11. get_inventory_stats — inventarier summary with optional status filter
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_inventory_stats(p_status text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total_count bigint;
  v_total_value numeric;
  v_active_count bigint;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(inkopspris), 0)
  INTO v_total_count, v_total_value
  FROM inventarier
  WHERE user_id = (SELECT auth.uid())
    AND (p_status IS NULL OR status = p_status);

  SELECT COUNT(*) INTO v_active_count
  FROM inventarier
  WHERE user_id = (SELECT auth.uid()) AND status = 'aktiv';

  RETURN json_build_object(
    'total_count', v_total_count,
    'total_value', v_total_value,
    'active_count', v_active_count
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 12. get_shareholder_stats — shareholder summary
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_shareholder_stats(p_company_id text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total_shareholders bigint;
  v_total_shares bigint;
  v_share_classes bigint;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(shares), 0)
  INTO v_total_shareholders, v_total_shares
  FROM shareholders
  WHERE user_id = (SELECT auth.uid())
    AND (p_company_id IS NULL OR company_id = p_company_id);

  SELECT COUNT(DISTINCT share_class) INTO v_share_classes
  FROM shareholders
  WHERE user_id = (SELECT auth.uid())
    AND (p_company_id IS NULL OR company_id = p_company_id);

  RETURN json_build_object(
    'total_shareholders', v_total_shareholders,
    'total_shares', v_total_shares,
    'share_classes', v_share_classes
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 13. get_meeting_stats_v1 — meeting summary with optional type filter
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_meeting_stats_v1(p_meeting_type text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total_meetings bigint;
  v_draft_count bigint;
  v_held_count bigint;
  v_signed_count bigint;
BEGIN
  SELECT COUNT(*) INTO v_total_meetings
  FROM meetings
  WHERE user_id = (SELECT auth.uid())
    AND (p_meeting_type IS NULL OR type = p_meeting_type);

  SELECT COUNT(*) INTO v_draft_count
  FROM meetings
  WHERE user_id = (SELECT auth.uid()) AND status = 'draft'
    AND (p_meeting_type IS NULL OR type = p_meeting_type);

  SELECT COUNT(*) INTO v_held_count
  FROM meetings
  WHERE user_id = (SELECT auth.uid()) AND status = 'held'
    AND (p_meeting_type IS NULL OR type = p_meeting_type);

  SELECT COUNT(*) INTO v_signed_count
  FROM meetings
  WHERE user_id = (SELECT auth.uid()) AND status = 'signed'
    AND (p_meeting_type IS NULL OR type = p_meeting_type);

  RETURN json_build_object(
    'total_meetings', v_total_meetings,
    'draft_count', v_draft_count,
    'held_count', v_held_count,
    'signed_count', v_signed_count
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 14. get_member_stats — förening member summary
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_member_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total_members bigint;
  v_active_count bigint;
  v_inactive_count bigint;
BEGIN
  SELECT COUNT(*) INTO v_total_members
  FROM members WHERE user_id = (SELECT auth.uid());

  SELECT COUNT(*) INTO v_active_count
  FROM members WHERE user_id = (SELECT auth.uid()) AND status = 'aktiv';

  SELECT COUNT(*) INTO v_inactive_count
  FROM members WHERE user_id = (SELECT auth.uid()) AND status != 'aktiv';

  RETURN json_build_object(
    'total_members', v_total_members,
    'active_count', v_active_count,
    'inactive_count', v_inactive_count
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 15. get_partner_stats — HB/KB partner summary
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_partner_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total_partners bigint;
  v_total_ownership_pct numeric;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(ownership_percentage), 0)
  INTO v_total_partners, v_total_ownership_pct
  FROM partners WHERE user_id = (SELECT auth.uid());

  RETURN json_build_object(
    'total_partners', v_total_partners,
    'total_ownership_pct', v_total_ownership_pct
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 16. get_payroll_stats — active employee payroll summary
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_payroll_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total_employees bigint;
  v_total_monthly_cost numeric;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(monthly_salary), 0)
  INTO v_total_employees, v_total_monthly_cost
  FROM employees
  WHERE user_id = (SELECT auth.uid()) AND status = 'active';

  RETURN json_build_object(
    'total_employees', v_total_employees,
    'total_monthly_cost', v_total_monthly_cost
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 17. get_benefit_stats — benefits summary
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_benefit_stats(target_year integer DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total_benefits bigint;
BEGIN
  SELECT COUNT(*) INTO v_total_benefits
  FROM benefits
  WHERE user_id = (SELECT auth.uid())
    AND (target_year IS NULL OR EXTRACT(YEAR FROM created_at) = target_year);

  RETURN json_build_object(
    'total_benefits', v_total_benefits
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 18. get_vat_stats — VAT declaration summary
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_vat_stats(p_year integer DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total_declarations bigint;
  v_submitted_count bigint;
  v_pending_count bigint;
BEGIN
  SELECT COUNT(*) INTO v_total_declarations
  FROM vat_declarations
  WHERE user_id = (SELECT auth.uid())
    AND (p_year IS NULL OR year = p_year);

  SELECT COUNT(*) INTO v_submitted_count
  FROM vat_declarations
  WHERE user_id = (SELECT auth.uid()) AND status = 'submitted'
    AND (p_year IS NULL OR year = p_year);

  SELECT COUNT(*) INTO v_pending_count
  FROM vat_declarations
  WHERE user_id = (SELECT auth.uid()) AND status IN ('upcoming', 'pending')
    AND (p_year IS NULL OR year = p_year);

  RETURN json_build_object(
    'total_declarations', v_total_declarations,
    'submitted_count', v_submitted_count,
    'pending_count', v_pending_count
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 19. get_agi_stats — AGI report summary
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_agi_stats(p_year integer DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total_reports bigint;
BEGIN
  SELECT COUNT(*) INTO v_total_reports
  FROM agi_reports
  WHERE user_id = (SELECT auth.uid())
    AND (p_year IS NULL OR EXTRACT(YEAR FROM created_at) = p_year);

  RETURN json_build_object(
    'total_reports', v_total_reports
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 20. increment_ai_usage — upsert AI usage tracking per model per month
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id uuid,
  p_model_id text,
  p_provider text,
  p_tokens integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_period_start timestamptz;
  v_period_end timestamptz;
BEGIN
  v_period_start := date_trunc('month', now());
  v_period_end := date_trunc('month', now()) + interval '1 month' - interval '1 second';

  INSERT INTO public.ai_usage (user_id, model_id, provider, tokens_used, requests_count, period_start, period_end)
  VALUES (p_user_id, p_model_id, p_provider, p_tokens, 1, v_period_start, v_period_end)
  ON CONFLICT (user_id, model_id, period_start)
  DO UPDATE SET
    tokens_used = public.ai_usage.tokens_used + p_tokens,
    requests_count = public.ai_usage.requests_count + 1,
    updated_at = now();
END;
$$;

-- ---------------------------------------------------------------------------
-- 21. book_pending_item_status — atomically book a pending item
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION book_pending_item_status(
  p_pending_id uuid,
  p_verification_id text,
  p_source_type text,
  p_source_id text,
  p_entries jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_entry jsonb;
  v_user_id uuid;
BEGIN
  v_user_id := (SELECT auth.uid());

  -- Create the verification
  INSERT INTO verifications (id, user_id, source_type, source_id, date, description)
  VALUES (
    p_verification_id,
    v_user_id,
    p_source_type,
    p_source_id,
    CURRENT_DATE,
    'Automatisk bokföring'
  );

  -- Create verification lines from the entries array
  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
  LOOP
    INSERT INTO verification_lines (
      verification_id,
      user_id,
      account_number,
      account_name,
      description,
      debit,
      credit
    ) VALUES (
      p_verification_id,
      v_user_id,
      (v_entry->>'account_number')::integer,
      v_entry->>'account_name',
      v_entry->>'description',
      COALESCE((v_entry->>'debit')::numeric, 0),
      COALESCE((v_entry->>'credit')::numeric, 0)
    );
  END LOOP;

  -- Update pending booking status
  UPDATE pending_bookings
  SET status = 'booked'
  WHERE id = p_pending_id
    AND user_id = v_user_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 22. clear_demo_data — remove all data for a user (demo reset)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION clear_demo_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Delete in dependency order (children first)
  DELETE FROM public.verification_lines WHERE user_id = p_user_id;
  DELETE FROM public.verifications WHERE user_id = p_user_id;
  DELETE FROM public.transactions WHERE user_id = p_user_id;
  DELETE FROM public.receipts WHERE user_id = p_user_id;
  DELETE FROM public.payslips WHERE user_id = p_user_id;
  DELETE FROM public.benefits WHERE user_id = p_user_id;
  DELETE FROM public.employees WHERE user_id = p_user_id;
  DELETE FROM public.customer_invoices WHERE user_id = p_user_id;
  DELETE FROM public.supplier_invoices WHERE user_id = p_user_id;
  DELETE FROM public.shareholders WHERE user_id = p_user_id;
  DELETE FROM public.share_transactions WHERE user_id = p_user_id;
  DELETE FROM public.shareholdings WHERE user_id = p_user_id;
  DELETE FROM public.partners WHERE user_id = p_user_id;
  DELETE FROM public.members WHERE user_id = p_user_id;
  DELETE FROM public.dividends WHERE user_id = p_user_id;
  DELETE FROM public.meetings WHERE user_id = p_user_id;
  DELETE FROM public.pending_bookings WHERE user_id = p_user_id;
  DELETE FROM public.inventarier WHERE user_id = p_user_id;
  DELETE FROM public.vat_declarations WHERE user_id = p_user_id;
  DELETE FROM public.agi_reports WHERE user_id = p_user_id;
  DELETE FROM public.activity_log WHERE user_id = p_user_id;
  DELETE FROM public.events WHERE user_id = p_user_id;
  DELETE FROM public.messages WHERE user_id = p_user_id;
  DELETE FROM public.conversations WHERE user_id = p_user_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 23. log_transaction_activity — trigger function for activity logging
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_transaction_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_action text;
  v_entity_name text;
  v_entity_id text;
  v_user_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_entity_name := NEW.name;
    v_entity_id := NEW.id;
    v_user_id := NEW.user_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated';
    v_entity_name := NEW.name;
    v_entity_id := NEW.id;
    v_user_id := NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_entity_name := OLD.name;
    v_entity_id := OLD.id;
    v_user_id := OLD.user_id;
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, entity_name)
  VALUES (v_user_id, v_action, 'transaction', v_entity_id, v_entity_name);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach the trigger to transactions table
DROP TRIGGER IF EXISTS transactions_activity_log ON transactions;
CREATE TRIGGER transactions_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION log_transaction_activity();

-- ---------------------------------------------------------------------------
-- GRANTS — allow authenticated users to call all functions
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION get_user_credits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_user_credits(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_credits(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_account_balances(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_verification_number(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_balances() TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_cashflow(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_invoice_stats(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_receipt_stats(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_stats(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_shareholder_stats(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_meeting_stats_v1(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_payroll_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_benefit_stats(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vat_stats(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agi_stats(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_ai_usage(uuid, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION book_pending_item_status(uuid, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_demo_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION log_transaction_activity() TO authenticated;
