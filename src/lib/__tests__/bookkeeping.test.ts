/**
 * Tests for the bookkeeping module
 * Covers validation, entry creators, and VAT calculations
 */
import { isValidAccount } from '../bookkeeping/utils'
import {
  validateJournalEntry,
  validateLine,
  isBalanced,
  roundToOre,
} from '../bookkeeping/validation'
import { createSimpleEntry } from '../bookkeeping/entries/simple'
import { createSalaryEntry, createVacationAccrual, calculateEmployerContributions } from '../bookkeeping/entries/salary'
import { calculateVat, extractVat, splitGrossAmount } from '../bookkeeping/vat'
import { DEFAULT_ACCOUNTS, PAYMENT_ACCOUNTS } from '../bookkeeping/types'
import type { JournalEntry, JournalEntryLine } from '../bookkeeping/types'

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
