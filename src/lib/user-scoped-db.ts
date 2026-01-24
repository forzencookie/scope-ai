// @ts-nocheck - Supabase types need regeneration, tables exist in schema.sql
/**
 * User-Scoped Database Access
 * 
 * This module provides database access that automatically filters data
 * by the authenticated user's company membership. Unlike server-db.ts
 * which uses the admin client (bypasses RLS), this uses the user's
 * session to enforce Row Level Security.
 * 
 * Usage:
 *   const userDb = await createUserScopedDb()
 *   if (!userDb) return unauthorized()
 *   const transactions = await userDb.transactions.list()
 */

import { createServerSupabaseClient } from './supabase-server'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Type aliases for cleaner code
type Tables = Database['public']['Tables']

export interface UserScopedDb {
    userId: string
    companyId: string | null

    // Data accessors - all automatically filtered by RLS
    transactions: {
        list: (options?: { limit?: number }) => Promise<Tables['transactions']['Row'][]>
        getById: (id: string) => Promise<Tables['transactions']['Row'] | null>
        create: (data: Tables['transactions']['Insert']) => Promise<Tables['transactions']['Row'] | null>
        update: (id: string, data: Tables['transactions']['Update']) => Promise<Tables['transactions']['Row'] | null>
        delete: (id: string) => Promise<boolean>
    }

    receipts: {
        list: (options?: { limit?: number }) => Promise<Tables['receipts']['Row'][]>
        getById: (id: string) => Promise<Tables['receipts']['Row'] | null>
        create: (data: Tables['receipts']['Insert']) => Promise<Tables['receipts']['Row'] | null>
        update: (id: string, data: Tables['receipts']['Update']) => Promise<Tables['receipts']['Row'] | null>
    }

    supplierInvoices: {
        list: (options?: { limit?: number }) => Promise<Tables['supplier_invoices']['Row'][]>
        getById: (id: string) => Promise<Tables['supplier_invoices']['Row'] | null>
        create: (data: Tables['supplier_invoices']['Insert']) => Promise<Tables['supplier_invoices']['Row'] | null>
        update: (id: string, data: Tables['supplier_invoices']['Update']) => Promise<Tables['supplier_invoices']['Row'] | null>
    }

    verifications: {
        list: (options?: { limit?: number }) => Promise<Tables['verifications']['Row'][]>
        getById: (id: string) => Promise<Tables['verifications']['Row'] | null>
        create: (data: Tables['verifications']['Insert']) => Promise<Tables['verifications']['Row'] | null>
    }

    // Payroll tables
    employees: {
        list: (options?: { limit?: number }) => Promise<Tables['employees']['Row'][]>
        getById: (id: string) => Promise<Tables['employees']['Row'] | null>
        create: (data: Tables['employees']['Insert']) => Promise<Tables['employees']['Row'] | null>
        update: (id: string, data: Tables['employees']['Update']) => Promise<Tables['employees']['Row'] | null>
    }

    payslips: {
        list: (options?: { limit?: number }) => Promise<Tables['payslips']['Row'][]>
        getById: (id: string) => Promise<Tables['payslips']['Row'] | null>
        create: (data: Tables['payslips']['Insert']) => Promise<Tables['payslips']['Row'] | null>
    }

    // Conversations (user-scoped, not company-scoped)
    conversations: {
        list: (options?: { limit?: number }) => Promise<Tables['conversations']['Row'][]>
        getById: (id: string) => Promise<Tables['conversations']['Row'] | null>
        create: (data: Tables['conversations']['Insert']) => Promise<Tables['conversations']['Row'] | null>
        delete: (id: string) => Promise<boolean>
    }

    messages: {
        listByConversation: (conversationId: string) => Promise<Tables['messages']['Row'][]>
        create: (data: Tables['messages']['Insert']) => Promise<Tables['messages']['Row'] | null>
    }

    // Inbox items (company-scoped)
    inboxItems: {
        list: (options?: { limit?: number }) => Promise<Tables['inbox_items']['Row'][]>
        create: (data: Tables['inbox_items']['Insert']) => Promise<Tables['inbox_items']['Row'] | null>
        update: (id: string, data: Tables['inbox_items']['Update']) => Promise<Tables['inbox_items']['Row'] | null>
    }

    // Roadmaps (user-scoped planning)
    roadmaps: {
        listActive: () => Promise<any[]>
    }

    // Aggregated KPIs (reads from multiple tables)
    getCompanyKPIs: () => Promise<{
        recent_transactions_count: number
        unpaid_invoices_count: number
        unread_inbox_count: number
        last_sync: string
    }>

