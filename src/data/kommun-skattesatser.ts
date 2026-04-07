/**
 * Swedish municipal tax rates (kommunala skattesatser)
 *
 * Source: Skatteverket — skattesatser-kommuner-{year}.xlsx
 * Published yearly in December for the following year.
 * Download: https://skatteverket.se/download/18.1522bf3f19aea8075ba429/1765179297305/skattesatser-kommuner-2026.xlsx
 *
 * Update procedure:
 * 1. Download new xlsx from Skatteverket (published every December)
 * 2. Parse with: npx xlsx-cli file.xlsx | node parse-script.js > kommun-skattesatser-{year}.json
 * 3. Replace the JSON file in src/data/
 * 4. Update the import below to point to the new year
 */

import rates from './kommun-skattesatser-2026.json'

export interface KommunSkattesats {
    /** Municipal tax rate (kommunalskatt) */
    kommunalskatt: number
    /** Regional/county tax rate (landstingsskatt/regionskatt) */
    landstingsskatt: number
    /** Burial fee (begravningsavgift) */
    begravningsavgift: number
    /** Total tax rate excluding church fee (kommunalskatt + landstingsskatt + begravningsavgift) */
    total: number
}

const ratesMap = rates as Record<string, KommunSkattesats>

/**
 * Look up tax rates for a Swedish municipality.
 *
 * @param kommun - Municipality name (case-insensitive, e.g. "Stockholm", "Göteborg")
 * @returns Tax rates or null if kommun not found
 *
 * @example
 * const tax = getKommunSkattesats("Stockholm")
 * // { kommunalskatt: 18.22, landstingsskatt: 12.33, begravningsavgift: 0.07, total: 30.62 }
 */
export function getKommunSkattesats(kommun: string): KommunSkattesats | null {
    return ratesMap[kommun.toUpperCase()] ?? null
}

/**
 * Get all available municipality names.
 */
export function getAllKommuner(): string[] {
    return Object.keys(ratesMap)
}

/**
 * Current tax year for the loaded data.
 */
export const SKATTESATS_YEAR = 2026
