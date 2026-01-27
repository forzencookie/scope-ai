-- =============================================================================
-- Migration: Add Investment & Tax Tables
-- Description: Creates tables for periodiseringsfonder, share_holdings, and tax_reports
-- Date: 2026-01-27
-- =============================================================================

-- =============================================================================
-- 1. Periodiseringsfonder (Tax Allocation Reserves)
-- Swedish tax law allows companies to defer up to 25% of profit for 6 years
-- =============================================================================

CREATE TABLE IF NOT EXISTS periodiseringsfonder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    year INTEGER NOT NULL,                           -- Tax year of allocation
    amount NUMERIC(15,2) NOT NULL,                   -- Amount allocated
    dissolved_amount NUMERIC(15,2) DEFAULT 0,        -- Amount dissolved so far
    expires_at DATE NOT NULL,                        -- Expiry date (6 years after allocation)
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'partially_dissolved', 'dissolved', 'expired')),
    notes TEXT,
    
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for periodiseringsfonder
CREATE INDEX IF NOT EXISTS idx_periodiseringsfonder_company ON periodiseringsfonder(company_id);
CREATE INDEX IF NOT EXISTS idx_periodiseringsfonder_user ON periodiseringsfonder(user_id);
CREATE INDEX IF NOT EXISTS idx_periodiseringsfonder_year ON periodiseringsfonder(year);
CREATE INDEX IF NOT EXISTS idx_periodiseringsfonder_status ON periodiseringsfonder(status);

-- RLS for periodiseringsfonder
ALTER TABLE periodiseringsfonder ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'periodiseringsfonder' AND policyname = 'Users can view own periodiseringsfonder') THEN
        CREATE POLICY "Users can view own periodiseringsfonder" ON periodiseringsfonder
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'periodiseringsfonder' AND policyname = 'Users can manage own periodiseringsfonder') THEN
        CREATE POLICY "Users can manage own periodiseringsfonder" ON periodiseringsfonder
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- =============================================================================
-- 2. Share Holdings (Aktieinnehav)
-- Track ownership stakes in other companies
-- =============================================================================

CREATE TABLE IF NOT EXISTS shareholdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    company_name TEXT NOT NULL,                      -- Name of company whose shares are held
    org_number TEXT,                                 -- Organization number of held company
    holding_type TEXT DEFAULT 'other' CHECK (holding_type IN ('listed', 'unlisted', 'subsidiary', 'associate', 'other')),
    shares_count INTEGER,                            -- Number of shares held
    purchase_date DATE,
    purchase_price NUMERIC(15,2),                    -- Total acquisition cost
    current_value NUMERIC(15,2),                     -- Current market value
    dividend_received NUMERIC(15,2) DEFAULT 0,       -- Total dividends received
    bas_account TEXT DEFAULT '1350',                 -- BAS account for booking
    notes TEXT,
    
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for shareholdings
CREATE INDEX IF NOT EXISTS idx_shareholdings_company ON shareholdings(company_id);
CREATE INDEX IF NOT EXISTS idx_shareholdings_user ON shareholdings(user_id);
CREATE INDEX IF NOT EXISTS idx_shareholdings_holding_type ON shareholdings(holding_type);

-- RLS for shareholdings
ALTER TABLE shareholdings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shareholdings' AND policyname = 'Users can view own shareholdings') THEN
        CREATE POLICY "Users can view own shareholdings" ON shareholdings
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shareholdings' AND policyname = 'Users can manage own shareholdings') THEN
        CREATE POLICY "Users can manage own shareholdings" ON shareholdings
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- =============================================================================
-- 3. Tax Reports (Moms/Skatterapporter)
-- Store VAT and other tax report submissions
-- =============================================================================

CREATE TABLE IF NOT EXISTS taxreports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL CHECK (type IN ('vat', 'income', 'employer', 'other')),
    period_id UUID,                                  -- Reference to financial period
    period TEXT,                                     -- Period string (e.g., '2024-01', '2024-Q1')
    year INTEGER,
    
    -- VAT specific fields
    output_vat NUMERIC(15,2),                        -- Utgående moms
    input_vat NUMERIC(15,2),                         -- Ingående moms
    net_vat NUMERIC(15,2),                           -- Moms att betala/få tillbaka
    
    -- General fields
    amount NUMERIC(15,2),                            -- Total amount (for non-VAT reports)
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'submitted', 'accepted', 'rejected')),
    submitted_at TIMESTAMPTZ,
    due_date DATE,
    
    -- Metadata
    data JSONB,                                      -- Additional report data
    notes TEXT,
    
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for taxreports
CREATE INDEX IF NOT EXISTS idx_taxreports_company ON taxreports(company_id);
CREATE INDEX IF NOT EXISTS idx_taxreports_user ON taxreports(user_id);
CREATE INDEX IF NOT EXISTS idx_taxreports_type ON taxreports(type);
CREATE INDEX IF NOT EXISTS idx_taxreports_period ON taxreports(period);
CREATE INDEX IF NOT EXISTS idx_taxreports_status ON taxreports(status);

-- RLS for taxreports
ALTER TABLE taxreports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'taxreports' AND policyname = 'Users can view own taxreports') THEN
        CREATE POLICY "Users can view own taxreports" ON taxreports
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'taxreports' AND policyname = 'Users can manage own taxreports') THEN
        CREATE POLICY "Users can manage own taxreports" ON taxreports
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- =============================================================================
-- Updated at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_periodiseringsfonder_updated_at') THEN
        CREATE TRIGGER update_periodiseringsfonder_updated_at 
            BEFORE UPDATE ON periodiseringsfonder 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shareholdings_updated_at') THEN
        CREATE TRIGGER update_shareholdings_updated_at 
            BEFORE UPDATE ON shareholdings 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_taxreports_updated_at') THEN
        CREATE TRIGGER update_taxreports_updated_at 
            BEFORE UPDATE ON taxreports 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
