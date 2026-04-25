export const PRICE_BASE_AMOUNTS: Record<number, number> = {
    2023: 52500,
    2024: 57300,
    2025: 58800,
    // Add future years as they are confirmed
}

export const FALLBACK_PBB = 57300 // Default to 2024 if year is out of range

/**
 * Gets the Price Base Amount (Prisbasbelopp) for a specific year.
 * Determined by the transaction date, not the current system date.
 */
export function getPriceBaseAmount(dateInput: Date | string): number {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    // Check for invalid date
    if (isNaN(date.getTime())) return FALLBACK_PBB

    const year = date.getFullYear()
    return PRICE_BASE_AMOUNTS[year] || FALLBACK_PBB
}

/**
 * Checks if an amount exceeds half the price base amount (halvt prisbasbelopp)
 * This is the threshold for "Inventarier av mindre värde" (check 5:1 K2-regler)
 */
export function isInventarieThresholdExceeded(amount: number, date: string | Date): boolean {
    const pbb = getPriceBaseAmount(date)
    const limit = pbb / 2
    return amount > limit
}
