// @ts-nocheck - TODO: Fix after regenerating Supabase types with proper PostgrestVersion
/**
 * Complete INK2 SRU Processor
 * Calculates all INK2/INK2R/INK2S fields from accounting data
 * 
 * This processor maps BAS accounts to SRU field codes
 * and generates complete declarations
 */

import type { Verification } from "@/hooks/use-verifications"
import type { SRUDeclaration, SRUField, TaxPeriod } from "@/types/sru"
import {
    INK2R_BALANCE_SHEET_FIELDS,
    INK2R_INCOME_STATEMENT_FIELDS,
    INK2S_FIELDS,
    INK2_MAIN_FIELDS,
    type FieldDefinition
} from "./ink2-fields"

// =============================================================================
// Types
// =============================================================================

export interface AccountBalance {
    account: string
    debit: number
    credit: number
    balance: number  // Credit - Debit (standard accounting sign)
}

export interface CompanyInfo {
    orgnr: string
    name: string
    fiscalYearStart: Date
    fiscalYearEnd: Date
}

export interface INK2CalculationResult {
    mainForm: SRUField[]       // INK2
    balanceSheet: SRUField[]   // INK2R balance
    incomeStatement: SRUField[] // INK2R income
    taxAdjustments: SRUField[] // INK2S
    summary: {
        totalAssets: number
        totalEquityAndLiabilities: number
        revenue: number
        expenses: number
        profit: number
        taxableIncome: number
    }
}

// =============================================================================
// Account Balance Calculator
// =============================================================================

/**
 * Calculate account balances from verifications for a specific period
 */
export function calculateAccountBalances(
    verifications: Verification[],
    startDate: Date,
    endDate: Date
): Map<string, AccountBalance> {
    const balances = new Map<string, AccountBalance>()

    verifications.forEach(v => {
        const vDate = new Date(v.date)
        if (vDate < startDate || vDate > endDate) return

        v.rows.forEach(row => {
            const existing = balances.get(row.account) || {
                account: row.account,
                debit: 0,
                credit: 0,
                balance: 0,
            }

            existing.debit += row.debit || 0
            existing.credit += row.credit || 0
            existing.balance = existing.credit - existing.debit

            balances.set(row.account, existing)
        })
    })

    return balances
}

/**
 * Sum balances for accounts within a range or list
 */
function sumAccounts(
    balances: Map<string, AccountBalance>,
    accountSpec: number[] | undefined,
    sign: '+' | '-' | '*' = '*'
): number {
    if (!accountSpec || accountSpec.length === 0) return 0

    let total = 0

    accountSpec.forEach(spec => {
        // Account spec can be a prefix (e.g., 3000 = accounts 3000-3099)
        const prefix = String(spec)

        balances.forEach((bal, account) => {
            if (account.startsWith(prefix.slice(0, 2))) {
                // More specific matching for 4-digit specs
                const accNum = parseInt(account.slice(0, 4))
                if (accNum >= spec && accNum < spec + 100) {
                    // Sign handling based on field definition
                    if (sign === '+') {
                        total += Math.max(0, bal.balance)
                    } else if (sign === '-') {
                        total += Math.min(0, bal.balance)
                    } else {
                        total += bal.balance
                    }
                }
            }
        })
    })

    return total
}

/**
 * Sum accounts matching a range
 */
function sumAccountRange(
    balances: Map<string, AccountBalance>,
    start: number,
    end: number
): number {
    let total = 0

    balances.forEach((bal, account) => {
        const accNum = parseInt(account.slice(0, 4))
        if (accNum >= start && accNum <= end) {
            total += bal.balance
        }
    })

    return total
}

// =============================================================================
// Field Calculators
// =============================================================================

/**
 * Calculate INK2R Balance Sheet fields
 */
