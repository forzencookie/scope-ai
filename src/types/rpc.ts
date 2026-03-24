/**
 * RPC Return Types
 *
 * Types for Supabase RPC function results that aren't in the generated types yet.
 * Used in service mappers to replace `any` casts on RPC results.
 */

/** Return type for `get_account_balances` RPC */
export interface AccountBalanceRow {
    id: string
    account_number: number
    account_name: string
    balance: number
    period: string | null
    year: number
}

/** Return type for `get_invoice_stats` RPC */
export interface InvoiceStatsRow {
    incoming_total: number
    outgoing_total: number
    overdue_count: number
    overdue_amount: number
    paid_amount: number
}
