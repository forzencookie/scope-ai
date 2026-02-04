-- ============================================================================
-- FIX: Profiles RLS Policy Recursion
-- ============================================================================
-- Date: 2026-02-04
--
-- Problem: The profiles table has RLS policies that query the profiles table
-- itself to check admin status, causing infinite recursion:
--
--   EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
--
-- Solution: Create a SECURITY DEFINER function to check admin status that
-- bypasses RLS, then use this function in the policies.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create a SECURITY DEFINER function to check admin status
-- This function bypasses RLS to avoid recursion
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ============================================================================
-- STEP 2: Drop ALL existing profiles policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
DROP POLICY IF EXISTS "profiles_all" ON profiles;

-- ============================================================================
-- STEP 3: Create new non-recursive policies using is_admin() function
-- ============================================================================

-- SELECT: Users can view own profile, admins can view all
CREATE POLICY profiles_select ON profiles
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR is_admin()
  );

-- UPDATE: Users can update own profile, admins can update all
CREATE POLICY profiles_update ON profiles
  FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR is_admin()
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR is_admin()
  );

-- INSERT: Users can only insert their own profile (during signup)
CREATE POLICY profiles_insert ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- DELETE: Only admins can delete profiles (and not their own)
CREATE POLICY profiles_delete ON profiles
  FOR DELETE TO authenticated
  USING (
    is_admin()
    AND id != (SELECT auth.uid())
  );

-- ============================================================================
-- STEP 4: Fix other policies that also query profiles for admin check
-- ============================================================================

-- Fix categories_admin_modify policy
DROP POLICY IF EXISTS "categories_admin_modify" ON categories;
DROP POLICY IF EXISTS "categories_admin_manage" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;

CREATE POLICY categories_admin_modify ON categories
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Fix securityauditlog_admin_select policy
DROP POLICY IF EXISTS "securityauditlog_admin_select" ON securityauditlog;
DROP POLICY IF EXISTS "Admins can view audit logs" ON securityauditlog;
DROP POLICY IF EXISTS "Admins can view securityauditlog" ON securityauditlog;

CREATE POLICY securityauditlog_admin_select ON securityauditlog
  FOR SELECT TO authenticated
  USING (is_admin());

-- ============================================================================
-- STEP 5: Add comment to document the function
-- ============================================================================

COMMENT ON FUNCTION is_admin() IS
  'Check if the current user is an admin. Uses SECURITY DEFINER to bypass RLS and avoid recursion when used in profiles table policies.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION COMPLETE: Fixed Profiles RLS Recursion';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  1. Created is_admin() SECURITY DEFINER function';
  RAISE NOTICE '  2. Replaced recursive profiles policies';
  RAISE NOTICE '  3. Fixed categories_admin_modify policy';
  RAISE NOTICE '  4. Fixed securityauditlog_admin_select policy';
  RAISE NOTICE '============================================';
END $$;
