export type BenefitCategory = 'tax_free' | 'taxable' | 'salary_sacrifice'

export interface FormanCatalogItem {
    id: string
    name: string
    category: BenefitCategory
    maxAmount?: number
    taxFree: boolean
    formansvardeCalculation?: string
    description?: string
    rules?: Record<string, unknown>
    basAccount?: string
}

export interface EmployeeBenefit {
    id: string
    companyId: string
    employeeName: string
    benefitType: string
    amount: number
    year: number
    month?: number
    formansvarde?: number
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

export interface BenefitTaxImpact {
    benefitType: string
    amount: number
    taxFree: boolean
    formansvarde: number
    employeeTax: number
    employerFees: number
    netCost: number
}
