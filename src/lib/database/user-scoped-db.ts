/**
 * User-Scoped Database Access Layer
 * 
 * Provides user-level database access that respects Row Level Security (RLS).
 * Uses the user's session to enforce access controls.
 * 
 * For admin-level operations that bypass RLS, use server-db.ts instead.
 */

import { createServerSupabaseClient } from './supabase-server'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { RoadmapWithSteps, Tables } from './repositories/types'

// =============================================================================
// User-Scoped DB Interface
// =============================================================================

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
        list: (options?: { limit?: number }) => Promise<Tables['supplierinvoices']['Row'][]>
        getById: (id: string) => Promise<Tables['supplierinvoices']['Row'] | null>
        create: (data: Tables['supplierinvoices']['Insert']) => Promise<Tables['supplierinvoices']['Row'] | null>
        update: (id: string, data: Tables['supplierinvoices']['Update']) => Promise<Tables['supplierinvoices']['Row'] | null>
    }

    verifications: {
        list: (options?: { limit?: number }) => Promise<Tables['verifications']['Row'][]>
        getById: (id: string) => Promise<Tables['verifications']['Row'] | null>
        create: (data: Tables['verifications']['Insert']) => Promise<Tables['verifications']['Row'] | null>
    }

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

    conversations: {
        list: (options?: { limit?: number }) => Promise<Tables['conversations']['Row'][]>
        getById: (id: string) => Promise<Tables['conversations']['Row'] | null>
        create: (data: Tables['conversations']['Insert']) => Promise<Tables['conversations']['Row'] | null>
        delete: (id: string) => Promise<boolean>
    }

    messages: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        listByConversation: (conversationId: string) => Promise<any[]>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: (data: any) => Promise<any | null>
    }

    inboxItems: {
        list: (options?: { limit?: number }) => Promise<Tables['inboxitems']['Row'][]>
        create: (data: Tables['inboxitems']['Insert']) => Promise<Tables['inboxitems']['Row'] | null>
        update: (id: string, data: Tables['inboxitems']['Update']) => Promise<Tables['inboxitems']['Row'] | null>
    }

    roadmaps: {
        listActive: () => Promise<RoadmapWithSteps[]>
    }

    getCompanyKPIs: () => Promise<{
        recent_transactions_count: number
        unpaid_invoices_count: number
        unread_inbox_count: number
        last_sync: string
    }>

    client: SupabaseClient<Database>
}

// =============================================================================
// Factory Functions for Each Repository
// =============================================================================

function createTransactionsAccessor(supabase: SupabaseClient<Database>, userId: string, companyId: string | null) {
    return {
        list: async (options?: { limit?: number }) => {
            const query = supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false })
            if (options?.limit) query.limit(options.limit)
            const { data, error } = await query
            if (error) console.error('[UserScopedDb] transactions.list error:', error)
            return data || []
        },
        getById: async (id: string) => {
            const { data } = await supabase.from('transactions').select('*').eq('id', id).single()
            return data
        },
        create: async (data: Tables['transactions']['Insert']) => {
            const insertData = { ...data, user_id: data.user_id ?? userId, company_id: data.company_id ?? companyId }
            const { data: created, error } = await supabase.from('transactions').insert(insertData).select().single()
            if (error) console.error('[UserScopedDb] transactions.create error:', error)
            return created
        },
        update: async (id: string, data: Tables['transactions']['Update']) => {
            const { data: updated, error } = await supabase.from('transactions').update(data).eq('id', id).select().single()
            if (error) console.error('[UserScopedDb] transactions.update error:', error)
            return updated
        },
        delete: async (id: string) => {
            const { error } = await supabase.from('transactions').delete().eq('id', id)
            if (error) console.error('[UserScopedDb] transactions.delete error:', error)
            return !error
        },
    }
}

function createReceiptsAccessor(supabase: SupabaseClient<Database>, userId: string, companyId: string | null) {
    return {
        list: async (options?: { limit?: number }) => {
            const query = supabase.from('receipts').select('*').order('captured_at', { ascending: false })
            if (options?.limit) query.limit(options.limit)
            const { data, error } = await query
            if (error) console.error('[UserScopedDb] receipts.list error:', error)
            return data || []
        },
        getById: async (id: string) => {
            const { data } = await supabase.from('receipts').select('*').eq('id', id).single()
            return data
        },
        create: async (data: Tables['receipts']['Insert']) => {
            const insertData = { ...data, user_id: data.user_id ?? userId, company_id: data.company_id ?? companyId }
            const { data: created, error } = await supabase.from('receipts').insert(insertData).select().single()
            if (error) console.error('[UserScopedDb] receipts.create error:', error)
            return created
        },
        update: async (id: string, data: Tables['receipts']['Update']) => {
            const { data: updated, error } = await supabase.from('receipts').update(data).eq('id', id).select().single()
            if (error) console.error('[UserScopedDb] receipts.update error:', error)
            return updated
        },
    }
}

