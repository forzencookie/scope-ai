-- Migration for Association Members
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    member_number TEXT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    join_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'aktiv', -- 'aktiv', 'vilande', 'avslutad'
    membership_type TEXT NOT NULL DEFAULT 'ordinarie', -- 'ordinarie', 'stödmedlem', 'hedersmedlem'
    last_paid_year INTEGER,
    roles TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to members" ON members FOR ALL USING (true);
