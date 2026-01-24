-- Create companies table (Root Dependency)
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    org_number TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create supplier_invoices table (Root Dependency)
CREATE TABLE IF NOT EXISTS supplier_invoices (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    supplier_name TEXT,
    amount DECIMAL(15,2),
    due_date DATE,
    ocr TEXT,
    status TEXT DEFAULT 'pending',
    user_id UUID REFERENCES auth.users(id),
    company_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch create other missing critical tables (Root Dependencies)
CREATE TABLE IF NOT EXISTS agi_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    period TEXT,
    status TEXT DEFAULT 'draft',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    company_id TEXT
);

CREATE TABLE IF NOT EXISTS vat_declarations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    period TEXT,
    status TEXT DEFAULT 'draft',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    company_id TEXT
);

CREATE TABLE IF NOT EXISTS income_declarations (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id UUID REFERENCES auth.users(id), company_id TEXT);
CREATE TABLE IF NOT EXISTS k10_declarations (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id UUID REFERENCES auth.users(id), company_id TEXT, shareholder_id UUID, fiscal_year INTEGER);
CREATE TABLE IF NOT EXISTS ne_appendices (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id UUID REFERENCES auth.users(id), company_id TEXT);

CREATE TABLE IF NOT EXISTS annual_closings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, 
    year INTEGER,
    status TEXT DEFAULT 'draft',
    user_id UUID REFERENCES auth.users(id), 
    company_id TEXT
);

CREATE TABLE IF NOT EXISTS annual_reports (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id UUID REFERENCES auth.users(id), company_id TEXT);
CREATE TABLE IF NOT EXISTS month_closings (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id UUID REFERENCES auth.users(id), company_id TEXT);

CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, 
    date DATE,
    description TEXT,
    user_id UUID REFERENCES auth.users(id), 
    company_id TEXT
);

CREATE TABLE IF NOT EXISTS assets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id), company_id TEXT);

CREATE TABLE IF NOT EXISTS company_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    meeting_date DATE,
    type TEXT,
    status TEXT,
    user_id UUID REFERENCES auth.users(id), 
    company_id TEXT
);

CREATE TABLE IF NOT EXISTS board_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID REFERENCES auth.users(id), 
    company_id TEXT,
    meeting_id UUID REFERENCES company_meetings(id)
);
CREATE TABLE IF NOT EXISTS inbox_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id), company_id TEXT);
CREATE TABLE IF NOT EXISTS ai_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id), company_id TEXT);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Create rate_limits table for persistent rate limiting
-- This replaces the in-memory rate limiting which is lost on server restarts

CREATE TABLE IF NOT EXISTS rate_limits (
  identifier TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup queries (finding expired entries)
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time ON rate_limits(reset_time);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on row updates
DROP TRIGGER IF EXISTS rate_limits_updated_at ON rate_limits;
CREATE TRIGGER rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limits_updated_at();

-- Comment explaining the table
COMMENT ON TABLE rate_limits IS 'Stores rate limit counters for API rate limiting. Entries expire based on reset_time.';
COMMENT ON COLUMN rate_limits.identifier IS 'Unique identifier for the rate-limited entity (e.g., IP address, user ID)';
COMMENT ON COLUMN rate_limits.count IS 'Number of requests made in the current window';
COMMENT ON COLUMN rate_limits.reset_time IS 'When the current rate limit window expires';
