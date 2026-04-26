// DB-backed accounting services
export * from "./account-service"
export * from "./transactions"
export * from "./verification-service"
export * from "./receipt-service"
export * from "./inventarie-service"
export * from "./closing-entry-service"
export * from "./period-closing-service"


export type {
    JournalEntry,
    JournalEntryLine,
    ValidationResult,
    SwedishVatRate,
} from './types'

export { VAT_ACCOUNTS, PAYMENT_ACCOUNTS, DEFAULT_ACCOUNTS } from './types'

export {
    validateJournalEntry,
    validateLine,
    isBalanced,
    canSave,
    roundToOre,
} from './validation'

export {
    VAT_RATES,
    calculateVat,
    calculateGross,
    calculateNet,
    extractVat,
    inferVatRateFromAccount,
    getVatAccount,
    splitGrossAmount,
    formatVat,
} from './vat'

export {
    createSimpleEntry,
    type SimpleEntryParams,
    createPurchaseEntry,
    createSupplierPayment,
    type PurchaseEntryParams,
    createSalesEntry,
    createMultiVatSalesEntry,
    createPaymentReceivedEntry,
    createCreditNoteEntry,
    type SalesEntryParams,
    type MultiVatSalesEntryParams,
    type InvoiceLineItem,
    createSalaryEntry,
    createPayrollTaxPayment,
    createSalaryAccrual,
    createVacationAccrual,
    calculateEmployerContributions,
    type SalaryEntryParams,
    type SalaryComponents,
} from './entries'

export {
    generateEntryId,
    getNextVerificationNumber,
    finalizeEntry,
    isValidAccount,
    getAccountName,
    getAccountBalance,
    formatSwedishDate,
    getFiscalYearRange,
    getCurrentFiscalYear,
    getAccountClass,
    isBalanceSheetAccount,
    isIncomeStatementAccount,
    formatSEK,
} from './utils'

export {
    calculateEgenavgifter,
    type EgenavgifterRates,
    type EgenavgifterOptions,
    type EgenavgifterComponent,
    type EgenavgifterResult,
} from './egenavgifter'
