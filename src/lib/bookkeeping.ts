// ============================================
// Double-Entry Bookkeeping System
// Core logic for Swedish accounting
// ============================================

import { getAccount, isDebitIncrease, isCreditIncrease, type Account } from '@/data/accounts';

// ============================================
// Types
// ============================================

/**
 * A single line in a journal entry (verifikation)
 */
export interface JournalEntryLine {
  accountNumber: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
  // For VAT handling
  vatCode?: '25' | '12' | '6' | '0';
  vatAmount?: number;
}

/**
 * A complete journal entry (verifikation)
 */
export interface JournalEntry {
  id: string;
  /** Verification number - unique per fiscal year */
  verificationNumber: number;
  /** Verification series (A, B, C, etc.) */
  series: string;
  /** Date of the transaction */
  date: string;
  /** Description of the transaction */
  description: string;
  /** The individual debit/credit lines */
  lines: JournalEntryLine[];
  /** Source document reference */
  documentRef?: string;
  /** Type of document */
  documentType?: 'invoice' | 'receipt' | 'bank' | 'manual' | 'adjustment';
  /** Created by (user or AI) */
  createdBy: 'user' | 'ai';
  /** AI confidence if created by AI */
  aiConfidence?: number;
  /** Timestamps */
  createdAt: string;
  updatedAt: string;
}

/**
 * Validation result for a journal entry
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * A common transaction template for AI suggestions
 */
export interface TransactionTemplate {
  id: string;
  name: string;
  description: string;
  /** Keywords that trigger this template */
  keywords: string[];
  /** The default lines for this template */
  lines: Omit<JournalEntryLine, 'debit' | 'credit'>[];
  /** Which line gets the debit (index) */
  debitLineIndex: number;
  /** Which line gets the credit (index) */
  creditLineIndex: number;
  /** VAT handling */
  vatRate?: '25' | '12' | '6' | '0';
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate that a journal entry follows double-entry rules
 */
export function validateJournalEntry(entry: JournalEntry): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check that there are at least 2 lines
  if (entry.lines.length < 2) {
    errors.push('En verifikation måste ha minst två rader (debet och kredit)');
  }

  // Calculate totals
  const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);

  // Check that debits equal credits (with small tolerance for floating point)
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    errors.push(`Debet (${formatCurrency(totalDebit)}) och kredit (${formatCurrency(totalCredit)}) måste balansera`);
  }

  // Check that each line has either debit OR credit, not both
  entry.lines.forEach((line, index) => {
    if (line.debit > 0 && line.credit > 0) {
      errors.push(`Rad ${index + 1}: En rad kan inte ha både debet och kredit`);
    }
    if (line.debit === 0 && line.credit === 0) {
      warnings.push(`Rad ${index + 1}: Raden har varken debet eller kredit`);
    }
    if (line.debit < 0 || line.credit < 0) {
      errors.push(`Rad ${index + 1}: Belopp kan inte vara negativa`);
    }
  });

  // Check that all accounts exist
  entry.lines.forEach((line, index) => {
    const account = getAccount(line.accountNumber);
    if (!account) {
      warnings.push(`Rad ${index + 1}: Konto ${line.accountNumber} finns inte i kontoplanen`);
    }
  });

  // Check that date is valid
  if (!entry.date || isNaN(Date.parse(entry.date))) {
    errors.push('Ogiltigt datum');
  }

  // Check that description exists
  if (!entry.description?.trim()) {
    warnings.push('Beskrivning saknas');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if entry balances (debits = credits)
 */
export function isBalanced(entry: JournalEntry): boolean {
  const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);
  return Math.abs(totalDebit - totalCredit) < 0.01;
}

// ============================================
// Entry Creation Helpers
// ============================================

/**
 * Create a simple two-line journal entry
 */