function createSupplierInvoicesAccessor(supabase: SupabaseClient<Database>, userId: string, companyId: string | null) {
    return {
        list: async (options?: { limit?: number }) => {
            const query = supabase.from('supplierinvoices').select('*').order('due_date', { ascending: true })
            if (options?.limit) query.limit(options.limit)
            const { data, error } = await query
            if (error) console.error('[UserScopedDb] supplierInvoices.list error:', error)
            return data || []
        },
        getById: async (id: string) => {
            const { data } = await supabase.from('supplierinvoices').select('*').eq('id', id).single()
            return data
        },
        create: async (data: Tables['supplierinvoices']['Insert']) => {
            const insertData = { ...data, user_id: data.user_id ?? userId, company_id: data.company_id ?? companyId }
            const { data: created, error } = await supabase.from('supplierinvoices').insert(insertData).select().single()
            if (error) console.error('[UserScopedDb] supplierInvoices.create error:', error)
            return created
        },
        update: async (id: string, data: Tables['supplierinvoices']['Update']) => {
            const { data: updated, error } = await supabase.from('supplierinvoices').update(data).eq('id', id).select().single()
            if (error) console.error('[UserScopedDb] supplierInvoices.update error:', error)
            return updated
        },
    }
}

function createVerificationsAccessor(supabase: SupabaseClient<Database>, userId: string, companyId: string | null) {
    return {
        list: async (options?: { limit?: number }) => {
            const query = supabase.from('verifications').select('*').order('date', { ascending: false })
            if (options?.limit) query.limit(options.limit)
            const { data, error } = await query
            if (error) console.error('[UserScopedDb] verifications.list error:', error)
            return data || []
        },
        getById: async (id: string) => {
            const { data } = await supabase.from('verifications').select('*').eq('id', id).single()
            return data
        },
        create: async (data: Tables['verifications']['Insert']) => {
            const insertData = { ...data, user_id: data.user_id ?? userId, company_id: data.company_id ?? companyId }
            const { data: created, error } = await supabase.from('verifications').insert(insertData).select().single()
            if (error) console.error('[UserScopedDb] verifications.create error:', error)
            return created
        },
    }
}

function createEmployeesAccessor(supabase: SupabaseClient<Database>, userId: string) {
    return {
        list: async (options?: { limit?: number }) => {
            const query = supabase.from('employees').select('*').order('name', { ascending: true })
            if (options?.limit) query.limit(options.limit)
            const { data, error } = await query
            if (error) console.error('[UserScopedDb] employees.list error:', error)
            return data || []
        },
        getById: async (id: string) => {
            const { data } = await supabase.from('employees').select('*').eq('id', id).single()
            return data
        },
        create: async (data: Tables['employees']['Insert']) => {
            const insertData = { ...data, user_id: data.user_id ?? userId }
            const { data: created, error } = await supabase.from('employees').insert(insertData).select().single()
            if (error) console.error('[UserScopedDb] employees.create error:', error)
            return created
        },
        update: async (id: string, data: Tables['employees']['Update']) => {
            const { data: updated, error } = await supabase.from('employees').update(data).eq('id', id).select().single()
            if (error) console.error('[UserScopedDb] employees.update error:', error)
            return updated
        },
    }
}

function createPayslipsAccessor(supabase: SupabaseClient<Database>, userId: string) {
    return {
        list: async (options?: { limit?: number }) => {
            const query = supabase.from('payslips').select('*').order('created_at', { ascending: false })
            if (options?.limit) query.limit(options.limit)
            const { data, error } = await query
            if (error) console.error('[UserScopedDb] payslips.list error:', error)
            return data || []
        },
        getById: async (id: string) => {
            const { data } = await supabase.from('payslips').select('*').eq('id', id).single()
            return data
        },
        create: async (data: Tables['payslips']['Insert']) => {
            const insertData = { ...data, user_id: data.user_id ?? userId }
            const { data: created, error } = await supabase.from('payslips').insert(insertData).select().single()
            if (error) console.error('[UserScopedDb] payslips.create error:', error)
            return created
        },
    }
}

function createConversationsAccessor(supabase: SupabaseClient<Database>, userId: string) {
    return {
        list: async (options?: { limit?: number }) => {
            const query = supabase.from('conversations').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
            if (options?.limit) query.limit(options.limit)
            const { data, error } = await query
            if (error) console.error('[UserScopedDb] conversations.list error:', error)
            return data || []
        },
        getById: async (id: string) => {
            const { data } = await supabase.from('conversations').select('*').eq('id', id).eq('user_id', userId).single()
            return data
        },
        create: async (data: Tables['conversations']['Insert']) => {
            const insertData = { ...data, user_id: userId }
            const { data: created, error } = await supabase.from('conversations').insert(insertData).select().single()
            if (error) console.error('[UserScopedDb] conversations.create error:', error)
            return created
        },
        delete: async (id: string) => {
            const { error } = await supabase.from('conversations').delete().eq('id', id).eq('user_id', userId)
            if (error) console.error('[UserScopedDb] conversations.delete error:', error)
            return !error
        },
    }
}

