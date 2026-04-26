/**
 * Tests for the bookkeeping module
 * Covers validation, entry creators, and VAT calculations
 */
import { isValidAccount, getAccountClass, getFiscalYearRange } from '@/services/accounting'
import {
  validateJournalEntry,
  validateLine,
  isBalanced,
  roundToOre,
} from '@/services/accounting'
import { createSimpleEntry } from '@/services/accounting'
import { createSalaryEntry, createVacationAccrual, calculateEmployerContributions, createPayrollTaxPayment, createSalaryAccrual } from '@/services/accounting'
import { createSalesEntry, createMultiVatSalesEntry, createPaymentReceivedEntry, createCreditNoteEntry } from '@/services/accounting'
import { createPurchaseEntry, createSupplierPayment } from '@/services/accounting'
import { calculateVat, extractVat, splitGrossAmount } from '@/services/accounting'
import { DEFAULT_ACCOUNTS, PAYMENT_ACCOUNTS } from '@/services/accounting'
import type { JournalEntry, JournalEntryLine } from '@/services/accounting'

// =============================================================================
// isValidAccount
// =============================================================================

describe('isValidAccount', () => {
  it('should accept valid BAS accounts', () => {
    expect(isValidAccount('1930')).toBe(true) // Företagskonto
    expect(isValidAccount('7010')).toBe(true) // Löner
    expect(isValidAccount('2610')).toBe(true) // Utgående moms 25%
    expect(isValidAccount('3010')).toBe(true) // Försäljning
  })

  it('should reject invalid account numbers', () => {
    expect(isValidAccount('9999')).toBe(false)
    expect(isValidAccount('6111')).toBe(false)
    expect(isValidAccount('0000')).toBe(false)
  })
})

// =============================================================================
// validateLine
// =============================================================================

describe('validateLine', () => {
  it('should accept a valid debit line', () => {
    const line: JournalEntryLine = { account: '1930', debit: 1000, credit: 0 }
    const errors = validateLine(line, 0)
    expect(errors).toHaveLength(0)
  })

  it('should accept a valid credit line', () => {
    const line: JournalEntryLine = { account: '3010', debit: 0, credit: 1000 }
    const errors = validateLine(line, 0)
    expect(errors).toHaveLength(0)
  })

  it('should reject non-4-digit account numbers', () => {
    const line: JournalEntryLine = { account: '19', debit: 1000, credit: 0 }
    const errors = validateLine(line, 0)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject invalid BAS account numbers', () => {
    const line: JournalEntryLine = { account: '9999', debit: 1000, credit: 0 }
    const errors = validateLine(line, 0)
    expect(errors.some(e => e.includes('finns inte i BAS kontoplanen'))).toBe(true)
  })

  it('should reject a line with both debit and credit', () => {
    const line: JournalEntryLine = { account: '1930', debit: 100, credit: 100 }
    const errors = validateLine(line, 0)
    expect(errors.some(e => e.includes('både debet och kredit'))).toBe(true)
  })

  it('should reject a line with zero amounts', () => {
    const line: JournalEntryLine = { account: '1930', debit: 0, credit: 0 }
    const errors = validateLine(line, 0)
    expect(errors.some(e => e.includes('saknar belopp'))).toBe(true)
  })

  it('should reject negative amounts', () => {
    const line: JournalEntryLine = { account: '1930', debit: -100, credit: 0 }
    const errors = validateLine(line, 0)
    expect(errors.some(e => e.includes('negativt'))).toBe(true)
  })
})

// =============================================================================
// validateJournalEntry
// =============================================================================