export function createSimpleEntry(params: {
  debitAccount: string;
  creditAccount: string;
  amount: number;
  description: string;
  date: string;
  documentRef?: string;
  documentType?: JournalEntry['documentType'];
  vatRate?: '25' | '12' | '6' | '0';
}): Omit<JournalEntry, 'id' | 'verificationNumber' | 'series' | 'createdAt' | 'updatedAt'> {
  const { debitAccount, creditAccount, amount, description, date, documentRef, documentType, vatRate } = params;
  
  const lines: JournalEntryLine[] = [
    {
      accountNumber: debitAccount,
      accountName: getAccount(debitAccount)?.name,
      debit: amount,
      credit: 0,
    },
    {
      accountNumber: creditAccount,
      accountName: getAccount(creditAccount)?.name,
      debit: 0,
      credit: amount,
    },
  ];

  // Add VAT handling if specified
  if (vatRate && vatRate !== '0') {
    const vatMultiplier = parseFloat(vatRate) / 100;
    const netAmount = amount / (1 + vatMultiplier);
    const vatAmount = amount - netAmount;
    
    // Adjust the lines for VAT
    lines[0].debit = netAmount;
    lines[0].vatCode = vatRate;
    lines[0].vatAmount = vatAmount;
    
    // Add VAT line
    const vatAccountNumber = vatRate === '25' ? '2610' : vatRate === '12' ? '2620' : '2630';
    lines.push({
      accountNumber: vatAccountNumber,
      accountName: getAccount(vatAccountNumber)?.name,
      debit: 0,
      credit: vatAmount,
      vatCode: vatRate,
    });
  }

  return {
    date,
    description,
    lines,
    documentRef,
    documentType,
    createdBy: 'user',
  };
}

/**
 * Create a journal entry with VAT split (common for purchases)
 */
export function createPurchaseEntry(params: {
  expenseAccount: string;
  totalAmount: number;
  vatRate: '25' | '12' | '6' | '0';
  description: string;
  date: string;
  paymentAccount?: string; // Default: 1930 (bank)
}): Omit<JournalEntry, 'id' | 'verificationNumber' | 'series' | 'createdAt' | 'updatedAt'> {
  const { expenseAccount, totalAmount, vatRate, description, date, paymentAccount = '1930' } = params;
  
  const lines: JournalEntryLine[] = [];
  
  if (vatRate === '0') {
    // No VAT
    lines.push({
      accountNumber: expenseAccount,
      accountName: getAccount(expenseAccount)?.name,
      debit: totalAmount,
      credit: 0,
    });
  } else {
    // Calculate VAT split
    const vatMultiplier = parseFloat(vatRate) / 100;
    const netAmount = totalAmount / (1 + vatMultiplier);
    const vatAmount = totalAmount - netAmount;
    
    // Expense line (net amount)
    lines.push({
      accountNumber: expenseAccount,
      accountName: getAccount(expenseAccount)?.name,
      debit: roundToOre(netAmount),
      credit: 0,
    });
    
    // Input VAT line (ingående moms)
    lines.push({
      accountNumber: '1640', // Ingående moms
      accountName: 'Ingående moms',
      debit: roundToOre(vatAmount),
      credit: 0,
      vatCode: vatRate,
    });
  }
  
  // Payment line (credit bank account)
  lines.push({
    accountNumber: paymentAccount,
    accountName: getAccount(paymentAccount)?.name,
    debit: 0,
    credit: totalAmount,
  });

  return {
    date,
    description,
    lines,
    documentType: 'receipt',
    createdBy: 'user',
  };
}

/**
 * Create a sales invoice entry
 */
export function createSalesEntry(params: {
  revenueAccount?: string; // Default: 3010
  totalAmount: number;
  vatRate: '25' | '12' | '6' | '0';
  description: string;
  date: string;
  customerName?: string;
}): Omit<JournalEntry, 'id' | 'verificationNumber' | 'series' | 'createdAt' | 'updatedAt'> {
  const { revenueAccount = '3010', totalAmount, vatRate, description, date, customerName } = params;
  
  const lines: JournalEntryLine[] = [];
  
  // Accounts receivable (kundfordran)
  lines.push({
    accountNumber: '1510',
    accountName: 'Kundfordringar',
    debit: totalAmount,
    credit: 0,
    description: customerName,
  });
  
  if (vatRate === '0') {
    // No VAT - full amount to revenue
    lines.push({
      accountNumber: revenueAccount,
      accountName: getAccount(revenueAccount)?.name,
      debit: 0,
      credit: totalAmount,
    });
  } else {
    // Calculate VAT split
    const vatMultiplier = parseFloat(vatRate) / 100;
    const netAmount = totalAmount / (1 + vatMultiplier);
    const vatAmount = totalAmount - netAmount;
    
    // Revenue line (net amount)
    lines.push({
      accountNumber: revenueAccount,
      accountName: getAccount(revenueAccount)?.name,
      debit: 0,
      credit: roundToOre(netAmount),
    });
    
    // Output VAT line (utgående moms)
    const vatAccountNumber = vatRate === '25' ? '2610' : vatRate === '12' ? '2620' : '2630';
    lines.push({
      accountNumber: vatAccountNumber,
      accountName: getAccount(vatAccountNumber)?.name,
      debit: 0,
      credit: roundToOre(vatAmount),
      vatCode: vatRate,
    });
  }

  return {
    date,
    description,
    lines,
    documentType: 'invoice',
    createdBy: 'user',
  };
}

