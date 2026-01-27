/**
 * Shared Types for Database Repositories
 * 
 * Common types and interfaces used across all repositories.
 */

import type { Json } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Re-export database types
export type Tables = Database['public']['Tables']
export type { Json }

// Supabase client type alias
export type DbClient = SupabaseClient<Database>

// Common input types for server-db operations
export interface TransactionInput {
    id?: string
    date?: string
    description?: string
    name?: string
    amount?: number | string
    status?: string
    category?: string
    source?: string
    createdBy?: string
    created_by?: string
    metadata?: Record<string, unknown>
}

export interface TransactionMetadata {
    status?: string
    category?: string
    [key: string]: unknown
}

export interface ReceiptInput {
    id?: string
    date?: string
    supplier?: string
    amount?: number
    category?: string
    status?: string
    source?: string
    createdBy?: string
    created_by?: string
    attachmentUrl?: string
}

export interface InvoiceInput {
    id?: string
    invoiceNumber?: string
    customerName?: string
    amount?: number
    vatAmount?: number
    totalAmount?: number
    issueDate?: string
    date?: string
    dueDate?: string
    status?: string
    createdBy?: string
    created_by?: string
    companyId?: string
}

export interface SupplierInvoiceInput {
    id?: string
    invoiceNumber?: string
    supplierName?: string
    supplier?: string
    amount?: number
    vatAmount?: number
    totalAmount?: number
    dueDate?: string
    invoiceDate?: string
    status?: string
    ocr?: string
    ocrNumber?: string
}

export interface VerificationInput {
    id?: string
    date?: string
    description?: string
    rows?: Json
}

export interface EmployeeInput {
    name: string
    role?: string
    email?: string
    salary?: number
    status?: string
    employment_date?: string
}

export interface PayslipInput {
    id?: string
    employee_id: string
    period: string
    gross_salary: number
    tax_deduction: number
    net_salary: number
    bonuses?: number
    deductions?: number
    status?: string
    payment_date?: string
    user_id?: string
}

export interface CorporateDocumentInput {
    id?: string
    type: string
    title: string
    date?: string
    content?: string
    status?: string
    source?: string
    createdBy?: string
    created_by?: string
    metadata?: Record<string, unknown>
}

export interface ShareholderInput {
    name: string
    ssn_org_nr?: string
    shares_count?: number
    shares_percentage?: number
    share_class?: string
}

export interface TaxReportInput {
    id?: string
    user_id?: string
    period_id?: string
    report_type?: string
    data?: Json
    status?: string
    period_start?: string
    period_end?: string
}

export interface InboxItemInput {
    id?: string
    sender?: string
    title?: string
    description?: string
    date?: string
    category?: string
    read?: boolean
    starred?: boolean
}

export interface InboxItemRow {
    id: string
    sender?: string
    title?: string
    description?: string
    date?: string
    created_at: string
    category?: string
    read?: boolean
    starred?: boolean
}

export interface AIToolLogInput {
    toolName: string
    parameters: Record<string, unknown>
    result?: unknown
    status: 'success' | 'error' | 'pending'
    executionTimeMs?: number
    errorMessage?: string
    userId?: string
}

export interface MessageInput {
    conversation_id: string
    role: 'user' | 'assistant' | 'system' | 'data'
    content: string
    tool_calls?: Json
    tool_results?: Json
    metadata?: Record<string, unknown>
    user_id: string
}

// Roadmap with nested steps type (from join query)
export type RoadmapWithSteps = Tables['roadmaps']['Row'] & {
    steps: Tables['roadmap_steps']['Row'][]
}
