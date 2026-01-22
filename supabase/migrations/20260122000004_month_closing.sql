-- ============================================
-- Month Closing Module
-- Stores the state of accounting periods (reconciliation checklist)
-- ============================================

CREATE TABLE IF NOT EXISTS public.month_closings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL, -- references companies(id)
    year INTEGER NOT NULL,
    month INTEGER NOT NULL, -- 1-12
    status TEXT DEFAULT 'open', -- 'open', 'locked'
    checks JSONB DEFAULT '{}'::jsonb, -- Store checklist state
    locked_at TIMESTAMPTZ,
    locked_by UUID, -- references auth.users(id)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, year, month)
);

-- RLS
ALTER TABLE public.month_closings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see closings for their company
-- Note: Simplified for the demo as we don't have a strict company-user join table yet, 
-- but following the pattern in financial_periods.
CREATE POLICY "Users can view own month closings" ON public.month_closings 
    FOR SELECT USING (true); -- Usually restricted, but keeping it open for development

CREATE POLICY "Users can update own month closings" ON public.month_closings 
    FOR UPDATE USING (true);

CREATE POLICY "Users can insert own month closings" ON public.month_closings 
    FOR INSERT WITH CHECK (true);

-- Grants
GRANT ALL ON public.month_closings TO authenticated, service_role;
