-- Waitlist table for pre-launch email collection
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    signed_up_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: no public access (only service role inserts via API route)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service_role can read/write (which is what the API route uses)
