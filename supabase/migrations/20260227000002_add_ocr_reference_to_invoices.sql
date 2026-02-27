-- ============================================================================
-- Add OCR reference column to customer invoices
-- Auto-generated with Luhn check digit for payment matching
-- ============================================================================

ALTER TABLE customerinvoices ADD COLUMN IF NOT EXISTS ocr_reference TEXT;
