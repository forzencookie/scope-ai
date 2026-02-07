-- ============================================================================
-- Phase 1: The Accounting Spine
-- Creates verification_lines table for proper double-entry bookkeeping
-- and extends verifications with source tracking and fiscal controls
-- ============================================================================

-- ============================================================================
-- 1. Extend verifications table with source tracking + fiscal controls
-- ============================================================================

ALTER TABLE verifications
    ADD COLUMN IF NOT EXISTS source_type TEXT,       -- 'transaction', 'invoice', 'supplier_invoice', 'payroll', 'dividend', 'manual', 'depreciation'
    ADD COLUMN IF NOT EXISTS source_id TEXT,          -- FK back to originating record
    ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15,2),
    ADD COLUMN IF NOT EXISTS fiscal_year INTEGER,
    ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Backfill fiscal_year from date for existing rows
UPDATE verifications
SET fiscal_year = EXTRACT(YEAR FROM date)::INTEGER
WHERE fiscal_year IS NULL AND date IS NOT NULL;

-- Index for source lookups
CREATE INDEX IF NOT EXISTS idx_verifications_source
    ON verifications(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_verifications_fiscal_year
    ON verifications(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_verifications_locked
    ON verifications(is_locked) WHERE is_locked = TRUE;

COMMENT ON COLUMN verifications.source_type IS 'Origin of this verification: transaction, invoice, supplier_invoice, payroll, dividend, manual, depreciation';
COMMENT ON COLUMN verifications.source_id IS 'ID of the originating record (transaction ID, invoice ID, etc.)';
COMMENT ON COLUMN verifications.total_amount IS 'Total transaction amount for display convenience';
COMMENT ON COLUMN verifications.fiscal_year IS 'Fiscal year derived from date, for efficient year-based queries';
COMMENT ON COLUMN verifications.is_locked IS 'TRUE after månadsavslut — prevents edits to closed periods';

-- ============================================================================
-- 2. Create verification_lines table (relational journal entry lines)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.verification_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id TEXT NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
    account_number INTEGER NOT NULL,           -- BAS account (1000-8999)
    account_name TEXT,                          -- Human-readable name
    debit NUMERIC(15,2) NOT NULL DEFAULT 0,
    credit NUMERIC(15,2) NOT NULL DEFAULT 0,
    description TEXT,                           -- Optional line description
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure at least one of debit/credit is non-zero
    CONSTRAINT check_debit_or_credit CHECK (debit > 0 OR credit > 0),
    -- Ensure not both debit and credit are non-zero on same line
    CONSTRAINT check_not_both CHECK (NOT (debit > 0 AND credit > 0))
);

-- ============================================================================
-- 3. Indexes for verification_lines
-- ============================================================================

-- Primary lookup: all lines for a verification
CREATE INDEX IF NOT EXISTS idx_vlines_verification_id
    ON verification_lines(verification_id);

-- Report aggregation: account balances across date ranges
CREATE INDEX IF NOT EXISTS idx_vlines_account_number
    ON verification_lines(account_number);

-- User isolation
CREATE INDEX IF NOT EXISTS idx_vlines_user_id
    ON verification_lines(user_id);

-- Composite for efficient report queries: "sum account X for user Y"
CREATE INDEX IF NOT EXISTS idx_vlines_user_account
    ON verification_lines(user_id, account_number);

COMMENT ON TABLE verification_lines IS 'Double-entry journal lines. Each verification has 2+ balanced lines (total debit = total credit).';

-- ============================================================================
-- 4. RLS Policies for verification_lines
-- ============================================================================

ALTER TABLE verification_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification lines"
    ON verification_lines FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification lines"
    ON verification_lines FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verification lines"
    ON verification_lines FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own verification lines"
    ON verification_lines FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON verification_lines TO authenticated;
GRANT ALL ON verification_lines TO service_role;

-- ============================================================================
-- 5. Database function: get_account_balances
-- Aggregates debit/credit per account for a date range, for report generation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_account_balances(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    account_number INTEGER,
    account_name TEXT,
    total_debit NUMERIC(15,2),
    total_credit NUMERIC(15,2),
    balance NUMERIC(15,2)
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT
        vl.account_number,
        MAX(vl.account_name) AS account_name,
        COALESCE(SUM(vl.debit), 0) AS total_debit,
        COALESCE(SUM(vl.credit), 0) AS total_credit,
        COALESCE(SUM(vl.debit), 0) - COALESCE(SUM(vl.credit), 0) AS balance
    FROM verification_lines vl
    INNER JOIN verifications v ON v.id = vl.verification_id
    WHERE vl.user_id = p_user_id
      AND (p_start_date IS NULL OR v.date >= p_start_date)
      AND (p_end_date IS NULL OR v.date <= p_end_date)
    GROUP BY vl.account_number
    ORDER BY vl.account_number;
$$;

COMMENT ON FUNCTION get_account_balances IS 'Aggregates debit/credit totals per BAS account for Resultaträkning and Balansräkning';

-- ============================================================================
-- 6. Database function: get_next_verification_number
-- Atomic next-number generation to prevent gaps (BFL compliance)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_next_verification_number(
    p_series TEXT DEFAULT 'A',
    p_fiscal_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT COALESCE(MAX(number), 0) + 1
    FROM verifications
    WHERE series = p_series
      AND fiscal_year = p_fiscal_year
      AND user_id = p_user_id;
$$;

COMMENT ON FUNCTION get_next_verification_number IS 'Returns next sequential verification number for BFL-compliant gap-free numbering';

-- ============================================================================
-- 7. Migrate existing JSONB rows data into verification_lines
-- ============================================================================

-- This extracts existing journal lines from the rows JSONB column
-- and inserts them into the new relational table
DO $$
DECLARE
    v_record RECORD;
    v_line JSONB;
BEGIN
    FOR v_record IN
        SELECT id, user_id, company_id, rows
        FROM verifications
        WHERE rows IS NOT NULL
          AND rows != '[]'::jsonb
          AND user_id IS NOT NULL
    LOOP
        FOR v_line IN SELECT * FROM jsonb_array_elements(v_record.rows)
        LOOP
            INSERT INTO verification_lines (
                verification_id,
                account_number,
                account_name,
                debit,
                credit,
                description,
                user_id,
                company_id
            ) VALUES (
                v_record.id,
                COALESCE((v_line->>'account')::INTEGER, 0),
                v_line->>'description',
                COALESCE((v_line->>'debit')::NUMERIC, 0),
                COALESCE((v_line->>'credit')::NUMERIC, 0),
                v_line->>'description',
                v_record.user_id,
                v_record.company_id
            );
        END LOOP;
    END LOOP;
END;
$$;

-- Also backfill total_amount on verifications from the lines we just migrated
UPDATE verifications v
SET total_amount = sub.total
FROM (
    SELECT verification_id, SUM(debit) AS total
    FROM verification_lines
    GROUP BY verification_id
) sub
WHERE v.id = sub.verification_id
  AND v.total_amount IS NULL;
