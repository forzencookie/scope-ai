/**
 * Verification types — shared across services and AI tools.
 * Moved from hooks/use-verifications.ts during AI-native purge.
 */

export interface VerificationRow {
    account: string
    description: string
    debit: number
    credit: number
}

export interface Verification {
    id: string
    /** BFL series letter, e.g. "A", "B", "Y" */
    series?: string
    /** Sequential number within series, e.g. 1, 2, 3 */
    number?: number
    date: string
    description: string
    rows: VerificationRow[]
    sourceType?: string
    sourceId?: string
}
