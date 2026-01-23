-- Migration for Partners (HB/KB)
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    personal_number TEXT,
    type TEXT NOT NULL, -- 'komplementär', 'kommanditdelägare'
    ownership_percentage NUMERIC(5,2),
    profit_share_percentage NUMERIC(5,2),
    capital_contribution NUMERIC(15,2),
    current_capital_balance NUMERIC(15,2),
    join_date DATE,
    is_limited_liability BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to partners" ON partners FOR ALL USING (true);