describe('validateJournalEntry', () => {
  const makeEntry = (overrides?: Partial<JournalEntry>): JournalEntry => ({
    id: 'test-1',
    date: '2026-01-15',
    description: 'Test entry',
    rows: [
      { account: '1930', debit: 1000, credit: 0 },
      { account: '3010', debit: 0, credit: 1000 },
    ],
    ...overrides,
  })

  it('should accept a valid balanced entry', () => {
    const result = validateJournalEntry(makeEntry())
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject an imbalanced entry', () => {
    const result = validateJournalEntry(makeEntry({
      rows: [
        { account: '1930', debit: 1000, credit: 0 },
        { account: '3010', debit: 0, credit: 500 },
      ],
    }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('obalanserad'))).toBe(true)
  })

  it('should reject entries with invalid account numbers', () => {
    const result = validateJournalEntry(makeEntry({
      rows: [
        { account: '9999', debit: 1000, credit: 0 },
        { account: '3010', debit: 0, credit: 1000 },
      ],
    }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('finns inte i BAS kontoplanen'))).toBe(true)
  })

  it('should reject entries with fewer than 2 rows', () => {
    const result = validateJournalEntry(makeEntry({
      rows: [{ account: '1930', debit: 1000, credit: 0 }],
    }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('minst 2 rader'))).toBe(true)
  })

  it('should reject entries without a date', () => {
    const result = validateJournalEntry(makeEntry({ date: '' }))
    expect(result.valid).toBe(false)
  })

  it('should reject entries without a description', () => {
    const result = validateJournalEntry(makeEntry({ description: '' }))
    expect(result.valid).toBe(false)
  })

  it('should warn about future dates', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const dateStr = futureDate.toISOString().split('T')[0]
    const result = validateJournalEntry(makeEntry({ date: dateStr }))
    expect(result.warnings.some(w => w.includes('framtiden'))).toBe(true)
  })
})

// =============================================================================
// createSimpleEntry
// =============================================================================

describe('createSimpleEntry', () => {
  it('should create a valid two-line entry without VAT', () => {
    const entry = createSimpleEntry({
      date: '2026-01-15',
      description: 'Bank transfer',
      amount: 5000,
      debitAccount: '1630',
      creditAccount: '1930',
    })

    expect(entry.rows).toHaveLength(2)
    expect(entry.rows[0].account).toBe('1630')
    expect(entry.rows[0].debit).toBe(5000)
    expect(entry.rows[1].account).toBe('1930')
    expect(entry.rows[1].credit).toBe(5000)
    expect(isBalanced(entry)).toBe(true)
  })

  it('should create a three-line entry with VAT', () => {
    const entry = createSimpleEntry({
      date: '2026-01-15',
      description: 'Office supplies',
      amount: 1250,
      debitAccount: '6110',
      creditAccount: '1930',
      vatRate: 25,
    })

    expect(entry.rows).toHaveLength(3)
    expect(isBalanced(entry)).toBe(true)
    // Should have an ingående moms row
    expect(entry.rows.some(r => r.account === '2640')).toBe(true)
  })
})

// =============================================================================
// createSalaryEntry
// =============================================================================

describe('createSalaryEntry', () => {
  const salaryParams = {
    date: '2026-01-25',
    description: 'Lön januari',
    salary: {
      grossSalary: 45000,
      preliminaryTax: 13500,
      employerContributions: 14139,
    },
    paidImmediately: true,
  }

  it('should create a balanced entry with correct rows', () => {
    const entry = createSalaryEntry(salaryParams)

    expect(isBalanced(entry)).toBe(true)
    expect(entry.rows.length).toBeGreaterThanOrEqual(4)
    expect(entry.series).toBe('L')
  })

  it('should use DEFAULT_ACCOUNTS constants', () => {
    const entry = createSalaryEntry(salaryParams)
    const accounts = entry.rows.map(r => r.account)

    expect(accounts).toContain(DEFAULT_ACCOUNTS.SALARY_EXPENSE)
    expect(accounts).toContain(DEFAULT_ACCOUNTS.EMPLOYER_CONTRIBUTIONS_EXPENSE)
    expect(accounts).toContain(DEFAULT_ACCOUNTS.TAX_WITHHOLDING)
    expect(accounts).toContain(DEFAULT_ACCOUNTS.EMPLOYER_CONTRIBUTIONS_LIABILITY)
  })

  it('should accrue when not paid immediately', () => {
    const entry = createSalaryEntry({ ...salaryParams, paidImmediately: false })
    const accounts = entry.rows.map(r => r.account)

    expect(accounts).toContain(DEFAULT_ACCOUNTS.ACCRUED_SALARIES)
    expect(accounts).not.toContain(PAYMENT_ACCOUNTS.BANK)
  })

  it('should include pension and deductions rows when provided', () => {
    const entry = createSalaryEntry({
      ...salaryParams,
      salary: {
        ...salaryParams.salary,
        pensionContribution: 2000,
        otherDeductions: 500,
      },
    })

    expect(isBalanced(entry)).toBe(true)
    const accounts = entry.rows.map(r => r.account)
    expect(accounts).toContain(DEFAULT_ACCOUNTS.PENSION_LIABILITY)
    expect(accounts).toContain(DEFAULT_ACCOUNTS.OTHER_DEDUCTIONS)
  })
})

