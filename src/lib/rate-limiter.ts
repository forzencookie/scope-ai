/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Consolidated Rate Limiter
 * 
 * Provides rate limiting with automatic environment detection:
 * - Production: Supabase-backed (persistent, distributed)
 * - Development: In-memory (simple, no external dependencies)
 * 
 * Usage:
 * ```ts
 * import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter'
 * 
 * const clientId = getClientIdentifier(request)
 * const result = await checkRateLimit(clientId)
 * if (!result.success) {
 *   return new Response('Too Many Requests', { status: 429 })
 * }
 * ```
 */

import { supabase } from './database/supabase'

// ============================================================================
// Types
// ============================================================================

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

export const DEFAULT_CONFIG: RateLimitConfig = {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
}

// ============================================================================
// IP Validation
// ============================================================================

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})$/
const IPV6_REGEX = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::(?:[a-fA-F0-9]{1,4}:){0,6}[a-fA-F0-9]{1,4}$|^(?:[a-fA-F0-9]{1,4}:){1,7}:$|^(?:[a-fA-F0-9]{1,4}:){0,6}::(?:[a-fA-F0-9]{1,4}:){0,5}[a-fA-F0-9]{1,4}$/

function validateIpAddress(ip: string | null | undefined): string | null {
    if (!ip || typeof ip !== 'string') return null
    const trimmed = ip.trim()
    if (!trimmed) return null
    if (IPV4_REGEX.test(trimmed)) return trimmed
    if (IPV6_REGEX.test(trimmed)) return trimmed.toLowerCase()
    if (trimmed.toLowerCase().startsWith('::ffff:')) {
        const ipv4Part = trimmed.slice(7)
        if (IPV4_REGEX.test(ipv4Part)) return trimmed.toLowerCase()
    }
    return null
}

// ============================================================================
// Client Identification
// ============================================================================

const TRUST_PROXY_HEADERS =
    process.env.TRUST_PROXY_HEADERS === 'true' ||
    process.env.VERCEL === '1' ||
    process.env.CF_PAGES === '1'

/**
 * Get client identifier from request headers
 * Safely handles proxy headers based on environment configuration
 */
export function getClientIdentifier(request: Request): string {
    const isTrusted = TRUST_PROXY_HEADERS || process.env.VERCEL === '1' || process.env.CF_PAGES === '1'

    if (isTrusted) {
        // Cloudflare
        const cfIp = validateIpAddress(request.headers.get('cf-connecting-ip'))
        if (cfIp) return `ip:${cfIp}`

        // X-Forwarded-For (take first IP)
        const xff = request.headers.get('x-forwarded-for')
        if (xff) {
            const firstIp = validateIpAddress(xff.split(',')[0])
            if (firstIp) return `ip:${firstIp}`
        }

        // X-Real-IP
        const realIp = validateIpAddress(request.headers.get('x-real-ip'))
        if (realIp) return `ip:${realIp}`
    }

    return 'anonymous'
}

// ============================================================================
// In-Memory Rate Limiter (Development)
// ============================================================================

interface RateLimitEntry {
    count: number
    resetTime: number
}

const memoryStore = new Map<string, RateLimitEntry>()

function checkRateLimitMemory(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const entry = memoryStore.get(identifier)

    if (!entry || now >= entry.resetTime) {
        memoryStore.set(identifier, { count: 1, resetTime: now + config.windowMs })
        return { success: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs }
    }

    if (entry.count >= config.maxRequests) {
        return {
            success: false,
            remaining: 0,
            resetTime: entry.resetTime,
            retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        }
    }

    entry.count++
    return { success: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime }
}

// ============================================================================
// Supabase Rate Limiter (Production)
// ============================================================================

async function checkRateLimitSupabase(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now()
    const resetTime = now + config.windowMs

    try {
        // Try to get existing entry
        const { data: existing } = await supabase
            .from('rate_limits' as any)
            .select('count, reset_time')
            .eq('identifier', identifier)
            .single()

        if (existing) {
            const existingResetTime = new Date((existing as any).reset_time).getTime()

            // Window expired - reset
            if (now >= existingResetTime) {
                await supabase
                    .from('rate_limits' as any)
                    .update({ count: 1, reset_time: new Date(resetTime).toISOString() })
                    .eq('identifier', identifier)

                return { success: true, remaining: config.maxRequests - 1, resetTime }
            }

            // Rate limit exceeded
            if ((existing as any).count >= config.maxRequests) {
                return {
                    success: false,
                    remaining: 0,
                    resetTime: existingResetTime,
                    retryAfter: Math.ceil((existingResetTime - now) / 1000),
                }
            }

            // Increment counter
            await supabase
                .from('rate_limits' as any)
                .update({ count: (existing as any).count + 1 })
                .eq('identifier', identifier)

            return { success: true, remaining: config.maxRequests - (existing as any).count - 1, resetTime: existingResetTime }
        }

        // No existing entry - create new one
        await supabase
            .from('rate_limits' as any)
            .insert({ identifier, count: 1, reset_time: new Date(resetTime).toISOString() })

        return { success: true, remaining: config.maxRequests - 1, resetTime }
    } catch (error) {
        console.error('Rate limit check failed, allowing request:', error)
        return { success: true, remaining: config.maxRequests, resetTime }
    }
}

// ============================================================================
// Main API
// ============================================================================

const useSupabase = process.env.USE_SUPABASE_RATE_LIMIT === 'true' || process.env.NODE_ENV === 'production'

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - Unique identifier for the client (use getClientIdentifier)
 * @param config - Rate limit configuration (optional)
 * @returns Result indicating if request is allowed
 */
export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
    if (useSupabase) {
        return checkRateLimitSupabase(identifier, config)
    }
    return checkRateLimitMemory(identifier, config)
}

/**
 * Clear the rate limit store (useful for testing)
 */
export async function clearRateLimitStore(): Promise<void> {
    if (useSupabase) {
        await supabase.from('rate_limits' as any).delete().neq('identifier', '')
    } else {
        memoryStore.clear()
    }
}

/**
 * Clean up expired entries (call periodically in production)
 */
export async function cleanupExpiredEntries(): Promise<void> {
    if (useSupabase) {
        await supabase.from('rate_limits' as any).delete().lt('reset_time', new Date().toISOString())
    } else {
        const now = Date.now()
        for (const [key, entry] of memoryStore.entries()) {
            if (now > entry.resetTime) memoryStore.delete(key)
        }
    }
}

// Legacy exports for backwards compatibility
export { DEFAULT_CONFIG as DEFAULT_RATE_LIMIT_CONFIG }
export { checkRateLimit as checkRateLimitSupabase }
