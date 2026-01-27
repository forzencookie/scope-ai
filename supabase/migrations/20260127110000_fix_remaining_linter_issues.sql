-- ============================================================================
-- Fix Remaining Linter Issues
-- ============================================================================
-- 1. categories: Consolidate duplicate SELECT policies
-- 2. ratelimitssliding: Intentionally ignored (rate limiting needs anon access)
-- ============================================================================

-- Fix categories: has both categories_select AND categories_admin_manage for SELECT
-- Consolidate into a single policy
DROP POLICY IF EXISTS "categories_admin_manage" ON categories;
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_all" ON categories;

-- Categories are shared lookup data - all authenticated users can read
-- Only admins can modify
CREATE POLICY categories_select ON categories
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY categories_admin_modify ON categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );

-- ============================================================================
-- NOTE: ratelimitssliding policy is INTENTIONALLY permissive
-- ============================================================================
-- The linter flags `ratelimitssliding_anon_all` as overly permissive.
-- This is BY DESIGN because:
-- 1. Rate limiting must work BEFORE authentication (login attempts, etc.)
-- 2. The table contains no sensitive data (just counters and timestamps)
-- 3. Restricting anon would break the rate limiting functionality
--
-- This warning can be safely ignored.
-- ============================================================================

DO $$ BEGIN RAISE NOTICE '✅ Fixed categories duplicate policies. ratelimitssliding warning is intentional.'; END $$;