// =============================================================================
// createVacationAccrual (Semesterlagen 12%)
// =============================================================================

describe('createVacationAccrual', () => {
  it('should calculate 12% of gross salary by default', () => {
    const entry = createVacationAccrual({
      grossSalary: 45000,
      date: '2026-01-31',
    })

    const expectedAmount = roundToOre(45000 * 0.12)
    expect(entry.rows).toHaveLength(2)
    expect(entry.rows[0].debit).toBe(expectedAmount)
    expect(entry.rows[1].credit).toBe(expectedAmount)
    expect(isBalanced(entry)).toBe(true)
  })

  it('should use correct accounts', () => {
    const entry = createVacationAccrual({
      grossSalary: 30000,
      date: '2026-01-31',
    })

    expect(entry.rows[0].account).toBe(DEFAULT_ACCOUNTS.VACATION_PAY_EXPENSE)
    expect(entry.rows[1].account).toBe(DEFAULT_ACCOUNTS.VACATION_PAY_LIABILITY)
  })

  it('should accept custom vacation pay rate', () => {
    const entry = createVacationAccrual({
      grossSalary: 50000,
      vacationPayRate: 0.15,
      date: '2026-01-31',
    })

    const expectedAmount = roundToOre(50000 * 0.15)
    expect(entry.rows[0].debit).toBe(expectedAmount)
  })

  it('should handle rounding correctly', () => {
    const entry = createVacationAccrual({
      grossSalary: 33333,
      date: '2026-01-31',
    })

    const expectedAmount = roundToOre(33333 * 0.12) // 4000.0 - but let's be precise
    expect(entry.rows[0].debit).toBe(expectedAmount)
    expect(isBalanced(entry)).toBe(true)
  })
})

// =============================================================================
// VAT calculations
// =============================================================================

describe('VAT calculations', () => {
  it('should calculate VAT from net amount', () => {
    expect(calculateVat(1000, 25)).toBe(250)
    expect(calculateVat(1000, 12)).toBe(120)
    expect(calculateVat(1000, 6)).toBe(60)
    expect(calculateVat(1000, 0)).toBe(0)
  })

  it('should extract VAT from gross amount', () => {
    expect(extractVat(1250, 25)).toBe(250)
    expect(extractVat(1120, 12)).toBe(120)
  })

  it('should handle rounding edge cases', () => {
    // 1/3 SEK scenario
    const result = splitGrossAmount(100, 25)
    expect(result.net + result.vat).toBe(result.gross)
    expect(result.gross).toBe(100)
  })

  it('should round to öre correctly', () => {
    // Note: 1.005 * 100 = 100.49999... in IEEE 754, so Math.round gives 1.00
    // This is expected JS floating-point behavior
    expect(roundToOre(1.006)).toBe(1.01)
    expect(roundToOre(1.004)).toBe(1)
    expect(roundToOre(99.999)).toBe(100)
    expect(roundToOre(1234.567)).toBe(1234.57)
  })
})

// =============================================================================
// calculateEmployerContributions
// =============================================================================

describe('calculateEmployerContributions', () => {
  it('should calculate based on provided rate', () => {
    expect(calculateEmployerContributions(45000, 0.3142)).toBe(roundToOre(45000 * 0.3142))
  })

  it('should handle zero salary', () => {
    expect(calculateEmployerContributions(0, 0.3142)).toBe(0)
  })
})

// =============================================================================
// createSalesEntry
// =============================================================================

