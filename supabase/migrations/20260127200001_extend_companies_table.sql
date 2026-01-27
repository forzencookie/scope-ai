-- ============================================================================
-- Extend Companies Table with Full Company Information
-- ============================================================================

-- Add missing columns to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'ab',
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS registration_date DATE,
ADD COLUMN IF NOT EXISTS fiscal_year_end TEXT DEFAULT '12-31',
ADD COLUMN IF NOT EXISTS accounting_method TEXT DEFAULT 'invoice',
ADD COLUMN IF NOT EXISTS vat_frequency TEXT DEFAULT 'quarterly',
ADD COLUMN IF NOT EXISTS is_closely_held BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS has_employees BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_moms_registration BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS share_capital INTEGER DEFAULT 25000,
ADD COLUMN IF NOT EXISTS total_shares INTEGER DEFAULT 500;

-- Add index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);

-- Enable RLS if not already enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own companies" ON companies;
DROP POLICY IF EXISTS "Users can insert own companies" ON companies;
DROP POLICY IF EXISTS "Users can update own companies" ON companies;

-- Users can view their own companies
CREATE POLICY "Users can view own companies"
    ON companies FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own companies
CREATE POLICY "Users can insert own companies"
    ON companies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own companies
CREATE POLICY "Users can update own companies"
    ON companies FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE companies IS 'Company information and settings for each user';
