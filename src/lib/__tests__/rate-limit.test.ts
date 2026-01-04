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
    cleanupExpiredEntries,
    type RateLimitConfig,
} from '@/lib/rate-limiter'

describe('Rate Limiter', () => {
    beforeEach(async () => {
        await clearRateLimitStore()
    })

    const defaultConfig: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000, // 1 minute
    }

    describe('checkRateLimit', () => {
        it('should allow requests under the limit', async () => {
            const result = await checkRateLimit('user-1', defaultConfig)

            expect(result.success).toBe(true)
            expect(result.remaining).toBe(4)
            expect(result.resetTime).toBeGreaterThan(Date.now())
        })

        it('should track requests per identifier', async () => {
            // First request for user-1
            const result1 = await checkRateLimit('user-1', defaultConfig)
            expect(result1.remaining).toBe(4)

            // First request for user-2 (separate limit)
            const result2 = await checkRateLimit('user-2', defaultConfig)
            expect(result2.remaining).toBe(4)

            // Second request for user-1
            const result3 = await checkRateLimit('user-1', defaultConfig)
            expect(result3.remaining).toBe(3)
        })

        it('should block requests over the limit', async () => {
            const config: RateLimitConfig = { maxRequests: 3, windowMs: 60000 }

            // Make 3 allowed requests
            await checkRateLimit('user-1', config)
            await checkRateLimit('user-1', config)
            await checkRateLimit('user-1', config)

            // 4th request should be blocked
            const result = await checkRateLimit('user-1', config)
            expect(result.success).toBe(false)
            expect(result.remaining).toBe(0)
        })

        it('should reset after window expires', async () => {
            jest.useFakeTimers()
            const config: RateLimitConfig = { maxRequests: 2, windowMs: 1000 }

            // Exhaust limit
            await checkRateLimit('user-1', config)
            await checkRateLimit('user-1', config)

            let result = await checkRateLimit('user-1', config)
            expect(result.success).toBe(false)

            // Advance time past window
            jest.advanceTimersByTime(1500)

            // Should be allowed again
            result = await checkRateLimit('user-1', config)
            expect(result.success).toBe(true)
            expect(result.remaining).toBe(1)

            jest.useRealTimers()
        })
    })

    describe('clearRateLimitStore', () => {
        it('should clear all rate limit entries', async () => {
            const config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 }

            // Add some entries
            await checkRateLimit('user-1', config)
            await checkRateLimit('user-2', config)
            await checkRateLimit('user-3', config)

            // Clear store
            await clearRateLimitStore()

            // All users should have full quota
            const result1 = await checkRateLimit('user-1', config)
            const result2 = await checkRateLimit('user-2', config)

            expect(result1.remaining).toBe(4) // First request, 5-1=4
            expect(result2.remaining).toBe(4)
        })
    })

    describe('cleanupExpiredEntries', () => {
        it('should execute cleanup without error', async () => {
            // Just verifying it doesn't crash since we can't easily check side effects of mocked supabase call here without more complex mocking
            await expect(cleanupExpiredEntries()).resolves.not.toThrow()
        })
    })

    describe('edge cases', () => {
        it('should handle empty identifier', async () => {
            const result = await checkRateLimit('', defaultConfig)
            expect(result.success).toBe(true)
        })

        it('should handle very high maxRequests', async () => {
            const config: RateLimitConfig = { maxRequests: 10000, windowMs: 60000 }
            const result = await checkRateLimit('user-1', config)
            expect(result.success).toBe(true)
            expect(result.remaining).toBe(9999)
        })

        it('should handle very short window', async () => {
            jest.useFakeTimers()
            const config: RateLimitConfig = { maxRequests: 1, windowMs: 100 }

            await checkRateLimit('user-1', config)
            let result = await checkRateLimit('user-1', config)
            expect(result.success).toBe(false)

            jest.advanceTimersByTime(150)
            result = await checkRateLimit('user-1', config)
            expect(result.success).toBe(true)

            jest.useRealTimers()
        })
    })
})
