/**
 * Salary entry creator
 * For recording payroll transactions (Swedish lönehantering)
 */

import type { JournalEntry, JournalEntryLine } from '../types'
import { DEFAULT_ACCOUNTS, PAYMENT_ACCOUNTS } from '../types'
import { roundToOre } from '../validation'
import { generateEntryId } from '../utils'

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
 *
 * @param grossSalary Gross salary amount
 * @param rate Employer contribution rate as decimal (e.g. 0.3142). Required — caller must fetch from taxService.
 */
export function calculateEmployerContributions(
  grossSalary: number,
  rate: number
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
    bankAccount = PAYMENT_ACCOUNTS.BANK,
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
    account: DEFAULT_ACCOUNTS.SALARY_EXPENSE,
    debit: roundToOre(grossSalary),
    credit: 0,
    description: 'Bruttolön',
  })

  // 2. Debit employer contributions expense
  rows.push({
    account: DEFAULT_ACCOUNTS.EMPLOYER_CONTRIBUTIONS_EXPENSE,
    debit: roundToOre(employerContributions),
    credit: 0,
    description: 'Arbetsgivaravgifter',
  })

  // 3. Credit tax liability (källskatt)
  rows.push({
    account: DEFAULT_ACCOUNTS.TAX_WITHHOLDING,
    debit: 0,
    credit: roundToOre(preliminaryTax),
    description: 'Personalens källskatt',
  })

  // 4. Credit employer contribution liability
  rows.push({
    account: DEFAULT_ACCOUNTS.EMPLOYER_CONTRIBUTIONS_LIABILITY,
    debit: 0,
    credit: roundToOre(employerContributions),
    description: 'Skuld arbetsgivaravgifter',
  })

  // 5. Pension contribution if applicable
  if (pensionContribution > 0) {
    rows.push({
      account: DEFAULT_ACCOUNTS.PENSION_LIABILITY,
      debit: 0,
      credit: roundToOre(pensionContribution),
      description: 'Skuld pensionspremier',
    })
  }

  // 6. Other deductions if applicable
  if (otherDeductions > 0) {
    rows.push({
      account: DEFAULT_ACCOUNTS.OTHER_DEDUCTIONS,
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
      account: DEFAULT_ACCOUNTS.ACCRUED_SALARIES,
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
    bankAccount = PAYMENT_ACCOUNTS.BANK,
    taxAccount = DEFAULT_ACCOUNTS.TAX_ACCOUNT,
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
        account: DEFAULT_ACCOUNTS.TAX_WITHHOLDING,
        debit: roundToOre(preliminaryTax),
        credit: 0,
        description: 'Betalning källskatt',
      },
      {
        account: DEFAULT_ACCOUNTS.EMPLOYER_CONTRIBUTIONS_LIABILITY,
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
 * Create a vacation pay accrual entry (Semesterlagen 12%)
 *
 * Swedish law requires employers to accrue vacation pay at 12% of gross salary.
 * This function calculates and creates the accrual entry automatically.
 *
 * @param grossSalary - The gross salary to calculate accrual from
 * @param vacationPayRate - Rate as decimal (default 0.12 per Semesterlagen)
 * @param date - Accrual date (YYYY-MM-DD)
 */
export function createVacationAccrual(params: {
  grossSalary: number
  vacationPayRate?: number
  date: string
  description?: string
  series?: string
}): JournalEntry {
  const {
    grossSalary,
    vacationPayRate = 0.12,
    date,
    description = 'Semesterlöneskuld',
    series = 'L',
  } = params

  const accrualAmount = roundToOre(grossSalary * vacationPayRate)

  return {
    id: generateEntryId(),
    date,
    description,
    series,
    rows: [
      {
        account: DEFAULT_ACCOUNTS.VACATION_PAY_EXPENSE,
        debit: accrualAmount,
        credit: 0,
        description: `Reservering semesterlön (${(vacationPayRate * 100).toFixed(0)}%)`,
      },
      {
        account: DEFAULT_ACCOUNTS.VACATION_PAY_LIABILITY,
        debit: 0,
        credit: accrualAmount,
        description: 'Upplupen semesterlöneskuld',
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
    vacation: { expense: DEFAULT_ACCOUNTS.VACATION_PAY_EXPENSE, liability: DEFAULT_ACCOUNTS.VACATION_PAY_LIABILITY },
    bonus: { expense: DEFAULT_ACCOUNTS.SALARY_EXPENSE, liability: DEFAULT_ACCOUNTS.ACCRUED_SALARIES },
    other: { expense: DEFAULT_ACCOUNTS.VACATION_PAY_EXPENSE, liability: '2990' },
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
