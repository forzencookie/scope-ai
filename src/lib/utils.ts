import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Maximum delay to prevent accidental long waits */
const MAX_DELAY_MS = 30000

/**
 * Async delay utility for simulating network latency
 * @param ms - Milliseconds to wait (skips if 0 or negative, capped at 30s)
 * @param signal - Optional AbortSignal for cancellation
 */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  if (signal?.aborted) return Promise.reject(new DOMException('Delay aborted', 'AbortError'))

  const clampedMs = Math.min(ms, MAX_DELAY_MS)

  return new Promise((resolve, reject) => {
    const onTimeout = () => {
      cleanup()
      resolve()
    }

    const onAbort = () => {
      clearTimeout(timeoutId)
      reject(new DOMException('Delay aborted', 'AbortError'))
    }

    const cleanup = () => signal?.removeEventListener('abort', onAbort)

    const timeoutId = setTimeout(onTimeout, clampedMs)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Parse amount string to number, removing currency symbols
 * Handles both Swedish (1 234,56) and English (1,234.56) formats
 * Returns 0 for invalid input instead of NaN
 * @example parseAmount("-$1,234.56") => -1234.56
 * @example parseAmount("1 234,56 kr") => 1234.56
 * @example parseAmount("-1,234,567.89") => -1234567.89
 */
export function parseAmount(amount: string): number {
  if (!amount || typeof amount !== 'string') return 0

  // Preserve the sign before normalization
  const isNegative = amount.includes('-')

  // Remove all whitespace
  let normalized = amount.replace(/\s/g, '')

  // Count separators to determine format
  const commaCount = (normalized.match(/,/g) || []).length
  const periodCount = (normalized.match(/\./g) || []).length
  const lastComma = normalized.lastIndexOf(',')
  const lastPeriod = normalized.lastIndexOf('.')

  // Determine format based on separator positions and counts
  if (lastComma > lastPeriod && commaCount === 1) {
    // Swedish format: 1.234,56 or 1234,56 (comma is decimal separator)
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else if (lastPeriod > lastComma && periodCount === 1) {
    // English format: 1,234.56 or 1234.56 (period is decimal separator)
    normalized = normalized.replace(/,/g, '')
  } else if (commaCount > 1) {
    // Multiple commas = thousand separators: 1,234,567
    normalized = normalized.replace(/,/g, '')
  } else if (periodCount > 1) {
    // Multiple periods = thousand separators: 1.234.567
    normalized = normalized.replace(/\./g, '')
  } else {
    // Single separator or no separator - remove commas for safety
    normalized = normalized.replace(/,/g, '')
  }

  // Keep only digits and decimal point
  normalized = normalized.replace(/[^\d.]/g, '')

  const parsed = parseFloat(normalized)
  if (!Number.isFinite(parsed)) return 0

  // Apply sign if original was negative
  return isNegative ? -Math.abs(parsed) : parsed
}

/**
 * Parse date string to Date object
 * Returns null for invalid dates instead of Invalid Date
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Safely parse date, returning a fallback for invalid input
 */
export function parseDateSafe(dateString: string, fallback: Date = new Date()): Date {
  return parseDate(dateString) ?? fallback
}

/**
 * Format a number as currency
 * @example formatCurrency(-1234.56) => "-1 234,56 kr"
 * @example formatCurrency(1234.56, "sv-SE", "SEK", 0) => "1 235 kr"
 */
export function formatCurrency(
  amount: number,
  locale = "sv-SE",
  currency = "SEK",
  minimumFractionDigits = 2
): string {
  if (!Number.isFinite(amount)) return formatCurrency(0, locale, currency, minimumFractionDigits)

  // Prevent -0 display by normalizing small negative numbers to 0
  // If the absolute amount is less than half of the smallest fraction digit, it rounds to zero.
  // We explicitly set it to positive 0 to avoid "-0,00 kr"
  const epsilon = 0.5 * Math.pow(10, -minimumFractionDigits)
  if (Math.abs(amount) < epsilon) {
    amount = 0
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(amount)
}

/**
 * Format a date string for display
 * @example formatDate("2024-01-15") => "2024-01-15" (sv-SE locale)
 * @example formatDate("2024-01-15", { month: "long" }) => "15 januari 2024"
 */
export function formatDate(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions,
  locale = "sv-SE"
): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(locale, options)
}

/**
 * Format a date with full year, month name, and day
 * @example formatDateLong("2024-01-15") => "15 januari 2024"
 */
export function formatDateLong(dateStr: string, locale = "sv-SE"): string {
  return formatDate(dateStr, { year: "numeric", month: "long", day: "numeric" }, locale)
}

/**
 * Format a date with short month
 * @example formatDateShort("2024-01-15") => "15 jan"
 */
export function formatDateShort(dateStr: string, locale = "sv-SE"): string {
  return formatDate(dateStr, { month: "short", day: "numeric" }, locale)
}

/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Debounced function interface with cancel and flush capabilities
 */
export interface DebouncedFunction<T extends (...args: unknown[]) => void> {
  (...args: Parameters<T>): void
  /** Cancel any pending debounced calls */
  cancel: () => void
  /** Immediately execute pending call if any */
  flush: () => void
}

/**
 * Debounce a function call with cancel and flush support
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let pendingArgs: Parameters<T> | null = null

  const debounced = ((...args: Parameters<T>) => {
    pendingArgs = args
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn(...args)
      pendingArgs = null
      timeoutId = null
    }, delayMs)
  }) as DebouncedFunction<T>

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    pendingArgs = null
  }

  debounced.flush = () => {
    if (timeoutId && pendingArgs) {
      clearTimeout(timeoutId)
      fn(...pendingArgs)
      timeoutId = null
      pendingArgs = null
    }
  }

  return debounced
}
