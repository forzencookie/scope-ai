-- ============================================
-- Phase 3: Audit & Invoices
-- Adds support for AI auditability and new document types
-- ============================================

-- 1. Ensure transactions metadata columns exist
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS created_by TEXT;
-- source already exists in 20241212000002

-- 2. Create receipts table if it doesn't exist (it was missing from migrations)
CREATE TABLE IF NOT EXISTS public.receipts (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    supplier TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    category TEXT,
    status TEXT DEFAULT 'pending',
    source TEXT DEFAULT 'manual',
    created_by TEXT,
    image_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id),
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT,
    customer_name TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    vat_amount DECIMAL(12, 2),
    total_amount DECIMAL(12, 2),
    issue_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    source TEXT DEFAULT 'manual',
    created_by TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id),
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create AI Audit Log table
CREATE TABLE IF NOT EXISTS public.ai_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_name TEXT NOT NULL,
    parameters JSONB NOT NULL,
    result JSONB,
    status TEXT NOT NULL, -- 'success', 'error', 'pending'
    user_id UUID REFERENCES auth.users(id),
    execution_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_tool_name ON public.ai_audit_log(tool_name);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_created_at ON public.ai_audit_log(created_at DESC);

-- 6. RLS Policies (Simple version for MVP)
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own receipts" ON public.receipts FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own receipts" ON public.receipts FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own receipts" ON public.receipts FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own audit logs" ON public.ai_audit_log FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- 7. Grant permissions
GRANT ALL ON public.receipts TO authenticated, anon, service_role;
GRANT ALL ON public.invoices TO authenticated, anon, service_role;
GRANT ALL ON public.ai_audit_log TO authenticated, anon, service_role;
