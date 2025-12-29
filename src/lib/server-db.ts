// @ts-nocheck - Supabase types are stale, will regenerate after migration
import { getSupabaseAdmin } from './supabase';
// import { SimulatedDB } from './server-db-types'; // Removed: Missing file


// Suppress type errors for now until Supabase types are regenerated
// @ts-nocheck but cleaner
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

// We keep the SimulatedDB interface compatible for now, or use loose typing
// as the frontend expects certain shapes.
// Ideally, we'd import Database types from supabase.

// Fallback state if DB fails (or for initial cache)
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
};

// ============================================================================
// Supabase Database Adapter
// Replaces the JSON file I/O with Supabase Admin calls
// ============================================================================

export const db = {
    get: async () => {
        // Build the full "SimulatedDB" object by querying all tables
        // This is inefficient but maintains compatibility with the existing "load everything" pattern
        const supabase = getSupabaseAdmin();
        // @ts-ignore
        const [tx, rc, si, ver] = await Promise.all([
            supabase.from('transactions').select('*').order('occurred_at', { ascending: false }),
            supabase.from('receipts').select('*').order('captured_at', { ascending: false }),
            // @ts-ignore
            supabase.from('supplier_invoices').select('*').order('due_date', { ascending: true }),
            // @ts-ignore
            supabase.from('verifications').select('*').order('date', { ascending: false })
        ]);

        return {
            transactions: tx.data || [],
            receipts: rc.data?.map(r => ({ ...r, attachmentUrl: r.image_url })) || [],
            invoices: [], // Not migrated yet
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
            balances: defaultState.balances, // Still mocked for now
            transactionMetadata: {},
            invoices: [],
            aiAuditLogs: [],
            financialPeriods: [],
            taxReports: [],
            employees: [],
            payslips: []
        };
    },

    set: (data: any) => {
        // No-op: We don't overwrite the whole DB anymore
        console.warn("db.set() called but ignored in Supabase mode");
    },

    // Transactions
    addTransaction: async (tx: any) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('transactions').insert({
            id: tx.id,
            date: tx.date,
            description: tx.description,
            amount: tx.amount,
            status: tx.status,
            category: tx.category,
            source: tx.source || 'manual',
            created_by: tx.createdBy || tx.created_by,
            metadata: tx
        }).select().single();
        if (error) console.error("Supabase Error:", error);
        return data || tx;
    },

    updateTransactionMetadata: async (id: string, metadata: any) => {
        const supabase = getSupabaseAdmin();
        // First get existing meta
        const { data: existing } = await supabase.from('transactions').select('metadata').eq('id', id).single();
        const newMeta = { ...(existing?.metadata || {}), ...metadata };

        await supabase.from('transactions').update({
            metadata: newMeta,
            status: metadata.status || undefined,
            category: metadata.category || undefined
        }).eq('id', id);
        return newMeta;
    },

    // Receipts
    addReceipt: async (receipt: any) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('receipts').insert({
            id: receipt.id,
            date: receipt.date,
            supplier: receipt.supplier,
            amount: receipt.amount,
            category: receipt.category,
            status: receipt.status,
            source: receipt.source || 'manual',
            created_by: receipt.createdBy || receipt.created_by,
            image_url: receipt.attachmentUrl
        }).select().single();
        if (error) { console.error("Supabase Error (addReceipt):", error); throw error; }
        return data ? { ...data, attachmentUrl: data.image_url } : receipt;
    },

    // Invoices
    addInvoice: async (invoice: any) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('invoices').insert({
            id: invoice.id,
            invoice_number: invoice.invoiceNumber,
            customer_name: invoice.customerName,
            amount: invoice.amount,
            vat_amount: invoice.vatAmount,
            total_amount: invoice.totalAmount,
            issue_date: invoice.issueDate || invoice.date,
            due_date: invoice.dueDate,
            status: invoice.status || 'draft',
            source: invoice.source || 'manual',
            created_by: invoice.createdBy || invoice.created_by,
            metadata: invoice
        }).select().single();
        if (error) console.error("Supabase Error (addInvoice):", error);
        return data || invoice;
    },

    // Supplier Invoices
    addSupplierInvoice: async (invoice: any) => {
        const supabase = getSupabaseAdmin();
        // Map frontend CamelCase to DB snake_case
        // @ts-ignore
        const { data, error } = await supabase.from('supplier_invoices').insert({
            id: invoice.id,
            invoice_number: invoice.invoiceNumber,
            supplier_name: invoice.supplierName, // or .supplier
            amount: invoice.amount,
            vat_amount: invoice.vatAmount,
            total_amount: invoice.totalAmount,
            due_date: invoice.dueDate,
            issue_date: invoice.invoiceDate,
            status: invoice.status,
            ocr: invoice.ocr || invoice.ocrNumber
        }).select().single();
        console.log(error)
        return invoice;
    },

    updateSupplierInvoice: async (id: string, updates: any) => {
        const supabase = getSupabaseAdmin();
        // Create mapping of updates
        const dbUpdates: any = {};
        if (updates.status) dbUpdates.status = updates.status;

        await supabase.from('supplier_invoices').update(dbUpdates).eq('id', id);
        return { id, ...updates };
    },

    // Verifications
    addVerification: async (verification: any) => {
        const supabase = getSupabaseAdmin();

        let id = verification.id;
        if (!id) {
            // Simple sequence generation via count (race condition prone but fine for MVP)
            const { count } = await supabase.from('verifications').select('*', { count: 'exact', head: true });
            id = `A-${(count || 0) + 1}`;
        }

        // @ts-ignore
        const { data, error } = await supabase.from('verifications').insert({
            id,
            date: verification.date,
            description: verification.description,
            rows: verification.rows
        }).select().single();

        return data || verification;
    },

    getVerifications: async () => {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase.from('verifications').select('*').order('created_at', { ascending: false });
        return data || [];
    },

    // Legacy fallback
    updateTransaction: async (id: string, updates: any) => {
        const supabase = getSupabaseAdmin();
        await supabase.from('transactions').update(updates).eq('id', id);
        return { id, ...updates };
    },

    // Inbox
    getInboxItems: async () => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('inbox')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) console.error('getInboxItems error:', error);
        return (data || []).map((row: any) => ({
            id: row.id,
            sender: row.sender,
            title: row.title,
            description: row.description,
            date: row.date || 'Idag',
            timestamp: new Date(row.created_at),
            category: row.category,
            read: row.read,
            starred: row.starred,
            aiSuggestion: row.ai_suggestion,
            aiStatus: row.ai_status,
            linkedEntityId: row.linked_entity_id,
            linkedEntityType: row.linked_entity_type,
            documentData: row.document_data,
        }));
    },

    addInboxItem: async (item: any) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('inbox').insert({
            id: item.id || undefined,
            sender: item.sender,
            title: item.title,
            description: item.description,
            date: item.date,
            category: item.category || 'other',
            read: item.read ?? false,
            starred: item.starred ?? false,
            ai_suggestion: item.aiSuggestion,
            ai_status: item.aiStatus || 'pending',
            linked_entity_id: item.linkedEntityId,
            linked_entity_type: item.linkedEntityType,
            document_data: item.documentData,
        }).select().single();
        if (error) console.error('addInboxItem error:', error);
        return data || item;
    },

    updateInboxItem: async (id: string, updates: any) => {
        const supabase = getSupabaseAdmin();
        const dbUpdates: any = {};
        if (updates.read !== undefined) dbUpdates.read = updates.read;
        if (updates.starred !== undefined) dbUpdates.starred = updates.starred;
        if (updates.aiStatus !== undefined) dbUpdates.ai_status = updates.aiStatus;
        if (updates.aiSuggestion !== undefined) dbUpdates.ai_suggestion = updates.aiSuggestion;
        if (updates.linkedEntityId !== undefined) dbUpdates.linked_entity_id = updates.linkedEntityId;
        if (updates.linkedEntityType !== undefined) dbUpdates.linked_entity_type = updates.linkedEntityType;
        if (updates.category !== undefined) dbUpdates.category = updates.category;

        const { error } = await supabase.from('inbox').update(dbUpdates).eq('id', id);
        if (error) console.error('updateInboxItem error:', error);
        return { id, ...updates };
    },

    clearInbox: async () => {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase.from('inbox').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) console.error('clearInbox error:', error);
        return { success: !error };
    },

    // AI Audit Logs
    logAIToolExecution: async (log: {
        toolName: string,
        parameters: any,
        result?: any,
        status: 'success' | 'error' | 'pending',
        executionTimeMs?: number,
        errorMessage?: string,
        userId?: string
    }) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('ai_audit_log').insert({
            tool_name: log.toolName,
            parameters: log.parameters,
            result: log.result,
            status: log.status,
            execution_time_ms: log.executionTimeMs,
            error_message: log.errorMessage,
            user_id: log.userId
        }).select().single();
        if (error) console.error("Supabase Error (logAIToolExecution):", error);
        return data;
    },

    // Financial Periods
    getFinancialPeriods: async () => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('financial_periods').select('*').order('start_date', { ascending: false });
        if (error) console.error("Supabase Error (getFinancialPeriods):", error);
        return data || [];
    },

    updateFinancialPeriodStatus: async (id: string, status: string) => {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase.from('financial_periods').update({ status }).eq('id', id);
        if (error) console.error("Supabase Error (updateFinancialPeriodStatus):", error);
        return { success: !error };
    },

    // Tax Reports (VAT etc)
    getTaxReports: async (type?: string) => {
        const supabase = getSupabaseAdmin();
        let query = supabase.from('tax_reports').select('*').order('generated_at', { ascending: false });
        if (type) query = query.eq('report_type', type);
        const { data, error } = await query;
        if (error) console.error("Supabase Error (getTaxReports):", error);
        return data || [];
    },

    upsertTaxReport: async (report: any) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('tax_reports').upsert({
            id: report.id || undefined,
            user_id: report.user_id,
            period_id: report.period_id,
            report_type: report.report_type || 'vat',
            data: report.data,
            status: report.status || 'draft',
            period_start: report.period_start,
            period_end: report.period_end,
            generated_at: new Date().toISOString()
        }).select().single();
        if (error) console.error("Supabase Error (upsertTaxReport):", error);
        return data || report;
    },

    // Employees
    getEmployees: async () => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('employees').select('*').order('name');
        if (error) console.error("Supabase Error (getEmployees):", error);
        return data || [];
    },

    // Payslips
    getPayslips: async () => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('payslips').select('*, employees(*)').order('created_at', { ascending: false });
        if (error) console.error("Supabase Error (getPayslips):", error);
        return data || [];
    },

    addPayslip: async (payslip: any) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('payslips').insert({
            id: payslip.id,
            employee_id: payslip.employee_id,
            period: payslip.period,
            gross_salary: payslip.gross_salary,
            tax_deduction: payslip.tax_deduction,
            net_salary: payslip.net_salary,
            bonuses: payslip.bonuses || 0,
            deductions: payslip.deductions || 0,
            status: payslip.status || 'draft',
            payment_date: payslip.payment_date,
            user_id: payslip.user_id,
        }).select().single();
        if (error) console.error("Supabase Error (addPayslip):", error);
        return data || payslip;
    },

    // Corporate Compliance
    getCorporateDocuments: async () => {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase.from('corporate_documents').select('*').order('date', { ascending: false });
        return data || [];
    },

    addCorporateDocument: async (doc: any) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('corporate_documents').insert({
            id: doc.id || undefined,
            type: doc.type,
            title: doc.title,
            date: doc.date,
            content: doc.content,
            status: doc.status || 'draft',
            source: doc.source || 'manual',
            created_by: doc.createdBy || doc.created_by,
            metadata: doc.metadata || {}
        }).select().single();
        if (error) console.error("Supabase Error (addCorporateDocument):", error);
        return data || doc;
    },

    getShareholders: async () => {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase.from('shareholders').select('*').order('shares_count', { ascending: false });
        return data || [];
    },

    updateShareholder: async (id: string, updates: any) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('shareholders').update(updates).eq('id', id).select().single();
        if (error) console.error("Supabase Error (updateShareholder):", error);
        return data || { id, ...updates };
    },
};

// Keep readDB for the migration script ONLY (reads the JSON file one last time)
/*
export function readDB(): any { // Typing loose for now
    const fs = require('fs');
    const path = require('path');
    const DB_PATH = path.join(process.cwd(), 'src', 'data', 'simulated-db.json');
    try {
        if (fs.existsSync(DB_PATH)) {
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        }
    } catch (e) { }
    return defaultState;
}
*/
