/**
 * Tests for utility functions
 */
import { cn, delay, parseAmount, formatCurrency } from '../utils'

describe('cn (class name merger)', () => {
    it('should merge class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
        expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
        expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz')
    })

    it('should handle arrays of classes', () => {
        expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('should handle objects with boolean values', () => {
        expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })

    it('should merge tailwind classes correctly', () => {
        expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('should handle undefined and null', () => {
        expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
    })
})

describe('delay', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('should resolve immediately for 0 or negative values', async () => {
        const promise0 = delay(0)
        const promiseNeg = delay(-100)
        
        await expect(promise0).resolves.toBeUndefined()
        await expect(promiseNeg).resolves.toBeUndefined()
    })

    it('should wait for the specified time', async () => {
        const callback = jest.fn()
        delay(1000).then(callback)

        expect(callback).not.toHaveBeenCalled()
        
        jest.advanceTimersByTime(500)
        await Promise.resolve() // Flush promises
        expect(callback).not.toHaveBeenCalled()

        jest.advanceTimersByTime(500)
        await Promise.resolve()
        expect(callback).toHaveBeenCalled()
    })

    it('should cap delay at maximum value', async () => {
        const callback = jest.fn()
        delay(100000).then(callback) // 100 seconds

        jest.advanceTimersByTime(30000) // 30 seconds (max)
        await Promise.resolve()
        expect(callback).toHaveBeenCalled()
    })

    it('should reject immediately if signal already aborted', async () => {
        const controller = new AbortController()
        controller.abort()

        await expect(delay(1000, controller.signal)).rejects.toThrow('Delay aborted')
    })

    it('should reject when signal is aborted during delay', async () => {
        const controller = new AbortController()
        const promise = delay(5000, controller.signal)

        jest.advanceTimersByTime(1000)
        controller.abort()

        await expect(promise).rejects.toThrow('Delay aborted')
    })
})

describe('parseAmount', () => {
    describe('basic parsing', () => {
        it('should return 0 for invalid input', () => {
            expect(parseAmount('')).toBe(0)
            expect(parseAmount(null as unknown as string)).toBe(0)
            expect(parseAmount(undefined as unknown as string)).toBe(0)
        })

        it('should handle numbers passed as input', () => {
            expect(parseAmount(123 as unknown as string)).toBe(123)
        })

        it('should parse simple numbers', () => {
            expect(parseAmount('100')).toBe(100)
            expect(parseAmount('100.50')).toBe(100.50)
        })
    })

    describe('English format (period as decimal)', () => {
        it('should parse English format with commas', () => {
            expect(parseAmount('1,234.56')).toBe(1234.56)
            expect(parseAmount('1,234,567.89')).toBe(1234567.89)
        })

        it('should handle currency symbols', () => {
            expect(parseAmount('$1,234.56')).toBe(1234.56)
            expect(parseAmount('$100.00')).toBe(100)
        })

        it('should handle negative amounts', () => {
            expect(parseAmount('-$1,234.56')).toBe(-1234.56)
            expect(parseAmount('-1,234.56')).toBe(-1234.56)
        })
    })

    describe('Swedish format (comma as decimal)', () => {
        it('should parse Swedish format with spaces', () => {
            expect(parseAmount('1 234,56')).toBe(1234.56)
            expect(parseAmount('1234,56')).toBe(1234.56)
        })

        it('should handle Swedish currency', () => {
            expect(parseAmount('1 234,56 kr')).toBe(1234.56)
            expect(parseAmount('100,00 SEK')).toBe(100)
        })

        it('should handle periods as thousand separators', () => {
            expect(parseAmount('1.234,56')).toBe(1234.56)
        })
    })

    describe('edge cases', () => {
        it('should handle multiple thousand separators', () => {
            expect(parseAmount('1,234,567')).toBe(1234567)
            expect(parseAmount('1.234.567')).toBe(1234567)
        })

        it('should handle whitespace', () => {
            expect(parseAmount('  1234.56  ')).toBe(1234.56)
            expect(parseAmount('1 234 567')).toBe(1234567)
        })
    })
})

describe('formatCurrency', () => {
    it('should format positive amounts', () => {
        const result = formatCurrency(1234.56)
        // Result varies by locale, just check it's a string
        expect(typeof result).toBe('string')
        expect(result).toContain('1')
    })

    it('should format negative amounts', () => {
        const result = formatCurrency(-1234.56)
        expect(typeof result).toBe('string')
    })

    it('should format zero', () => {
        const result = formatCurrency(0)
        expect(typeof result).toBe('string')
        expect(result).toContain('0')
    })

    it('should handle custom locale and currency', () => {
        const result = formatCurrency(100, 'en-US', 'USD')
        expect(typeof result).toBe('string')
    })

    it('should handle non-finite numbers', () => {
        const result = formatCurrency(NaN)
        expect(typeof result).toBe('string')
        // Should return formatted 0 for non-finite values
    })
})