/**
 * Create a payment received entry
 */
export function createPaymentReceivedEntry(params: {
  amount: number;
  date: string;
  customerName?: string;
  bankAccount?: string; // Default: 1930
}): Omit<JournalEntry, 'id' | 'verificationNumber' | 'series' | 'createdAt' | 'updatedAt'> {
  const { amount, date, customerName, bankAccount = '1930' } = params;
  
  return {
    date,
    description: `Betalning mottagen${customerName ? ` från ${customerName}` : ''}`,
    lines: [
      {
        accountNumber: bankAccount,
        accountName: getAccount(bankAccount)?.name,
        debit: amount,
        credit: 0,
      },
      {
        accountNumber: '1510',
        accountName: 'Kundfordringar',
        debit: 0,
        credit: amount,
        description: customerName,
      },
    ],
    documentType: 'bank',
    createdBy: 'user',
  };
}

/**
 * Create a salary payment entry
 */
export function createSalaryEntry(params: {
  grossSalary: number;
  taxAmount: number;
  netSalary: number;
  employerContributions: number;
  date: string;
  employeeName?: string;
}): Omit<JournalEntry, 'id' | 'verificationNumber' | 'series' | 'createdAt' | 'updatedAt'> {
  const { grossSalary, taxAmount, netSalary, employerContributions, date, employeeName } = params;
  
  return {
    date,
    description: `Löneutbetalning${employeeName ? ` ${employeeName}` : ''}`,
    lines: [
      // Salary expense (debit)
      {
        accountNumber: '7010',
        accountName: 'Löner till kollektivanställda',
        debit: grossSalary,
        credit: 0,
      },
      // Employer contributions expense (debit)
      {
        accountNumber: '7510',
        accountName: 'Arbetsgivaravgifter',
        debit: employerContributions,
        credit: 0,
      },
      // Tax liability (credit)
      {
        accountNumber: '2710',
        accountName: 'Personalskatt',
        debit: 0,
        credit: taxAmount,
      },
      // Employer contributions liability (credit)
      {
        accountNumber: '2730',
        accountName: 'Arbetsgivaravgifter',
        debit: 0,
        credit: employerContributions,
      },
      // Bank payment (credit)
      {
        accountNumber: '1930',
        accountName: 'Företagskonto',
        debit: 0,
        credit: netSalary,
      },
    ],
    documentType: 'manual',
    createdBy: 'user',
  };
}

// ============================================
// Transaction Templates (for AI suggestions)
// ============================================

