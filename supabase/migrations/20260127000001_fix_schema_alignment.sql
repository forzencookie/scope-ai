-- Migration: Fix schema alignment with application code
-- Date: 2026-01-27
-- Description: Add missing columns and tables that the application code expects

-- ============================================================================
-- 1. SUPPLIERINVOICES - Add missing columns for Swedish invoice requirements
-- ============================================================================

-- Add invoice_number column (Fakturanummer - legally required)
ALTER TABLE supplierinvoices 
  ADD COLUMN IF NOT EXISTS invoice_number text;

-- Add issue_date column (Fakturadatum - required for bokföring)
ALTER TABLE supplierinvoices 
  ADD COLUMN IF NOT EXISTS issue_date date;

-- Add vat_amount column (Momsbelopp - required for momsredovisning)
ALTER TABLE supplierinvoices 
  ADD COLUMN IF NOT EXISTS vat_amount numeric;

-- Add total_amount column (code uses total_amount, table has amount)
ALTER TABLE supplierinvoices 
  ADD COLUMN IF NOT EXISTS total_amount numeric;

-- Migrate existing amount data to total_amount if needed
UPDATE supplierinvoices 
  SET total_amount = amount 
  WHERE total_amount IS NULL AND amount IS NOT NULL;

-- Add category column
ALTER TABLE supplierinvoices
  ADD COLUMN IF NOT EXISTS category text;

-- Add document_url column for PDF storage
ALTER TABLE supplierinvoices
  ADD COLUMN IF NOT EXISTS document_url text;

-- ============================================================================
-- 2. VERIFICATIONS - Add missing rows column for journal entries
-- ============================================================================

ALTER TABLE verifications 
  ADD COLUMN IF NOT EXISTS rows jsonb;

-- ============================================================================
-- 3. TRANSACTIONS - Add missing metadata column
-- ============================================================================

ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- ============================================================================
-- 4. NOTIFICATIONS - Add read column
-- ============================================================================

ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;

-- ============================================================================
-- 5. TAX_REPORTS - Create if not exists (for VAT reporting)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tax_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id text REFERENCES companies(id) ON DELETE CASCADE,
  report_type text NOT NULL, -- 'vat', 'income', 'k10', 'fiscal'
  period text,
  year integer,
  start_date date,
  end_date date,
  due_date date,
  status text DEFAULT 'upcoming', -- 'upcoming', 'pending', 'submitted'
  output_vat numeric DEFAULT 0,
  input_vat numeric DEFAULT 0,
  net_vat numeric DEFAULT 0,
  data jsonb,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tax_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tax_reports' AND policyname = 'Users can view own tax reports'
  ) THEN
    CREATE POLICY "Users can view own tax reports" ON tax_reports
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tax_reports' AND policyname = 'Users can manage own tax reports'
  ) THEN
    CREATE POLICY "Users can manage own tax reports" ON tax_reports
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- 6. USERCREDITS - Create table for AI credit tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS usercredits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  credits_remaining integer DEFAULT 100,
  lifetime_credits_purchased integer DEFAULT 0,
  last_refill_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE usercredits ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'usercredits' AND policyname = 'Users can view own credits'
  ) THEN
    CREATE POLICY "Users can view own credits" ON usercredits
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- 7. PERIODISERINGSFONDER - Swedish tax deferral table
-- ============================================================================

CREATE TABLE IF NOT EXISTS periodiseringsfonder (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id text REFERENCES companies(id) ON DELETE CASCADE,
  year integer NOT NULL,
  amount numeric NOT NULL,
  utilized_amount numeric DEFAULT 0,
  remaining_amount numeric,
  expires_at date,
  status text DEFAULT 'active', -- 'active', 'utilized', 'expired'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE periodiseringsfonder ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'periodiseringsfonder' AND policyname = 'Users can manage own periodiseringsfonder'
  ) THEN
    CREATE POLICY "Users can manage own periodiseringsfonder" ON periodiseringsfonder
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- 8. VATDECLARATIONS - VAT declaration tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS vatdeclarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id text REFERENCES companies(id) ON DELETE CASCADE,
  period text NOT NULL,
  period_type text DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly'
  year integer NOT NULL,
  start_date date,
  end_date date,
  due_date date,
  output_vat numeric DEFAULT 0,
  input_vat numeric DEFAULT 0,
  net_vat numeric DEFAULT 0,
  status text DEFAULT 'upcoming', -- 'upcoming', 'pending', 'submitted'
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vatdeclarations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vatdeclarations' AND policyname = 'Users can manage own vatdeclarations'
  ) THEN
    CREATE POLICY "Users can manage own vatdeclarations" ON vatdeclarations
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- 9. DATABASE FUNCTIONS - Add missing RPC functions
-- ============================================================================

-- Function to get user credits
CREATE OR REPLACE FUNCTION get_user_credits(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits integer;
BEGIN
  SELECT credits_remaining INTO v_credits
  FROM usercredits
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_credits, 0);
END;
$$;

-- Function to consume user credits
CREATE OR REPLACE FUNCTION consume_user_credits(p_user_id uuid, p_amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current integer;
BEGIN
  SELECT credits_remaining INTO v_current
  FROM usercredits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_current IS NULL THEN
    -- Create credits row if it doesn't exist
    INSERT INTO usercredits (user_id, credits_remaining)
    VALUES (p_user_id, 100 - p_amount);
    RETURN true;
  END IF;
  
  IF v_current < p_amount THEN
    RETURN false;
  END IF;
  
  UPDATE usercredits
  SET credits_remaining = credits_remaining - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$;

-- Function to add user credits
CREATE OR REPLACE FUNCTION add_user_credits(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  INSERT INTO usercredits (user_id, credits_remaining, lifetime_credits_purchased)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET credits_remaining = usercredits.credits_remaining + p_amount,
      lifetime_credits_purchased = usercredits.lifetime_credits_purchased + p_amount,
      updated_at = now()
  RETURNING credits_remaining INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$;

-- ============================================================================
-- 10. FORMANER (BENEFITS) - Skipped - table formaner_catalog doesn't exist
-- ============================================================================

-- ============================================================================
-- 11. ACTIVITY_LOG improvements
-- ============================================================================

-- Ensure all required columns exist
ALTER TABLE activity_log
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_name text,
  ADD COLUMN IF NOT EXISTS user_email text;

-- ============================================================================
-- 12. Grant necessary permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
