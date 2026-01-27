/**
 * Type Guards & Assertion Functions
 * 
 * Use these instead of `as any` for runtime-validated type narrowing.
 * This eliminates eslint-disable comments while maintaining type safety.
 * 
 * @example
 * // Instead of:
 * const data = response as any
 * 
 * // Use:
 * const data = asRecord(response)
 * if (hasProperty(data, 'invoice_number')) {
 *   console.log(data.invoice_number)
 * }
 */

// =============================================================================
// Basic Type Guards
// =============================================================================

/**
 * Check if value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value)
}

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
    return typeof value === 'string'
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value)
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean'
}

/**
 * Check if value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
    return value === null || value === undefined
}

// =============================================================================
// Property Guards
// =============================================================================

/**
 * Check if object has a specific property
 */
export function hasProperty<K extends string>(
    obj: unknown,
    key: K
): obj is Record<K, unknown> {
    return isObject(obj) && key in obj
}

/**
 * Check if object has all specified properties
 */
export function hasProperties<K extends string>(
    obj: unknown,
    keys: K[]
): obj is Record<K, unknown> {
    return isObject(obj) && keys.every(key => key in obj)
}

/**
 * Check if object has a string property
 */
export function hasStringProperty<K extends string>(
    obj: unknown,
    key: K
): obj is Record<K, string> {
    return hasProperty(obj, key) && isString(obj[key])
}

/**
 * Check if object has a number property
 */
export function hasNumberProperty<K extends string>(
    obj: unknown,
    key: K
): obj is Record<K, number> {
    return hasProperty(obj, key) && isNumber(obj[key])
}

// =============================================================================
// Safe Casts (with defaults)
// =============================================================================

/**
 * Safely cast unknown to Record, returns empty object if not valid
 */
export function asRecord(value: unknown): Record<string, unknown> {
    return isObject(value) ? value : {}
}

/**
 * Safely cast unknown to array, returns empty array if not valid
 */
export function asArray<T = unknown>(value: unknown): T[] {
    return isArray(value) ? (value as T[]) : []
}

/**
 * Safely cast unknown to string, returns default if not valid
 */
export function asString(value: unknown, defaultValue = ''): string {
    return isString(value) ? value : defaultValue
}

/**
 * Safely cast unknown to number, returns default if not valid
 */
export function asNumber(value: unknown, defaultValue = 0): number {
    return isNumber(value) ? value : defaultValue
}

/**
 * Safely cast unknown to boolean, returns default if not valid
 */
export function asBoolean(value: unknown, defaultValue = false): boolean {
    return isBoolean(value) ? value : defaultValue
}

// =============================================================================
// Assertion Functions (throw on invalid)
// =============================================================================

/**
 * Assert value is not null/undefined
 */
export function assertDefined<T>(
    value: T | null | undefined,
    message = 'Value is null or undefined'
): asserts value is T {
    if (value === null || value === undefined) {
        throw new Error(message)
    }
}

/**
 * Assert value is an object
 */
export function assertObject(
    value: unknown,
    message = 'Value is not an object'
): asserts value is Record<string, unknown> {
    if (!isObject(value)) {
        throw new Error(message)
    }
}

/**
 * Assert value is an array
 */
export function assertArray(
    value: unknown,
    message = 'Value is not an array'
): asserts value is unknown[] {
    if (!isArray(value)) {
        throw new Error(message)
    }
}

/**
 * Assert object has required properties
 */
export function assertHasProperties<K extends string>(
    value: unknown,
    keys: K[],
    message?: string
): asserts value is Record<K, unknown> {
    if (!hasProperties(value, keys)) {
        throw new Error(message ?? `Object missing required properties: ${keys.join(', ')}`)
    }
}

// =============================================================================
// Domain-Specific Type Guards
// =============================================================================

/**
 * Invoice type guard
 */
export interface InvoiceLike {
    id: string
    invoice_number?: string
    amount?: number
    total_amount?: number
}

export function isInvoiceLike(value: unknown): value is InvoiceLike {
    return hasStringProperty(value, 'id') && (
        hasProperty(value, 'invoice_number') ||
        hasProperty(value, 'amount') ||
        hasProperty(value, 'total_amount')
    )
}

/**
 * Receipt type guard
 */
export interface ReceiptLike {
    id: string
    supplier?: string
    amount?: number
}

export function isReceiptLike(value: unknown): value is ReceiptLike {
    return hasStringProperty(value, 'id') && (
        hasProperty(value, 'supplier') ||
        hasProperty(value, 'amount')
    )
}

/**
 * Transaction type guard
 */
export interface TransactionLike {
    id: string
    amount?: number
    amount_value?: number
    description?: string
}

export function isTransactionLike(value: unknown): value is TransactionLike {
    return hasStringProperty(value, 'id') && (
        hasProperty(value, 'amount') ||
        hasProperty(value, 'amount_value') ||
        hasProperty(value, 'description')
    )
}

// =============================================================================
// JSON Parse Helpers
// =============================================================================

/**
 * Safely parse JSON with type validation
 */
export function parseJsonAs<T>(
    json: string,
    validator: (value: unknown) => value is T,
    defaultValue: T
): T {
    try {
        const parsed = JSON.parse(json)
        return validator(parsed) ? parsed : defaultValue
    } catch {
        return defaultValue
    }
}

/**
 * Safely parse JSON to Record
 */
export function parseJsonRecord(json: string | null | undefined): Record<string, unknown> {
    if (!json) return {}
    try {
        const parsed = JSON.parse(json)
        return isObject(parsed) ? parsed : {}
    } catch {
        return {}
    }
}

/**
 * Safely parse JSON to array
 */
export function parseJsonArray<T = unknown>(json: string | null | undefined): T[] {
    if (!json) return []
    try {
        const parsed = JSON.parse(json)
        return isArray(parsed) ? (parsed as T[]) : []
    } catch {
        return []
    }
}
