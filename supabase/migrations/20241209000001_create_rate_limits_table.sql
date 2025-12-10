-- Create rate_limits table for persistent rate limiting
-- This replaces the in-memory rate limiting which is lost on server restarts

CREATE TABLE IF NOT EXISTS rate_limits (
  identifier TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup queries (finding expired entries)
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time ON rate_limits(reset_time);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on row updates
DROP TRIGGER IF EXISTS rate_limits_updated_at ON rate_limits;
CREATE TRIGGER rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limits_updated_at();

-- Comment explaining the table
COMMENT ON TABLE rate_limits IS 'Stores rate limit counters for API rate limiting. Entries expire based on reset_time.';
COMMENT ON COLUMN rate_limits.identifier IS 'Unique identifier for the rate-limited entity (e.g., IP address, user ID)';
COMMENT ON COLUMN rate_limits.count IS 'Number of requests made in the current window';
COMMENT ON COLUMN rate_limits.reset_time IS 'When the current rate limit window expires';
