-- ============================================
-- Phase 6: Real Payroll
-- Adds support for employees and payslips
-- ============================================

-- 1. Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT,
    monthly_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(4, 2) NOT NULL DEFAULT 0.24, -- e.g. 0.24 for 24%
    start_date DATE,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
    user_id UUID REFERENCES auth.users(id),
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix: Create missing benefits tables referenced later
CREATE TABLE IF NOT EXISTS public.benefits (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    type TEXT,
    taxable_amount DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    company_id UUID
);

CREATE TABLE IF NOT EXISTS public.employee_benefits (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id UUID REFERENCES public.employees(id),
    benefit_id TEXT REFERENCES public.benefits(id),
    user_id UUID REFERENCES auth.users(id),
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create payslips table
CREATE TABLE IF NOT EXISTS public.payslips (
    id TEXT PRIMARY KEY, -- e.g. 'LB-202412-001'
    employee_id UUID REFERENCES public.employees(id),
    period TEXT NOT NULL, -- e.g. 'December 2024'
    gross_salary DECIMAL(12, 2) NOT NULL,
    tax_deduction DECIMAL(12, 2) NOT NULL,
    net_salary DECIMAL(12, 2) NOT NULL,
    bonuses DECIMAL(12, 2) DEFAULT 0,
    deductions DECIMAL(12, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'pending', 'sent'
    payment_date DATE,
    user_id UUID REFERENCES auth.users(id),
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Seed initial employees for testing
INSERT INTO public.employees (name, role, monthly_salary, tax_rate, start_date)
VALUES 
    ('Anna Andersson', 'VD', 45000, 0.24, '2020-01-15'),
    ('Erik Eriksson', 'Utvecklare', 40000, 0.24, '2021-03-01')
ON CONFLICT DO NOTHING;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON public.payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_user_id ON public.payslips(user_id);

-- 5. RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own employees" ON public.employees FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage own employees" ON public.employees FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own payslips" ON public.payslips FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage own payslips" ON public.payslips FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- 6. Grants
GRANT ALL ON public.employees TO authenticated, anon, service_role;
GRANT ALL ON public.payslips TO authenticated, anon, service_role;
