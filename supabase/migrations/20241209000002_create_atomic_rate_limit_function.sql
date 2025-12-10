-- Migration: Create atomic rate limit function
-- This function handles rate limiting atomically to prevent race conditions
CREATE OR REPLACE FUNCTION check_rate_limit_atomic(
    p_identifier TEXT,
    p_max_requests INTEGER,
    p_window_ms INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_reset_time TIMESTAMPTZ;
    v_current_count INTEGER;
    v_allowed BOOLEAN;
BEGIN
    v_reset_time := v_now + (p_window_ms || ' milliseconds')::INTERVAL;
    INSERT INTO rate_limits (identifier, count, reset_time)
    VALUES (p_identifier, 1, v_reset_time)
    ON CONFLICT (identifier) DO UPDATE
    SET 
        count = CASE 
            WHEN rate_limits.reset_time < v_now THEN 1
            ELSE rate_limits.count + 1
        END,
        reset_time = CASE 
            WHEN rate_limits.reset_time < v_now THEN v_reset_time
            ELSE rate_limits.reset_time
        END
    RETURNING count, reset_time INTO v_current_count, v_reset_time;
    v_allowed := v_current_count <= p_max_requests;
    RETURN json_build_object(
        'allowed', v_allowed,
        'current_count', v_current_count,
        'reset_time', v_reset_time
    );
END;
$$
