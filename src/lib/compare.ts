/**
 * Shared comparison utilities for sorting
 * Used by both hooks and services to maintain consistency
 */

/**
 * Compare two values for sorting, handling null/undefined
 * Null/undefined values are pushed to the end regardless of sort direction
 * 
 * @param aVal - First value to compare
 * @param bVal - Second value to compare
 * @returns Comparison result (-1, 0, or 1)
 */
export function compareValues(aVal: unknown, bVal: unknown): number {
    // Handle null/undefined - push them to the end
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1

    // String comparison
    if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal)
    }

    // Number comparison
    if (typeof aVal === "number" && typeof bVal === "number") {
        return aVal - bVal
    }

    // Date comparison
    if (aVal instanceof Date && bVal instanceof Date) {
        return aVal.getTime() - bVal.getTime()
    }

    // Boolean comparison (true > false)
    if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        return aVal === bVal ? 0 : aVal ? 1 : -1
    }

    // Fallback to string comparison
    return String(aVal).localeCompare(String(bVal))
}

/**
 * Compare two values with a direction multiplier
 * 
 * @param aVal - First value to compare
 * @param bVal - Second value to compare
 * @param direction - Sort direction (1 for asc, -1 for desc)
 * @returns Comparison result adjusted for direction
 */
export function compareValuesWithDirection(
    aVal: unknown, 
    bVal: unknown, 
    direction: 1 | -1
): number {
    const result = compareValues(aVal, bVal)
    // Only apply direction to actual comparisons, not null handling
    if (aVal == null || bVal == null || result === 0) return result
    return result * direction
}
