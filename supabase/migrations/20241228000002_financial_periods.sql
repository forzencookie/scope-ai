-- ============================================
-- Phase 5: Real Reports (Skatt)
-- Adds support for financial periods and VAT storage
-- ============================================

-- 1. Create financial periods table
CREATE TABLE IF NOT EXISTS public.financial_periods (
    id TEXT PRIMARY KEY, -- e.g. '2024-Q1'
    name TEXT NOT NULL,  -- e.g. 'Q1 2024'
    type TEXT DEFAULT 'quarterly', -- 'monthly', 'quarterly', 'yearly'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'open', -- 'open', 'closed', 'submitted'
    user_id UUID REFERENCES auth.users(id),
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure tax_reports table exists first (Fix for broken migration chain)
CREATE TABLE IF NOT EXISTS public.tax_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    data JSONB DEFAULT '{}'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure tax_reports has period_id for linkage
ALTER TABLE public.tax_reports ADD COLUMN IF NOT EXISTS period_id TEXT REFERENCES public.financial_periods(id);

-- 4. Seed initial periods for 2024 (Quarterly)
INSERT INTO public.financial_periods (id, name, type, start_date, end_date, status)
VALUES 
    ('2024-Q1', 'Q1 2024', 'quarterly', '2024-01-01', '2024-03-31', 'submitted'),
    ('2024-Q2', 'Q2 2024', 'quarterly', '2024-04-01', '2024-06-30', 'submitted'),
    ('2024-Q3', 'Q3 2024', 'quarterly', '2024-07-01', '2024-09-30', 'submitted'),
    ('2024-Q4', 'Q4 2024', 'quarterly', '2024-10-01', '2024-12-31', 'open')
ON CONFLICT (id) DO NOTHING;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_financial_periods_user_id ON public.financial_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_reports_period_id ON public.tax_reports(period_id);

-- 5. RLS
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own periods" ON public.financial_periods FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own periods" ON public.financial_periods FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- 6. Grants
GRANT ALL ON public.financial_periods TO authenticated, anon, service_role;
