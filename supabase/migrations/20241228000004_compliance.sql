-- Migration Phase 7: Corporate Compliance
-- Tables for Board Minutes and Share Register

-- Corporate Documents (Board Minutes, AGM, etc.)
CREATE TABLE IF NOT EXISTS corporate_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    type TEXT NOT NULL, -- 'board_minutes', 'agm', 'egm', 'share_register_snapshot'
    title TEXT NOT NULL,
    date DATE NOT NULL,
    content TEXT, -- Markdown or JSON content
    status TEXT DEFAULT 'draft', -- 'draft', 'signed', 'archived'
    version INTEGER DEFAULT 1,
    source TEXT DEFAULT 'manual', -- 'manual', 'ai'
    created_by TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Shareholders
CREATE TABLE IF NOT EXISTS shareholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    ssn_org_nr TEXT, -- personal number or org number
    shares_count INTEGER NOT NULL DEFAULT 0,
    shares_percentage NUMERIC(5,2),
    voting_power NUMERIC(5,2),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE corporate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shareholders ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Allow all for service role)
CREATE POLICY "Allow all access to corporate_documents" ON corporate_documents FOR ALL USING (true);
CREATE POLICY "Allow all access to shareholders" ON shareholders FOR ALL USING (true);

-- Seed Initial Shareholders (Mock to Real)
INSERT INTO shareholders (name, shares_count, shares_percentage)
VALUES 
    ('Rice', 900, 90.00),
    ('Investor AB', 100, 10.00)
ON CONFLICT DO NOTHING;
