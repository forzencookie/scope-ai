-- ============================================
-- CONSOLIDATION MIGRATION
-- Merging Month Closing into Financial Periods
-- ============================================

-- 1. Extend financial_periods with reconciliation state
ALTER TABLE public.financial_periods 
    ADD COLUMN IF NOT EXISTS reconciliation_checks JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS locked_by UUID;

-- 2. Seed Monthly Periods for 2024 (if they don't exist)
INSERT INTO public.financial_periods (id, name, type, start_date, end_date, status)
VALUES 
    ('2024-M01', 'Jan 2024', 'monthly', '2024-01-01', '2024-01-31', 'open'),
    ('2024-M02', 'Feb 2024', 'monthly', '2024-02-01', '2024-02-29', 'open'),
    ('2024-M03', 'Mar 2024', 'monthly', '2024-03-01', '2024-03-31', 'open'),
    ('2024-M04', 'Apr 2024', 'monthly', '2024-04-01', '2024-04-30', 'open'),
    ('2024-M05', 'Maj 2024', 'monthly', '2024-05-01', '2024-05-31', 'open'),
    ('2024-M06', 'Jun 2024', 'monthly', '2024-06-01', '2024-06-30', 'open'),
    ('2024-M07', 'Jul 2024', 'monthly', '2024-07-01', '2024-07-31', 'open'),
    ('2024-M08', 'Aug 2024', 'monthly', '2024-08-01', '2024-08-31', 'open'),
    ('2024-M09', 'Sep 2024', 'monthly', '2024-09-01', '2024-09-30', 'open'),
    ('2024-M10', 'Okt 2024', 'monthly', '2024-10-01', '2024-10-31', 'open'),
    ('2024-M11', 'Nov 2024', 'monthly', '2024-11-01', '2024-11-30', 'open'),
    ('2024-M12', 'Dec 2024', 'monthly', '2024-12-01', '2024-12-31', 'open')
ON CONFLICT (id) DO NOTHING;

-- 3. CLEAN UP (Drop the redundant table if user created it)
DROP TABLE IF EXISTS public.month_closings;
