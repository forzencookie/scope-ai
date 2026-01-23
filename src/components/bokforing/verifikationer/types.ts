export interface Verification {
    id: number | string
    date: string
    description: string
    amount: number
    konto: string
    kontoName: string
    hasTransaction: boolean
    hasUnderlag: boolean
}

export interface VerificationStats {
    total: number
    withTransaction: number
    withUnderlag: number
    missingUnderlag: number
    totalAmount: number
}
