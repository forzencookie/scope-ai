-- ============================================================================
-- FIX REMAINING SECURITY GAPS
-- ============================================================================
-- Generated: 2026-01-26
-- 
-- This migration fixes:
-- 1. CRITICAL: corporate_documents has FOR ALL USING (true) - completely public!
-- 2. MEDIUM: Ensure roadmap_steps policies use optimized pattern
-- 3. Add any missing user_id columns and policies
-- ============================================================================

-- ============================================================================
-- SECTION 1: FIX corporate_documents (CRITICAL)
-- ============================================================================

-- First, check if table exists and has user_id column
DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'corporate_documents' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE corporate_documents ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added user_id column to corporate_documents';
  END IF;
END $$;

-- Drop the insecure public policy
DROP POLICY IF EXISTS "Allow all access to corporate_documents" ON corporate_documents;
DROP POLICY IF EXISTS "corporate_documents_policy" ON corporate_documents;
DROP POLICY IF EXISTS "corporate_documents_select" ON corporate_documents;
DROP POLICY IF EXISTS "corporate_documents_insert" ON corporate_documents;
DROP POLICY IF EXISTS "corporate_documents_update" ON corporate_documents;
DROP POLICY IF EXISTS "corporate_documents_delete" ON corporate_documents;

-- Create proper user-scoped policies
CREATE POLICY corporate_documents_select ON corporate_documents 
  FOR SELECT TO authenticated 
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY corporate_documents_insert ON corporate_documents 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY corporate_documents_update ON corporate_documents 
  FOR UPDATE TO authenticated 
  USING (user_id = (SELECT auth.uid())) 
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY corporate_documents_delete ON corporate_documents 
  FOR DELETE TO authenticated 
  USING (user_id = (SELECT auth.uid()));

-- Ensure RLS is enabled
ALTER TABLE corporate_documents ENABLE ROW LEVEL SECURITY;

-- Revoke public/anon access
REVOKE ALL ON corporate_documents FROM anon;
REVOKE ALL ON corporate_documents FROM public;
GRANT ALL ON corporate_documents TO authenticated;
GRANT ALL ON corporate_documents TO service_role;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_corporate_documents_user_id 
  ON corporate_documents(user_id);

RAISE NOTICE '✅ Fixed corporate_documents - removed public access, added user-scoped policies';

-- ============================================================================
-- SECTION 2: FIX roadmap_steps (Uses parent join - optimize)
-- ============================================================================

-- roadmap_steps uses parent join which is fine, but let's ensure it's optimized
-- and add a direct user_id for better performance

DO $$
BEGIN
  -- Add user_id column if it doesn't exist (denormalization for performance)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'roadmap_steps' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE roadmap_steps ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Backfill user_id from parent roadmaps table
    UPDATE roadmap_steps rs
    SET user_id = r.user_id
    FROM roadmaps r
    WHERE rs.roadmap_id = r.id;
    
    RAISE NOTICE 'Added and backfilled user_id column on roadmap_steps';
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their roadmap steps" ON roadmap_steps;
DROP POLICY IF EXISTS "Users can insert their roadmap steps" ON roadmap_steps;
DROP POLICY IF EXISTS "Users can update their roadmap steps" ON roadmap_steps;
DROP POLICY IF EXISTS "Users can delete their roadmap steps" ON roadmap_steps;
DROP POLICY IF EXISTS "roadmap_steps_select" ON roadmap_steps;
DROP POLICY IF EXISTS "roadmap_steps_insert" ON roadmap_steps;
DROP POLICY IF EXISTS "roadmap_steps_update" ON roadmap_steps;
DROP POLICY IF EXISTS "roadmap_steps_delete" ON roadmap_steps;

-- Create optimized policies using direct user_id (faster than join)
CREATE POLICY roadmap_steps_select ON roadmap_steps 
  FOR SELECT TO authenticated 
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY roadmap_steps_insert ON roadmap_steps 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY roadmap_steps_update ON roadmap_steps 
  FOR UPDATE TO authenticated 
  USING (user_id = (SELECT auth.uid())) 
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY roadmap_steps_delete ON roadmap_steps 
  FOR DELETE TO authenticated 
  USING (user_id = (SELECT auth.uid()));

-- Create index
CREATE INDEX IF NOT EXISTS idx_roadmap_steps_user_id 
  ON roadmap_steps(user_id);

RAISE NOTICE '✅ Fixed roadmap_steps - added direct user_id for performance';

-- ============================================================================
-- SECTION 3: ENSURE roadmaps table is properly secured
-- ============================================================================

-- Drop and recreate roadmaps policies for consistency
DROP POLICY IF EXISTS "Users can view their roadmaps" ON roadmaps;
DROP POLICY IF EXISTS "Users can insert their roadmaps" ON roadmaps;
DROP POLICY IF EXISTS "Users can update their roadmaps" ON roadmaps;
DROP POLICY IF EXISTS "Users can delete their roadmaps" ON roadmaps;
DROP POLICY IF EXISTS "roadmaps_select" ON roadmaps;
DROP POLICY IF EXISTS "roadmaps_insert" ON roadmaps;
DROP POLICY IF EXISTS "roadmaps_update" ON roadmaps;
DROP POLICY IF EXISTS "roadmaps_delete" ON roadmaps;

CREATE POLICY roadmaps_select ON roadmaps 
  FOR SELECT TO authenticated 
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY roadmaps_insert ON roadmaps 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY roadmaps_update ON roadmaps 
  FOR UPDATE TO authenticated 
  USING (user_id = (SELECT auth.uid())) 
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY roadmaps_delete ON roadmaps 
  FOR DELETE TO authenticated 
  USING (user_id = (SELECT auth.uid()));

ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

