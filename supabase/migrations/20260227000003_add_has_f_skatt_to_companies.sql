-- ============================================================================
-- Add has_f_skatt to companies table
-- Controls whether "Innehar F-skattsedel" appears on invoice PDFs
-- Defaults to true (most Swedish companies have F-skatt)
-- ============================================================================

ALTER TABLE companies ADD COLUMN IF NOT EXISTS has_f_skatt BOOLEAN DEFAULT true;
