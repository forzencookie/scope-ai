-- ============================================================================
-- Create Suppliers Table
-- ============================================================================
-- Supplier registry for vendor management and invoice matching

CREATE TABLE IF NOT EXISTS suppliers (
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
    payment_terms INTEGER DEFAULT 30,
    default_currency TEXT DEFAULT 'SEK',

    -- Categorization
    category TEXT, -- e.g., 'IT', 'Office supplies', 'Professional services'
    default_account TEXT, -- Default booking account (e.g., '6993' for IT)

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS suppliers_all ON suppliers;
CREATE POLICY suppliers_all ON suppliers
    FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(user_id, name);
CREATE INDEX IF NOT EXISTS idx_suppliers_org_number ON suppliers(org_number) WHERE org_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_suppliers_bankgiro ON suppliers(bankgiro) WHERE bankgiro IS NOT NULL;

-- Add supplier_id to supplierinvoices
ALTER TABLE supplierinvoices
    ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

CREATE INDEX IF NOT EXISTS idx_supplierinvoices_supplier ON supplierinvoices(supplier_id)
    WHERE supplier_id IS NOT NULL;

-- Updated at trigger
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
COMMENT ON TABLE suppliers IS 'Supplier registry for vendor management';
