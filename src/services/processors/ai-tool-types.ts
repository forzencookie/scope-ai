// AI Tool Types for Processors

// ==========================================
// Periodiseringsfonder
// ==========================================

export interface Periodiseringsfond {
    id: string
    companyId: string
    year: number
    amount: number
    dissolvedAmount: number
    expiresAt: Date
    status: 'active' | 'dissolved' | 'partially_dissolved' | 'expired'
    notes?: string
    createdAt: Date
    updatedAt: Date
}

export interface CreatePeriodiseringsfondInput {
    year: number
    amount: number
    notes?: string
}

export interface TaxSavingsCalculation {
    periodiseringsfondAmount: number
    taxRate: number
    taxSaved: number
    expiresAt: Date
}

// ==========================================
// Investments - Share Holdings
// ==========================================

export interface ShareHolding {
    id: string
    companyId: string
    companyName: string
    orgNumber?: string
    holdingType: 'listed' | 'unlisted' | 'subsidiary' | 'associate' | 'other'
    sharesCount: number
    purchaseDate?: Date
    purchasePrice?: number
    currentValue?: number
    dividendReceived: number
    basAccount: string
    notes?: string
    createdAt: Date
    updatedAt: Date
}

export interface CreateShareHoldingInput {
    companyName: string
    orgNumber?: string
    holdingType?: ShareHolding['holdingType']
    sharesCount: number
    purchaseDate?: Date
    purchasePrice?: number
    notes?: string
}
