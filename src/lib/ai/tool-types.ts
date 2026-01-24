/**
 * AI Tool Types
 * 
 * TypeScript interfaces for the AI-first tool architecture
 * covering tax optimization, benefits, and investments.
 */

// =============================================================================
// Periodiseringsfonder (Tax Allocation Reserves)
// =============================================================================

export interface Periodiseringsfond {
    id: string
    companyId: string
    year: number // Tax year the fond was created for
    amount: number
    dissolvedAmount: number // Amount dissolved so far
    expiresAt: Date // 6 years from creation
    status: 'active' | 'partially_dissolved' | 'dissolved'
    notes?: string
    createdAt: Date
    updatedAt: Date
}

export interface CreatePeriodiseringsfondInput {
    year: number
    amount: number
    notes?: string
}

// =============================================================================
// Förmåner (Employee Benefits)
// =============================================================================

export type BenefitCategory = 'tax_free' | 'taxable' | 'salary_sacrifice'

export interface FormanCatalogItem {
    id: string // e.g., 'friskvard', 'tjanstebil'
    name: string
    category: BenefitCategory
    maxAmount?: number // NULL if no limit
    taxFree: boolean
    formansvardeCalculation?: string // How to calculate taxable value
    description?: string
    rules?: Record<string, unknown> // Detailed rules per company type
    basAccount?: string
}

export interface EmployeeBenefit {
    id: string
    companyId: string
    employeeName: string
    benefitType: string // FK to formaner_catalog.id
    amount: number
    year: number
    month?: number
    formansvarde?: number // Calculated taxable value
    notes?: string
    createdAt: Date
}

export interface AssignBenefitInput {
    employeeName: string
    benefitType: string
    amount: number
    year: number
    month?: number
    notes?: string
}

// =============================================================================
// Investments: Properties (Fastigheter)
// =============================================================================

export type PropertyType = 'building' | 'land' | 'investment_property'

export interface Property {
    id: string
    companyId: string
    name: string
    propertyType?: PropertyType
    address?: string
    purchaseDate?: Date
    purchasePrice?: number
    landValue?: number // Separate for depreciation (land doesn't depreciate)
    buildingValue?: number
    depreciationRate: number // Typically 2-4%
    currentValue?: number // Book value after depreciation
    basAccount: string
    notes?: string
    createdAt: Date
    updatedAt: Date
}

export interface CreatePropertyInput {
    name: string
    propertyType?: PropertyType
    address?: string
    purchaseDate?: Date
    purchasePrice?: number
    landValue?: number
    buildingValue?: number
    depreciationRate?: number
    notes?: string
}

// =============================================================================
// Investments: Share Holdings (Aktieinnehav)
// =============================================================================

export type HoldingType = 'subsidiary' | 'associated' | 'other'

export interface ShareHolding {
    id: string
    companyId: string
    companyName: string // The company whose shares we hold
    orgNumber?: string
    holdingType: HoldingType
    sharesCount?: number
    purchaseDate?: Date
    purchasePrice?: number // Total acquisition cost
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
    holdingType?: HoldingType
    sharesCount?: number
    purchaseDate?: Date
    purchasePrice?: number
    notes?: string
}

// =============================================================================
// Investments: Crypto
// =============================================================================

export interface CryptoHolding {
    id: string
    companyId: string
    coin: string // 'BTC', 'ETH', etc.
    amount: number
    purchaseDate?: Date
    purchasePriceSek?: number
    currentPriceSek?: number
    basAccount: string
    notes?: string
    createdAt: Date
    updatedAt: Date
}

export type CryptoTransactionType = 'buy' | 'sell' | 'swap'

export interface CryptoTransaction {
    id: string
    companyId: string
    coin: string
    transactionType: CryptoTransactionType
    amount: number
    priceSek: number // Price per unit
    totalSek: number
    transactionDate: Date
    notes?: string
    createdAt: Date
}

export interface CreateCryptoTransactionInput {
    coin: string
    transactionType: CryptoTransactionType
    amount: number
    priceSek: number
    transactionDate: Date
    notes?: string
}

// =============================================================================
// Tax Calculations (for AI tool use)
// =============================================================================

export interface TaxSavingsCalculation {
    periodiseringsfondAmount: number
    taxRate: number // 20.6% for AB, income tax for EF
    taxSaved: number
    expiresAt: Date
}

export interface BenefitTaxImpact {
    benefitType: string
    amount: number
    taxFree: boolean
    formansvarde: number // Taxable value
    employeeTax: number
    employerFees: number
    netCost: number
}
