-- ============================================================================
-- Activity Log / Audit Trail
-- ============================================================================
-- Tracks all significant actions in the system for accountability.
-- User B can see: "User A booked transaction X at 14:32"
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who did it
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,  -- Denormalized for display even if user is deleted
    user_email TEXT,
    
    -- What company context
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
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
    USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

-- Users can insert their own activity (system also inserts via service role)
CREATE POLICY "Users can log their own activity"
    ON activity_log FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_company ON activity_log(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- ============================================================================
-- Automatic activity logging via triggers
-- ============================================================================

-- Function to log activity automatically
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_action TEXT;
    v_entity_name TEXT;
    v_changes JSONB;
    v_user_id UUID;
    v_user_name TEXT;
    v_user_email TEXT;
    v_company_id UUID;
BEGIN
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
    ELSIF TG_OP = 'UPDATE' THEN
        -- Check for specific status changes
        IF TG_TABLE_NAME = 'transactions' AND NEW.status != OLD.status THEN
            IF NEW.status = 'bokförd' THEN
                v_action := 'booked';
            ELSE
                v_action := 'updated';
            END IF;
        ELSIF TG_TABLE_NAME IN ('customerinvoices', 'supplierinvoices') THEN
            IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
                v_action := 'paid';
            ELSIF NEW.status = 'sent' AND OLD.status != 'sent' THEN
                v_action := 'sent';
            ELSE
                v_action := 'updated';
            END IF;
        ELSE
            v_action := 'updated';
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted';
    END IF;

    -- Get user info
    v_user_id := COALESCE(
        NEW.updated_by,
        NEW.created_by,
        NEW.user_id,
        auth.uid()
    );
    
    -- Get user details
    SELECT email, raw_user_meta_data->>'full_name'
    INTO v_user_email, v_user_name
    FROM auth.users
    WHERE id = v_user_id;

    -- Get company_id
    v_company_id := COALESCE(NEW.company_id, OLD.company_id);

    -- Build entity name based on table
    CASE TG_TABLE_NAME
        WHEN 'transactions' THEN
            v_entity_name := COALESCE(NEW.description, OLD.description, 'Transaktion');
        WHEN 'customerinvoices' THEN
            v_entity_name := 'Kundfaktura #' || COALESCE(NEW.invoice_number, OLD.invoice_number, '?');
        WHEN 'supplierinvoices' THEN
            v_entity_name := 'Leverantörsfaktura #' || COALESCE(NEW.invoice_number, OLD.invoice_number, '?');
        WHEN 'receipts' THEN
            v_entity_name := 'Kvitto ' || COALESCE(TO_CHAR(NEW.total_amount, '999 999 kr'), '');
        WHEN 'payslips' THEN
            v_entity_name := 'Lönebesked';
        WHEN 'verifications' THEN
            v_entity_name := 'Verifikation #' || COALESCE(NEW.number::TEXT, OLD.number::TEXT, '?');
        ELSE
            v_entity_name := TG_TABLE_NAME;
    END CASE;

    -- Build changes object for updates
    IF TG_OP = 'UPDATE' THEN
        v_changes := jsonb_build_object(
            'status', CASE WHEN NEW.status IS DISTINCT FROM OLD.status 
                THEN jsonb_build_object('from', OLD.status, 'to', NEW.status) 
                ELSE NULL END
        );
        -- Remove null values
        v_changes := (SELECT jsonb_object_agg(key, value) FROM jsonb_each(v_changes) WHERE value IS NOT NULL);
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
        v_company_id,
        v_action,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        v_entity_name,
        v_changes
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply triggers to key tables
DROP TRIGGER IF EXISTS trg_transactions_activity ON transactions;
CREATE TRIGGER trg_transactions_activity
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS trg_customerinvoices_activity ON customerinvoices;
CREATE TRIGGER trg_customerinvoices_activity
    AFTER INSERT OR UPDATE OR DELETE ON customerinvoices
    FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS trg_supplierinvoices_activity ON supplierinvoices;
CREATE TRIGGER trg_supplierinvoices_activity
    AFTER INSERT OR UPDATE OR DELETE ON supplierinvoices
    FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS trg_receipts_activity ON receipts;
CREATE TRIGGER trg_receipts_activity
    AFTER INSERT OR UPDATE OR DELETE ON receipts
    FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS trg_verifications_activity ON verifications;
CREATE TRIGGER trg_verifications_activity
    AFTER INSERT OR UPDATE OR DELETE ON verifications
    FOR EACH ROW EXECUTE FUNCTION log_activity();

COMMENT ON TABLE activity_log IS 'Audit trail tracking all significant actions for accountability and history';
