-- Migration to fix schema mismatches for mock data
-- Adds missing columns to transactions, receipts, and supplier_invoices

-- 1. TRANSACTIONS
-- Missing: account, amount_value, company_id, possibly created_by (though might be there)
DO $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'account') THEN
        ALTER TABLE public.transactions ADD COLUMN account TEXT;
    END IF;

    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'amount_value') THEN
        ALTER TABLE public.transactions ADD COLUMN amount_value DECIMAL(12,2);
    END IF;

    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'company_id') THEN
        -- Assuming company_id is TEXT based on current finding, referencing companies(id) if possible
        -- But companies table might have UUID too. Let's make it TEXT to be safe or UUID if we know companies is UUID.
        -- In seed script we used '000...1'. If companies.id is TEXT, we use TEXT. 
        ALTER TABLE public.transactions ADD COLUMN company_id TEXT;
    END IF;
    
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'created_by') THEN
        ALTER TABLE public.transactions ADD COLUMN created_by TEXT;
    END IF;
END $$;

-- 2. RECEIPTS
-- Missing: amount (wait, seriously? Receipts usually have amount. Maybe it was total_amount?)
-- Error said 'amount' missing.
DO $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'amount') THEN
        ALTER TABLE public.receipts ADD COLUMN amount DECIMAL(12,2);
    END IF;
    
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'total_amount') THEN
        -- Add total_amount too as fallback
        ALTER TABLE public.receipts ADD COLUMN total_amount DECIMAL(12,2);
    END IF;
END $$;

-- 3. SUPPLIER_INVOICES
-- Missing: company_id, user_id (maybe)
DO $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'supplier_invoices' AND column_name = 'company_id') THEN
        ALTER TABLE public.supplier_invoices ADD COLUMN company_id TEXT;
    END IF;

    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'supplier_invoices' AND column_name = 'user_id') THEN
        ALTER TABLE public.supplier_invoices ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;
