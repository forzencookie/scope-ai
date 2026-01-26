/**
 * Bank Transaction Service
 * 
 * This service handles the flow of bank transactions:
 * 1. Simulator/External → Naked bank transactions
 * 2. Bank stores raw transactions
 * 3. Dashboard can enrich with categorization and bookkeeping
 * 
 * The design mimics how real bank data works:
 * - Banks provide minimal "naked" data (amount, description, date)
 * - Bookkeeping software "dresses" the data with categories, accounts, verifikationer
 */

import type { 
  NakedBankTransaction, 
  EnrichedTransaction, 
  BankAccountType,
} from '@/types/bank'

// ============================================
// Storage Keys
// ============================================

const NAKED_TRANSACTIONS_KEY = 'bank_naked_transactions'
const ENRICHED_TRANSACTIONS_KEY = 'bank_enriched_transactions'
const BALANCES_KEY = 'bank_balances'

// ============================================
// Types
// ============================================

export interface BankBalances {
  foretagskonto: number
  sparkonto: number
  skattekonto: number
}

// Default starting balances
const DEFAULT_BALANCES: BankBalances = {
  foretagskonto: 250000,
  sparkonto: 150000,
  skattekonto: 45000,
}

// ============================================
// Balance Management
// ============================================

export function getBalances(): BankBalances {
  if (typeof window === 'undefined') return DEFAULT_BALANCES
  
  const stored = localStorage.getItem(BALANCES_KEY)
  if (!stored) {
    localStorage.setItem(BALANCES_KEY, JSON.stringify(DEFAULT_BALANCES))
    return DEFAULT_BALANCES
  }
  return JSON.parse(stored)
}

export function updateBalances(balances: BankBalances): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(BALANCES_KEY, JSON.stringify(balances))
}

export function resetBalances(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(BALANCES_KEY, JSON.stringify(DEFAULT_BALANCES))
}

// ============================================
// Naked Transaction Storage
// ============================================

