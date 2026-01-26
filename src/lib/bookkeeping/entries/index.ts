/**
 * Entry creator barrel file
 * Re-exports all entry creation functions
 */

export { createSimpleEntry } from './simple'
export type { SimpleEntryParams } from './simple'

export { 
  createPurchaseEntry, 
  createSupplierPayment 
} from './purchase'
export type { PurchaseEntryParams } from './purchase'

export { 
  createSalesEntry, 
  createPaymentReceivedEntry, 
  createCreditNoteEntry 
} from './sales'
export type { SalesEntryParams } from './sales'

export { 
  createSalaryEntry, 
  createPayrollTaxPayment, 
  createSalaryAccrual,
  calculateEmployerContributions 
} from './salary'
export type { SalaryEntryParams, SalaryComponents } from './salary'