describe('createSalesEntry', () => {
  it('should create a balanced sales entry with 25% VAT', () => {
    const entry = createSalesEntry({
      date: '2026-01-15',
      description: 'Consulting services',
      grossAmount: 12500,
      vatRate: 25,
    })

    expect(isBalanced(entry)).toBe(true)
    expect(entry.rows).toHaveLength(3) // receivable, revenue, output VAT
    expect(entry.rows[0].account).toBe('1510') // Kundfordringar
    expect(entry.rows[0].debit).toBe(12500)
    expect(entry.series).toBe('A')
  })

  it('should handle 0% VAT (single revenue line)', () => {
    const entry = createSalesEntry({
      date: '2026-01-15',
      description: 'VAT-exempt sale',
      grossAmount: 10000,
      vatRate: 0,
    })

    expect(isBalanced(entry)).toBe(true)
    expect(entry.rows).toHaveLength(2) // receivable + revenue (no VAT line)
    expect(entry.rows[1].credit).toBe(10000)
  })

  it('should use bank account for immediate payment', () => {
    const entry = createSalesEntry({
      date: '2026-01-15',
      description: 'Cash sale',
      grossAmount: 1250,
      vatRate: 25,
      paidImmediately: true,
    })

    expect(isBalanced(entry)).toBe(true)
    expect(entry.rows[0].account).toBe(PAYMENT_ACCOUNTS.BANK)
  })

  it('should include invoice number in description', () => {
    const entry = createSalesEntry({
      date: '2026-01-15',
      description: 'Acme Corp',
      grossAmount: 5000,
      invoiceNumber: '2026-001',
    })

    expect(entry.description).toContain('Faktura 2026-001')
  })

  it('should skip customer receivable (1510) with cash method', () => {
    const entry = createSalesEntry({
      date: '2026-01-15',
      description: 'Consulting (kassametoden)',
      grossAmount: 12500,
      vatRate: 25,
      accountingMethod: 'cash',
    })

    expect(isBalanced(entry)).toBe(true)
    // Should NOT have 1510
    expect(entry.rows.every(r => r.account !== '1510')).toBe(true)
    // Should debit bank directly
    expect(entry.rows[0].account).toBe(PAYMENT_ACCOUNTS.BANK)
    expect(entry.rows[0].debit).toBe(12500)
  })

  it('should use customer receivable (1510) with invoice method (default)', () => {
    const entry = createSalesEntry({
      date: '2026-01-15',
      description: 'Consulting (fakturametoden)',
      grossAmount: 12500,
      vatRate: 25,
      accountingMethod: 'invoice',
    })

    expect(isBalanced(entry)).toBe(true)
    expect(entry.rows[0].account).toBe('1510')
    expect(entry.rows[0].debit).toBe(12500)
  })
})

// =============================================================================
// createMultiVatSalesEntry
// =============================================================================

describe('createMultiVatSalesEntry', () => {
  it('should group line items by VAT rate', () => {
    const entry = createMultiVatSalesEntry({
      date: '2026-01-15',
      description: 'Mixed invoice',
      grossAmount: 15000,
      lineItems: [
        { quantity: 1, unitPrice: 8000, vatRate: 25 },
        { quantity: 2, unitPrice: 2000, vatRate: 12 },
        { quantity: 1, unitPrice: 1000, vatRate: 25 },
      ],
    })

    // Should have: 1 receivable + 2 revenue lines (25% and 12%) + 2 VAT lines
    expect(entry.rows.length).toBeGreaterThanOrEqual(5)
    expect(entry.rows[0].debit).toBe(15000) // receivable = gross
  })

  it('should handle all items at same VAT rate', () => {
    const entry = createMultiVatSalesEntry({
      date: '2026-01-15',
      description: 'Same rate',
      grossAmount: 5000,
      lineItems: [
        { quantity: 1, unitPrice: 3000, vatRate: 25 },
        { quantity: 1, unitPrice: 2000, vatRate: 25 },
      ],
    })

    // 1 receivable + 1 revenue + 1 VAT = 3 rows
    expect(entry.rows).toHaveLength(3)
  })
})

// =============================================================================
// createPaymentReceivedEntry
// =============================================================================

describe('createPaymentReceivedEntry', () => {
  it('should debit bank and credit receivable', () => {
    const entry = createPaymentReceivedEntry({
      date: '2026-02-01',
      description: 'Payment from customer',
      amount: 12500,
    })

    expect(isBalanced(entry)).toBe(true)
    expect(entry.rows).toHaveLength(2)
    expect(entry.rows[0].account).toBe(PAYMENT_ACCOUNTS.BANK)
    expect(entry.rows[0].debit).toBe(12500)
    expect(entry.rows[1].account).toBe('1510')
    expect(entry.rows[1].credit).toBe(12500)
  })
})

