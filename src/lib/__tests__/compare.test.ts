/**
 * Tests for comparison utilities
 */
import { compareValues, compareValuesWithDirection } from '../compare'

describe('compareValues', () => {
    describe('null/undefined handling', () => {
        it('should return 0 when both values are null', () => {
            expect(compareValues(null, null)).toBe(0)
        })

        it('should return 0 when both values are undefined', () => {
            expect(compareValues(undefined, undefined)).toBe(0)
        })

        it('should push null to end (return 1) when first value is null', () => {
            expect(compareValues(null, 'test')).toBe(1)
            expect(compareValues(null, 123)).toBe(1)
        })

        it('should push null to end (return -1) when second value is null', () => {
            expect(compareValues('test', null)).toBe(-1)
            expect(compareValues(123, null)).toBe(-1)
        })

        it('should handle mixed null and undefined', () => {
            expect(compareValues(null, undefined)).toBe(0)
            expect(compareValues(undefined, null)).toBe(0)
        })
    })

    describe('string comparison', () => {
        it('should compare strings alphabetically', () => {
            expect(compareValues('apple', 'banana')).toBeLessThan(0)
            expect(compareValues('banana', 'apple')).toBeGreaterThan(0)
            expect(compareValues('apple', 'apple')).toBe(0)
        })

        it('should handle empty strings', () => {
            expect(compareValues('', 'a')).toBeLessThan(0)
            expect(compareValues('a', '')).toBeGreaterThan(0)
            expect(compareValues('', '')).toBe(0)
        })

        it('should use locale-aware comparison', () => {
            // Swedish å should come after a
            expect(compareValues('å', 'a')).toBeGreaterThan(0)
        })
    })

    describe('number comparison', () => {
        it('should compare numbers correctly', () => {
            expect(compareValues(1, 2)).toBeLessThan(0)
            expect(compareValues(2, 1)).toBeGreaterThan(0)
            expect(compareValues(5, 5)).toBe(0)
        })

        it('should handle negative numbers', () => {
            expect(compareValues(-5, 5)).toBeLessThan(0)
            expect(compareValues(-1, -5)).toBeGreaterThan(0)
        })

        it('should handle decimals', () => {
            expect(compareValues(1.5, 1.6)).toBeLessThan(0)
            expect(compareValues(1.5, 1.5)).toBe(0)
        })

        it('should handle zero', () => {
            expect(compareValues(0, 1)).toBeLessThan(0)
            expect(compareValues(1, 0)).toBeGreaterThan(0)
            expect(compareValues(0, 0)).toBe(0)
        })
    })

    describe('date comparison', () => {
        it('should compare dates correctly', () => {
            const earlier = new Date('2024-01-01')
            const later = new Date('2024-12-31')

            expect(compareValues(earlier, later)).toBeLessThan(0)
            expect(compareValues(later, earlier)).toBeGreaterThan(0)
        })

        it('should return 0 for equal dates', () => {
            const date1 = new Date('2024-06-15')
            const date2 = new Date('2024-06-15')

            expect(compareValues(date1, date2)).toBe(0)
        })
    })

    describe('boolean comparison', () => {
        it('should compare booleans (true > false)', () => {
            expect(compareValues(true, false)).toBe(1)
            expect(compareValues(false, true)).toBe(-1)
            expect(compareValues(true, true)).toBe(0)
            expect(compareValues(false, false)).toBe(0)
        })
    })

    describe('mixed types fallback', () => {
        it('should fall back to string comparison for mixed types', () => {
            const result = compareValues('123', 456)
            expect(typeof result).toBe('number')
        })
    })
})

describe('compareValuesWithDirection', () => {
    describe('ascending (direction = 1)', () => {
        it('should return same result as compareValues', () => {
            expect(compareValuesWithDirection('a', 'b', 1)).toBeLessThan(0)
            expect(compareValuesWithDirection('b', 'a', 1)).toBeGreaterThan(0)
            expect(compareValuesWithDirection(1, 2, 1)).toBeLessThan(0)
        })
    })

    describe('descending (direction = -1)', () => {
        it('should reverse the comparison result', () => {
            expect(compareValuesWithDirection('a', 'b', -1)).toBeGreaterThan(0)
            expect(compareValuesWithDirection('b', 'a', -1)).toBeLessThan(0)
            expect(compareValuesWithDirection(1, 2, -1)).toBeGreaterThan(0)
        })

        it('should still return 0 for equal values', () => {
            // Note: -0 and 0 are equal in JavaScript but Object.is treats them differently
            expect(compareValuesWithDirection('a', 'a', -1)).toEqual(0)
            expect(compareValuesWithDirection(5, 5, -1)).toEqual(0)
        })
    })

    describe('null handling with direction', () => {
        it('should not reverse null handling (null always goes to end)', () => {
            // Null should always be pushed to end, regardless of direction
            expect(compareValuesWithDirection(null, 'test', 1)).toBe(1)
            expect(compareValuesWithDirection(null, 'test', -1)).toBe(1)
            expect(compareValuesWithDirection('test', null, 1)).toBe(-1)
            expect(compareValuesWithDirection('test', null, -1)).toBe(-1)
        })
    })
})
