-- ============================================
-- Add Missing Essential Tables
-- These tables are needed for core functionality
-- ============================================

-- 1. ACCOUNTBALANCES - Track BAS account balances
CREATE TABLE IF NOT EXISTS accountbalances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    account_number TEXT NOT NULL,           -- BAS account: 1000-8999
    account_name TEXT NOT NULL,
    balance NUMERIC(15,2) DEFAULT 0,
    
    period TEXT,                            -- e.g., '2026-01' for monthly
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, company_id, account_number, year, period)
);

ALTER TABLE accountbalances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own accountbalances" ON accountbalances FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX idx_accountbalances_user ON accountbalances(user_id);
CREATE INDEX idx_accountbalances_account ON accountbalances(account_number);
CREATE INDEX idx_accountbalances_year ON accountbalances(year);

-- 2. BANKCONNECTIONS - Track bank API connections
CREATE TABLE IF NOT EXISTS bankconnections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    provider TEXT NOT NULL CHECK (provider IN ('tink', 'plaid', 'nordigen', 'manual')),
    bank_name TEXT NOT NULL,
    account_id TEXT,                        -- External account ID from provider
    account_type TEXT,                      -- checking, savings, etc.
    
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'error', 'disconnected')),
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    
    access_token_encrypted TEXT,            -- Encrypted token
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bankconnections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bankconnections" ON bankconnections FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX idx_bankconnections_user ON bankconnections(user_id);
CREATE INDEX idx_bankconnections_status ON bankconnections(status);

-- 3. DOCUMENTS - Track uploaded files/documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,                -- Storage path
    file_type TEXT,                         -- MIME type
    file_size INTEGER,                      -- Bytes
    
    document_type TEXT CHECK (document_type IN (
        'receipt', 'invoice', 'contract', 'report', 
        'tax_document', 'bank_statement', 'payslip', 'other'
    )),
    
    -- AI extraction results
    extracted_data JSONB DEFAULT '{}',
    extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN (
        'pending', 'processing', 'completed', 'failed'
    )),
    
    -- Links to other entities
    entity_type TEXT,                       -- 'receipt', 'invoice', etc.
    entity_id UUID,
    
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents" ON documents FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);

-- 4. INTEGRATIONS - Third-party service states
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    service TEXT NOT NULL,                  -- 'fortnox', 'visma', 'skatteverket', etc.
    enabled BOOLEAN DEFAULT false,
    
    credentials_encrypted JSONB,            -- Encrypted API keys/tokens
    settings JSONB DEFAULT '{}',
    
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error')),
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, service)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own integrations" ON integrations FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX idx_integrations_user ON integrations(user_id);
CREATE INDEX idx_integrations_service ON integrations(service);

-- 5. PARTNERS - HB/KB delägare (Handelsbolag, Kommanditbolag)
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    personal_number TEXT,                   -- Personnummer
    
    type TEXT NOT NULL CHECK (type IN ('komplementär', 'kommanditdelägare')),
    
    ownership_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,  -- Ägarandel %
    profit_share_percentage NUMERIC(5,2),   -- Resultatandel % (if different)
    
    capital_contribution NUMERIC(15,2) DEFAULT 0,   -- Insatt kapital
    current_capital_balance NUMERIC(15,2) DEFAULT 0, -- Kapitalkonto saldo
    
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    exit_date DATE,
    
    is_limited_liability BOOLEAN DEFAULT false,  -- Begränsat ansvar (KB)
    
    -- Contact info
    email TEXT,
    phone TEXT,
    address TEXT,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own partners" ON partners FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX idx_partners_user ON partners(user_id);
CREATE INDEX idx_partners_company ON partners(company_id);

-- 6. MEMBERS - Förening medlemmar (Ekonomisk/Ideell förening)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    member_number TEXT,                     -- Medlemsnummer
    name TEXT NOT NULL,
    
    email TEXT,
    phone TEXT,
    address TEXT,
    
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    exit_date DATE,
    
    status TEXT DEFAULT 'aktiv' CHECK (status IN ('aktiv', 'vilande', 'avslutad')),
    membership_type TEXT DEFAULT 'ordinarie' CHECK (membership_type IN (
        'ordinarie', 'stödmedlem', 'hedersmedlem'
    )),
    
    last_paid_year INTEGER,                 -- Senast betald avgift
    
    roles TEXT[] DEFAULT '{}',              -- Styrelse, revisor, etc.
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own members" ON members FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX idx_members_user ON members(user_id);
CREATE INDEX idx_members_company ON members(company_id);
CREATE INDEX idx_members_status ON members(status);

