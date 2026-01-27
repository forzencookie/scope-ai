/**
 * Server Database Access Layer
 * 
 * Provides admin-level database access that bypasses RLS.
 * Uses the Supabase service role key for server-side operations.
 * 
 * For user-scoped operations with RLS, use user-scoped-db.ts instead.
 */

import { getSupabaseAdmin } from './supabase'
import {
    createTransactionsRepository,
    createReceiptsRepository,
    createInvoicesRepository,
    createSupplierInvoicesRepository,
    createVerificationsRepository,
    createEmployeesRepository,
    createPayslipsRepository,
    createCorporateRepository,
    createConversationsRepository,
    createInboxRepository,
    createFinancialRepository,
} from './repositories'

// =============================================================================
// Default State (fallback for empty database)
// =============================================================================

const defaultState = {
    transactions: [],
    receipts: [],
    invoices: [],
    supplierInvoices: [],
    verifications: [],
    inbox: [],
    balances: {
        foretagskonto: 250000,
        sparkonto: 150000,
        skattekonto: 45000,
    },
    transactionMetadata: {},
}

// =============================================================================
// Database Object (combines all repositories)
// =============================================================================

export const db = {
    /**
     * Get all data for initial load (with default pagination)
     */
    get: async (options?: { limit?: number }) => {
        const supabase = getSupabaseAdmin()
        const defaultLimit = options?.limit ?? 20

        const [tx, rc, si, ver] = await Promise.all([
            supabase.from('transactions').select('*').order('occurred_at', { ascending: false }).limit(defaultLimit),
            supabase.from('receipts').select('*').order('captured_at', { ascending: false }).limit(defaultLimit),
            supabase.from('supplierinvoices').select('*').order('due_date', { ascending: true }).limit(defaultLimit),
            supabase.from('verifications').select('*').order('date', { ascending: false }).limit(defaultLimit)
        ])

        return {
            transactions: tx.data || [],
            receipts: rc.data?.map(r => ({ ...r, attachmentUrl: r.image_url })) || [],
            invoices: [],
            supplierInvoices: si.data?.map(i => ({
                ...i,
                invoiceNumber: i.invoice_number,
                supplierName: i.supplier_name,
                totalAmount: i.total_amount,
                invoiceDate: i.issue_date,
                dueDate: i.due_date,
                ocrNumber: i.ocr
            })) || [],
            verifications: ver.data || [],
            inbox: [],
            balances: defaultState.balances,
            transactionMetadata: {},
            aiAuditLogs: [],
            financialPeriods: [],
            taxReports: [],
            employees: [],
            payslips: []
        }
    },

    set: (_data: Record<string, unknown>) => {
        console.warn("db.set() called but ignored in Supabase mode")
    },

    // =========================================================================
    // Transaction Methods (delegate to repository)
    // =========================================================================
    
    addTransaction: async (tx: Parameters<ReturnType<typeof createTransactionsRepository>['create']>[0]) => {
        const repo = createTransactionsRepository(getSupabaseAdmin())
        return repo.create(tx)
    },

    updateTransactionMetadata: async (id: string, metadata: Parameters<ReturnType<typeof createTransactionsRepository>['updateMetadata']>[1]) => {
        const repo = createTransactionsRepository(getSupabaseAdmin())
        return repo.updateMetadata(id, metadata)
    },

    getTransactions: async (filters?: Parameters<ReturnType<typeof createTransactionsRepository>['list']>[0]) => {
        const repo = createTransactionsRepository(getSupabaseAdmin())
        return repo.list(filters)
    },

    updateTransaction: async (id: string, updates: Record<string, unknown>) => {
        const repo = createTransactionsRepository(getSupabaseAdmin())
        return repo.update(id, updates)
    },

    // =========================================================================
    // Receipt Methods
    // =========================================================================

    addReceipt: async (receipt: Parameters<ReturnType<typeof createReceiptsRepository>['create']>[0]) => {
        const repo = createReceiptsRepository(getSupabaseAdmin())
        return repo.create(receipt)
    },

    // =========================================================================
    // Invoice Methods
    // =========================================================================

    getCustomerInvoices: async (filters?: Parameters<ReturnType<typeof createInvoicesRepository>['list']>[0]) => {
        const repo = createInvoicesRepository(getSupabaseAdmin())
        return repo.list(filters)
    },

    addInvoice: async (invoice: Parameters<ReturnType<typeof createInvoicesRepository>['create']>[0]) => {
        const repo = createInvoicesRepository(getSupabaseAdmin())
        return repo.create(invoice)
    },

    // =========================================================================
    // Supplier Invoice Methods
    // =========================================================================

    getSupplierInvoices: async (filters?: Parameters<ReturnType<typeof createSupplierInvoicesRepository>['list']>[0]) => {
        const repo = createSupplierInvoicesRepository(getSupabaseAdmin())
        return repo.list(filters)
    },

    addSupplierInvoice: async (invoice: Parameters<ReturnType<typeof createSupplierInvoicesRepository>['create']>[0]) => {
        const repo = createSupplierInvoicesRepository(getSupabaseAdmin())
        return repo.create(invoice)
    },

    updateSupplierInvoice: async (id: string, updates: { status?: string }) => {
        const repo = createSupplierInvoicesRepository(getSupabaseAdmin())
        return repo.updateStatus(id, updates.status || '')
    },

    // =========================================================================
    // Verification Methods
    // =========================================================================

    addVerification: async (verification: Parameters<ReturnType<typeof createVerificationsRepository>['create']>[0]) => {
        const repo = createVerificationsRepository(getSupabaseAdmin())
        return repo.create(verification)
    },

    getVerifications: async (limit?: number) => {
        const repo = createVerificationsRepository(getSupabaseAdmin())
        return repo.list(limit)
    },

    // =========================================================================
    // Inbox Methods
    // =========================================================================

    getInboxItems: async (limit?: number) => {
        const repo = createInboxRepository(getSupabaseAdmin())
        return repo.list(limit)
    },

    addInboxItem: async (item: Parameters<ReturnType<typeof createInboxRepository>['create']>[0]) => {
        const repo = createInboxRepository(getSupabaseAdmin())
        return repo.create(item)
    },

    updateInboxItem: async (id: string, updates: { read?: boolean; starred?: boolean; category?: string }) => {
        const repo = createInboxRepository(getSupabaseAdmin())
        return repo.update(id, updates)
    },

    clearInbox: async () => {
        const repo = createInboxRepository(getSupabaseAdmin())
        return repo.clear()
    },

    // =========================================================================
    // AI Audit Log Methods
    // =========================================================================

    logAIToolExecution: async (log: Parameters<ReturnType<typeof createFinancialRepository>['logAIToolExecution']>[0]) => {
        const repo = createFinancialRepository(getSupabaseAdmin())
        return repo.logAIToolExecution(log)
    },

    // =========================================================================
    // Financial Period Methods
    // =========================================================================

    getFinancialPeriods: async () => {
        const repo = createFinancialRepository(getSupabaseAdmin())
        return repo.listPeriods()
    },

    updateFinancialPeriodStatus: async (id: string, status: string) => {
        const repo = createFinancialRepository(getSupabaseAdmin())
        return repo.updatePeriodStatus(id, status)
    },

    // =========================================================================
    // Tax Report Methods
    // =========================================================================

    getTaxReports: async (type?: string) => {
        const repo = createFinancialRepository(getSupabaseAdmin())
        return repo.listTaxReports(type)
    },

    upsertTaxReport: async (report: Parameters<ReturnType<typeof createFinancialRepository>['upsertTaxReport']>[0]) => {
        const repo = createFinancialRepository(getSupabaseAdmin())
        return repo.upsertTaxReport(report)
    },

    // =========================================================================
    // Employee Methods
    // =========================================================================

    getEmployees: async (limit?: number) => {
        const repo = createEmployeesRepository(getSupabaseAdmin())
        return repo.list(limit)
    },

    addEmployee: async (employee: Parameters<ReturnType<typeof createEmployeesRepository>['create']>[0]) => {
        const repo = createEmployeesRepository(getSupabaseAdmin())
        return repo.create(employee)
    },

    // =========================================================================
    // Payslip Methods
    // =========================================================================

    getPayslips: async (limit?: number) => {
        const repo = createPayslipsRepository(getSupabaseAdmin())
        return repo.list(limit)
    },

    addPayslip: async (payslip: Parameters<ReturnType<typeof createPayslipsRepository>['create']>[0]) => {
        const repo = createPayslipsRepository(getSupabaseAdmin())
        return repo.create(payslip)
    },

    // =========================================================================
    // Corporate Methods
    // =========================================================================

    getCorporateDocuments: async (limit?: number) => {
        const repo = createCorporateRepository(getSupabaseAdmin())
        return repo.listDocuments(limit)
    },

    addCorporateDocument: async (doc: Parameters<ReturnType<typeof createCorporateRepository>['createDocument']>[0]) => {
        const repo = createCorporateRepository(getSupabaseAdmin())
        return repo.createDocument(doc)
    },

    getShareholders: async (limit?: number) => {
        const repo = createCorporateRepository(getSupabaseAdmin())
        return repo.listShareholders(limit)
    },

    addShareholder: async (shareholder: Parameters<ReturnType<typeof createCorporateRepository>['createShareholder']>[0]) => {
        const repo = createCorporateRepository(getSupabaseAdmin())
        return repo.createShareholder(shareholder)
    },

    updateShareholder: async (id: string, updates: Parameters<ReturnType<typeof createCorporateRepository>['updateShareholder']>[1]) => {
        const repo = createCorporateRepository(getSupabaseAdmin())
        return repo.updateShareholder(id, updates)
    },

    getRoadmaps: async (userId: string) => {
        const repo = createCorporateRepository(getSupabaseAdmin())
        return repo.listRoadmaps(userId)
    },

    // =========================================================================
    // KPI Methods
    // =========================================================================

    getCompanyKPIs: async () => {
        const repo = createFinancialRepository(getSupabaseAdmin())
        return repo.getCompanyKPIs()
    },

    // =========================================================================
    // Conversation Methods
    // =========================================================================

    createConversation: async (title: string, userId?: string) => {
        const repo = createConversationsRepository(getSupabaseAdmin())
        return repo.create(title, userId)
    },

    getConversations: async (userId?: string, limit?: number) => {
        const repo = createConversationsRepository(getSupabaseAdmin())
        return repo.list(userId, limit)
    },

    getConversation: async (id: string) => {
        const repo = createConversationsRepository(getSupabaseAdmin())
        return repo.getById(id)
    },

    addMessage: async (message: Parameters<ReturnType<typeof createConversationsRepository>['addMessage']>[0]) => {
        const repo = createConversationsRepository(getSupabaseAdmin())
        return repo.addMessage(message)
    },

    getMessages: async (conversationId: string) => {
        const repo = createConversationsRepository(getSupabaseAdmin())
        return repo.getMessages(conversationId)
    },
}
