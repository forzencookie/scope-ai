-- Migration: Drop activity_log table and related trigger
-- Reason: Merged into events table which has hash chain integrity,
-- typed sources/categories, and a unified timeline. The events table
-- is the single audit trail for the app.

-- Drop the transaction activity trigger first (correct trigger name)
DROP TRIGGER IF EXISTS transactions_activity_log ON transactions;

-- Now drop the trigger function
DROP FUNCTION IF EXISTS log_transaction_activity();

-- Drop RLS policies
DROP POLICY IF EXISTS "activity_log_select" ON activity_log;
DROP POLICY IF EXISTS "activity_log_insert" ON activity_log;
DROP POLICY IF EXISTS "activity_log_update" ON activity_log;
DROP POLICY IF EXISTS "activity_log_delete" ON activity_log;

-- Drop the table (cascades indexes)
DROP TABLE IF EXISTS activity_log;
