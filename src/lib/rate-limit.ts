/**
 * Rate limiter with Supabase backend for production
 * Falls back to in-memory for development/testing
 * 
 * In production (USE_SUPABASE_RATE_LIMIT=true):
 * - Persistent across server restarts
 * - Shared across serverless function instances
 * - Suitable for distributed deployments
 * 
 * In development:
 * - Uses in-memory store for simplicity
 * - State is lost on server restart (acceptable for dev)
 */

// Re-export Supabase-backed functions for production use
export {
    checkRateLimit as checkRateLimitSupabase,
    cleanupExpiredEntries as cleanupExpiredEntriesSupabase,
    clearRateLimitStore as clearRateLimitStoreSupabase,
} from './rate-limit-supabase'

interface RateLimitEntry {
    count: number
    resetTime: number
}

// In-memory store for rate limiting (development fallback)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Track cleanup interval for testability
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Start the cleanup interval for expired entries
 * Safe to call multiple times - will only start one interval
 */
export function startCleanupInterval(): void {
    if (cleanupIntervalId !== null) return

    cleanupIntervalId = setInterval(() => {
        cleanupExpiredEntriesInMemory()
    }, CLEANUP_INTERVAL_MS)

    // Prevent the interval from keeping Node.js alive
    if (typeof cleanupIntervalId === 'object' && 'unref' in cleanupIntervalId) {
        cleanupIntervalId.unref()
    }
}

/**
 * Stop the cleanup interval
 * Useful for tests or graceful shutdown
 */
export function stopCleanupInterval(): void {
    if (cleanupIntervalId !== null) {
        clearInterval(cleanupIntervalId)
        cleanupIntervalId = null
    }
}

/**
 * Clean up expired entries from the in-memory store
 */
function cleanupExpiredEntriesInMemory(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    // Collect keys to delete (avoid modifying during iteration)
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            keysToDelete.push(key)
        }
    }

    // Delete expired entries
    for (const key of keysToDelete) {
        rateLimitStore.delete(key)
    }
}

/**
 * Clear all rate limit entries (useful for testing)
 */
export function clearRateLimitStore(): void {
    rateLimitStore.clear()
}

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

/**
 * Check if a request should be rate limited (in-memory version)
 * 
 * ⚠️ WARNING: This is the in-memory fallback for development only.
 * For production, use checkRateLimitSupabase from './rate-limit-supabase'
 * which persists across server restarts and serverless function instances.
 * 
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed and remaining quota
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
): RateLimitResult {
    // Validate identifier
    if (!identifier || typeof identifier !== 'string') {
        identifier = 'anonymous'
    }

    const now = Date.now()
    const entry = rateLimitStore.get(identifier)

    // If no entry exists or window has expired, create new entry
    if (!entry || now > entry.resetTime) {
        const newEntry: RateLimitEntry = {
            count: 1,
            resetTime: now + config.windowMs,
        }
        rateLimitStore.set(identifier, newEntry)

        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetTime: newEntry.resetTime,
        }
    }

    // Increment counter
    entry.count++

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
        return {
            success: false,
            remaining: 0,
            resetTime: entry.resetTime,
            retryAfter: Math.max(1, retryAfter), // Ensure at least 1 second
        }
    }

    return {
        success: true,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime,
    }
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

// Auto-start cleanup in production (not in test environment)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
    startCleanupInterval()
}
