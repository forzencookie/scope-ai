/**
 * Salary entry creator
 * For recording payroll transactions (Swedish lönehantering)
 */

import type { JournalEntry, JournalEntryLine } from '../types'
import { roundToOre } from '../validation'
import { generateEntryId } from '../utils'
import { FALLBACK_TAX_RATES } from '@/services/tax-service'

/**
 * Swedish salary components
 */
export interface SalaryComponents {
  /** Gross salary (bruttolön) */
  grossSalary: number
  /** Preliminary tax withheld (preliminärskatt) */
  preliminaryTax: number
  /** Employer social contributions (arbetsgivaravgifter) */
  employerContributions: number
  /** Optional: pension contributions */
  pensionContribution?: number
  /** Optional: other deductions */
  otherDeductions?: number
}

export interface SalaryEntryParams {
  /** Payment date */
  date: string
  /** Employee name or description */
  description: string
  /** Salary components */
  salary: SalaryComponents
  /** Pay immediately from bank */
  paidImmediately?: boolean
  /** Bank account */
  bankAccount?: string
  /** Series identifier */
  series?: string
}

/**
 * Calculate Swedish employer contributions (arbetsgivaravgifter)
 * Rate is loaded from system_parameters when available, with fallback.
 * 
 * @param grossSalary Gross salary amount
 * @param rate Optional custom rate as decimal (e.g. 0.3142). Default from FALLBACK_TAX_RATES.
 */
export function calculateEmployerContributions(
  grossSalary: number,
  rate: number = FALLBACK_TAX_RATES.employerContributionRate
): number {
  return roundToOre(grossSalary * rate)
}

/**
 * Create a salary payment journal entry
 * 
 * Swedish payroll accounting flow:
 * 1. Debit 7010 (Löner) - gross salary as expense
 * 2. Debit 7510 (Arbetsgivaravgifter) - employer contributions
 * 3. Credit 2710 (Personalens källskatt) - tax liability
 * 4. Credit 2730 (Arbetsgivaravgifter skuld) - employer contribution liability
 * 5. Credit 2920 (Upplupna löner) or 1930 (Bank) - net salary
 * 
 * @example
 * createSalaryEntry({
 *   date: '2024-01-25',
 *   description: 'Lön januari - Anna Andersson',
 *   salary: {
 *     grossSalary: 45000,
 *     preliminaryTax: 13500,
 *     employerContributions: 14139, // 45000 * 0.3142
 *   },
 *   paidImmediately: true,
 * })
 */
export function createSalaryEntry(params: SalaryEntryParams): JournalEntry {
  const {
    date,
    description,
    salary,
    paidImmediately = false,
    bankAccount = '1930',
    series = 'L', // L-series for salary/payroll
  } = params

  const {
    grossSalary,
    preliminaryTax,
    employerContributions,
    pensionContribution = 0,
    otherDeductions = 0,
  } = salary

  const rows: JournalEntryLine[] = []

  // Net salary (what the employee receives)
  const netSalary = roundToOre(grossSalary - preliminaryTax - pensionContribution - otherDeductions)

  // 1. Debit salary expense (gross)
  rows.push({
    account: '7010',
    debit: roundToOre(grossSalary),
    credit: 0,
    description: 'Bruttolön',
  })

  // 2. Debit employer contributions expense
  rows.push({
    account: '7510',
    debit: roundToOre(employerContributions),
    credit: 0,
    description: 'Arbetsgivaravgifter',
  })

  // 3. Credit tax liability (källskatt)
  rows.push({
    account: '2710',
    debit: 0,
    credit: roundToOre(preliminaryTax),
    description: 'Personalens källskatt',
  })

  // 4. Credit employer contribution liability
  rows.push({
    account: '2730',
    debit: 0,
    credit: roundToOre(employerContributions),
    description: 'Skuld arbetsgivaravgifter',
  })

  // 5. Pension contribution if applicable
  if (pensionContribution > 0) {
    rows.push({
      account: '2740',
      debit: 0,
      credit: roundToOre(pensionContribution),
      description: 'Skuld pensionspremier',
    })
  }

  // 6. Other deductions if applicable
  if (otherDeductions > 0) {
    rows.push({
      account: '2790',
      debit: 0,
      credit: roundToOre(otherDeductions),
      description: 'Övriga löneavdrag',
    })
  }

  // 7. Net salary - either paid immediately or as accrued liability
  if (paidImmediately) {
    rows.push({
      account: bankAccount,
      debit: 0,
      credit: netSalary,
      description: 'Löneutbetalning',
    })
  } else {
    rows.push({
      account: '2920',
      debit: 0,
      credit: netSalary,
      description: 'Upplupna löner',
    })
  }

  return {
    id: generateEntryId(),
    date,
    description,
    series,
    rows,
    finalized: false,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Create a tax payment entry (paying off payroll taxes)
 * Used when paying Skatteverket on the 12th of each month
 */
export function createPayrollTaxPayment(params: {
  date: string
  description: string
  preliminaryTax: number
  employerContributions: number
  bankAccount?: string
  taxAccount?: string
  series?: string
}): JournalEntry {
  const {
    date,
    description,
    preliminaryTax,
    employerContributions,
    bankAccount = '1930',
    taxAccount = '1630', // Skattekonto
    series = 'L',
  } = params

  const totalAmount = roundToOre(preliminaryTax + employerContributions)

  return {
    id: generateEntryId(),
    date,
    description,
    series,
    rows: [
      // Clear tax liabilities
      {
        account: '2710',
        debit: roundToOre(preliminaryTax),
        credit: 0,
        description: 'Betalning källskatt',
      },
      {
        account: '2730',
        debit: roundToOre(employerContributions),
        credit: 0,
        description: 'Betalning arbetsgivaravgifter',
      },
      // Payment from bank
      {
        account: bankAccount,
        debit: 0,
        credit: totalAmount,
        description: 'Skattebetalning',
      },
    ],
    finalized: false,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Create a salary accrual entry (for monthly accruals)
 * Used for accruing vacation pay, bonuses, etc.
 */
export function createSalaryAccrual(params: {
  date: string
  description: string
  amount: number
  type: 'vacation' | 'bonus' | 'other'
  series?: string
}): JournalEntry {
  const { date, description, amount, type, series = 'L' } = params

  // Map type to accounts
  const accountMap = {
    vacation: { expense: '7090', liability: '2920' },
    bonus: { expense: '7010', liability: '2920' },
    other: { expense: '7090', liability: '2990' },
  }

  const accounts = accountMap[type]
  const roundedAmount = roundToOre(amount)

  return {
    id: generateEntryId(),
    date,
    description,
    series,
    rows: [
      {
        account: accounts.expense,
        debit: roundedAmount,
        credit: 0,
        description: `Reservering ${type === 'vacation' ? 'semesterlön' : type === 'bonus' ? 'bonus' : 'övrigt'}`,
      },
      {
        account: accounts.liability,
        debit: 0,
        credit: roundedAmount,
        description: 'Upplupen skuld',
      },
    ],
    finalized: false,
    createdAt: new Date().toISOString(),
  }
}
