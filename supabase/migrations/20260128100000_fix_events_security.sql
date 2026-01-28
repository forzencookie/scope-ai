-- Migration: Add user_id to events table and fix RLS security
-- This fixes the critical security issue where all users could see all events

-- Add user_id column
ALTER TABLE events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);

-- Drop the permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON events;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON events;

-- Create proper user-scoped RLS policies
CREATE POLICY "events_select_own" ON events
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "events_insert_own" ON events
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events_update_own" ON events
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events_delete_own" ON events
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Add comment explaining the security model
COMMENT ON COLUMN events.user_id IS 'Owner of this event - required for RLS security';
