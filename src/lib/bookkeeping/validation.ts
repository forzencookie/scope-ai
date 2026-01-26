/**
 * Validation functions for Swedish double-entry bookkeeping
 */

import type { JournalEntry, JournalEntryLine, ValidationResult } from './types'

/**
 * Round to nearest öre (Swedish cent, 0.01 SEK)
 */
export function roundToOre(amount: number): number {
  return Math.round(amount * 100) / 100
}

/**
 * Check if a journal entry is balanced (total debits = total credits)
 */
export function isBalanced(entry: JournalEntry): boolean {
  const totalDebit = entry.rows.reduce((sum, row) => sum + roundToOre(row.debit), 0)
  const totalCredit = entry.rows.reduce((sum, row) => sum + roundToOre(row.credit), 0)
  
  // Allow for small floating-point errors (0.01 öre tolerance)
  return Math.abs(roundToOre(totalDebit) - roundToOre(totalCredit)) < 0.01
}

/**
 * Validate a single journal entry line
 */
export function validateLine(line: JournalEntryLine, index: number): string[] {
  const errors: string[] = []

  // Account number validation
  if (!line.account || line.account.length !== 4) {
    errors.push(`Rad ${index + 1}: Kontonummer måste vara 4 siffror`)
  }

  if (!/^\d{4}$/.test(line.account)) {
    errors.push(`Rad ${index + 1}: Ogiltigt kontonummer "${line.account}"`)
  }

  // Amount validation
  if (line.debit < 0) {
    errors.push(`Rad ${index + 1}: Debet kan inte vara negativt`)
  }

  if (line.credit < 0) {
    errors.push(`Rad ${index + 1}: Kredit kan inte vara negativt`)
  }

  // Must have either debit or credit (but not both)
  if (line.debit > 0 && line.credit > 0) {
    errors.push(`Rad ${index + 1}: En rad kan inte ha både debet och kredit`)
  }

  if (line.debit === 0 && line.credit === 0) {
    errors.push(`Rad ${index + 1}: Raden saknar belopp`)
  }

  return errors
}

/**
 * Comprehensive validation of a journal entry
 */
export function validateJournalEntry(entry: JournalEntry): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic field validation
  if (!entry.id) {
    errors.push('Verifikation saknar ID')
  }

  if (!entry.date) {
    errors.push('Verifikation saknar datum')
  } else {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(entry.date)) {
      errors.push('Ogiltigt datumformat (förväntat: YYYY-MM-DD)')
    } else {
      // Check if date is valid
      const date = new Date(entry.date)
      if (isNaN(date.getTime())) {
        errors.push('Ogiltigt datum')
      }
      
      // Warn about future dates
      if (date > new Date()) {
        warnings.push('Verifikationen har ett datum i framtiden')
      }
    }
  }

  if (!entry.description || entry.description.trim().length === 0) {
    errors.push('Verifikation saknar beskrivning')
  }

  // Must have at least 2 lines for double-entry
  if (!entry.rows || entry.rows.length < 2) {
    errors.push('Verifikation måste ha minst 2 rader (dubbel bokföring)')
  } else {
    // Validate each line
    entry.rows.forEach((line, index) => {
      errors.push(...validateLine(line, index))
    })

    // Check balance
    if (!isBalanced(entry)) {
      const totalDebit = entry.rows.reduce((sum, row) => sum + row.debit, 0)
      const totalCredit = entry.rows.reduce((sum, row) => sum + row.credit, 0)
      const diff = Math.abs(totalDebit - totalCredit)
      errors.push(
        `Verifikationen är obalanserad: Debet ${totalDebit.toFixed(2)} SEK, Kredit ${totalCredit.toFixed(2)} SEK (diff: ${diff.toFixed(2)} SEK)`
      )
    }
  }

  // Warn about locked entries being modified
  if (entry.finalized) {
    warnings.push('Denna verifikation är låst och bör inte ändras')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Quick check if entry can be saved (minimal validation)
 */
export function canSave(entry: JournalEntry): boolean {
  // Must have date, description, at least 2 rows, and be balanced
  return (
    !!entry.date &&
    !!entry.description &&
    entry.rows.length >= 2 &&
    isBalanced(entry)
  )
}
