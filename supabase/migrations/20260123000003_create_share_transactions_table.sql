-- ============================================
-- Share Transactions Table (Aktiebok History)
-- Stores share transaction history for aktiebok
-- ============================================

CREATE TABLE IF NOT EXISTS share_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Transaction info
    transaction_date DATE NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'Nyemission',      -- New share issuance
        'Överlåtelse',     -- Transfer between shareholders
        'Split',           -- Stock split
        'Sammanläggning',  -- Reverse split
        'Inlösen',         -- Redemption
        'Utdelning'        -- Dividend (in kind)
    )),
    
    -- Parties
    from_shareholder_id UUID REFERENCES shareholders(id),
    to_shareholder_id UUID REFERENCES shareholders(id),
    from_name TEXT,  -- For company/external parties
    to_name TEXT,    -- For company/external parties
    
    -- Share details
    shares INTEGER NOT NULL,
    share_class TEXT DEFAULT 'B' CHECK (share_class IN ('A', 'B')),
    price_per_share NUMERIC(12, 2),
    total_price NUMERIC(12, 2),
    
    -- Verification link
    verification_id UUID,
    
    -- Additional data
    notes TEXT,
    document_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE share_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own share transactions"
    ON share_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own share transactions"
    ON share_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own share transactions"
    ON share_transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own share transactions"
    ON share_transactions FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_share_transactions_user_id ON share_transactions(user_id);
CREATE INDEX idx_share_transactions_date ON share_transactions(transaction_date);

-- Trigger for updated_at
CREATE TRIGGER set_share_transactions_updated_at
    BEFORE UPDATE ON share_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE share_transactions IS 'Stores share transaction history for aktiebok per user';