RAISE NOTICE '✅ Updated roadmaps policies to use optimized pattern';

-- ============================================================================
-- SECTION 4: CHECK FOR ANY OTHER TABLES WITH public access policies
-- ============================================================================

-- Log any remaining tables with potentially insecure policies
DO $$
DECLARE
  policy_record RECORD;
  count_insecure INTEGER := 0;
BEGIN
  FOR policy_record IN 
    SELECT tablename, policyname, qual::text as condition
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND (qual::text = 'true' OR qual::text LIKE '%true%')
    AND tablename NOT IN (
      'categories',           -- Intentional: global BAS codes
      'ratelimits',           -- Intentional: rate limiting
      'ratelimitssliding'     -- Intentional: rate limiting
    )
  LOOP
    RAISE WARNING '⚠️ Potentially insecure policy: % on % with condition: %', 
      policy_record.policyname, policy_record.tablename, policy_record.condition;
    count_insecure := count_insecure + 1;
  END LOOP;
  
  IF count_insecure = 0 THEN
    RAISE NOTICE '✅ No remaining insecure policies found';
  ELSE
    RAISE WARNING '⚠️ Found % potentially insecure policies - review above', count_insecure;
  END IF;
END $$;

-- ============================================================================
-- SECTION 5: ADD TRIGGER TO AUTO-POPULATE user_id on roadmap_steps
-- ============================================================================

-- Create trigger function to auto-populate user_id from parent
CREATE OR REPLACE FUNCTION set_roadmap_step_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user_id not provided, get it from parent roadmap
  IF NEW.user_id IS NULL AND NEW.roadmap_id IS NOT NULL THEN
    SELECT user_id INTO NEW.user_id
    FROM roadmaps
    WHERE id = NEW.roadmap_id;
  END IF;
  
  -- Fallback to current user
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS set_roadmap_step_user_id_trigger ON roadmap_steps;
CREATE TRIGGER set_roadmap_step_user_id_trigger
  BEFORE INSERT ON roadmap_steps
  FOR EACH ROW
  EXECUTE FUNCTION set_roadmap_step_user_id();

RAISE NOTICE '✅ Created trigger to auto-populate user_id on roadmap_steps';

-- ============================================================================
-- SECTION 6: VERIFY ALL CRITICAL TABLES HAVE PROPER SECURITY
-- ============================================================================

DO $$
DECLARE
  t TEXT;
  critical_tables TEXT[] := ARRAY[
    'transactions', 'receipts', 'customerinvoices', 'supplierinvoices',
    'employees', 'payslips', 'shareholders', 'dividends', 'boardminutes',
    'taxreports', 'vatdeclarations', 'k10declarations', 'companies',
    'verifications', 'corporate_documents', 'bankconnections'
  ];
  policy_count INTEGER;
  has_user_id BOOLEAN;
BEGIN
  FOREACH t IN ARRAY critical_tables LOOP
    -- Check policy count
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = t AND schemaname = 'public';
    
    -- Check user_id column
    SELECT EXISTS(
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = t AND column_name = 'user_id'
    ) INTO has_user_id;
    
    IF policy_count < 4 THEN
      RAISE WARNING '⚠️ Table % has only % policies (expected 4)', t, policy_count;
    END IF;
    
    IF NOT has_user_id THEN
      RAISE WARNING '⚠️ Table % is missing user_id column', t;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 7: UPDATE verify_security_setup FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS verify_security_setup();

CREATE OR REPLACE FUNCTION verify_security_setup()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count BIGINT,
  has_user_id BOOLEAN,
  has_insecure_policy BOOLEAN,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.relname::TEXT,
    t.relrowsecurity,
    (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.relname)::BIGINT,
    EXISTS(
      SELECT 1 FROM information_schema.columns c 
      WHERE c.table_name = t.relname AND c.column_name = 'user_id'
    ),
    EXISTS(
      SELECT 1 FROM pg_policies p 
      WHERE p.tablename = t.relname 
      AND p.qual::text = 'true'
      AND t.relname NOT IN ('categories', 'ratelimits', 'ratelimitssliding')
    ),
    CASE 
      WHEN NOT t.relrowsecurity THEN '❌ RLS DISABLED'
      WHEN (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.relname) = 0 THEN '❌ NO POLICIES'
      WHEN EXISTS(
        SELECT 1 FROM pg_policies p 
        WHERE p.tablename = t.relname 
        AND p.qual::text = 'true'
        AND t.relname NOT IN ('categories', 'ratelimits', 'ratelimitssliding')
      ) THEN '⚠️ INSECURE POLICY'
      ELSE '✅ OK'
    END
  FROM pg_class t
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public' AND t.relkind = 'r'
  ORDER BY 
    CASE 
      WHEN NOT t.relrowsecurity THEN 0
      WHEN (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.relname) = 0 THEN 1
      ELSE 2
    END,
    t.relname;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_security_setup TO authenticated;

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Security gaps migration completed!';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Fixed:';
  RAISE NOTICE '  1. ✅ corporate_documents - removed public access';
  RAISE NOTICE '  2. ✅ roadmap_steps - added direct user_id';
  RAISE NOTICE '  3. ✅ roadmaps - updated to optimized policy pattern';
  RAISE NOTICE '  4. ✅ Added auto-populate trigger for roadmap_steps';
  RAISE NOTICE '  5. ✅ Updated verify_security_setup() function';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Run: SELECT * FROM verify_security_setup() WHERE status != ''✅ OK''';
  RAISE NOTICE '============================================================';
END $$;
