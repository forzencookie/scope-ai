-- =============================================================================
-- Migration: Add Onboarding Status to Profiles
-- Description: Track onboarding completion status per user in the database
-- Date: 2026-01-27
-- =============================================================================

-- Add onboarding columns to profiles table
ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE;

-- Add index for quick lookup of users who haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding 
    ON profiles(id) 
    WHERE onboarding_completed_at IS NULL AND onboarding_skipped = FALSE;

-- Comment for documentation
COMMENT ON COLUMN profiles.onboarding_completed_at IS 'Timestamp when user completed the onboarding wizard';
COMMENT ON COLUMN profiles.onboarding_skipped IS 'Whether user chose to permanently skip onboarding';
