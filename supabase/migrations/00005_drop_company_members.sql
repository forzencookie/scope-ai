-- Migration: Drop company_members table
-- Reason: Confusing overlap with domain tables (shareholders, partners, members, employees).
-- company_members was meant for multi-user company access (enterprise feature, not MVP).
-- Auth now queries companies.user_id directly instead of company_members.

-- Drop RLS policies first
DROP POLICY IF EXISTS "company_members_select" ON company_members;
DROP POLICY IF EXISTS "company_members_insert" ON company_members;
DROP POLICY IF EXISTS "company_members_update" ON company_members;
DROP POLICY IF EXISTS "company_members_delete" ON company_members;

-- Drop the table (cascades indexes and triggers)
DROP TABLE IF EXISTS company_members;
