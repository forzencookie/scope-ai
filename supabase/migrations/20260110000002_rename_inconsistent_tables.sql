-- =====================================================
-- Migration: Rename Tables for Consistency
-- =====================================================

-- 1. INBOX -> INBOX_ITEMS
-- "Inbox" is the location/concept, "Items" are the specific records.
ALTER TABLE IF EXISTS inbox RENAME TO inbox_items;

-- 2. NE_APPENDIX -> TAX_NE_APPENDICES
-- Pluralized to match other tables. Added 'tax_' prefix to group with other tax tables (optional but cleaner)
-- Or just 'ne_appendices' if you prefer shorter. Let's go with meaningful plural.
ALTER TABLE IF EXISTS ne_appendix RENAME TO ne_appendices;

-- 3. MONTHLY_TAX_SUMMARY -> TAX_MONTHLY_SUMMARIES
-- Pluralized as it stores multiple summary records.
ALTER TABLE IF EXISTS monthly_tax_summary RENAME TO tax_monthly_summaries;

-- =====================================================
-- NOTE: 
-- You will need to update your frontend code references
-- after applying this migration.
-- 
-- 1. supabase.from('inbox') -> supabase.from('inbox_items')
-- 2. supabase.from('ne_appendix') -> supabase.from('ne_appendices')
-- 3. supabase.from('monthly_tax_summary') -> supabase.from('tax_monthly_summaries')
-- =====================================================
