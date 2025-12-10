-- Migration: Create sliding window rate limits table
-- This provides more accurate rate limiting than fixed window approach

-- Create the sliding window rate limits table
CREATE TABLE IF NOT EXISTS rate_limits_sliding (
    identifier TEXT PRIMARY KEY,
    window_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_access TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleanup queries (find old entries)
CREATE INDEX IF NOT EXISTS idx_rate_limits_sliding_last_access 
ON rate_limits_sliding(last_access);

-- Index for JSON queries on window_data
CREATE INDEX IF NOT EXISTS idx_rate_limits_sliding_window_data 
ON rate_limits_sliding USING GIN (window_data);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rate_limits_sliding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS rate_limits_sliding_updated_at ON rate_limits_sliding;
CREATE TRIGGER rate_limits_sliding_updated_at
    BEFORE UPDATE ON rate_limits_sliding
    FOR EACH ROW
    EXECUTE FUNCTION update_rate_limits_sliding_updated_at();

-- Function to clean up old entries (call periodically via cron)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits_sliding(max_age_minutes INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limits_sliding
    WHERE last_access < NOW() - (max_age_minutes || ' minutes')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE rate_limits_sliding ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role full access"
ON rate_limits_sliding
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Anon users can read/write their own entries (identified by identifier)
CREATE POLICY "Anon rate limit access"
ON rate_limits_sliding
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE rate_limits_sliding IS 'Sliding window rate limiting with JSONB storage for window counts';
COMMENT ON COLUMN rate_limits_sliding.identifier IS 'Unique identifier (IP, user ID, API key hash, etc.)';
COMMENT ON COLUMN rate_limits_sliding.window_data IS 'JSON object mapping window IDs to request counts';
COMMENT ON COLUMN rate_limits_sliding.last_access IS 'Last time this entry was accessed (for cleanup)';
