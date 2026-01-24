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
    get: async (options?: { limit?: number }) => {
        // Build the full "SimulatedDB" object by querying all tables
        // PERFORMANCE: Added default pagination limits to prevent loading entire database
        const supabase = getSupabaseAdmin();
        const defaultLimit = options?.limit ?? 20; // Default to 20 records per table to optimize initial load

        // @ts-ignore
        const [tx, rc, si, ver] = await Promise.all([
            supabase.from('transactions').select('*').order('occurred_at', { ascending: false }).limit(defaultLimit),
            supabase.from('receipts').select('*').order('captured_at', { ascending: false }).limit(defaultLimit),
            // @ts-ignore
            supabase.from('supplier_invoices').select('*').order('due_date', { ascending: true }).limit(defaultLimit),
            // @ts-ignore
            supabase.from('verifications').select('*').order('date', { ascending: false }).limit(defaultLimit)
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

    set: (_data: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _ = _data;
        // No-op: We don't overwrite the whole DB anymore
        console.warn("db.set() called but ignored in Supabase mode");
    },

    // Transactions
    addTransaction: async (tx: any) => {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase.from('transactions').insert({
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

    getTransactions: async (filters: {
        limit?: number,
        startDate?: string,
        endDate?: string,
        minAmount?: number,
        maxAmount?: number,
        status?: string
    } = {}) => {
        const supabase = getSupabaseAdmin();
        let query = supabase.from('transactions').select('*').order('date', { ascending: false });

        if (filters.startDate) query = query.gte('date', filters.startDate);
        if (filters.endDate) query = query.lte('date', filters.endDate);
        if (filters.minAmount !== undefined) query = query.gte('amount', filters.minAmount); // Note: Simple check, handling negative amounts (expenses) complexity might be needed if user means absolute magnitude
        if (filters.status) query = query.eq('status', filters.status);

        if (filters.limit) query = query.limit(filters.limit);

        const { data, error } = await query;
        if (error) console.error("Supabase Error (getTransactions):", error);
        return data || [];
    },

    getCustomerInvoices: async (filters: {
        limit?: number,
        status?: string,
        customer?: string
    } = {}) => {
        const supabase = getSupabaseAdmin();
        // Note: 'invoices' table is for customer invoices
        let query = supabase.from('invoices').select('*').order('due_date', { ascending: true });

        if (filters.status) query = query.eq('status', filters.status);
        if (filters.customer) query = query.ilike('customer_name', `%${filters.customer}%`);

        if (filters.limit) query = query.limit(filters.limit);

        const { data, error } = await query;
        if (error) console.error("Supabase Error (getCustomerInvoices):", error);

        // Map snake_case to CamelCase if needed by frontend/AI, but generally tools should adapt. 
        // For consistency with existing codebase, let's map it.
        return (data || []).map(i => ({
            ...i,
            customerName: i.customer_name,
            invoiceNumber: i.invoice_number,
            totalAmount: i.total_amount,
            dueDate: i.due_date
        }));
    },

    getSupplierInvoices: async (filters: {
        limit?: number,
        status?: string,
        supplier?: string
    } = {}) => {
        const supabase = getSupabaseAdmin();
        let query = supabase.from('supplier_invoices').select('*').order('due_date', { ascending: true });

        if (filters.status) query = query.eq('status', filters.status);
        if (filters.supplier) query = query.ilike('supplier_name', `%${filters.supplier}%`);

        if (filters.limit) query = query.limit(filters.limit);

        const { data, error } = await query;
        if (error) console.error("Supabase Error (getSupplierInvoices):", error);

        return (data || []).map(i => ({
            ...i,
            supplierName: i.supplier_name,
            invoiceNumber: i.invoice_number,
            totalAmount: i.total_amount,
            dueDate: i.due_date,
            invoiceDate: i.issue_date
        }));
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
        const { error } = await supabase.from('supplier_invoices').insert({
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
        
        if (error) {
            console.error('Error adding supplier invoice:', error);
            throw error;
        }

        return invoice;
    },

    updateSupplierInvoice: async (id: string, updates: any) => {
        const supabase = getSupabaseAdmin();
        // Create mapping of updates
        const dbUpdates: any = {};
        if (updates.status) dbUpdates.status = updates.status;

        const { error } = await supabase.from('supplier_invoices').update(dbUpdates).eq('id', id);
        if (error) {
            console.error('Error updating supplier invoice:', error);
            throw error;
        }
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
        const { error } = await supabase.from('verifications').insert({
            id,
            date: verification.date,
            description: verification.description,
            rows: verification.rows
        }).select().single();

        if (error) {
            console.error('Error adding verification:', error);
            throw error;
        }

        return data || verification;
    },

    getVerifications: async (limit?: number) => {
        const supabase = getSupabaseAdmin();
        let query = supabase.from('verifications').select('*').order('created_at', { ascending: false });
        if (limit) query = query.limit(limit);
        else query = query.limit(50); // Default pagination
        const { data } = await query;
        return data || [];
    },

    // Legacy fallback
    updateTransaction: async (id: string, updates: any) => {
        const supabase = getSupabaseAdmin();
        await supabase.from('transactions').update(updates).eq('id', id);
        return { id, ...updates };
    },

    // Inbox
    getInboxItems: async (limit?: number) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('inbox_items')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit ?? 50); // Default pagination
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
        }));
    },

    addInboxItem: async (item: any) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('inbox_items').insert({
            id: item.id || undefined,
            sender: item.sender,
            title: item.title,
            description: item.description,
            date: item.date,
            category: item.category || 'other',
            read: item.read ?? false,
            starred: item.starred ?? false,
        }).select().single();
        if (error) console.error('addInboxItem error:', error);
        return data || item;
    },

    updateInboxItem: async (id: string, updates: any) => {
        const supabase = getSupabaseAdmin();
        const dbUpdates: any = {};
        if (updates.read !== undefined) dbUpdates.read = updates.read;
        if (updates.starred !== undefined) dbUpdates.starred = updates.starred;
        if (updates.category !== undefined) dbUpdates.category = updates.category;

        const { error } = await supabase.from('inbox_items').update(dbUpdates).eq('id', id);
        if (error) console.error('updateInboxItem error:', error);
        return { id, ...updates };
    },

    clearInbox: async () => {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase.from('inbox_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
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
    getEmployees: async (limit?: number) => {
        const supabase = getSupabaseAdmin();
        let query = supabase.from('employees').select('*').order('name');
        if (limit) query = query.limit(limit);
        else query = query.limit(100); // Default pagination for employees
        const { data, error } = await query;
        if (error) console.error("Supabase Error (getEmployees):", error);
        return data || [];
    },

    addEmployee: async (employee: any) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('employees').insert({
            name: employee.name,
            role: employee.role,
            email: employee.email,
            salary: employee.salary,
            status: employee.status || 'active',
            employment_date: employee.employment_date || new Date().toISOString().split('T')[0]
        }).select().single();

        if (error) {
            console.error("Supabase Error (addEmployee):", error);
            throw new Error(`Failed to add employee: ${error.message}`);
        }
        return data;
    },


    // Payslips
    getPayslips: async (limit?: number) => {
        const supabase = getSupabaseAdmin();
        let query = supabase.from('payslips').select('*, employees(*)').order('created_at', { ascending: false });
        if (limit) query = query.limit(limit);
        else query = query.limit(50); // Default pagination
        const { data, error } = await query;
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
    getCorporateDocuments: async (limit?: number) => {
        const supabase = getSupabaseAdmin();
        let query = supabase.from('corporate_documents').select('*').order('date', { ascending: false });
        if (limit) query = query.limit(limit);
        else query = query.limit(50); // Default pagination
        const { data } = await query;
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

    getShareholders: async (limit?: number) => {
        const supabase = getSupabaseAdmin();
        let query = supabase.from('shareholders').select('*').order('shares_count', { ascending: false });
        if (limit) query = query.limit(limit);
        else query = query.limit(100); // Default pagination
        const { data } = await query;
        return data || [];
    },

    updateShareholder: async (id: string, updates: any) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('shareholders').update(updates).eq('id', id).select().single();
        if (error) console.error("Supabase Error (updateShareholder):", error);
        return data || { id, ...updates };
    },

    addShareholder: async (shareholder: any) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('shareholders').insert({
            name: shareholder.name,
            ssn_org_nr: shareholder.ssn_org_nr || '',
            shares_count: shareholder.shares_count || 0,
            shares_percentage: shareholder.shares_percentage || 0,
            share_class: shareholder.share_class || 'B', // Default to B shares if not specified
        }).select().single();
        if (error) {
            console.error("Supabase Error (addShareholder):", error);
            throw new Error(`Failed to add shareholder: ${error.message}`);
        }
        return data;
    },

    // ============================================================================
    // Planning & Roadmaps
    // ============================================================================

    getRoadmaps: async (userId: string) => {
        const supabase = getSupabaseAdmin();
        // Get active roadmaps with their steps
        const { data, error } = await supabase
            .from('roadmaps')
            .select('*, steps:roadmap_steps(*)')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) console.error("Supabase Error (getRoadmaps):", error);
        return data || [];
    },

    // ============================================================================
    // KPI / Status Aggregation (for AI Context)
    // ============================================================================

    getCompanyKPIs: async () => {
        // Simplified KPI fetcher for AI context
        // In a real app, this would do proper aggregation queries
        const supabase = getSupabaseAdmin();

        // Parallel queries for speed
        // @ts-ignore
        const [tx, invoices, inbox] = await Promise.all([
            supabase.from('transactions').select('amount, status').limit(100), // Last 100 tx
            // @ts-ignore
            supabase.from('supplier_invoices').select('amount, due_date, status').eq('status', 'unpaid'),
            supabase.from('inbox_items').select('count', { count: 'exact', head: true }).eq('read', false)
        ]);

        return {
            recent_transactions_count: tx.data?.length || 0,
            unpaid_invoices_count: invoices.data?.length || 0,
            unread_inbox_count: inbox.count || 0,
            last_sync: new Date().toISOString()
        };
    },


    // ============================================================================
    // Chat Persistence
    // ============================================================================

    createConversation: async (title: string, userId?: string) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('conversations').insert({
            title,
            user_id: userId
        }).select().single();
        if (error) console.error("Supabase Error (createConversation):", error);
        return data;
    },

    getConversations: async (userId?: string, limit?: number) => {
        const supabase = getSupabaseAdmin();
        let query = supabase.from('conversations').select('*').order('updated_at', { ascending: false });
        if (userId) query = query.eq('user_id', userId);
        query = query.limit(limit ?? 50); // Default pagination for conversations
        const { data, error } = await query;
        if (error) console.error("Supabase Error (getConversations):", error);
        return data || [];
    },

    getConversation: async (id: string) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('conversations').select('*').eq('id', id).single();
        if (error) console.error("Supabase Error (getConversation):", error);
        return data;
    },

    addMessage: async (message: {
        conversation_id: string,
        role: 'user' | 'assistant' | 'system' | 'data',
        content: string,
        tool_calls?: any,
        tool_results?: any,
        metadata?: any
    }) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('messages').insert({
            conversation_id: message.conversation_id,
            role: message.role,
            content: message.content,
            tool_calls: message.tool_calls,
            tool_results: message.tool_results,
            metadata: message.metadata
        }).select().single();

        // Update conversation timestamp
        if (!error && message.conversation_id) {
            await supabase.from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', message.conversation_id);
        }

        if (error) console.error("Supabase Error (addMessage):", error);
        return data;
    },

    getMessages: async (conversationId: string) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) console.error("Supabase Error (getMessages):", error);
        return data || [];
    }
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