-- 7. NOTIFICATIONS - User notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    
    -- Link to related entity
    entity_type TEXT,
    entity_id UUID,
    action_url TEXT,
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Auto-dismiss settings
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- 8. INVENTARIER - Fixed assets tracking
CREATE TABLE IF NOT EXISTS inventarier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,                          -- 'inventarier', 'maskiner', 'datorer', etc.
    
    -- Purchase info
    purchase_date DATE NOT NULL,
    purchase_price NUMERIC(15,2) NOT NULL,
    supplier TEXT,
    invoice_reference TEXT,
    
    -- Depreciation
    depreciation_method TEXT DEFAULT 'linear' CHECK (depreciation_method IN ('linear', 'declining')),
    useful_life_years INTEGER DEFAULT 5,
    residual_value NUMERIC(15,2) DEFAULT 0,
    current_value NUMERIC(15,2),
    
    -- Accounting
    account_number TEXT DEFAULT '1220',     -- Standard inventarier account
    depreciation_account TEXT DEFAULT '7832',
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'scrapped', 'lost')),
    disposal_date DATE,
    disposal_value NUMERIC(15,2),
    
    -- Location/tracking
    location TEXT,
    serial_number TEXT,
    barcode TEXT,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventarier ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own inventarier" ON inventarier FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX idx_inventarier_user ON inventarier(user_id);
CREATE INDEX idx_inventarier_status ON inventarier(status);

-- 9. SHARETRANSACTIONS - Share transfer history (for AB)
CREATE TABLE IF NOT EXISTS sharetransactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'issue', 'transfer', 'split', 'redemption', 'bonus_issue'
    )),
    
    from_shareholder_id UUID REFERENCES shareholders(id),
    to_shareholder_id UUID REFERENCES shareholders(id),
    
    share_count INTEGER NOT NULL,
    price_per_share NUMERIC(15,2),
    total_amount NUMERIC(15,2),
    
    transaction_date DATE NOT NULL,
    registration_date DATE,                 -- Bolagsverket registration
    
    notes TEXT,
    document_reference TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sharetransactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sharetransactions" ON sharetransactions FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX idx_sharetransactions_user ON sharetransactions(user_id);
CREATE INDEX idx_sharetransactions_date ON sharetransactions(transaction_date);

-- 10. TAXCALENDAR - Tax deadlines and reminders
CREATE TABLE IF NOT EXISTS taxcalendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT,
    
    deadline_type TEXT NOT NULL CHECK (deadline_type IN (
        'moms', 'agi', 'skatt', 'arsredovisning', 'deklaration', 'other'
    )),
    
    due_date DATE NOT NULL,
    reminder_date DATE,
    
    period TEXT,                            -- e.g., '2026-01' for monthly VAT
    year INTEGER,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'skipped')),
    completed_at TIMESTAMPTZ,
    
    -- Auto-generated vs manual
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT,                -- 'monthly', 'quarterly', 'yearly'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE taxcalendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own taxcalendar" ON taxcalendar FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX idx_taxcalendar_user ON taxcalendar(user_id);
CREATE INDEX idx_taxcalendar_due ON taxcalendar(due_date);
CREATE INDEX idx_taxcalendar_status ON taxcalendar(status) WHERE status = 'pending';

-- 11. SETTINGS - User/company preferences
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Settings scope: 'user' or 'company'
    scope TEXT DEFAULT 'user' CHECK (scope IN ('user', 'company')),
    
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, company_id, key)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings" ON settings FOR ALL
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX idx_settings_user ON settings(user_id);
CREATE INDEX idx_settings_key ON settings(key);

-- Add update triggers for all new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DO $$
DECLARE
    tables TEXT[] := ARRAY[
        'accountbalances', 'bankconnections', 'documents', 'integrations',
        'partners', 'members', 'inventarier', 'settings'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
            CREATE TRIGGER update_%s_updated_at
                BEFORE UPDATE ON %s
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- Summary of new tables:
-- 1. accountbalances - BAS account balances (1000-8999)
-- 2. bankconnections - Bank API connections (Tink, Plaid, etc.)
-- 3. documents - File/document metadata
-- 4. integrations - Third-party service states (Fortnox, Visma, etc.)
-- 5. partners - HB/KB delägare (Handelsbolag partners)
-- 6. members - Förening medlemmar (Association members)
-- 7. notifications - User notifications
-- 8. inventarier - Fixed assets tracking
-- 9. sharetransactions - Share transfer history (AB)
-- 10. taxcalendar - Tax deadlines/reminders
-- 11. settings - User/company preferences
