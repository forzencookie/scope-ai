-- ============================================================================
-- Create Customers Table
-- ============================================================================
-- Customer registry for invoicing - no more re-entering customer details

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Basic info
    name TEXT NOT NULL,
    org_number TEXT,
    vat_number TEXT,

    -- Contact
    email TEXT,
    phone TEXT,
    contact_person TEXT,

    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    postal_code TEXT,
    city TEXT,
    country TEXT DEFAULT 'SE',

    -- Invoice settings
    payment_terms INTEGER DEFAULT 30,
    default_currency TEXT DEFAULT 'SEK',
    credit_limit DECIMAL(15,2),

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS customers_all ON customers;
CREATE POLICY customers_all ON customers
    FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(user_id, name);
CREATE INDEX IF NOT EXISTS idx_customers_org_number ON customers(org_number) WHERE org_number IS NOT NULL;

-- Add customer_id to customerinvoices
ALTER TABLE customerinvoices
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

CREATE INDEX IF NOT EXISTS idx_customerinvoices_customer ON customerinvoices(customer_id)
    WHERE customer_id IS NOT NULL;

-- Updated at trigger
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
COMMENT ON TABLE customers IS 'Customer registry for invoicing';
