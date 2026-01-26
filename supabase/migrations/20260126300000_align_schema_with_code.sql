-- =============================================================================
-- MIGRATION: Align Database Schema with Application Code
-- Date: 2026-01-26
-- Purpose: Add missing columns to tables so database matches TypeScript types
-- =============================================================================

-- =============================================================================
-- 1. VERIFICATIONS TABLE - Critical for double-entry bookkeeping
-- =============================================================================
-- The verifications table needs:
-- - rows: JSONB array of journal entry lines (konteringsrader)
-- - number: Sequential verification number (required by Bokföringslagen)
-- - series: Series code (A, B, etc.) for different verification types
-- - created_at: Timestamp

ALTER TABLE verifications 
    ADD COLUMN IF NOT EXISTS rows JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS number INTEGER,
    ADD COLUMN IF NOT EXISTS series TEXT DEFAULT 'A',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS company_id TEXT;

-- Make rows NOT NULL after adding (can't do in ADD COLUMN with existing rows)
-- First ensure all existing rows have a default value
UPDATE verifications SET rows = '[]'::jsonb WHERE rows IS NULL;

-- Add index for verification number lookup
CREATE INDEX IF NOT EXISTS idx_verifications_number ON verifications(number);
CREATE INDEX IF NOT EXISTS idx_verifications_series ON verifications(series);
CREATE INDEX IF NOT EXISTS idx_verifications_user_date ON verifications(user_id, date);

COMMENT ON COLUMN verifications.rows IS 'JSONB array of journal entry lines: [{account, description, debit, credit}]';
COMMENT ON COLUMN verifications.number IS 'Sequential verification number per series, required by Swedish accounting law';
COMMENT ON COLUMN verifications.series IS 'Verification series (A=customer invoices, B=supplier invoices, etc.)';

-- =============================================================================
-- 2. TRANSACTIONS TABLE - Bank transactions and categorization
-- =============================================================================
-- Align with code expectations for bank reconciliation

-- First check current structure and add missing columns
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS account TEXT,
    ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS amount_value NUMERIC,
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES categories(id),
    ADD COLUMN IF NOT EXISTS company_id TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_by TEXT,
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SEK',
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS external_reference TEXT,
    ADD COLUMN IF NOT EXISTS merchant TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB,
    ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS receipt_id TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS vat_amount NUMERIC;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_occurred ON transactions(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant);

COMMENT ON COLUMN transactions.occurred_at IS 'When the transaction occurred (from bank)';
COMMENT ON COLUMN transactions.merchant IS 'Merchant/vendor name from bank statement';
COMMENT ON COLUMN transactions.vat_amount IS 'Calculated or extracted VAT amount';
COMMENT ON COLUMN transactions.status IS 'pending, booked, matched, ignored';

-- =============================================================================
-- 3. RECEIPTS TABLE - Expense receipts with metadata
-- =============================================================================

ALTER TABLE receipts
    ADD COLUMN IF NOT EXISTS amount NUMERIC,
    ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SEK',
    ADD COLUMN IF NOT EXISTS file_url TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS total_amount NUMERIC,
    ADD COLUMN IF NOT EXISTS transaction_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS vendor TEXT,
    ADD COLUMN IF NOT EXISTS company_id TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_receipts_user_captured ON receipts(user_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_vendor ON receipts(vendor);

COMMENT ON COLUMN receipts.captured_at IS 'When the receipt was captured/uploaded';
COMMENT ON COLUMN receipts.vendor IS 'Vendor/merchant name from receipt';
COMMENT ON COLUMN receipts.transaction_count IS 'Number of line items on receipt';

-- =============================================================================
-- 4. SUPPLIER INVOICES TABLE - Incoming invoices
-- =============================================================================

ALTER TABLE supplierinvoices
    ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS company_id TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS document_url TEXT,
    ADD COLUMN IF NOT EXISTS due_date DATE,
    ADD COLUMN IF NOT EXISTS invoice_number TEXT,
    ADD COLUMN IF NOT EXISTS issue_date DATE,
    ADD COLUMN IF NOT EXISTS ocr TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS supplier_name TEXT,
    ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vat_amount NUMERIC;

-- Update existing rows to have required values
UPDATE supplierinvoices SET supplier_name = 'Unknown' WHERE supplier_name IS NULL;
UPDATE supplierinvoices SET amount = 0 WHERE amount IS NULL;
UPDATE supplierinvoices SET total_amount = COALESCE(amount, 0) WHERE total_amount IS NULL;

CREATE INDEX IF NOT EXISTS idx_supplierinvoices_user_due ON supplierinvoices(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_supplierinvoices_status ON supplierinvoices(status);

-- =============================================================================
-- 5. MONTH CLOSINGS TABLE - Monthly accounting closure
-- =============================================================================

-- Create if not exists (migrations may have used different name)
CREATE TABLE IF NOT EXISTS monthclosings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id),
    company_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'locked')),
    checks JSONB DEFAULT '{}',
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, year, month)
);

-- RLS for monthclosings
ALTER TABLE monthclosings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monthclosings_user_policy" ON monthclosings;
CREATE POLICY "monthclosings_user_policy" ON monthclosings
    FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_monthclosings_user_period ON monthclosings(user_id, year, month);

-- =============================================================================
-- 6. AI LOGS TABLE - Proper structure for AI audit trail
-- =============================================================================

ALTER TABLE ailogs
    ADD COLUMN IF NOT EXISTS model TEXT,
    ADD COLUMN IF NOT EXISTS prompt TEXT,
    ADD COLUMN IF NOT EXISTS response TEXT,
    ADD COLUMN IF NOT EXISTS tokens_used INTEGER,
    ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_ailogs_user_created ON ailogs(user_id, created_at DESC);

