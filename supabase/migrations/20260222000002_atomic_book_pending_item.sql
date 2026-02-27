-- Atomic booking: updates pending_booking status + source entity status in one transaction.
-- Prevents orphaned verifications and double-booking race conditions.

CREATE OR REPLACE FUNCTION book_pending_item_status(
  p_pending_id UUID,
  p_verification_id UUID,
  p_entries JSONB,
  p_source_type TEXT,
  p_source_id TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_table TEXT;
  v_status TEXT;
BEGIN
  -- 1. Atomically mark pending booking as 'booked'
  --    The WHERE status = 'pending' guard prevents double-booking
  UPDATE public.pending_bookings
  SET
    status = 'booked',
    booked_at = NOW(),
    verification_id = p_verification_id,
    proposed_entries = p_entries
  WHERE id = p_pending_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending booking % hittades inte eller är redan bokförd', p_pending_id;
  END IF;

  -- 2. Update source entity status based on source_type
  CASE p_source_type
    WHEN 'payslip'           THEN v_table := 'payslips';          v_status := 'booked';
    WHEN 'customer_invoice'  THEN v_table := 'customerinvoices';  v_status := 'Bokförd';
    WHEN 'supplier_invoice'  THEN v_table := 'supplierinvoices';  v_status := 'Bokförd';
    WHEN 'invoice_payment'   THEN v_table := 'customerinvoices';  v_status := 'Betald';
    WHEN 'transaction'       THEN v_table := 'transactions';      v_status := 'Bokförd';
    WHEN 'dividend_decision' THEN v_table := 'dividends';         v_status := 'booked';
    WHEN 'dividend_payment'  THEN v_table := 'dividends';         v_status := 'paid';
    ELSE
      -- owner_withdrawal, ai_entry — no source entity status update needed
      v_table := NULL;
  END CASE;

  IF v_table IS NOT NULL THEN
    EXECUTE format('UPDATE public.%I SET status = $1 WHERE id = $2', v_table)
    USING v_status, p_source_id::UUID;
  END IF;
END;
$$;