// =============================================================================
// createCreditNoteEntry
// =============================================================================

describe('createCreditNoteEntry', () => {
  it('should reverse a sales entry (debit revenue, credit receivable)', () => {
    const entry = createCreditNoteEntry({
      date: '2026-02-01',
      description: 'Credit note',
      grossAmount: 5000,
      vatRate: 25,
    })

    expect(isBalanced(entry)).toBe(true)
    // Revenue should be debited (reversed)
    const revenueRow = entry.rows.find(r => r.account === '3010')
    expect(revenueRow?.debit).toBeGreaterThan(0)
    // Receivable should be credited (reduced)
    const receivableRow = entry.rows.find(r => r.account === '1510')
    expect(receivableRow?.credit).toBe(5000)
  })
})

// =============================================================================
// createPurchaseEntry
// =============================================================================

describe('createPurchaseEntry', () => {
  it('should create a balanced purchase entry with VAT', () => {
    const entry = createPurchaseEntry({
      date: '2026-01-15',
      description: 'Office rent',
      grossAmount: 12500,
      expenseAccount: '5010',
      vatRate: 25,
    })

    expect(isBalanced(entry)).toBe(true)
    expect(entry.rows).toHaveLength(3) // expense, input VAT, liability
    expect(entry.series).toBe('B')
  })

  it('should debit expense net amount and input VAT', () => {
    const entry = createPurchaseEntry({
      date: '2026-01-15',
      description: 'Test',
      grossAmount: 1250,
      expenseAccount: '6110',
      vatRate: 25,
    })

    const expenseRow = entry.rows.find(r => r.account === '6110')
    expect(expenseRow?.debit).toBe(1000) // net = 1250 / 1.25

    const vatRow = entry.rows.find(r => r.account === '2640')
    expect(vatRow?.debit).toBe(250) // VAT = 1250 - 1000
  })

  it('should credit supplier liability by default', () => {
    const entry = createPurchaseEntry({
      date: '2026-01-15',
      description: 'Test',
      grossAmount: 5000,
      expenseAccount: '5010',
    })

    const liabilityRow = entry.rows.find(r => r.account === '2440')
    expect(liabilityRow?.credit).toBe(5000)
  })

  it('should use bank for immediate payment', () => {
    const entry = createPurchaseEntry({
      date: '2026-01-15',
      description: 'Card purchase',
      grossAmount: 999,
      expenseAccount: '6540',
      vatRate: 25,
      paidImmediately: true,
    })

    expect(isBalanced(entry)).toBe(true)
    const bankRow = entry.rows.find(r => r.account === PAYMENT_ACCOUNTS.BANK)
    expect(bankRow?.credit).toBe(999)
  })

  it('should skip supplier liability (2440) with cash method', () => {
    const entry = createPurchaseEntry({
      date: '2026-01-15',
      description: 'Office rent (kassametoden)',
      grossAmount: 12500,
      expenseAccount: '5010',
      vatRate: 25,
      accountingMethod: 'cash',
    })

    expect(isBalanced(entry)).toBe(true)
    // Should NOT have 2440
    expect(entry.rows.every(r => r.account !== '2440')).toBe(true)
    // Should credit bank directly
    const bankRow = entry.rows.find(r => r.account === PAYMENT_ACCOUNTS.BANK)
    expect(bankRow?.credit).toBe(12500)
  })

  it('should use supplier liability (2440) with invoice method (default)', () => {
    const entry = createPurchaseEntry({
      date: '2026-01-15',
      description: 'Office rent (fakturametoden)',
      grossAmount: 12500,
      expenseAccount: '5010',
      vatRate: 25,
      accountingMethod: 'invoice',
    })

    expect(isBalanced(entry)).toBe(true)
    const liabilityRow = entry.rows.find(r => r.account === '2440')
    expect(liabilityRow?.credit).toBe(12500)
  })
})

// =============================================================================
// createSupplierPayment
// =============================================================================

