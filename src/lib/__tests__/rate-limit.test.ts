/**
 * Tests for rate limiting functionality (in-memory implementation)
 */

// Mock Supabase before importing rate-limit
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}))

import {
    checkRateLimit,
    clearRateLimitStore,
    startCleanupInterval,
    stopCleanupInterval,
    type RateLimitConfig,
} from '../rate-limit'

describe('Rate Limiter', () => {
    beforeEach(() => {
        clearRateLimitStore()
        stopCleanupInterval()
    })

    afterEach(() => {
        stopCleanupInterval()
    })

    const defaultConfig: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000, // 1 minute
    }

    describe('checkRateLimit', () => {
        it('should allow requests under the limit', () => {
            const result = checkRateLimit('user-1', defaultConfig)
            
            expect(result.success).toBe(true)
            expect(result.remaining).toBe(4)
            expect(result.resetTime).toBeGreaterThan(Date.now())
        })

        it('should track requests per identifier', () => {
            // First request for user-1
            const result1 = checkRateLimit('user-1', defaultConfig)
            expect(result1.remaining).toBe(4)

            // First request for user-2 (separate limit)
            const result2 = checkRateLimit('user-2', defaultConfig)
            expect(result2.remaining).toBe(4)

            // Second request for user-1
            const result3 = checkRateLimit('user-1', defaultConfig)
            expect(result3.remaining).toBe(3)
        })

        it('should block requests over the limit', () => {
            const config: RateLimitConfig = { maxRequests: 3, windowMs: 60000 }

            // Make 3 allowed requests
            checkRateLimit('user-1', config)
            checkRateLimit('user-1', config)
            checkRateLimit('user-1', config)

            // 4th request should be blocked
            const result = checkRateLimit('user-1', config)
            expect(result.success).toBe(false)
            expect(result.remaining).toBe(0)
        })

        it('should reset after window expires', () => {
            jest.useFakeTimers()
            const config: RateLimitConfig = { maxRequests: 2, windowMs: 1000 }

            // Exhaust limit
            checkRateLimit('user-1', config)
            checkRateLimit('user-1', config)
            
            let result = checkRateLimit('user-1', config)
            expect(result.success).toBe(false)

            // Advance time past window
            jest.advanceTimersByTime(1500)

            // Should be allowed again
            result = checkRateLimit('user-1', config)
            expect(result.success).toBe(true)
            expect(result.remaining).toBe(1)

            jest.useRealTimers()
        })
    })

    describe('clearRateLimitStore', () => {
        it('should clear all rate limit entries', () => {
            const config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 }

            // Add some entries
            checkRateLimit('user-1', config)
            checkRateLimit('user-2', config)
            checkRateLimit('user-3', config)

            // Clear store
            clearRateLimitStore()

            // All users should have full quota
            const result1 = checkRateLimit('user-1', config)
            const result2 = checkRateLimit('user-2', config)

            expect(result1.remaining).toBe(4) // First request, 5-1=4
            expect(result2.remaining).toBe(4)
        })
    })

    describe('cleanup interval', () => {
        it('should start and stop cleanup interval', () => {
            expect(() => startCleanupInterval()).not.toThrow()
            expect(() => stopCleanupInterval()).not.toThrow()
        })

        it('should not create multiple intervals', () => {
            startCleanupInterval()
            startCleanupInterval() // Should be a no-op
            stopCleanupInterval()
        })

        it('should handle stop when not started', () => {
            expect(() => stopCleanupInterval()).not.toThrow()
        })
    })

    describe('edge cases', () => {
        it('should handle empty identifier', () => {
            const result = checkRateLimit('', defaultConfig)
            expect(result.success).toBe(true)
        })

        it('should handle very high maxRequests', () => {
            const config: RateLimitConfig = { maxRequests: 10000, windowMs: 60000 }
            const result = checkRateLimit('user-1', config)
            expect(result.success).toBe(true)
            expect(result.remaining).toBe(9999)
        })

        it('should handle very short window', () => {
            jest.useFakeTimers()
            const config: RateLimitConfig = { maxRequests: 1, windowMs: 100 }

            checkRateLimit('user-1', config)
            let result = checkRateLimit('user-1', config)
            expect(result.success).toBe(false)

            jest.advanceTimersByTime(150)
            result = checkRateLimit('user-1', config)
            expect(result.success).toBe(true)

            jest.useRealTimers()
        })
    })
})
