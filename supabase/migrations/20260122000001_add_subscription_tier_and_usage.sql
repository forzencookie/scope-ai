-- ============================================================================
-- Add Subscription Tier and Usage Tracking
-- ============================================================================

-- Add subscription tier to profiles table
-- This controls which AI models users can access
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' 
CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));

-- Create index for efficient tier lookups
CREATE INDEX IF NOT EXISTS profiles_subscription_tier_idx ON profiles(subscription_tier);

-- ============================================================================
-- AI Usage Tracking Table
-- Tracks per-user API usage for billing and abuse prevention
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Usage metrics
    tokens_used INTEGER NOT NULL DEFAULT 0,
    requests_count INTEGER NOT NULL DEFAULT 0,
    
    -- Model tracking
    model_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    
    -- Time tracking
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Unique constraint: one record per user per model per period
    UNIQUE(user_id, model_id, period_start)
);

-- Enable RLS
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
    ON ai_usage FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert/update usage (no user writes)
CREATE POLICY "System can manage usage"
    ON ai_usage FOR ALL
    USING (true)
    WITH CHECK (true);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS ai_usage_user_idx ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS ai_usage_period_idx ON ai_usage(period_start, period_end);
CREATE INDEX IF NOT EXISTS ai_usage_model_idx ON ai_usage(model_id);

-- ============================================================================
-- Security Audit Log Table
-- Tracks unauthorized access attempts and security events
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Event details
    event_type TEXT NOT NULL CHECK (event_type IN (
        'unauthorized_model_access',
        'rate_limit_exceeded',
        'suspicious_activity',
        'auth_failure',
        'admin_action'
    )),
    
    -- Context
    requested_resource TEXT,
    allowed_resource TEXT,
    user_tier TEXT,
    
    -- Request info
    ip_address TEXT,
    user_agent TEXT,
    
    -- Additional data
    metadata JSONB DEFAULT '{}',
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON security_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
    ON security_audit_log FOR INSERT
    WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS security_audit_user_idx ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS security_audit_type_idx ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS security_audit_time_idx ON security_audit_log(created_at);

-- Trigger for ai_usage updated_at
CREATE TRIGGER update_ai_usage_updated_at
    BEFORE UPDATE ON ai_usage
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Helper function to get or create usage record for current period (monthly)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_monthly_usage(
    p_user_id UUID,
    p_model_id TEXT,
    p_provider TEXT
) RETURNS UUID AS $$
DECLARE
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
    v_usage_id UUID;
BEGIN
    -- Calculate current month boundaries
    v_period_start := date_trunc('month', NOW());
    v_period_end := date_trunc('month', NOW()) + INTERVAL '1 month';
    
    -- Try to find existing record
    SELECT id INTO v_usage_id
    FROM ai_usage
    WHERE user_id = p_user_id
      AND model_id = p_model_id
      AND period_start = v_period_start;
    
    -- If not found, create one
    IF v_usage_id IS NULL THEN
        INSERT INTO ai_usage (user_id, model_id, provider, period_start, period_end)
        VALUES (p_user_id, p_model_id, p_provider, v_period_start, v_period_end)
        RETURNING id INTO v_usage_id;
    END IF;
    
    RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to increment usage
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_ai_usage(
    p_user_id UUID,
    p_model_id TEXT,
    p_provider TEXT,
    p_tokens INTEGER DEFAULT 0
) RETURNS VOID AS $$
DECLARE
    v_usage_id UUID;
BEGIN
    v_usage_id := get_or_create_monthly_usage(p_user_id, p_model_id, p_provider);
    
    UPDATE ai_usage
    SET tokens_used = tokens_used + p_tokens,
        requests_count = requests_count + 1,
        updated_at = NOW()
    WHERE id = v_usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
