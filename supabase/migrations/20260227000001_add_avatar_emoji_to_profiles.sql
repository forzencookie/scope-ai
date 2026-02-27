-- ============================================================================
-- Add avatar_emoji to profiles table
-- Allows users to persist their chosen emoji avatar
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT '👤';
