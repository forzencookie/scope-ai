
const svSEFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const svSEDateFormatter = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
})

export const formatCurrency = (value: number) => svSEFormatter.format(value)
export const formatDate = (date: Date | string) => svSEDateFormatter.format(new Date(date))

/**
 * Compact SEK formatter for tight spaces.
 * Full:    "1 234 567 kr"
 * Compact: "1,2M kr" (≥1 000 000), "123k kr" (≥100 000)
 * Below 100k just uses normal formatting with no decimals.
 */
export function formatSEKCompact(amount: number): string {
    const abs = Math.abs(amount)
    const sign = amount < 0 ? '-' : ''

    if (abs >= 1_000_000_000) {
        const val = abs / 1_000_000_000
        return `${sign}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}Md kr`
    }
    if (abs >= 1_000_000) {
        const val = abs / 1_000_000
        return `${sign}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M kr`
    }
    if (abs >= 100_000) {
        const val = Math.round(abs / 1_000)
        return `${sign}${val}k kr`
    }

    return amount.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + ' kr'
}

/**
 * Full SEK format (no decimals): "1 234 567 kr"
 */
export function formatSEK(amount: number): string {
    return amount.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + ' kr'
}

/**
 * Compact variant of formatCurrency (Intl-style "1 234 kr" → "123k kr")
 * Uses the same output style as formatCurrency but abbreviated.
 */
export function formatCurrencyCompact(amount: number): string {
    return formatSEKCompact(amount)
}