-- =============================================================================
-- 7. VAT DECLARATIONS TABLE - Full structure
-- =============================================================================

ALTER TABLE vatdeclarations
    ADD COLUMN IF NOT EXISTS year INTEGER,
    ADD COLUMN IF NOT EXISTS due_date DATE,
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS end_date DATE,
    ADD COLUMN IF NOT EXISTS input_vat NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS output_vat NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS net_vat NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_vatdeclarations_user_period ON vatdeclarations(user_id, year, period);

-- =============================================================================
-- 8. EMPLOYEES TABLE - Payroll management
-- =============================================================================

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS personal_number TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT,
    ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC,
    ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'permanent',
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS end_date DATE,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS tax_table INTEGER,
    ADD COLUMN IF NOT EXISTS tax_column INTEGER,
    ADD COLUMN IF NOT EXISTS company_id TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_employees_user_status ON employees(user_id, status);

-- =============================================================================
-- 9. PAYSLIPS TABLE - Salary slips
-- =============================================================================

ALTER TABLE payslips
    ADD COLUMN IF NOT EXISTS employee_id TEXT REFERENCES employees(id),
    ADD COLUMN IF NOT EXISTS period TEXT,
    ADD COLUMN IF NOT EXISTS year INTEGER,
    ADD COLUMN IF NOT EXISTS month INTEGER,
    ADD COLUMN IF NOT EXISTS gross_salary NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS net_salary NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_deduction NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS employer_contributions NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vacation_days_used NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sick_days INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS deductions JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS company_id TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_payslips_employee_period ON payslips(employee_id, year, month);

-- =============================================================================
-- 10. SHAREHOLDERS TABLE - Share registry
-- =============================================================================

ALTER TABLE shareholders
    ADD COLUMN IF NOT EXISTS personal_number TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS share_class TEXT DEFAULT 'ordinary',
    ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ownership_percentage NUMERIC,
    ADD COLUMN IF NOT EXISTS voting_percentage NUMERIC,
    ADD COLUMN IF NOT EXISTS acquisition_date DATE,
    ADD COLUMN IF NOT EXISTS acquisition_price NUMERIC,
    ADD COLUMN IF NOT EXISTS is_board_member BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS board_role TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_shareholders_company ON shareholders(company_id);

-- =============================================================================
-- 11. BENEFITS TABLE - Employee benefits
-- =============================================================================

ALTER TABLE benefits
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS type TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS taxable_value NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cost_to_company NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS company_id TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================================================
-- 12. BOARD MINUTES TABLE
-- =============================================================================

ALTER TABLE boardminutes
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS meeting_date DATE,
    ADD COLUMN IF NOT EXISTS attendees JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS agenda JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS decisions JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS document_url TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS company_id TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================================================
-- 13. INVENTARIER TABLE - Fixed assets (Swedish column names to match code)
-- =============================================================================

ALTER TABLE inventarier
    ADD COLUMN IF NOT EXISTS namn TEXT,
    ADD COLUMN IF NOT EXISTS beskrivning TEXT,
    ADD COLUMN IF NOT EXISTS kategori TEXT,
    ADD COLUMN IF NOT EXISTS inkopspris NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS inkopsdatum DATE,
    ADD COLUMN IF NOT EXISTS livslangd_ar INTEGER DEFAULT 5,
    ADD COLUMN IF NOT EXISTS avskrivningsmetod TEXT DEFAULT 'linear',
    ADD COLUMN IF NOT EXISTS restvarde NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bokfort_varde NUMERIC,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS plats TEXT,
    ADD COLUMN IF NOT EXISTS company_id TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON TABLE inventarier IS 'Anläggningstillgångar / Fixed assets register';
COMMENT ON COLUMN inventarier.livslangd_ar IS 'Nyttjandeperiod i år';
COMMENT ON COLUMN inventarier.avskrivningsmetod IS 'linear, declining_balance, etc.';

-- =============================================================================
-- 14. ANNUAL CLOSINGS TABLE
-- =============================================================================

ALTER TABLE annualclosings
    ADD COLUMN IF NOT EXISTS fiscal_year INTEGER,
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS end_date DATE,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open',
    ADD COLUMN IF NOT EXISTS closing_entries JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS result NUMERIC,
    ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS closed_by TEXT,
    ADD COLUMN IF NOT EXISTS company_id TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================================================
-- 15. INTEGRATIONS TABLE
-- =============================================================================

ALTER TABLE integrations
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS type TEXT,
    ADD COLUMN IF NOT EXISTS provider TEXT,
    ADD COLUMN IF NOT EXISTS credentials JSONB,
    ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sync_error TEXT,
    ADD COLUMN IF NOT EXISTS company_id TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================================================
-- 16. COMPANY MEETINGS TABLE
-- =============================================================================

ALTER TABLE companymeetings
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS meeting_type TEXT,
    ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS agenda TEXT,
    ADD COLUMN IF NOT EXISTS minutes_url TEXT,
    ADD COLUMN IF NOT EXISTS attendees JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS decisions JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS company_id TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================================================
-- 17. Update RLS policies for new tables/columns
-- =============================================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplierinvoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ailogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vatdeclarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE shareholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE boardminutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventarier ENABLE ROW LEVEL SECURITY;
ALTER TABLE annualclosings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE companymeetings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- DONE
-- =============================================================================

COMMENT ON SCHEMA public IS 'Scope AI accounting database schema - aligned 2026-01-26';
