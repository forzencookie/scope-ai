export interface Verification {
    id: number | string
    /** BFL display label, e.g. "A1" */
    verificationNumber: string
    date: string
    description: string
    amount: number
    konto: string
    kontoName: string
    hasTransaction: boolean
    hasUnderlag: boolean
    /** Verification entries (journal lines) */
    entries?: Array<{ account: string; debit: number; credit: number; description?: string }>
}

export interface VerificationStats {
    total: number
    withTransaction: number
    withUnderlag: number
    missingUnderlag: number
    totalAmount: number
}
