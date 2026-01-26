-- ============================================================================
-- Add Demo Subscription Tier
-- ============================================================================
-- Adds 'demo' tier for users who want to explore the platform with simulated
-- AI and fake data, without incurring any costs.
--
-- Tier system:
--   - demo: Full UI, simulated AI, no real integrations (new default)
--   - free: DEPRECATED - treated same as demo
--   - pro: Full features, real AI, real integrations
--   - enterprise: Pro + priority support, custom integrations
-- ============================================================================

-- Update profiles table constraint to include 'demo'
DO $$
BEGIN
    -- Drop existing constraint
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
    
    -- Add new constraint with demo tier
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_subscription_tier_check 
    CHECK (subscription_tier IN ('demo', 'free', 'pro', 'enterprise'));
    
    -- Set default to 'demo' for new users
    ALTER TABLE profiles 
    ALTER COLUMN subscription_tier SET DEFAULT 'demo';
    
    -- Migrate existing 'free' users to 'demo'
    UPDATE profiles 
    SET subscription_tier = 'demo' 
    WHERE subscription_tier = 'free';
    
    RAISE NOTICE 'Updated subscription_tier constraint and migrated free users to demo';
END $$;

-- Update companies table constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'subscription_tier'
    ) THEN
        -- Drop existing constraint
        ALTER TABLE companies DROP CONSTRAINT IF EXISTS chk_companies_subscription_tier;
        
        -- Add new constraint with demo tier
        ALTER TABLE companies 
        ADD CONSTRAINT chk_companies_subscription_tier 
        CHECK (subscription_tier IN ('demo', 'free', 'starter', 'pro', 'enterprise'));
        
        -- Set default to 'demo'
        ALTER TABLE companies 
        ALTER COLUMN subscription_tier SET DEFAULT 'demo';
        
        -- Migrate existing 'free' users to 'demo'
        UPDATE companies 
        SET subscription_tier = 'demo' 
        WHERE subscription_tier = 'free';
        
        RAISE NOTICE 'Updated companies subscription_tier constraint';
    END IF;
END $$;

-- ============================================================================
-- Add is_demo_data flag to relevant tables
-- Allows easy cleanup when user upgrades from demo
-- ============================================================================

DO $$
BEGIN
    -- Add to transactions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'is_demo_data'
    ) THEN
        ALTER TABLE transactions ADD COLUMN is_demo_data BOOLEAN DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_transactions_demo ON transactions(is_demo_data) WHERE is_demo_data = TRUE;
    END IF;
    
    -- Add to invoices
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'is_demo_data'
    ) THEN
        ALTER TABLE invoices ADD COLUMN is_demo_data BOOLEAN DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_invoices_demo ON invoices(is_demo_data) WHERE is_demo_data = TRUE;
    END IF;
    
    -- Add to receipts
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' AND column_name = 'is_demo_data'
    ) THEN
        ALTER TABLE receipts ADD COLUMN is_demo_data BOOLEAN DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_receipts_demo ON receipts(is_demo_data) WHERE is_demo_data = TRUE;
    END IF;
    
    -- Add to partners
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partners' AND column_name = 'is_demo_data'
    ) THEN
        ALTER TABLE partners ADD COLUMN is_demo_data BOOLEAN DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_partners_demo ON partners(is_demo_data) WHERE is_demo_data = TRUE;
    END IF;
    
    RAISE NOTICE 'Added is_demo_data columns for demo data tracking';
END $$;

-- ============================================================================
-- Function to clear demo data when user upgrades
-- ============================================================================

CREATE OR REPLACE FUNCTION clear_demo_data(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Get company IDs for this user
    DELETE FROM transactions 
    WHERE company_id IN (SELECT id FROM companies WHERE user_id = p_user_id)
    AND is_demo_data = TRUE;
    
    DELETE FROM invoices 
    WHERE company_id IN (SELECT id FROM companies WHERE user_id = p_user_id)
    AND is_demo_data = TRUE;
    
    DELETE FROM receipts 
    WHERE company_id IN (SELECT id FROM companies WHERE user_id = p_user_id)
    AND is_demo_data = TRUE;
    
    DELETE FROM partners 
    WHERE company_id IN (SELECT id FROM companies WHERE user_id = p_user_id)
    AND is_demo_data = TRUE;
    
    RAISE NOTICE 'Cleared demo data for user %', p_user_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION clear_demo_data(UUID) TO authenticated;

COMMENT ON FUNCTION clear_demo_data IS 'Clears all demo data for a user when they upgrade to paid tier';
