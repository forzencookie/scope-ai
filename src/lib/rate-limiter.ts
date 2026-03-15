/**
 * Rate Limiter (in-memory)
 *
 * Simple sliding-window rate limiter using an in-memory Map.
 * Sufficient for single-instance deployments. When deploying to
 * serverless (Vercel), swap to Vercel KV / Upstash Redis.
 */

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

/**
 * Get client identifier from request headers.
 * Safely handles proxy headers on trusted platforms (Vercel, Cloudflare).
 */
export function getClientIdentifier(request: Request): string {
    const isTrusted =
        process.env.TRUST_PROXY_HEADERS === 'true' ||
        process.env.VERCEL === '1' ||
        process.env.CF_PAGES === '1'

    if (isTrusted) {
        const cfIp = validateIpAddress(request.headers.get('cf-connecting-ip'))
        if (cfIp) return `ip:${cfIp}`

        const xff = request.headers.get('x-forwarded-for')
        if (xff) {
            const firstIp = validateIpAddress(xff.split(',')[0])
            if (firstIp) return `ip:${firstIp}`
        }

        const realIp = validateIpAddress(request.headers.get('x-real-ip'))
        if (realIp) return `ip:${realIp}`
    }

    return 'anonymous'
}

// ============================================================================
// In-Memory Store
// ============================================================================

interface RateLimitEntry {
    count: number
    resetTime: number
}

const store = new Map<string, RateLimitEntry>()

/**
 * Check if a request should be rate limited.
 */
export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
    const now = Date.now()
    const entry = store.get(identifier)

    if (!entry || now >= entry.resetTime) {
        store.set(identifier, { count: 1, resetTime: now + config.windowMs })
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

/**
 * Clear all entries (for testing).
 */
export async function clearRateLimitStore(): Promise<void> {
    store.clear()
}

/**
 * Remove expired entries to prevent memory leaks.
 */
export async function cleanupExpiredEntries(): Promise<void> {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
        if (now > entry.resetTime) store.delete(key)
    }
}

// Legacy exports for backwards compatibility
export { DEFAULT_CONFIG as DEFAULT_RATE_LIMIT_CONFIG }
