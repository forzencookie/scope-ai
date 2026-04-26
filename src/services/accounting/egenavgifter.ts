/**
 * Egenavgifter — Canonical Calculation
 *
 * Correct formula per IL 16 kap 29§:
 *   profit × 0.75 (25% schablonavdrag) × rate
 *
 * 7 fee components that sum to the full rate (~28.97% for 2026).
 * Shared by UI hook and AI tools.
 */

export interface EgenavgifterRates {
    sjukforsakring: number
    foraldraforsakring: number
    alderspension: number
    efterlevandepension: number
    arbetsmarknadsavgift: number
    arbetsskadeavgift: number
    allmanLoneavgift: number
}

export interface EgenavgifterOptions {
    reduced?: boolean       // Reduced rate (66+ years, only ålderspension)
    karens?: boolean        // Karens reduction (sjukförsäkring discount)
    karensReduction?: number // The karens reduction rate (e.g. 0.0076)
    reducedRate?: number    // The reduced rate to use (e.g. 0.1021)
}

export interface EgenavgifterComponent {
    name: string
    rate: number
    amount: number
}

export interface EgenavgifterResult {
    /** The profit base after 25% schablonavdrag */
    base: number
    /** Effective rate applied */
    rate: number
    /** Total egenavgifter amount */
    avgifter: number
    /** Net after egenavgifter */
    nettoEfterAvgifter: number
    /** Monthly net estimate */
    monthlyNet: number
    /** Breakdown of 7 fee components */
    components: EgenavgifterComponent[]
}

const COMPONENT_LABELS: Record<string, string> = {
    sjukforsakring: 'Sjukförsäkringsavgift',
    foraldraforsakring: 'Föräldraförsäkringsavgift',
    alderspension: 'Ålderspensionsavgift',
    efterlevandepension: 'Efterlevandepensionsavgift',
    arbetsmarknadsavgift: 'Arbetsmarknadsavgift',
    arbetsskadeavgift: 'Arbetsskadeavgift',
    allmanLoneavgift: 'Allmän löneavgift',
}

/**
 * Calculate egenavgifter using the correct formula:
 *   profit × 0.75 × rate
 *
 * The 25% schablonavdrag (IL 16 kap 29§) reduces the base before applying rates.
 */
export function calculateEgenavgifter(
    profit: number,
    rates: EgenavgifterRates,
    options?: EgenavgifterOptions
): EgenavgifterResult {
    const base = profit * 0.75 // 25% schablonavdrag

    if (options?.reduced) {
        const reducedRate = options.reducedRate ?? rates.alderspension
        const avgifter = Math.round(base * reducedRate)
        return {
            base,
            rate: reducedRate,
            avgifter,
            nettoEfterAvgifter: profit - avgifter,
            monthlyNet: Math.round((profit - avgifter) / 12),
            components: [],
        }
    }

    // Full rate: sum of all 7 components
    let fullRate = Object.values(rates).reduce((sum, r) => sum + r, 0)

    if (options?.karens) {
        fullRate -= options.karensReduction ?? 0
    }

    const components: EgenavgifterComponent[] = Object.entries(rates).map(([key, pct]) => ({
        name: COMPONENT_LABELS[key] || key,
        rate: pct,
        amount: Math.round(base * pct),
    }))

    const avgifter = Math.round(base * fullRate)

    return {
        base,
        rate: fullRate,
        avgifter,
        nettoEfterAvgifter: profit - avgifter,
        monthlyNet: Math.round((profit - avgifter) / 12),
        components,
    }
}
