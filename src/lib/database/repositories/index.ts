/**
 * Database Repositories Index
 * 
 * Re-exports all repository modules for convenient importing.
 */

// Types
export * from './types'

// Repositories
export { createTransactionsRepository, type TransactionsRepository } from './transactions'
export { createReceiptsRepository, type ReceiptsRepository } from './receipts'
export { createInvoicesRepository, type InvoicesRepository } from './invoices'
export { createSupplierInvoicesRepository, type SupplierInvoicesRepository } from './supplier-invoices'
export { createVerificationsRepository, type VerificationsRepository } from './verifications'
export { createEmployeesRepository, type EmployeesRepository } from './employees'
export { createPayslipsRepository, type PayslipsRepository } from './payslips'
export { createCorporateRepository, type CorporateRepository } from './corporate'
export { createConversationsRepository, type ConversationsRepository } from './conversations'
export { createInboxRepository, type InboxRepository } from './inbox'
export { createFinancialRepository, type FinancialRepository } from './financial'
