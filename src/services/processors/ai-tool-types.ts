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
    status: 'active' | 'dissolved' | 'partially_dissolved'
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
// Investments - Properties
// ==========================================

export interface Property {
    id: string
    companyId: string
    name: string
    propertyType: string // e.g. 'industrial', 'residential'
    address?: string
    purchaseDate?: Date
    purchasePrice?: number
    landValue?: number
    buildingValue?: number
    depreciationRate: number // percent
    currentValue?: number
    basAccount: string
    notes?: string
    createdAt: Date
    updatedAt: Date
}

export interface CreatePropertyInput {
    name: string
    propertyType: string
    address?: string
    purchaseDate?: Date
    purchasePrice?: number
    landValue?: number
    buildingValue?: number
    depreciationRate?: number
    notes?: string
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

// ==========================================
// Investments - Crypto
// ==========================================

export interface CryptoHolding {
    id: string
    companyId: string
    coin: string // Symbol e.g. BTC
    amount: number
    purchaseDate?: Date
    purchasePriceSek?: number
    currentPriceSek?: number
    basAccount: string
    notes?: string
    createdAt: Date
    updatedAt: Date
}

export interface CryptoTransaction {
    id: string
    companyId: string
    coin: string
    transactionType: 'buy' | 'sell'
    amount: number
    priceSek: number
    totalSek: number
    transactionDate: Date
    notes?: string
    createdAt: Date
}

export interface CreateCryptoTransactionInput {
    coin: string
    transactionType: 'buy' | 'sell'
    amount: number
    priceSek: number
    transactionDate: Date
    notes?: string
}