function createMessagesAccessor(supabase: SupabaseClient<Database>, userId: string) {
    return {
        listByConversation: async (conversationId: string) => {
            // Verify conversation ownership first
            const { data: conv } = await supabase.from('conversations').select('id').eq('id', conversationId).eq('user_id', userId).single()
            if (!conv) {
                console.error('[UserScopedDb] messages.listByConversation: conversation not found or not owned')
                return []
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any).from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true })
            if (error) console.error('[UserScopedDb] messages.listByConversation error:', error)
            return data || []
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: async (msgData: any) => {
            // Verify conversation ownership
            const { data: conv } = await supabase.from('conversations').select('id').eq('id', msgData.conversation_id).eq('user_id', userId).single()
            if (!conv) {
                console.error('[UserScopedDb] messages.create: conversation not found or not owned')
                return null
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: created, error } = await (supabase as any).from('messages').insert(msgData).select().single()
            if (error) console.error('[UserScopedDb] messages.create error:', error)
            return created
        },
    }
}

function createInboxItemsAccessor(supabase: SupabaseClient<Database>, userId: string, companyId: string | null) {
    return {
        list: async (options?: { limit?: number }) => {
            const query = supabase.from('inboxitems').select('*').order('created_at', { ascending: false })
            if (options?.limit) query.limit(options.limit)
            const { data, error } = await query
            if (error) console.error('[UserScopedDb] inboxItems.list error:', error)
            return data || []
        },
        create: async (data: Tables['inboxitems']['Insert']) => {
            const insertData = { ...data, user_id: data.user_id ?? userId, company_id: data.company_id ?? companyId }
            const { data: created, error } = await supabase.from('inboxitems').insert(insertData).select().single()
            if (error) console.error('[UserScopedDb] inboxItems.create error:', error)
            return created
        },
        update: async (id: string, data: Tables['inboxitems']['Update']) => {
            const { data: updated, error } = await supabase.from('inboxitems').update(data).eq('id', id).select().single()
            if (error) console.error('[UserScopedDb] inboxItems.update error:', error)
            return updated
        },
    }
}

function createRoadmapsAccessor(supabase: SupabaseClient<Database>, userId: string) {
    return {
        listActive: async (): Promise<RoadmapWithSteps[]> => {
            const { data, error } = await supabase
                .from('roadmaps')
                .select('*, steps:roadmap_steps(*)')
                .eq('user_id', userId)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
            if (error) console.error('[UserScopedDb] roadmaps.listActive error:', error)
            return (data || []) as RoadmapWithSteps[]
        },
    }
}

// =============================================================================
// Main Factory Function
// =============================================================================

/**
 * Create a user-scoped database accessor
 * 
 * Returns null if user is not authenticated.
 * All queries automatically respect RLS policies.
 */
export async function createUserScopedDb(): Promise<UserScopedDb | null> {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return null
    }

    // Get user's company
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (supabase as any)
        .from('companymembers')
        .select('company_id')
        .eq('user_id', user.id)
        .single()

    const companyId = membership?.company_id ?? null

    return {
        userId: user.id,
        companyId,
        client: supabase,

        transactions: createTransactionsAccessor(supabase, user.id, companyId),
        receipts: createReceiptsAccessor(supabase, user.id, companyId),
        supplierInvoices: createSupplierInvoicesAccessor(supabase, user.id, companyId),
        verifications: createVerificationsAccessor(supabase, user.id, companyId),
        employees: createEmployeesAccessor(supabase, user.id),
        payslips: createPayslipsAccessor(supabase, user.id),
        conversations: createConversationsAccessor(supabase, user.id),
        messages: createMessagesAccessor(supabase, user.id),
        inboxItems: createInboxItemsAccessor(supabase, user.id, companyId),
        roadmaps: createRoadmapsAccessor(supabase, user.id),

        getCompanyKPIs: async () => {
            const [tx, invoices, inbox] = await Promise.all([
                supabase.from('transactions').select('amount, status').limit(100),
                supabase.from('supplierinvoices').select('total_amount, due_date, status').eq('status', 'unpaid'),
                supabase.from('inboxitems').select('*', { count: 'exact', head: true }).eq('read', false)
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
 */
export async function isAuthenticated(): Promise<{ userId: string } | null> {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return { userId: user.id }
}