export const transactionTemplates: TransactionTemplate[] = [
  {
    id: 'office-supplies',
    name: 'Kontorsmaterial',
    description: 'Inköp av kontorsmaterial',
    keywords: ['kontorsmaterial', 'papper', 'pennor', 'kontorsutrustning', 'staples', 'lyreco'],
    lines: [
      { accountNumber: '6110', description: 'Kontorsmaterial' },
      { accountNumber: '1930', description: 'Betalning' },
    ],
    debitLineIndex: 0,
    creditLineIndex: 1,
    vatRate: '25',
  },
  {
    id: 'software',
    name: 'Programvara',
    description: 'Inköp av programvara eller SaaS-tjänster',
    keywords: ['programvara', 'software', 'saas', 'licens', 'adobe', 'microsoft', 'google', 'slack', 'notion'],
    lines: [
      { accountNumber: '5420', description: 'Programvaror' },
      { accountNumber: '1930', description: 'Betalning' },
    ],
    debitLineIndex: 0,
    creditLineIndex: 1,
    vatRate: '25',
  },
  {
    id: 'phone',
    name: 'Telefoni',
    description: 'Telefonkostnader',
    keywords: ['telefon', 'mobil', 'tele2', 'telia', 'telenor', 'tre', 'hallon'],
    lines: [
      { accountNumber: '6212', description: 'Mobiltelefon' },
      { accountNumber: '1930', description: 'Betalning' },
    ],
    debitLineIndex: 0,
    creditLineIndex: 1,
    vatRate: '25',
  },
  {
    id: 'internet',
    name: 'Internet',
    description: 'Internetkostnader',
    keywords: ['internet', 'bredband', 'fiber'],
    lines: [
      { accountNumber: '6230', description: 'Datakommunikation' },
      { accountNumber: '1930', description: 'Betalning' },
    ],
    debitLineIndex: 0,
    creditLineIndex: 1,
    vatRate: '25',
  },
  {
    id: 'rent',
    name: 'Lokalhyra',
    description: 'Hyra för kontor eller lokal',
    keywords: ['hyra', 'lokal', 'kontor', 'hyresvärd'],
    lines: [
      { accountNumber: '5010', description: 'Lokalhyra' },
      { accountNumber: '1930', description: 'Betalning' },
    ],
    debitLineIndex: 0,
    creditLineIndex: 1,
    vatRate: '25',
  },
  {
    id: 'fuel',
    name: 'Drivmedel',
    description: 'Bensin, diesel eller laddning',
    keywords: ['bensin', 'diesel', 'drivmedel', 'tankning', 'circle k', 'okq8', 'preem', 'st1', 'shell', 'ingo'],
    lines: [
      { accountNumber: '5611', description: 'Drivmedel' },
      { accountNumber: '1930', description: 'Betalning' },
    ],
    debitLineIndex: 0,
    creditLineIndex: 1,
    vatRate: '25',
  },
  {
    id: 'travel',
    name: 'Resa',
    description: 'Resor och biljetter',
    keywords: ['resa', 'flyg', 'tåg', 'buss', 'sj', 'sas', 'norwegian', 'taxi', 'uber', 'bolt'],
    lines: [
      { accountNumber: '5810', description: 'Biljetter' },
      { accountNumber: '1930', description: 'Betalning' },
    ],
    debitLineIndex: 0,
    creditLineIndex: 1,
    vatRate: '6',
  },
  {
    id: 'hotel',
    name: 'Hotell',
    description: 'Hotell och logi',
    keywords: ['hotell', 'hotel', 'logi', 'övernattning', 'scandic', 'clarion', 'elite', 'airbnb'],
    lines: [
      { accountNumber: '5830', description: 'Kost och logi' },
      { accountNumber: '1930', description: 'Betalning' },
    ],
    debitLineIndex: 0,
    creditLineIndex: 1,
    vatRate: '12',
  },
  {
    id: 'representation',
    name: 'Representation',
    description: 'Kundmöten och representation',
    keywords: ['representation', 'kundmöte', 'lunch', 'middag', 'restaurang'],
    lines: [
      { accountNumber: '6072', description: 'Representation' },
      { accountNumber: '1930', description: 'Betalning' },
    ],
    debitLineIndex: 0,
    creditLineIndex: 1,
    vatRate: '25',
  },
  {
    id: 'insurance',
    name: 'Försäkring',
    description: 'Företagsförsäkringar',
    keywords: ['försäkring', 'if', 'trygg-hansa', 'länsförsäkringar', 'folksam'],
    lines: [
      { accountNumber: '6310', description: 'Försäkringspremier' },
      { accountNumber: '1930', description: 'Betalning' },
    ],
    debitLineIndex: 0,
    creditLineIndex: 1,
    vatRate: '0', // Försäkringar är momsfria
  },
  {
    id: 'accounting',
    name: 'Redovisning',
    description: 'Redovisningstjänster',
    keywords: ['redovisning', 'bokföring', 'revisor', 'revision', 'pwc', 'kpmg', 'ey', 'deloitte'],
    lines: [
      { accountNumber: '6530', description: 'Redovisningstjänster' },
      { accountNumber: '1930', description: 'Betalning' },
    ],
    debitLineIndex: 0,
    creditLineIndex: 1,
    vatRate: '25',
  },
  {
    id: 'bank-fee',
    name: 'Bankavgift',
    description: 'Bankavgifter och avgifter',
    keywords: ['bankavgift', 'avgift', 'årsavgift', 'kortavgift'],
    lines: [
      { accountNumber: '6570', description: 'Bankavgifter' },
      { accountNumber: '1930', description: 'Betalning' },
    ],
    debitLineIndex: 0,
    creditLineIndex: 1,
    vatRate: '0', // Bankavgifter är momsfria
  },
  {
    id: 'marketing',
    name: 'Marknadsföring',
    description: 'Marknadsföring och annonsering',
    keywords: ['marknadsföring', 'annons', 'reklam', 'google ads', 'facebook', 'instagram', 'linkedin'],
    lines: [
      { accountNumber: '6010', description: 'Marknadsföring' },
      { accountNumber: '1930', description: 'Betalning' },
    ],
    debitLineIndex: 0,
    creditLineIndex: 1,
    vatRate: '25',
  },
  {
    id: 'sales-service',
    name: 'Försäljning tjänster',
    description: 'Intäkt från försäljning av tjänster',
    keywords: ['faktura', 'konsult', 'arvode', 'tjänst'],
    lines: [
      { accountNumber: '1510', description: 'Kundfordran' },
      { accountNumber: '3010', description: 'Försäljning tjänster' },
    ],
    debitLineIndex: 0,
    creditLineIndex: 1,
    vatRate: '25',
  },
];