function calculateBalanceSheet(balances: Map<string, AccountBalance>): SRUField[] {
    const fields: SRUField[] = []

    // Assets (Tillgångar) - accounts 1000-1999
    // Immateriella anläggningstillgångar (1000-1099)
    const intangibleAssets = Math.abs(sumAccountRange(balances, 1000, 1099))
    if (intangibleAssets > 0) {
        fields.push({ code: 7201, value: intangibleAssets })
    }

    // Materiella anläggningstillgångar - Byggnader (1100-1199)
    const buildings = Math.abs(sumAccountRange(balances, 1100, 1199))
    if (buildings > 0) {
        fields.push({ code: 7214, value: buildings })
    }

    // Maskiner och inventarier (1200-1299)
    const machinery = Math.abs(sumAccountRange(balances, 1200, 1299))
    if (machinery > 0) {
        fields.push({ code: 7215, value: machinery })
    }

    // Finansiella anläggningstillgångar (1300-1399)
    const financialAssets = Math.abs(sumAccountRange(balances, 1300, 1399))
    if (financialAssets > 0) {
        fields.push({ code: 7230, value: financialAssets })
    }

    // Varulager (1400-1499)
    const inventory = Math.abs(sumAccountRange(balances, 1400, 1499))
    if (inventory > 0) {
        fields.push({ code: 7243, value: inventory })
    }

    // Kundfordringar (1500-1599)
    const receivables = Math.abs(sumAccountRange(balances, 1500, 1599))
    if (receivables > 0) {
        fields.push({ code: 7251, value: receivables })
    }

    // Övriga fordringar (1600-1699)
    const otherReceivables = Math.abs(sumAccountRange(balances, 1600, 1699))
    if (otherReceivables > 0) {
        fields.push({ code: 7261, value: otherReceivables })
    }

    // Förutbetalda kostnader (1700-1799)
    const prepaidExpenses = Math.abs(sumAccountRange(balances, 1700, 1799))
    if (prepaidExpenses > 0) {
        fields.push({ code: 7263, value: prepaidExpenses })
    }

    // Kortfristiga placeringar (1800-1899)
    const shortTermInvestments = Math.abs(sumAccountRange(balances, 1800, 1899))
    if (shortTermInvestments > 0) {
        fields.push({ code: 7271, value: shortTermInvestments })
    }

    // Kassa och bank (1900-1999)
    const cashAndBank = Math.abs(sumAccountRange(balances, 1900, 1999))
    if (cashAndBank > 0) {
        fields.push({ code: 7281, value: cashAndBank })
    }

    // Equity and Liabilities (Eget kapital och skulder) - accounts 2000-2999

    // Eget kapital - bundet (2080-2089)
    const restrictedEquity = Math.abs(sumAccountRange(balances, 2080, 2089))
    if (restrictedEquity > 0) {
        fields.push({ code: 7301, value: restrictedEquity })
    }

    // Eget kapital - fritt (2090-2099)
    const unrestrictedEquity = Math.abs(sumAccountRange(balances, 2090, 2099))
    if (unrestrictedEquity > 0) {
        fields.push({ code: 7302, value: unrestrictedEquity })
    }

    // Obeskattade reserver - Periodiseringsfonder (2110-2129)
    const periodizationFunds = Math.abs(sumAccountRange(balances, 2110, 2129))
    if (periodizationFunds > 0) {
        fields.push({ code: 7321, value: periodizationFunds })
    }

    // Ackumulerade överavskrivningar (2150-2159)
    const accumulatedDepreciation = Math.abs(sumAccountRange(balances, 2150, 2159))
    if (accumulatedDepreciation > 0) {
        fields.push({ code: 7322, value: accumulatedDepreciation })
    }

    // Avsättningar för pensioner (2210-2239)
    const pensionProvisions = Math.abs(sumAccountRange(balances, 2210, 2239))
    if (pensionProvisions > 0) {
        fields.push({ code: 7331, value: pensionProvisions })
    }

    // Övriga avsättningar (2250-2299)
    const otherProvisions = Math.abs(sumAccountRange(balances, 2250, 2299))
    if (otherProvisions > 0) {
        fields.push({ code: 7333, value: otherProvisions })
    }

    // Långfristiga skulder (2300-2399)
    const longTermLiabilities = Math.abs(sumAccountRange(balances, 2300, 2399))
    if (longTermLiabilities > 0) {
        fields.push({ code: 7352, value: longTermLiabilities })
    }

    // Checkräkningskredit (2410-2419)
    const overdraft = Math.abs(sumAccountRange(balances, 2410, 2419))
    if (overdraft > 0) {
        fields.push({ code: 7360, value: overdraft })
    }

    // Leverantörsskulder (2440-2449)
    const accountsPayable = Math.abs(sumAccountRange(balances, 2440, 2449))
    if (accountsPayable > 0) {
        fields.push({ code: 7365, value: accountsPayable })
    }

    // Skatteskulder (2500-2599)
    const taxLiabilities = Math.abs(sumAccountRange(balances, 2500, 2599))
    if (taxLiabilities > 0) {
        fields.push({ code: 7368, value: taxLiabilities })
    }

    // Personalens källskatt (2700-2799)
    const withholdingTax = Math.abs(sumAccountRange(balances, 2700, 2799))
    if (withholdingTax > 0) {
        const existing = fields.find(f => f.code === 7368)
        if (existing && typeof existing.value === 'number') {
            existing.value = existing.value + withholdingTax
        } else {
            fields.push({ code: 7368, value: withholdingTax })
        }
    }

    // Övriga kortfristiga skulder (2800-2899)
    const otherShortTermLiabilities = Math.abs(sumAccountRange(balances, 2800, 2899))
    if (otherShortTermLiabilities > 0) {
        fields.push({ code: 7369, value: otherShortTermLiabilities })
    }

    // Upplupna kostnader (2900-2999)
    const accruedExpenses = Math.abs(sumAccountRange(balances, 2900, 2999))
    if (accruedExpenses > 0) {
        fields.push({ code: 7370, value: accruedExpenses })
    }

    return fields
}

