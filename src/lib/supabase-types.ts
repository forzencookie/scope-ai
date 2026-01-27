/**
 * Supabase Type Helpers
 * 
 * Helpers for working with Supabase's Json type and database responses.
 * Use these instead of `as any` when dealing with Json columns or dynamic data.
 */

import type { Database } from '@/types/database'

// =============================================================================
// Json Column Helpers
// =============================================================================

/**
 * Supabase Json type from database
 */
export type Json = Database['public']['CompositeTypes'] extends { Json: infer T } 
    ? T 
    : string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

/**
 * Safely extract a typed value from a Json column
 */
export function fromJson<T>(
    json: Json | null | undefined,
    defaultValue: T
): T {
    if (json === null || json === undefined) {
        return defaultValue
    }
    return json as unknown as T
}

/**
 * Safely extract a record from a Json column
 */
export function jsonAsRecord(json: Json | null | undefined): Record<string, unknown> {
    if (json === null || json === undefined) {
        return {}
    }
    if (typeof json === 'object' && !Array.isArray(json)) {
        return json as Record<string, unknown>
    }
    return {}
}

/**
 * Safely extract an array from a Json column
 */
export function jsonAsArray<T = unknown>(json: Json | null | undefined): T[] {
    if (json === null || json === undefined) {
        return []
    }
    if (Array.isArray(json)) {
        return json as T[]
    }
    return []
}

// =============================================================================
// Database Row Type Helpers
// =============================================================================

/**
 * Extract Row type from a table name
 */
export type TableRow<T extends keyof Database['public']['Tables']> = 
    Database['public']['Tables'][T]['Row']

/**
 * Extract Insert type from a table name
 */
export type TableInsert<T extends keyof Database['public']['Tables']> = 
    Database['public']['Tables'][T]['Insert']

/**
 * Extract Update type from a table name
 */
export type TableUpdate<T extends keyof Database['public']['Tables']> = 
    Database['public']['Tables'][T]['Update']

// =============================================================================
// Common Table Type Aliases
// =============================================================================

export type TransactionRow = TableRow<'transactions'>
export type TransactionInsert = TableInsert<'transactions'>
export type TransactionUpdate = TableUpdate<'transactions'>

export type ReceiptRow = TableRow<'receipts'>
export type ReceiptInsert = TableInsert<'receipts'>
export type ReceiptUpdate = TableUpdate<'receipts'>

export type VerificationRow = TableRow<'verifications'>
export type VerificationInsert = TableInsert<'verifications'>
export type VerificationUpdate = TableUpdate<'verifications'>

export type SupplierInvoiceRow = TableRow<'supplierinvoices'>
export type SupplierInvoiceInsert = TableInsert<'supplierinvoices'>
export type SupplierInvoiceUpdate = TableUpdate<'supplierinvoices'>

export type EmployeeRow = TableRow<'employees'>
export type EmployeeInsert = TableInsert<'employees'>
export type EmployeeUpdate = TableUpdate<'employees'>

export type PayslipRow = TableRow<'payslips'>
export type PayslipInsert = TableInsert<'payslips'>
export type PayslipUpdate = TableUpdate<'payslips'>

export type CompanyRow = TableRow<'companies'>
export type CompanyInsert = TableInsert<'companies'>
export type CompanyUpdate = TableUpdate<'companies'>

export type ProfileRow = TableRow<'profiles'>
export type ProfileInsert = TableInsert<'profiles'>
export type ProfileUpdate = TableUpdate<'profiles'>

// =============================================================================
// Query Result Helpers
// =============================================================================

/**
 * Type for a Supabase query result with data
 */
export type QueryResult<T> = {
    data: T | null
    error: Error | null
}

/**
 * Type for a Supabase query result with array data
 */
export type QueryArrayResult<T> = {
    data: T[] | null
    error: Error | null
}

/**
 * Extract data from query result with fallback
 */
export function unwrapQuery<T>(
    result: { data: T | null; error: unknown },
    fallback: T
): T {
    if (result.error || result.data === null) {
        return fallback
    }
    return result.data
}

/**
 * Extract array data from query result with empty fallback
 */
export function unwrapQueryArray<T>(
    result: { data: T[] | null; error: unknown }
): T[] {
    if (result.error || result.data === null) {
        return []
    }
    return result.data
}

// =============================================================================
// RPC Function Helpers
// =============================================================================

/**
 * Type-safe RPC function call result extractor
 */
export function unwrapRpc<T>(
    result: { data: T | null; error: unknown },
    fallback: T
): T {
    if (result.error || result.data === null) {
        return fallback
    }
    return result.data
}

// =============================================================================
// Partial/Nullable Helpers
// =============================================================================

/**
 * Make all properties of T nullable (for updates)
 */
export type Nullable<T> = {
    [P in keyof T]: T[P] | null
}

/**
 * Make specified properties of T required
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

/**
 * Pick only the fields that exist in the database row
 */
export type PickRow<T extends keyof Database['public']['Tables'], K extends keyof TableRow<T>> = 
    Pick<TableRow<T>, K>
