-- Migration: Drop pending_bookings table and related RPC
-- Reason: Booking confirmation now happens in the chat UI (Scooby preview cards).
-- Verifications are created directly when the user confirms — no intermediate staging table.

-- Drop the RPC function that atomically updated pending_booking + source status
DROP FUNCTION IF EXISTS book_pending_item_status(UUID, TEXT, JSONB, TEXT, TEXT);

-- Drop RLS policies
DROP POLICY IF EXISTS "pending_bookings_select" ON pending_bookings;
DROP POLICY IF EXISTS "pending_bookings_insert" ON pending_bookings;
DROP POLICY IF EXISTS "pending_bookings_update" ON pending_bookings;
DROP POLICY IF EXISTS "pending_bookings_delete" ON pending_bookings;

-- Drop the table (cascades indexes and triggers)
DROP TABLE IF EXISTS pending_bookings;
