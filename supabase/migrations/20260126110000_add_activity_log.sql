-- ============================================================================
-- Activity Log / Audit Trail
-- ============================================================================
-- Tracks all significant actions in the system for accountability.
-- User B can see: "User A booked transaction X at 14:32"
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who did it
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,  -- Denormalized for display even if user is deleted
    user_email TEXT,
    
    -- What company context
    company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
    
    -- What happened
    action TEXT NOT NULL,  -- 'created', 'updated', 'deleted', 'booked', 'sent', 'approved'
    entity_type TEXT NOT NULL,  -- 'transaction', 'invoice', 'receipt', 'payslip'
    entity_id UUID,  -- ID of the affected record
    entity_name TEXT,  -- Human-readable name: "Faktura #1234" or "Transaktion: Inköp från Clas Ohlson"
    
    -- Details of what changed
    changes JSONB,  -- { "status": { "from": "draft", "to": "booked" }, "amount": { "from": 100, "to": 150 } }
    metadata JSONB,  -- Additional context like IP, user agent, etc.
    
    -- When
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Indexes for common queries
    CONSTRAINT activity_log_action_check CHECK (action IN (
        'created', 'updated', 'deleted', 'booked', 'sent', 'approved', 
        'rejected', 'paid', 'archived', 'restored', 'exported', 'imported',
        'invited', 'removed', 'login', 'logout'
    ))
);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view activity for their company
CREATE POLICY "Users can view company activity"
    ON activity_log FOR SELECT
    TO authenticated
    USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = (SELECT auth.uid())
        )
        OR user_id = (SELECT auth.uid())
    );

-- Users can insert their own activity (system also inserts via service role)
CREATE POLICY "Users can log their own activity"
    ON activity_log FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_company ON activity_log(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- ============================================================================
-- Automatic activity logging via triggers
-- ============================================================================

-- Function to log activity automatically
-- NOTE: This is a simplified version that works with transactions table specifically.
-- For other tables, activity should be logged via application code.
CREATE OR REPLACE FUNCTION log_transaction_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_action TEXT;
    v_entity_name TEXT;
    v_changes JSONB;
    v_user_id UUID;
    v_user_name TEXT;
    v_user_email TEXT;
BEGIN
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'bokförd' AND OLD.status != 'bokförd' THEN
            v_action := 'booked';
        ELSE
            v_action := 'updated';
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted';
    END IF;

    -- Get user info
    v_user_id := COALESCE(NEW.user_id, OLD.user_id, auth.uid());
    
    -- Get user details
    SELECT email, raw_user_meta_data->>'full_name'
    INTO v_user_email, v_user_name
    FROM auth.users
    WHERE id = v_user_id;

    -- Build entity name
    v_entity_name := COALESCE(NEW.description, OLD.description, 'Transaktion');

    -- Build changes object for updates
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        v_changes := jsonb_build_object(
            'status', jsonb_build_object('from', OLD.status, 'to', NEW.status)
        );
    END IF;

    -- Insert activity log
    INSERT INTO activity_log (
        user_id,
        user_name,
        user_email,
        company_id,
        action,
        entity_type,
        entity_id,
        entity_name,
        changes
    ) VALUES (
        v_user_id,
        v_user_name,
        v_user_email,
        COALESCE(NEW.company_id, OLD.company_id),
        v_action,
        'transaction',
        COALESCE(NEW.id, OLD.id),
        v_entity_name,
        v_changes
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply trigger only to transactions (safest, most valuable)
DROP TRIGGER IF EXISTS trg_transactions_activity ON transactions;
CREATE TRIGGER trg_transactions_activity
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION log_transaction_activity();

COMMENT ON TABLE activity_log IS 'Audit trail tracking all significant actions for accountability and history';