export function getNakedTransactions(): NakedBankTransaction[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(NAKED_TRANSACTIONS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function storeNakedTransaction(transaction: NakedBankTransaction): void {
  if (typeof window === 'undefined') return
  
  const transactions = getNakedTransactions()
  transactions.unshift(transaction)
  // Keep last 200 transactions
  localStorage.setItem(NAKED_TRANSACTIONS_KEY, JSON.stringify(transactions.slice(0, 200)))
}

export function clearNakedTransactions(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(NAKED_TRANSACTIONS_KEY)
}

// ============================================
// Enriched Transaction Storage
// ============================================

export function getEnrichedTransactions(): EnrichedTransaction[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(ENRICHED_TRANSACTIONS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function storeEnrichedTransaction(transaction: EnrichedTransaction): void {
  if (typeof window === 'undefined') return
  
  const transactions = getEnrichedTransactions()
  // Update existing or add new
  const existingIndex = transactions.findIndex(
    t => t.bankTransaction.id === transaction.bankTransaction.id
  )
  
  if (existingIndex >= 0) {
    transactions[existingIndex] = transaction
  } else {
    transactions.unshift(transaction)
  }
  
  localStorage.setItem(ENRICHED_TRANSACTIONS_KEY, JSON.stringify(transactions.slice(0, 200)))
}

export function clearEnrichedTransactions(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ENRICHED_TRANSACTIONS_KEY)
}

// ============================================
// Create Naked Bank Transaction
// ============================================

export interface CreateNakedTransactionParams {
  amount: number
  description: string
  account: BankAccountType
  reference?: string
  ocr?: string
}

/**
 * Creates a naked bank transaction as it would come from a real bank.
 * This is the entry point for ALL transactions in the system.
 */
export function createNakedTransaction(params: CreateNakedTransactionParams): NakedBankTransaction {
  const { amount, description, account, reference, ocr } = params
  
  // Get current balance for this account
  const balances = getBalances()
  const newBalance = balances[account] + amount
  
  // Create the transaction
  const transaction: NakedBankTransaction = {
    id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    amount,
    description,
    reference,
    ocr,
    account,
    balanceAfter: newBalance,
  }
  
  // Store the transaction
  storeNakedTransaction(transaction)
  
  // Update balance
  balances[account] = newBalance
  updateBalances(balances)
  
  return transaction
}

// ============================================
// Transaction Creation Helpers
// ============================================

/**
 * Simulate a customer payment (income)
 */
export function receivePayment(
  amount: number,
  customerName: string,
  reference?: string
): NakedBankTransaction {
  return createNakedTransaction({
    amount: Math.abs(amount), // Positive for income
    description: customerName,
    account: 'foretagskonto',
    reference,
  })
}

/**
 * Simulate a payment to supplier (expense)
 */
export function makePayment(
  amount: number,
  recipientName: string,
  reference?: string
): NakedBankTransaction {
  return createNakedTransaction({
    amount: -Math.abs(amount), // Negative for expense
    description: recipientName,
    account: 'foretagskonto',
    reference,
  })
}

/**
 * Simulate an internal transfer between accounts
 */
export function transferBetweenAccounts(
  amount: number,
  fromAccount: BankAccountType,
  toAccount: BankAccountType
): [NakedBankTransaction, NakedBankTransaction] {
  const outgoing = createNakedTransaction({
    amount: -Math.abs(amount),
    description: `Överföring till ${toAccount === 'foretagskonto' ? 'Företagskonto' : toAccount === 'sparkonto' ? 'Sparkonto' : 'Skattekonto'}`,
    account: fromAccount,
  })
  
  const incoming = createNakedTransaction({
    amount: Math.abs(amount),
    description: `Överföring från ${fromAccount === 'foretagskonto' ? 'Företagskonto' : fromAccount === 'sparkonto' ? 'Sparkonto' : 'Skattekonto'}`,
    account: toAccount,
  })
  
  return [outgoing, incoming]
}

/**
 * Simulate salary payment
 */
export function paySalary(
  netAmount: number,
  employeeName: string
): NakedBankTransaction {
  return createNakedTransaction({
    amount: -Math.abs(netAmount),
    description: `Lön ${employeeName}`,
    account: 'foretagskonto',
  })
}

/**
 * Simulate tax payment to skattekonto
 */
export function payTax(
  amount: number,
  taxType: string,
  ocr?: string
): NakedBankTransaction {
  return createNakedTransaction({
    amount: -Math.abs(amount),
    description: `Skatt: ${taxType}`,
    account: 'skattekonto',
    ocr,
  })
}

// ============================================
// Fetch Transactions for Dashboard
// ============================================

/**
 * Get all transactions for a specific account, with optional enrichment
 */
export function getTransactionsForAccount(
  account: BankAccountType
): NakedBankTransaction[] {
  return getNakedTransactions().filter(t => t.account === account)
}

/**
 * Get pending transactions (not yet categorized/booked)
 */
export function getPendingTransactions(): NakedBankTransaction[] {
  const naked = getNakedTransactions()
  const enriched = getEnrichedTransactions()
  const bookedIds = new Set(
    enriched
      .filter(e => e.status === 'booked' || e.status === 'verified')
      .map(e => e.bankTransaction.id)
  )
  
  return naked.filter(t => !bookedIds.has(t.id))
}

/**
 * Get transaction count by status
 */
export function getTransactionStats(): {
  total: number
  pending: number
  categorized: number
  booked: number
} {
  const naked = getNakedTransactions()
  const enriched = getEnrichedTransactions()
  
  return {
    total: naked.length,
    pending: naked.filter(t => !enriched.find(e => e.bankTransaction.id === t.id && e.status !== 'pending')).length,
    categorized: enriched.filter(e => e.status === 'categorized').length,
    booked: enriched.filter(e => e.status === 'booked' || e.status === 'verified').length,
  }
}

// ============================================
// Reset All Bank Data
// ============================================

export function resetBank(): void {
  clearNakedTransactions()
  clearEnrichedTransactions()
  resetBalances()
}