/**
 * Calculate INK2R Income Statement fields
 */
function calculateIncomeStatement(balances: Map<string, AccountBalance>): SRUField[] {
    const fields: SRUField[] = []

    // Revenue (Intäkter) - accounts 3000-3999

    // Nettoomsättning (3000-3799)
    const revenue = Math.abs(sumAccountRange(balances, 3000, 3799))
    if (revenue > 0) {
        fields.push({ code: 7410, value: revenue })
    }

    // Övriga rörelseintäkter (3900-3999)
    const otherOperatingIncome = Math.abs(sumAccountRange(balances, 3900, 3999))
    if (otherOperatingIncome > 0) {
        fields.push({ code: 7413, value: otherOperatingIncome })
    }

    // Expenses (Kostnader) - accounts 4000-7999

    // Råvaror och förnödenheter (4000-4099)
    const rawMaterials = Math.abs(sumAccountRange(balances, 4000, 4099))
    if (rawMaterials > 0) {
        fields.push({ code: 7511, value: rawMaterials })
    }

    // Handelsvaror (4100-4899)
    const goods = Math.abs(sumAccountRange(balances, 4100, 4899))
    if (goods > 0) {
        fields.push({ code: 7512, value: goods })
    }

    // Övriga externa kostnader (5000-6999)
    const otherExternalExpenses = Math.abs(sumAccountRange(balances, 5000, 6999))
    if (otherExternalExpenses > 0) {
        fields.push({ code: 7513, value: otherExternalExpenses })
    }

    // Personalkostnader (7000-7699)
    const personnelCosts = Math.abs(sumAccountRange(balances, 7000, 7699))
    if (personnelCosts > 0) {
        fields.push({ code: 7514, value: personnelCosts })
    }

    // Avskrivningar (7800-7899)
    const depreciation = Math.abs(sumAccountRange(balances, 7800, 7899))
    if (depreciation > 0) {
        fields.push({ code: 7515, value: depreciation })
    }

    // Övriga rörelsekostnader (7900-7999)
    const otherOperatingExpenses = Math.abs(sumAccountRange(balances, 7900, 7999))
    if (otherOperatingExpenses > 0) {
        fields.push({ code: 7517, value: otherOperatingExpenses })
    }

    // Financial items (8000-8999)

    // Ränteintäkter (8300-8399)
    const interestIncome = Math.abs(sumAccountRange(balances, 8300, 8399))
    if (interestIncome > 0) {
        fields.push({ code: 7417, value: interestIncome })
    }

    // Räntekostnader (8400-8499)
    const interestExpenses = Math.abs(sumAccountRange(balances, 8400, 8499))
    if (interestExpenses > 0) {
        fields.push({ code: 7522, value: interestExpenses })
    }

    // Bokslutsdispositioner (8800-8899)
    const closingDispositionsPos = Math.abs(sumAccountRange(balances, 8810, 8819))
    if (closingDispositionsPos > 0) {
        fields.push({ code: 7419, value: closingDispositionsPos }) // Mottagna koncernbidrag
    }

    // Skatt på årets resultat (8900-8999)
    const incomeTax = Math.abs(sumAccountRange(balances, 8900, 8999))
    if (incomeTax > 0) {
        fields.push({ code: 7528, value: incomeTax })
    }

    // Calculate net result
    const totalRevenue = revenue + otherOperatingIncome + interestIncome + closingDispositionsPos
    const totalExpenses = rawMaterials + goods + otherExternalExpenses + personnelCosts +
        depreciation + otherOperatingExpenses + interestExpenses + incomeTax
    const netResult = totalRevenue - totalExpenses

    if (netResult >= 0) {
        fields.push({ code: 7450, value: netResult }) // Vinst
    } else {
        fields.push({ code: 7550, value: Math.abs(netResult) }) // Förlust
    }

    return fields
}

