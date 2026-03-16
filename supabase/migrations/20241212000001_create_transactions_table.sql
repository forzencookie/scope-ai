-- ============================================
-- Transactions Table
-- Stores all bank transactions (mock and real)
-- ============================================

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    -- Primary key
    id TEXT PRIMARY KEY,
    
    -- Core transaction data
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount TEXT NOT NULL,
    amount_value DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'SEK',
    
    -- Status and categorization
    status TEXT NOT NULL DEFAULT 'Att bokföra',
    category TEXT,
    
    -- Display properties
    icon_name TEXT DEFAULT 'CreditCard',
    icon_color TEXT DEFAULT 'text-gray-500',
    
    -- Account info
    account TEXT DEFAULT 'Företagskonto',
    description TEXT,
    
    -- AI categorization suggestions
    ai_category TEXT,
    ai_account TEXT,
    ai_confidence INTEGER,
    ai_reasoning TEXT,
    
    -- Source tracking
    source TEXT DEFAULT 'manual', -- 'manual', 'mock_api', 'bank_import', 'revolut', etc.
    external_id TEXT, -- ID from external system (bank, Revolut, etc.)
    
    -- Booking reference (when booked)
    voucher_id TEXT,
    booked_at TIMESTAMPTZ,
    booked_by UUID REFERENCES auth.users(id),
    
    -- Receipt/attachment linking
    receipt_id TEXT,
    attachments TEXT[], -- Array of attachment URLs
    
    -- User ownership
    user_id UUID REFERENCES auth.users(id),
    company_id UUID, -- For multi-company support
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON public.transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON public.transactions(source);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON public.transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON public.transactions(external_id);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own transactions
CREATE POLICY "Users can view own transactions"
    ON public.transactions
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR user_id IS NULL
    );

-- Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
    ON public.transactions
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR user_id IS NULL
    );

-- Policy: Users can update their own transactions
CREATE POLICY "Users can update own transactions"
    ON public.transactions
    FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR user_id IS NULL
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR user_id IS NULL
    );

-- Policy: Users can delete their own transactions
CREATE POLICY "Users can delete own transactions"
    ON public.transactions
    FOR DELETE
    USING (
        auth.uid() = user_id 
        OR user_id IS NULL
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO anon;
GRANT ALL ON public.transactions TO service_role;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE public.transactions IS 'Bank transactions for bookkeeping';
COMMENT ON COLUMN public.transactions.status IS 'Att bokföra, Bokförd, Saknar underlag, Ignorerad';
COMMENT ON COLUMN public.transactions.source IS 'Origin: manual, mock_api, bank_import, revolut, etc.';
COMMENT ON COLUMN public.transactions.ai_confidence IS 'AI categorization confidence 0-100';
