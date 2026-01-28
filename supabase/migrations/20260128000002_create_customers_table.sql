-- Create customers table for customer registry
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic info
    name TEXT NOT NULL,
    org_number TEXT,
    vat_number TEXT,
    
    -- Contact info
    email TEXT,
    phone TEXT,
    website TEXT,
    
    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    postal_code TEXT,
    city TEXT,
    country TEXT DEFAULT 'SE',
    
    -- Billing settings
    payment_terms INTEGER DEFAULT 30,
    credit_limit DECIMAL(15,2),
    default_account TEXT DEFAULT '3000', -- Default revenue account
    
    -- Reference fields
    customer_number TEXT,
    reference_person TEXT,
    our_reference TEXT,
    
    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE customers IS 'Customer registry for invoicing';
COMMENT ON COLUMN customers.payment_terms IS 'Default payment terms in days';
COMMENT ON COLUMN customers.default_account IS 'Default BAS account for revenue';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_org_number ON customers(org_number);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own customers" ON customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers" ON customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers" ON customers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers" ON customers
    FOR DELETE USING (auth.uid() = user_id);

-- Add customer_id to customerinvoices if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customerinvoices') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'customerinvoices' AND column_name = 'customer_id') THEN
            ALTER TABLE customerinvoices ADD COLUMN customer_id UUID REFERENCES customers(id);
            CREATE INDEX IF NOT EXISTS idx_customerinvoices_customer_id ON customerinvoices(customer_id);
        END IF;
    END IF;
END $$;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;
CREATE TRIGGER trigger_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();