/**
 * Find matching template based on description
 */
export function findMatchingTemplate(description: string): TransactionTemplate | undefined {
  const lowerDesc = description.toLowerCase();
  
  return transactionTemplates.find(template =>
    template.keywords.some(keyword => lowerDesc.includes(keyword.toLowerCase()))
  );
}

/**
 * Create a journal entry from a template
 */
export function createFromTemplate(
  template: TransactionTemplate,
  amount: number,
  date: string,
  description?: string
): Omit<JournalEntry, 'id' | 'verificationNumber' | 'series' | 'createdAt' | 'updatedAt'> {
  // Use the purchase entry helper for expense templates
  if (template.debitLineIndex === 0 && template.creditLineIndex === 1) {
    const expenseAccount = template.lines[template.debitLineIndex].accountNumber;
    
    return createPurchaseEntry({
      expenseAccount,
      totalAmount: amount,
      vatRate: template.vatRate || '25',
      description: description || template.name,
      date,
    });
  }
  
  // For sales templates
  if (template.id.startsWith('sales')) {
    return createSalesEntry({
      totalAmount: amount,
      vatRate: template.vatRate || '25',
      description: description || template.name,
      date,
    });
  }
  
  // Fallback to simple entry
  return createSimpleEntry({
    debitAccount: template.lines[template.debitLineIndex].accountNumber,
    creditAccount: template.lines[template.creditLineIndex].accountNumber,
    amount,
    description: description || template.name,
    date,
    vatRate: template.vatRate,
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Round to nearest öre (Swedish cents)
 */
export function roundToOre(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Format currency in Swedish format
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate VAT from a gross amount
 */
export function calculateVat(grossAmount: number, vatRate: '25' | '12' | '6' | '0'): { net: number; vat: number } {
  if (vatRate === '0') {
    return { net: grossAmount, vat: 0 };
  }
  const vatMultiplier = parseFloat(vatRate) / 100;
  const net = roundToOre(grossAmount / (1 + vatMultiplier));
  const vat = roundToOre(grossAmount - net);
  return { net, vat };
}

/**
 * Calculate gross from net amount
 */
export function calculateGross(netAmount: number, vatRate: '25' | '12' | '6' | '0'): { gross: number; vat: number } {
  if (vatRate === '0') {
    return { gross: netAmount, vat: 0 };
  }
  const vatMultiplier = parseFloat(vatRate) / 100;
  const vat = roundToOre(netAmount * vatMultiplier);
  const gross = roundToOre(netAmount + vat);
  return { gross, vat };
}

/**
 * Get the total for a specific account from a list of entries
 */
export function getAccountBalance(entries: JournalEntry[], accountNumber: string): number {
  let balance = 0;
  const account = getAccount(accountNumber);
  
  entries.forEach(entry => {
    entry.lines.forEach(line => {
      if (line.accountNumber === accountNumber) {
        // For asset/expense accounts: debit increases, credit decreases
        // For liability/equity/revenue accounts: credit increases, debit decreases
        if (account && isDebitIncrease(account)) {
          balance += line.debit - line.credit;
        } else {
          balance += line.credit - line.debit;
        }
      }
    });
  });
  
  return balance;
}

/**
 * Generate the next verification number
 */
export function getNextVerificationNumber(existingEntries: JournalEntry[], series: string = 'A'): number {
  const seriesEntries = existingEntries.filter(e => e.series === series);
  if (seriesEntries.length === 0) {
    return 1;
  }
  const maxNumber = Math.max(...seriesEntries.map(e => e.verificationNumber));
  return maxNumber + 1;
}

/**
 * Generate a unique ID for a journal entry
 */
export function generateEntryId(): string {
  return `je-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a complete journal entry with all required fields
 */
export function finalizeEntry(
  draft: Omit<JournalEntry, 'id' | 'verificationNumber' | 'series' | 'createdAt' | 'updatedAt'>,
  existingEntries: JournalEntry[] = [],
  series: string = 'A'
): JournalEntry {
  const now = new Date().toISOString();
  
  return {
    ...draft,
    id: generateEntryId(),
    verificationNumber: getNextVerificationNumber(existingEntries, series),
    series,
    createdAt: now,
    updatedAt: now,
  };
}