    // Raw client access for advanced queries
    client: SupabaseClient<Database>
}

/**
 * Create a user-scoped database accessor
 * 
 * Returns null if user is not authenticated.
 * All queries automatically respect RLS policies.
 * 
 * @example
 * const userDb = await createUserScopedDb()
 * if (!userDb) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 * }
 * const txs = await userDb.transactions.list({ limit: 50 })
 */
export async function createUserScopedDb(): Promise<UserScopedDb | null> {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
        return null
    }

    // Get user's company (optional - some data is user-scoped, some is company-scoped)
    const { data: membership } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single()

    const companyId = membership?.company_id ?? null

    // Build the accessor object
    return {
        userId: user.id,
        companyId,
        client: supabase,

        transactions: {
            list: async (options?: { limit?: number }) => {
                const query = supabase
                    .from('transactions')
                    .select('*')
                    .order('occurred_at', { ascending: false })
                
                if (options?.limit) {
                    query.limit(options.limit)
                }
                
                const { data, error } = await query
                if (error) {
                    console.error('[UserScopedDb] transactions.list error:', error)
                    return []
                }
                return data || []
            },

            getById: async (id: string) => {
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('id', id)
                    .single()
                
                if (error) return null
                return data
            },

            create: async (data) => {
                // Automatically set user_id if not provided
                const insertData = {
                    ...data,
                    user_id: data.user_id ?? user.id,
                    company_id: data.company_id ?? companyId,
                }
                
                const { data: created, error } = await supabase
                    .from('transactions')
                    .insert(insertData)
                    .select()
                    .single()
                
                if (error) {
                    console.error('[UserScopedDb] transactions.create error:', error)
                    return null
                }
                return created
            },

            update: async (id: string, data) => {
                const { data: updated, error } = await supabase
                    .from('transactions')
                    .update(data)
                    .eq('id', id)
                    .select()
                    .single()
                
                if (error) {
                    console.error('[UserScopedDb] transactions.update error:', error)
                    return null
                }
                return updated
            },

            delete: async (id: string) => {
                const { error } = await supabase
                    .from('transactions')
                    .delete()
                    .eq('id', id)
                
                if (error) {
                    console.error('[UserScopedDb] transactions.delete error:', error)
                    return false
                }
                return true
            },
        },

        receipts: {
            list: async (options?: { limit?: number }) => {
                const query = supabase
                    .from('receipts')
                    .select('*')
                    .order('captured_at', { ascending: false })
                
                if (options?.limit) {
                    query.limit(options.limit)
                }
                
                const { data, error } = await query
                if (error) {
                    console.error('[UserScopedDb] receipts.list error:', error)
                    return []
                }
                return data || []
            },

            getById: async (id: string) => {
                const { data, error } = await supabase
                    .from('receipts')
                    .select('*')
                    .eq('id', id)
                    .single()
                
                if (error) return null
                return data
            },

            create: async (data) => {
                const insertData = {
                    ...data,
                    user_id: data.user_id ?? user.id,
                    company_id: data.company_id ?? companyId,
                }
                
                const { data: created, error } = await supabase
                    .from('receipts')
                    .insert(insertData)
                    .select()
                    .single()
                
                if (error) {
                    console.error('[UserScopedDb] receipts.create error:', error)
                    return null
                }
                return created
            },

            update: async (id: string, data) => {
                const { data: updated, error } = await supabase
                    .from('receipts')
                    .update(data)
                    .eq('id', id)
                    .select()
                    .single()
                
                if (error) {
                    console.error('[UserScopedDb] receipts.update error:', error)
                    return null
                }
                return updated
            },
        },

        supplierInvoices: {
            list: async (options?: { limit?: number }) => {
                const query = supabase
                    .from('supplier_invoices')
                    .select('*')
                    .order('due_date', { ascending: true })
                
                if (options?.limit) {
                    query.limit(options.limit)
                }
                
                const { data, error } = await query
                if (error) {
                    console.error('[UserScopedDb] supplierInvoices.list error:', error)
                    return []
                }
                return data || []
            },

            getById: async (id: string) => {
                const { data, error } = await supabase
                    .from('supplier_invoices')
                    .select('*')
                    .eq('id', id)
                    .single()
                
                if (error) return null
                return data
            },

            create: async (data) => {
                const insertData = {
                    ...data,
                    user_id: data.user_id ?? user.id,
                    company_id: data.company_id ?? companyId,
                }
                
                const { data: created, error } = await supabase
                    .from('supplier_invoices')
                    .insert(insertData)
                    .select()
                    .single()
                
                if (error) {
                    console.error('[UserScopedDb] supplierInvoices.create error:', error)
                    return null
                }
                return created
            },

            update: async (id: string, data) => {
                const { data: updated, error } = await supabase
                    .from('supplier_invoices')
                    .update(data)
                    .eq('id', id)
                    .select()
                    .single()
                
                if (error) {
                    console.error('[UserScopedDb] supplierInvoices.update error:', error)
                    return null
                }
                return updated
            },
        },

        verifications: {
            list: async (options?: { limit?: number }) => {
                const query = supabase
                    .from('verifications')
                    .select('*')
                    .order('date', { ascending: false })
                
                if (options?.limit) {
                    query.limit(options.limit)
                }
                
                const { data, error } = await query
                if (error) {
                    console.error('[UserScopedDb] verifications.list error:', error)
                    return []
                }
                return data || []
            },

            getById: async (id: string) => {
                const { data, error } = await supabase
                    .from('verifications')
                    .select('*')
                    .eq('id', id)
                    .single()
                
                if (error) return null
                return data
            },

            create: async (data) => {
                const insertData = {
                    ...data,
                    user_id: data.user_id ?? user.id,
                    company_id: data.company_id ?? companyId,
                }
                
                const { data: created, error } = await supabase
                    .from('verifications')
                    .insert(insertData)
                    .select()
                    .single()
                
                if (error) {
                    console.error('[UserScopedDb] verifications.create error:', error)
                    return null
                }
                return created
            },
        },

        // ============================================
        // EMPLOYEES
        // ============================================
        employees: {
            list: async (options?: { limit?: number }) => {
                const query = supabase
                    .from('employees')
                    .select('*')
                    .order('name', { ascending: true })
                
                if (options?.limit) {
                    query.limit(options.limit)
                }
                
                const { data, error } = await query
                if (error) {
                    console.error('[UserScopedDb] employees.list error:', error)
                    return []
                }
                return data || []
            },

            getById: async (id: string) => {
                const { data, error } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('id', id)
                    .single()
                
                if (error) return null
                return data
            },

            create: async (data) => {
                const insertData = {
                    ...data,
                    user_id: data.user_id ?? user.id,
                }
                
                const { data: created, error } = await supabase
                    .from('employees')
                    .insert(insertData)
                    .select()
                    .single()
                
                if (error) {
                    console.error('[UserScopedDb] employees.create error:', error)
                    return null
                }
                return created
            },

            update: async (id: string, data) => {
                const { data: updated, error } = await supabase
                    .from('employees')
                    .update(data)
                    .eq('id', id)
                    .select()
                    .single()
                
                if (error) {
                    console.error('[UserScopedDb] employees.update error:', error)
                    return null
                }
                return updated
            },
        },

        // ============================================
        // PAYSLIPS
        // ============================================
        payslips: {
            list: async (options?: { limit?: number }) => {
                const query = supabase
                    .from('payslips')
                    .select('*')
                    .order('created_at', { ascending: false })
                
                if (options?.limit) {
                    query.limit(options.limit)
                }
                
                const { data, error } = await query
                if (error) {
                    console.error('[UserScopedDb] payslips.list error:', error)
                    return []
                }
                return data || []
            },

            getById: async (id: string) => {
                const { data, error } = await supabase
                    .from('payslips')
                    .select('*')
                    .eq('id', id)
                    .single()
                
                if (error) return null
                return data
            },

            create: async (data) => {
                const insertData = {
                    ...data,
                    user_id: data.user_id ?? user.id,
                }
                
                const { data: created, error } = await supabase
                    .from('payslips')
                    .insert(insertData)
                    .select()
                    .single()
                
                if (error) {
                    console.error('[UserScopedDb] payslips.create error:', error)
                    return null
                }
                return created
            },
        },

        // ============================================
        // CONVERSATIONS (User-scoped, not company-scoped)
        // ============================================
        conversations: {
            list: async (options?: { limit?: number }) => {
                const query = supabase
                    .from('conversations')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })
                
                if (options?.limit) {
                    query.limit(options.limit)
                }
                
                const { data, error } = await query
                if (error) {
                    console.error('[UserScopedDb] conversations.list error:', error)
                    return []
                }
                return data || []
            },

            getById: async (id: string) => {
                const { data, error } = await supabase
                    .from('conversations')
                    .select('*')
                    .eq('id', id)
                    .eq('user_id', user.id)
                    .single()
                
                if (error) return null
                return data
            },

            create: async (data) => {
                const insertData = {
                    ...data,
                    user_id: user.id,
                }
                
                const { data: created, error } = await supabase
                    .from('conversations')
                    .insert(insertData)
                    .select()
                    .single()
                
                if (error) {
                    console.error('[UserScopedDb] conversations.create error:', error)
                    return null
                }
                return created
            },

            delete: async (id: string) => {
                const { error } = await supabase
                    .from('conversations')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', user.id)
                
                if (error) {
                    console.error('[UserScopedDb] conversations.delete error:', error)
                    return false
                }
                return true
            },
        },

        // ============================================
        // MESSAGES
        // ============================================
        messages: {
            listByConversation: async (conversationId: string) => {
                // First verify the conversation belongs to this user
                const { data: conv } = await supabase
                    .from('conversations')
                    .select('id')
                    .eq('id', conversationId)
                    .eq('user_id', user.id)
                    .single()
                
                if (!conv) {
                    console.error('[UserScopedDb] messages.listByConversation: conversation not found or not owned')
                    return []
                }
                
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true })
                
                if (error) {
                    console.error('[UserScopedDb] messages.listByConversation error:', error)
                    return []
                }
                return data || []
            },

            create: async (data) => {
                // Verify conversation ownership before inserting
                const { data: conv } = await supabase
                    .from('conversations')
                    .select('id')
                    .eq('id', data.conversation_id)
                    .eq('user_id', user.id)
                    .single()
                
                if (!conv) {
                    console.error('[UserScopedDb] messages.create: conversation not found or not owned')
                    return null
                }
                
                const { data: created, error } = await supabase
                    .from('messages')
                    .insert(data)
                    .select()
                    .single()
                
                if (error) {
                    console.error('[UserScopedDb] messages.create error:', error)
                    return null
                }
                return created
            },
        },

        // ============================================
        // INBOX ITEMS (Company-scoped)
        // ============================================
        inboxItems: {
            list: async (options?: { limit?: number }) => {
                const query = supabase
                    .from('inbox_items')
                    .select('*')
                    .order('created_at', { ascending: false })
                
                if (options?.limit) {
                    query.limit(options.limit)
                }
                
                const { data, error } = await query
                if (error) {
                    console.error('[UserScopedDb] inboxItems.list error:', error)
                    return []
                }
                return data || []
            },

            create: async (data) => {
                const insertData = {
                    ...data,
                    user_id: data.user_id ?? user.id,
                    company_id: data.company_id ?? companyId,
                }
                
                const { data: created, error } = await supabase
                    .from('inbox_items')
                    .insert(insertData)
                    .select()
                    .single()
                
                if (error) {
                    console.error('[UserScopedDb] inboxItems.create error:', error)
                    return null
                }
                return created
            },

            update: async (id: string, data) => {
                const { data: updated, error } = await supabase
                    .from('inbox_items')
                    .update(data)
                    .eq('id', id)
                    .select()
                    .single()
                
                if (error) {
                    console.error('[UserScopedDb] inboxItems.update error:', error)
                    return null
                }
                return updated
            },
        },

        // ============================================
        // ROADMAPS (User-scoped planning)
        // ============================================
        roadmaps: {
            listActive: async () => {
                const { data, error } = await supabase
                    .from('roadmaps')
                    .select('*, steps:roadmap_steps(*)')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                
                if (error) {
                    console.error('[UserScopedDb] roadmaps.listActive error:', error)
                    return []
                }
                return data || []
            },
        },

        // ============================================
        // COMPANY KPIs (Aggregated from multiple tables)
        // ============================================
        getCompanyKPIs: async () => {
            // Parallel queries for speed - RLS will filter by company
            const [tx, invoices, inbox] = await Promise.all([
                supabase.from('transactions').select('amount, status').limit(100),
                supabase.from('supplier_invoices').select('total_amount, due_date, status').eq('status', 'unpaid'),
                supabase.from('inbox_items').select('*', { count: 'exact', head: true }).eq('read', false)
            ])

            return {
                recent_transactions_count: tx.data?.length || 0,
                unpaid_invoices_count: invoices.data?.length || 0,
                unread_inbox_count: inbox.count || 0,
                last_sync: new Date().toISOString()
            }
        },
    }
}

/**
 * Quick check if user is authenticated
 * Use this for simple auth gates without needing full db access
 */
export async function isAuthenticated(): Promise<{ userId: string } | null> {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null
    return { userId: user.id }
}
