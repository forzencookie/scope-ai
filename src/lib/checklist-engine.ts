/**
 * Checklist Engine — Dynamic Avstämningskoll
 *
 * Pure utility (no React). Derives which reconciliation checks apply
 * for a given company profile + month, and resolves auto/manual states.
 */

import type { CompanyType } from './company-types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckDefinition {
  id: string
  label: string
  description: string
  type: 'auto' | 'manual'
}

export interface ResolvedCheck extends CheckDefinition {
  value: boolean
}

export interface ChecklistCompanyProfile {
  companyType: CompanyType
  hasEmployees: boolean
  hasMomsRegistration: boolean
  vatFrequency: 'monthly' | 'quarterly' | 'annually'
  fiscalYearEnd: string // "MM-DD"
}

// ---------------------------------------------------------------------------
// Check definitions (static catalogue)
// ---------------------------------------------------------------------------

const CHECKS: Record<string, CheckDefinition> = {
  no_pending_transactions: {
    id: 'no_pending_transactions',
    label: 'Inga obokförda transaktioner',
    description: 'Alla transaktioner är bokförda under perioden.',
    type: 'auto',
  },
  bank_reconciled: {
    id: 'bank_reconciled',
    label: 'Avstämning bankkonto (1930)',
    description: 'Kontrollera att bokfört saldo stämmer med kontoutdraget.',
    type: 'manual',
  },
  vat_reported: {
    id: 'vat_reported',
    label: 'Momsdeklaration inlämnad',
    description: 'Momsrapport skapad, kontrollerad och inlämnad.',
    type: 'manual',
  },
  agi_reported: {
    id: 'agi_reported',
    label: 'Arbetsgivardeklaration inlämnad',
    description: 'Löner och arbetsgivaravgifter rapporterade till Skatteverket.',
    type: 'manual',
  },
  payslips_done: {
    id: 'payslips_done',
    label: 'Löner utbetalda och bokförda',
    description: 'Lönebesked skapade och lönekörning bokförd.',
    type: 'manual',
  },
  delagare_uttag_bokfort: {
    id: 'delagare_uttag_bokfort',
    label: 'Delägaruttag bokförda',
    description: 'Kontrollera att alla delägaruttag är bokförda på rätt kapitalkonton (2010/2020).',
    type: 'manual',
  },
  annual_closing_prep: {
    id: 'annual_closing_prep',
    label: 'Förberedelse årsbokslut',
    description: 'Förbered årsbokslut — periodiseringar, avskrivningar, lagerinventering.',
    type: 'manual',
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if `month` is a VAT reporting month for this company.
 */
export function isVatMonth(company: ChecklistCompanyProfile, month: number): boolean {
  if (!company.hasMomsRegistration) return false

  switch (company.vatFrequency) {
    case 'monthly':
      return true
    case 'quarterly':
      return month === 3 || month === 6 || month === 9 || month === 12
    case 'annually': {
      const fyeMonth = parseFiscalYearEndMonth(company.fiscalYearEnd)
      return month === fyeMonth
    }
    default:
      return false
  }
}

/**
 * Returns true if `month` matches the company's fiscal year end month.
 */
export function isFiscalYearEndMonth(company: ChecklistCompanyProfile, month: number): boolean {
  return month === parseFiscalYearEndMonth(company.fiscalYearEnd)
}

function parseFiscalYearEndMonth(fiscalYearEnd: string): number {
  // Format: "MM-DD" → extract MM
  const parts = fiscalYearEnd.split('-')
  return parseInt(parts[0], 10) || 12
}

// ---------------------------------------------------------------------------
// Main logic
// ---------------------------------------------------------------------------

/**
 * Returns only the check definitions that are relevant for this company + month.
 */
export function getApplicableChecks(
  company: ChecklistCompanyProfile,
  _year: number,
  month: number,
): CheckDefinition[] {
  const checks: CheckDefinition[] = []

  // Universal — always included
  checks.push(CHECKS.no_pending_transactions)
  checks.push(CHECKS.bank_reconciled)

  // VAT — only if registered and it's a reporting month
  if (isVatMonth(company, month)) {
    checks.push(CHECKS.vat_reported)
  }

  // Employees — AGI + payslips
  if (company.hasEmployees) {
    checks.push(CHECKS.agi_reported)
    checks.push(CHECKS.payslips_done)
  }

  // HB/KB — partner withdrawals
  if (company.companyType === 'hb' || company.companyType === 'kb') {
    checks.push(CHECKS.delagare_uttag_bokfort)
  }

  // Fiscal year end month — annual closing prep
  if (isFiscalYearEndMonth(company, month)) {
    checks.push(CHECKS.annual_closing_prep)
  }

  return checks
}

/**
 * Merges check definitions with actual values (auto-computed + manual toggles).
 */
export function resolveChecks(
  definitions: CheckDefinition[],
  manualStates: Record<string, boolean>,
  autoStates: Record<string, boolean>,
): ResolvedCheck[] {
  return definitions.map(def => ({
    ...def,
    value: def.type === 'auto'
      ? (autoStates[def.id] ?? false)
      : (manualStates[def.id] ?? false),
  }))
}

/**
 * Counts completed vs total checks.
 */
export function getCheckProgress(resolved: ResolvedCheck[]): { completed: number; total: number } {
  return {
    completed: resolved.filter(c => c.value).length,
    total: resolved.length,
  }
}

// ---------------------------------------------------------------------------
// Backwards compat migration
// ---------------------------------------------------------------------------

const OLD_KEY_MAP: Record<string, string> = {
  bankReconciled: 'bank_reconciled',
  vatReported: 'vat_reported',
  declarationsDone: 'agi_reported',
  allCategorized: 'no_pending_transactions', // was manual, now auto — old value ignored at resolve time
}

/**
 * Migrates old camelCase JSONB keys to new snake_case IDs.
 * Passes through any keys that are already in the new format.
 */
export function migrateOldChecks(raw: Record<string, unknown>): { manualChecks: Record<string, boolean>; notes?: string } {
  const manualChecks: Record<string, boolean> = {}
  let notes: string | undefined

  for (const [key, value] of Object.entries(raw)) {
    if (key === 'notes') {
      notes = value as string
      continue
    }

    const mappedKey = OLD_KEY_MAP[key] || key
    if (typeof value === 'boolean') {
      manualChecks[mappedKey] = value
    }
  }

  return { manualChecks, notes }
}
