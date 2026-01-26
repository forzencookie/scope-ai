-- ============================================================================
-- User Credits Table for AI Token Top-ups
-- Tracks purchased credit packages and consumption
-- ============================================================================

CREATE TABLE IF NOT EXISTS usercredits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Credit information
    credits_purchased INTEGER NOT NULL,     -- Original amount purchased
    credits_remaining INTEGER NOT NULL,     -- Current remaining balance
    
    -- Stripe reference
    stripe_payment_id TEXT,                 -- Stripe payment intent or session ID
    price_paid_cents INTEGER,               -- Amount paid in cents (for records)
    currency TEXT DEFAULT 'sek',            -- Currency code
    
    -- Status
    is_active BOOLEAN DEFAULT true,         -- Whether credits can be used
    
    -- Time tracking
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,                 -- Optional expiration (null = never)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS usercredits_user_idx ON usercredits(user_id);
CREATE INDEX IF NOT EXISTS usercredits_active_idx ON usercredits(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS usercredits_expires_idx ON usercredits(expires_at) WHERE expires_at IS NOT NULL;

-- RLS Policies
ALTER TABLE usercredits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view own credits"
    ON usercredits FOR SELECT
    USING (user_id = auth.uid());

-- Only system can insert/update (via service role)
CREATE POLICY "System can manage credits"
    ON usercredits FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_usercredits_updated_at
    BEFORE UPDATE ON usercredits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Function to add purchased credits
-- ============================================================================

CREATE OR REPLACE FUNCTION add_user_credits(
    p_user_id UUID,
    p_credits INTEGER,
    p_stripe_payment_id TEXT DEFAULT NULL,
    p_price_paid_cents INTEGER DEFAULT NULL,
    p_currency TEXT DEFAULT 'sek'
) RETURNS UUID AS $$
DECLARE
    v_credit_id UUID;
BEGIN
    INSERT INTO usercredits (
        user_id,
        credits_purchased,
        credits_remaining,
        stripe_payment_id,
        price_paid_cents,
        currency,
        is_active,
        purchased_at
    ) VALUES (
        p_user_id,
        p_credits,
        p_credits,
        p_stripe_payment_id,
        p_price_paid_cents,
        p_currency,
        true,
        NOW()
    )
    RETURNING id INTO v_credit_id;
    
    RETURN v_credit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to consume credits (FIFO - oldest first)
-- Returns true if successful, false if insufficient credits
-- ============================================================================

CREATE OR REPLACE FUNCTION consume_user_credits(
    p_user_id UUID,
    p_tokens_to_consume INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_remaining_to_consume INTEGER := p_tokens_to_consume;
    v_credit RECORD;
BEGIN
    -- Loop through active credits (oldest first) and consume
    FOR v_credit IN 
        SELECT id, credits_remaining 
        FROM usercredits 
        WHERE user_id = p_user_id 
          AND is_active = true 
          AND credits_remaining > 0
          AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY purchased_at ASC
    LOOP
        IF v_remaining_to_consume <= 0 THEN
            EXIT;
        END IF;
        
        IF v_credit.credits_remaining >= v_remaining_to_consume THEN
            -- This credit row can cover the remaining consumption
            UPDATE usercredits 
            SET credits_remaining = credits_remaining - v_remaining_to_consume,
                updated_at = NOW()
            WHERE id = v_credit.id;
            v_remaining_to_consume := 0;
        ELSE
            -- Consume all from this row and continue to next
            v_remaining_to_consume := v_remaining_to_consume - v_credit.credits_remaining;
            UPDATE usercredits 
            SET credits_remaining = 0,
                is_active = false,
                updated_at = NOW()
            WHERE id = v_credit.id;
        END IF;
    END LOOP;
    
    -- Return true if we consumed everything, false if insufficient
    RETURN v_remaining_to_consume = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to get total available credits for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_credits(p_user_id UUID) 
RETURNS INTEGER AS $$
DECLARE
    v_total INTEGER;
BEGIN
    SELECT COALESCE(SUM(credits_remaining), 0)
    INTO v_total
    FROM usercredits
    WHERE user_id = p_user_id
      AND is_active = true
      AND credits_remaining > 0
      AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
