/**
 * Supabase-backed rate limiter for production use
 * 
 * Benefits over in-memory:
 * - Persistent across server restarts
 * - Shared across serverless function instances
 * - Suitable for distributed deployments
 * 
 * Requires a rate_limits table in Supabase:
 * 
 * CREATE TABLE rate_limits (
 *   identifier TEXT PRIMARY KEY,
 *   count INTEGER NOT NULL DEFAULT 1,
 *   reset_time TIMESTAMPTZ NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- Index for cleanup queries
 * CREATE INDEX idx_rate_limits_reset_time ON rate_limits(reset_time);
 * 
 * -- Function to auto-update updated_at
 * CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   NEW.updated_at = NOW();
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * CREATE TRIGGER rate_limits_updated_at
 *   BEFORE UPDATE ON rate_limits
 *   FOR EACH ROW
 *   EXECUTE FUNCTION update_rate_limits_updated_at();
 */

import { supabase } from './supabase'

export interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    maxRequests: number
    /** Time window in milliseconds */
    windowMs: number
}

export interface RateLimitResult {
    success: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
}

/** Default rate limit configuration */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
}

// IPv4 and IPv6 validation patterns
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})$/
const IPV6_REGEX = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::(?:[a-fA-F0-9]{1,4}:){0,6}[a-fA-F0-9]{1,4}$|^(?:[a-fA-F0-9]{1,4}:){1,7}:$|^(?:[a-fA-F0-9]{1,4}:){0,6}::(?:[a-fA-F0-9]{1,4}:){0,5}[a-fA-F0-9]{1,4}$/

/**
 * Validate an IP address (IPv4 or IPv6)
 * Returns the sanitized IP or null if invalid
 */
export function validateIpAddress(ip: string | null | undefined): string | null {
    if (!ip || typeof ip !== 'string') return null

    const trimmed = ip.trim()
    if (!trimmed) return null

    // Check for IPv4
    if (IPV4_REGEX.test(trimmed)) {
        return trimmed
    }

    // Check for IPv6
    if (IPV6_REGEX.test(trimmed)) {
        return trimmed.toLowerCase()
    }

    // Also accept IPv4-mapped IPv6 addresses (::ffff:192.0.2.1)
    if (trimmed.toLowerCase().startsWith('::ffff:')) {
        const ipv4Part = trimmed.slice(7)
        if (IPV4_REGEX.test(ipv4Part)) {
            return trimmed.toLowerCase()
        }
    }

    return null
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header for proxied requests, falls back to a default
 */
export function getClientIdentifier(request: Request): string {
    // Try to get real IP from various headers (used by proxies/load balancers)
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
        // Take the first IP in the chain (client's original IP)
        const rawIp = forwardedFor.split(',')[0]?.trim()
        const validIp = validateIpAddress(rawIp)
        if (validIp) return validIp
    }

    const realIp = validateIpAddress(request.headers.get('x-real-ip'))
    if (realIp) {
        return realIp
    }

    const cfConnectingIp = validateIpAddress(request.headers.get('cf-connecting-ip'))
    if (cfConnectingIp) {
        return cfConnectingIp
    }

    // Fallback for development/direct connections
    return 'anonymous'
}

/**
 * Check if a request should be rate limited (Supabase-backed)
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed and remaining quota
 */
export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
): Promise<RateLimitResult> {
    // Validate identifier
    if (!identifier || typeof identifier !== 'string') {
        identifier = 'anonymous'
    }

    const now = Date.now()
    const resetTime = new Date(now + config.windowMs).toISOString()

    try {
        // Try to get existing entry
        const { data: existingEntry, error: fetchError } = await supabase
            .from('rate_limits')
            .select('count, reset_time')
            .eq('identifier', identifier)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 = no rows returned (expected for new entries)
            console.error('Rate limit fetch error:', fetchError)
            // Fail open - allow request if DB error
            return {
                success: true,
                remaining: config.maxRequests - 1,
                resetTime: now + config.windowMs,
            }
        }

        // If no entry exists or window has expired, create/reset entry
        if (!existingEntry || new Date(existingEntry.reset_time).getTime() < now) {
            const { error: upsertError } = await supabase
                .from('rate_limits')
                .upsert({
                    identifier,
                    count: 1,
                    reset_time: resetTime,
                }, { onConflict: 'identifier' })

            if (upsertError) {
                console.error('Rate limit upsert error:', upsertError)
                // Fail open
                return {
                    success: true,
                    remaining: config.maxRequests - 1,
                    resetTime: now + config.windowMs,
                }
            }

            return {
                success: true,
                remaining: config.maxRequests - 1,
                resetTime: now + config.windowMs,
            }
        }

        // Entry exists and window is still valid - increment counter
        const newCount = existingEntry.count + 1
        const entryResetTime = new Date(existingEntry.reset_time).getTime()

        // Check if limit exceeded before updating
        if (newCount > config.maxRequests) {
            const retryAfter = Math.ceil((entryResetTime - now) / 1000)
            return {
                success: false,
                remaining: 0,
                resetTime: entryResetTime,
                retryAfter: Math.max(1, retryAfter),
            }
        }

        // Update counter
        const { error: updateError } = await supabase
            .from('rate_limits')
            .update({ count: newCount })
            .eq('identifier', identifier)

        if (updateError) {
            console.error('Rate limit update error:', updateError)
            // Fail open
            return {
                success: true,
                remaining: config.maxRequests - newCount,
                resetTime: entryResetTime,
            }
        }

        return {
            success: true,
            remaining: config.maxRequests - newCount,
            resetTime: entryResetTime,
        }
    } catch (error) {
        console.error('Rate limit check failed:', error)
        // Fail open - allow request if unexpected error
        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetTime: now + config.windowMs,
        }
    }
}

/**
 * Clean up expired rate limit entries
 * Should be called periodically (e.g., via cron job or scheduled function)
 */
export async function cleanupExpiredEntries(): Promise<{ deleted: number; error?: string }> {
    try {
        const now = new Date().toISOString()
        
        const { data, error } = await supabase
            .from('rate_limits')
            .delete()
            .lt('reset_time', now)
            .select('identifier')

        if (error) {
            console.error('Rate limit cleanup error:', error)
            return { deleted: 0, error: error.message }
        }

        return { deleted: data?.length ?? 0 }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Rate limit cleanup failed:', errorMessage)
        return { deleted: 0, error: errorMessage }
    }
}

/**
 * Clear all rate limit entries (useful for testing)
 */
export async function clearRateLimitStore(): Promise<void> {
    const { error } = await supabase
        .from('rate_limits')
        .delete()
        .neq('identifier', '') // Delete all rows

    if (error) {
        console.error('Failed to clear rate limit store:', error)
    }
}