/**
 * Calculate INK2S Tax Adjustment fields
 */
function calculateTaxAdjustments(
    incomeStatementFields: SRUField[],
    balances: Map<string, AccountBalance>
): SRUField[] {
    const fields: SRUField[] = []

    // Get the accounting result
    const profitField = incomeStatementFields.find(f => f.code === 7450)
    const lossField = incomeStatementFields.find(f => f.code === 7550)

    if (profitField) {
        fields.push({ code: 7650, value: profitField.value })
    }
    if (lossField) {
        fields.push({ code: 7750, value: lossField.value })
    }

    // Add back non-deductible items (4.3)

    // Tax expense (not deductible)
    const taxExpense = Math.abs(sumAccountRange(balances, 8900, 8999))
    if (taxExpense > 0) {
        fields.push({ code: 7651, value: taxExpense })
    }

    // Representation (partially non-deductible)
    const representationCost = Math.abs(sumAccountRange(balances, 6070, 6079))
    if (representationCost > 0) {
        // Assume 50% non-deductible for simplicity
        const nonDeductible = Math.round(representationCost * 0.5)
        if (nonDeductible > 0) {
            fields.push({ code: 7653, value: nonDeductible })
        }
    }

    // Calculate taxable result
    const bookProfit = typeof profitField?.value === 'number' ? profitField.value : 0
    const bookLoss = typeof lossField?.value === 'number' ? lossField.value : 0
    const addBacks = taxExpense + (Math.round((representationCost || 0) * 0.5))

    const taxableResult = (bookProfit - bookLoss) + addBacks

    if (taxableResult >= 0) {
        fields.push({ code: 7670, value: taxableResult }) // Överskott
    } else {
        fields.push({ code: 7770, value: Math.abs(taxableResult) }) // Underskott
    }

    return fields
}

// =============================================================================
// Main Processor
// =============================================================================