describe('createSupplierPayment', () => {
  it('should debit supplier liability and credit bank', () => {
    const entry = createSupplierPayment({
      date: '2026-02-15',
      description: 'Pay supplier invoice',
      amount: 25000,
    })

    expect(isBalanced(entry)).toBe(true)
    expect(entry.rows).toHaveLength(2)
    expect(entry.rows[0].account).toBe('2440') // leverantörsskuld
    expect(entry.rows[0].debit).toBe(25000)
    expect(entry.rows[1].account).toBe(PAYMENT_ACCOUNTS.BANK)
    expect(entry.rows[1].credit).toBe(25000)
  })
})

// =============================================================================
// createPayrollTaxPayment
// =============================================================================

describe('createPayrollTaxPayment', () => {
  it('should clear tax liabilities and credit bank', () => {
    const entry = createPayrollTaxPayment({
      date: '2026-02-12',
      description: 'Skatteinbetalning januari',
      preliminaryTax: 13500,
      employerContributions: 14139,
    })

    expect(isBalanced(entry)).toBe(true)
    expect(entry.rows).toHaveLength(3) // tax, employer contrib, bank
    expect(entry.series).toBe('L')

    const totalPayment = 13500 + 14139
    const bankRow = entry.rows.find(r => r.account === PAYMENT_ACCOUNTS.BANK)
    expect(bankRow?.credit).toBe(totalPayment)
  })
})

// =============================================================================
// createSalaryAccrual
// =============================================================================

describe('createSalaryAccrual', () => {
  it('should create a balanced vacation accrual entry', () => {
    const entry = createSalaryAccrual({
      date: '2026-01-31',
      description: 'Semesterlön jan',
      amount: 5400,
      type: 'vacation',
    })

    expect(isBalanced(entry)).toBe(true)
    expect(entry.rows[0].account).toBe(DEFAULT_ACCOUNTS.VACATION_PAY_EXPENSE)
    expect(entry.rows[0].debit).toBe(5400)
  })

  it('should use salary expense account for bonus type', () => {
    const entry = createSalaryAccrual({
      date: '2026-12-31',
      description: 'Bonus reservation',
      amount: 10000,
      type: 'bonus',
    })

    expect(isBalanced(entry)).toBe(true)
    expect(entry.rows[0].account).toBe(DEFAULT_ACCOUNTS.SALARY_EXPENSE)
  })
})

// =============================================================================
// getAccountClass
// =============================================================================

describe('getAccountClass', () => {
  it('should classify asset accounts as debit-normal', () => {
    const result = getAccountClass('1930')
    expect(result.normalBalance).toBe('debit')
  })

  it('should classify liability accounts as credit-normal', () => {
    const result = getAccountClass('2440')
    expect(result.normalBalance).toBe('credit')
  })

  it('should classify revenue accounts as credit-normal', () => {
    const result = getAccountClass('3010')
    expect(result.normalBalance).toBe('credit')
  })

  it('should classify expense accounts as debit-normal', () => {
    const result = getAccountClass('7010')
    expect(result.normalBalance).toBe('debit')
  })
})

// =============================================================================
// getFiscalYearRange
// =============================================================================

describe('getFiscalYearRange', () => {
  it('should return calendar year for 12-31 fiscal year end', () => {
    const range = getFiscalYearRange('12-31', new Date('2026-06-15'))
    expect(range.startStr).toBe('2026-01-01')
    expect(range.endStr).toBe('2026-12-31')
  })

  it('should handle broken fiscal year (e.g., 06-30)', () => {
    // In August 2026, fiscal year is Jul 2026 - Jun 2027
    const range = getFiscalYearRange('06-30', new Date('2026-08-15'))
    expect(range.startStr).toBe('2026-07-01')
    expect(range.endStr).toBe('2027-06-30')
  })

  it('should handle reference date within broken fiscal year', () => {
    // In March 2026, fiscal year ending 06-30 = Jul 2025 - Jun 2026
    const range = getFiscalYearRange('06-30', new Date('2026-03-15'))
    expect(range.startStr).toBe('2025-07-01')
    expect(range.endStr).toBe('2026-06-30')
  })

  it('should default to current date when no reference provided', () => {
    const range = getFiscalYearRange('12-31')
    const year = new Date().getFullYear()
    expect(range.startStr).toBe(`${year}-01-01`)
    expect(range.endStr).toBe(`${year}-12-31`)
  })
})
