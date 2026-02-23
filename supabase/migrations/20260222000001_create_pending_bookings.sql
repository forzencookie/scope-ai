-- Create pending_bookings table
-- Universal queue for two-phase booking: actions create pending entries,
-- user confirms via BookingWizard before they become verifications.

CREATE TABLE IF NOT EXISTS pending_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,  -- 'payslip', 'customer_invoice', 'supplier_invoice', 'invoice_payment', 'transaction', 'dividend_decision', 'dividend_payment', 'owner_withdrawal', 'ai_entry'
  source_id TEXT NOT NULL,     -- FK to originating record
  description TEXT NOT NULL,
  proposed_entries JSONB NOT NULL,  -- Array of {account, debit, credit, description}
  proposed_series TEXT DEFAULT 'A',
  proposed_date TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'booked', 'dismissed')),
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  booked_at TIMESTAMPTZ,
  verification_id TEXT,  -- Set when booked — references verifications.id
  metadata JSONB  -- Extra context (employee name, invoice number, etc.)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pending_bookings_user_status
  ON pending_bookings (user_id, status);

CREATE INDEX IF NOT EXISTS idx_pending_bookings_source
  ON pending_bookings (source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_pending_bookings_company
  ON pending_bookings (company_id, status);

-- Enable RLS
ALTER TABLE pending_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own pending bookings
CREATE POLICY "Users can view own pending bookings"
  ON pending_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pending bookings"
  ON pending_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending bookings"
  ON pending_bookings FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE pending_bookings IS 'Two-phase booking queue: actions create pending entries, BookingWizard confirms them into verifications';
COMMENT ON COLUMN pending_bookings.source_type IS 'Type of originating entity (payslip, customer_invoice, supplier_invoice, etc.)';
COMMENT ON COLUMN pending_bookings.proposed_entries IS 'Array of {account, debit, credit, description} — pre-built journal entry lines';
COMMENT ON COLUMN pending_bookings.verification_id IS 'Set when status transitions to booked — references the created verification';