export const INK2SRUProcessor = {
    /**
     * Calculate all INK2 fields from verifications
     */
    calculateAll(
        verifications: Verification[],
        company: CompanyInfo,
        taxPeriod: TaxPeriod
    ): INK2CalculationResult {
        // Calculate account balances for the fiscal year
        const balances = calculateAccountBalances(
            verifications,
            company.fiscalYearStart,
            company.fiscalYearEnd
        )

        // Calculate each section
        const balanceSheet = calculateBalanceSheet(balances)
        const incomeStatement = calculateIncomeStatement(balances)
        const taxAdjustments = calculateTaxAdjustments(incomeStatement, balances)

        // Format dates for main form
        const formatDate = (d: Date) =>
            `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

        // Main form fields
        const mainForm: SRUField[] = [
            { code: 7011, value: formatDate(company.fiscalYearStart) },
            { code: 7012, value: formatDate(company.fiscalYearEnd) },
        ]

        // Transfer result to main form
        const profit = taxAdjustments.find(f => f.code === 7670)
        const loss = taxAdjustments.find(f => f.code === 7770)

        if (profit) {
            mainForm.push({ code: 7104, value: profit.value })
        }
        if (loss) {
            mainForm.push({ code: 7114, value: loss.value })
        }

        // Calculate summary
        const totalAssets = balanceSheet
            .filter(f => typeof f.code === 'number' && f.code >= 7201 && f.code <= 7281)
            .reduce((sum, f) => sum + (typeof f.value === 'number' ? f.value : 0), 0)

        const totalEquityAndLiabilities = balanceSheet
            .filter(f => typeof f.code === 'number' && f.code >= 7301 && f.code <= 7370)
            .reduce((sum, f) => sum + (typeof f.value === 'number' ? f.value : 0), 0)

        const revenue = incomeStatement
            .filter(f => [7410, 7413, 7417, 7419].includes(f.code as number))
            .reduce((sum, f) => sum + (typeof f.value === 'number' ? f.value : 0), 0)

        const expenses = incomeStatement
            .filter(f => [7511, 7512, 7513, 7514, 7515, 7517, 7522, 7528].includes(f.code as number))
            .reduce((sum, f) => sum + (typeof f.value === 'number' ? f.value : 0), 0)

        return {
            mainForm,
            balanceSheet,
            incomeStatement,
            taxAdjustments,
            summary: {
                totalAssets,
                totalEquityAndLiabilities,
                revenue,
                expenses,
                profit: typeof profit?.value === 'number' ? profit.value : 0,
                taxableIncome: (typeof profit?.value === 'number' ? profit.value : 0) - (typeof loss?.value === 'number' ? loss.value : 0),
            },
        }
    },

    /**
     * Generate complete SRU declarations
     */
    generateDeclarations(
        verifications: Verification[],
        company: CompanyInfo,
        taxPeriod: TaxPeriod
    ): SRUDeclaration[] {
        const result = this.calculateAll(verifications, company, taxPeriod)

        const baseDecl = {
            orgnr: company.orgnr,
            name: company.name,
        }

        return [
            // INK2 Main form
            {
                ...baseDecl,
                blankettType: 'INK2' as const,
                period: taxPeriod,
                fields: result.mainForm,
            },
            // INK2R (both balance sheet and income statement combined)
            {
                ...baseDecl,
                blankettType: 'INK2R' as const,
                period: taxPeriod,
                fields: [
                    { code: 7011, value: result.mainForm.find(f => f.code === 7011)?.value || '' },
                    { code: 7012, value: result.mainForm.find(f => f.code === 7012)?.value || '' },
                    ...result.balanceSheet,
                    ...result.incomeStatement,
                ],
            },
            // INK2S
            {
                ...baseDecl,
                blankettType: 'INK2S' as const,
                period: taxPeriod,
                fields: [
                    { code: 7011, value: result.mainForm.find(f => f.code === 7011)?.value || '' },
                    { code: 7012, value: result.mainForm.find(f => f.code === 7012)?.value || '' },
                    ...result.taxAdjustments,
                ],
            },
        ]
    },
}
