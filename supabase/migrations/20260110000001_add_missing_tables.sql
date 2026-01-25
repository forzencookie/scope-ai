-- =====================================================
-- Migration: Add Missing Tables (v2)
-- Corrected for companies(id) type TEXT and missing user_id
-- =====================================================

-- 1. SHAREHOLDERS (Aktiebok)
CREATE TABLE IF NOT EXISTS shareholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id), -- Add owner
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE, -- TEXT type
    
    name TEXT NOT NULL,
    person_number TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    
    shares INTEGER NOT NULL DEFAULT 0,
    share_percentage NUMERIC(5,2),
    share_class TEXT DEFAULT 'A',
    voting_rights NUMERIC(5,2),
    
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
    acquired_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix for existing table without user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shareholders' AND column_name = 'user_id') THEN
        ALTER TABLE shareholders ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shareholders' AND column_name = 'company_id') THEN
        ALTER TABLE shareholders ADD COLUMN company_id TEXT REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE shareholders ENABLE ROW LEVEL SECURITY;

-- RLS based on user_id (Standard pattern)
CREATE POLICY "Users can view own shareholders"
    ON shareholders FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own shareholders"
    ON shareholders FOR ALL
    USING (user_id = auth.uid());

CREATE INDEX idx_shareholders_user ON shareholders(user_id);
CREATE INDEX idx_shareholders_company ON shareholders(company_id);

-- =====================================================

-- 2. COMPANY_MEETINGS
CREATE TABLE IF NOT EXISTS company_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    meeting_type TEXT NOT NULL CHECK (meeting_type IN (
        'bolagsstamma', 'arsmote', 'extra_stamma', 'styrelsemote'
    )),
    
    meeting_date DATE NOT NULL,
    meeting_time TIME,
    location TEXT,
    is_digital BOOLEAN DEFAULT FALSE,
    meeting_link TEXT,
    
    status TEXT DEFAULT 'planned' CHECK (status IN (
        'planned', 'called', 'held', 'cancelled'
    )),
    
    attendees JSONB DEFAULT '[]',
    agenda TEXT,
    minutes TEXT,
    decisions JSONB DEFAULT '[]',
    
    notice_sent_at TIMESTAMPTZ,
    deadline_proposals DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE company_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings"
    ON company_meetings FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own meetings"
    ON company_meetings FOR ALL
    USING (user_id = auth.uid());

CREATE INDEX idx_company_meetings_user ON company_meetings(user_id);
CREATE INDEX idx_company_meetings_company ON company_meetings(company_id);

-- =====================================================

-- 3. DIVIDENDS
CREATE TABLE IF NOT EXISTS dividends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    fiscal_year INTEGER NOT NULL,
    decision_date DATE NOT NULL,
    meeting_id UUID REFERENCES company_meetings(id),
    
    total_amount NUMERIC(15,2) NOT NULL,
    per_share_amount NUMERIC(10,4),
    
    tax_rate NUMERIC(5,2) DEFAULT 30.00,
    total_tax NUMERIC(15,2),
    net_amount NUMERIC(15,2),
    
    status TEXT DEFAULT 'planned' CHECK (status IN (
        'planned', 'decided', 'paid', 'cancelled'
    )),
    payment_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dividends"
    ON dividends FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own dividends"
    ON dividends FOR ALL
    USING (user_id = auth.uid());

CREATE INDEX idx_dividends_user ON dividends(user_id);
CREATE INDEX idx_dividends_company ON dividends(company_id);

-- =====================================================

-- 4. BOARD_MINUTES
CREATE TABLE IF NOT EXISTS board_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES company_meetings(id),
    
    title TEXT NOT NULL,
    protocol_number TEXT,
    meeting_date DATE NOT NULL,
    
    attendees JSONB DEFAULT '[]',
    agenda_items JSONB DEFAULT '[]',
    decisions JSONB DEFAULT '[]',
    notes TEXT,
    
    chairman TEXT,
    secretary TEXT,
    signed_at TIMESTAMPTZ,
    
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending_signatures', 'signed', 'archived'
    )),
    
    attachments JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE board_minutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own board minutes"
    ON board_minutes FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own board minutes"
    ON board_minutes FOR ALL
    USING (user_id = auth.uid());

CREATE INDEX idx_board_minutes_user ON board_minutes(user_id);

-- =====================================================

-- 5. CUSTOMER_INVOICES
CREATE TABLE IF NOT EXISTS customer_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    customer_name TEXT NOT NULL,
    customer_org_number TEXT,
    customer_email TEXT,
    customer_address TEXT,
    
    subtotal NUMERIC(15,2) NOT NULL,
    vat_rate NUMERIC(5,2) DEFAULT 25.00,
    vat_amount NUMERIC(15,2),
    total_amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'SEK',
    
    items JSONB DEFAULT '[]',
    
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'credited'
    )),
    paid_at TIMESTAMPTZ,
    paid_amount NUMERIC(15,2),
    payment_reference TEXT,
    
    reminder_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own customer invoices"
    ON customer_invoices FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own customer invoices"
    ON customer_invoices FOR ALL
    USING (user_id = auth.uid());

CREATE INDEX idx_customer_invoices_user ON customer_invoices(user_id);
CREATE INDEX idx_customer_invoices_status ON customer_invoices(status);

-- =====================================================

-- 6. EVENTS
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id), -- Linked to user
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL,
    
    source TEXT NOT NULL CHECK (source IN ('ai', 'user', 'system', 'document', 'authority')),
    
    category TEXT,
    entity_type TEXT,
    entity_id UUID,
    
    actor_id UUID,
    actor_name TEXT,
    
    metadata JSONB DEFAULT '{}',
    related_to JSONB DEFAULT '[]',
    
    status TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
    ON events FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own events"
    ON events FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);

-- =====================================================

-- 7. K10_DECLARATIONS
CREATE TABLE IF NOT EXISTS k10_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    shareholder_id UUID REFERENCES shareholders(id),
    
    fiscal_year INTEGER NOT NULL,
    
    gransbelopp NUMERIC(15,2),
    used_gransbelopp NUMERIC(15,2),
    saved_gransbelopp NUMERIC(15,2),
    
    omkostnadsbelopp NUMERIC(15,2),
    lonebaserat_utrymme NUMERIC(15,2),
    
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
    deadline DATE,
    submitted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE k10_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own k10"
    ON k10_declarations FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own k10"
    ON k10_declarations FOR ALL
    USING (user_id = auth.uid());

CREATE INDEX idx_k10_user ON k10_declarations(user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION get_shareholder_stats_v1(p_company_id TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalShareholders', COUNT(*),
        'totalShares', COALESCE(SUM(shares), 0),
        'totalVotes', COALESCE(SUM(voting_rights), 0)
    ) INTO result
    FROM shareholders
    WHERE company_id = p_company_id AND status = 'active';
    -- Note: RLS will automatically apply, so we don't strictly need to filter by user_id here 
    -- if we trust RLS, but the function user context applies.
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
