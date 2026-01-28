-- Create suppliers table for supplier/vendor registry
CREATE TABLE IF NOT EXISTS suppliers (
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
    
    -- Payment info
    bankgiro TEXT,
    plusgiro TEXT,
    iban TEXT,
    bic TEXT,
    bank_account TEXT,
    
    -- Billing settings
    payment_terms INTEGER DEFAULT 30,
    default_account TEXT DEFAULT '4000', -- Default expense account
    
    -- Reference fields
    supplier_number TEXT,
    contact_person TEXT,
    our_reference TEXT,
    
    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE suppliers IS 'Supplier/vendor registry for accounts payable';
COMMENT ON COLUMN suppliers.payment_terms IS 'Expected payment terms in days';
COMMENT ON COLUMN suppliers.default_account IS 'Default BAS expense account';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_org_number ON suppliers(org_number);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own suppliers" ON suppliers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suppliers" ON suppliers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suppliers" ON suppliers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own suppliers" ON suppliers
    FOR DELETE USING (auth.uid() = user_id);

-- Add supplier_id to supplierinvoices if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplierinvoices') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'supplierinvoices' AND column_name = 'supplier_id') THEN
            ALTER TABLE supplierinvoices ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
            CREATE INDEX IF NOT EXISTS idx_supplierinvoices_supplier_id ON supplierinvoices(supplier_id);
        END IF;
    END IF;
END $$;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_suppliers_updated_at ON suppliers;
CREATE TRIGGER trigger_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_suppliers_updated_at();
