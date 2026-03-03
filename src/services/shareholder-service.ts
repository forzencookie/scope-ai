import { getSupabaseClient } from '@/lib/database/supabase'
import type { Database } from '@/types/database'

type ShareholderRow = Database['public']['Tables']['shareholders']['Row']
type ShareTransactionRow = Database['public']['Tables']['sharetransactions']['Row']

// =============================================================================
// UI Types
// =============================================================================

export interface Shareholder {
    id: string
    name: string
    personalOrOrgNumber: string
    sharesCount: number
    shareClass: string
    ownershipPercentage: number
    votingPercentage: number
    isBoardMember: boolean
    boardRole: string | null
    email: string | null
    phone: string | null
    acquisitionDate: string | null
    acquisitionPrice: number | null
}

export interface ShareTransaction {
    id: string
    fromShareholderId: string | null
    fromShareholderName: string | null
    toShareholderId: string | null
    toShareholderName: string
    shareCount: number
    pricePerShare: number | null
    totalPrice: number | null
    registrationDate: string
    documentReference: string | null
    notes: string | null
}

export interface GetShareholdersOptions {
    limit?: number
    offset?: number
    search?: string
    shareClass?: 'A' | 'B'
    boardMembersOnly?: boolean
}

export interface ShareRegisterSummary {
    totalShares: number
    totalShareholderCount: number
    sharesByClass: { classA: number; classB: number }
    totalCapital: number
    quotaValue: number
}

// =============================================================================
// Mappers
// =============================================================================

function mapRowToShareholder(row: ShareholderRow, totalShares: number): Shareholder {
    const sharesCount = row.shares_count ?? row.shares ?? 0
    const ownershipPct = row.ownership_percentage ??
        (totalShares > 0 ? (sharesCount / totalShares) * 100 : 0)

    return {
        id: row.id,
        name: row.name,
        personalOrOrgNumber: row.ssn_org_nr ?? '',
        sharesCount,
        shareClass: row.share_class ?? 'A',
        ownershipPercentage: Math.round(ownershipPct * 100) / 100,
        votingPercentage: row.voting_percentage ?? ownershipPct,
        isBoardMember: row.is_board_member ?? false,
        boardRole: row.board_role,
        email: row.email,
        phone: row.phone,
        acquisitionDate: row.acquisition_date,
        acquisitionPrice: row.acquisition_price,
    }
}

// =============================================================================
// Service
// =============================================================================

export const shareholderService = {
    async getShareholders({
        limit = 100,
        offset = 0,
        search = '',
        shareClass,
        boardMembersOnly
    }: GetShareholdersOptions = {}) {
        const supabase = getSupabaseClient()

        let query = supabase
            .from('shareholders')
            .select('*', { count: 'exact' })
            .order('shares', { ascending: false })
            .range(offset, offset + limit - 1)

        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
        }
        if (shareClass) {
            query = query.eq('share_class', shareClass)
        }
        if (boardMembersOnly) {
            query = query.eq('is_board_member', true)
        }

        const { data, error, count } = await query
        if (error) throw error
        if (!data || data.length === 0) return { shareholders: [], totalCount: 0 }

        const totalShares = data.reduce((sum, row) => sum + (row.shares_count ?? row.shares ?? 0), 0)

        return {
            shareholders: data.map((row) => mapRowToShareholder(row, totalShares)),
            totalCount: count ?? 0,
        }
    },

    async getShareholderById(id: string): Promise<Shareholder | null> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('shareholders')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !data) return null
        return mapRowToShareholder(data, 0)
    },

    async getShareRegisterSummary(quotaValue: number = 100): Promise<ShareRegisterSummary> {
        const supabase = getSupabaseClient()

        const { data } = await supabase
            .from('shareholders')
            .select('shares, shares_count, share_class')

        if (!data || data.length === 0) {
            return { totalShares: 0, totalShareholderCount: 0, sharesByClass: { classA: 0, classB: 0 }, totalCapital: 0, quotaValue }
        }

        let classA = 0
        let classB = 0
        let totalShares = 0

        for (const row of data) {
            const shares = row.shares_count ?? row.shares ?? 0
            totalShares += shares
            if (row.share_class === 'B') classB += shares
            else classA += shares
        }

        return {
            totalShares,
            totalShareholderCount: data.length,
            sharesByClass: { classA, classB },
            totalCapital: totalShares * quotaValue,
            quotaValue,
        }
    },

    async getBoardMembers() {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('shareholders')
            .select('*')
            .eq('is_board_member', true)
            .order('board_role', { ascending: true })

        if (error) throw error
        if (!data || data.length === 0) return []

        return data.map((row) => ({
            id: row.id,
            name: row.name,
            personalNumber: row.ssn_org_nr ?? '',
            role: row.board_role ?? 'Ledamot',
            email: row.email,
            phone: row.phone,
        }))
    },

    async getShareTransactions({ limit = 50, offset = 0 } = {}) {
        const supabase = getSupabaseClient()

        const { data, error, count } = await supabase
            .from('sharetransactions')
            .select('*', { count: 'exact' })
            .order('registration_date', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) throw error
        if (!data || data.length === 0) return { transactions: [], totalCount: 0 }

        const transactions: ShareTransaction[] = data.map((row) => ({
            id: row.id,
            fromShareholderId: row.from_shareholder_id,
            fromShareholderName: null, // Would need a join to resolve
            toShareholderId: row.to_shareholder_id,
            toShareholderName: '', // Would need a join to resolve
            shareCount: row.share_count,
            pricePerShare: row.price_per_share,
            totalPrice: row.total_amount,
            registrationDate: row.registration_date ?? row.transaction_date,
            documentReference: row.document_reference,
            notes: row.notes,
        }))

        return { transactions, totalCount: count ?? 0 }
    },

    async addShareholder({
        name,
        personalOrOrgNumber,
        sharesCount,
        shareClass = 'A',
        email,
        phone,
        isBoardMember = false,
        boardRole,
        shareNumberFrom,
        shareNumberTo,
    }: {
        name: string
        personalOrOrgNumber: string
        sharesCount: number
        shareClass?: 'A' | 'B'
        email?: string
        phone?: string
        isBoardMember?: boolean
        boardRole?: string
        shareNumberFrom?: number
        shareNumberTo?: number
    }) {
        const supabase = getSupabaseClient()

        // Auto-assign share numbers if not provided
        let assignedFrom = shareNumberFrom
        let assignedTo = shareNumberTo

        if (!assignedFrom && !assignedTo && sharesCount > 0) {
            const { data: maxRow } = await supabase
                .from('shareholders')
                .select('share_number_to')
                .not('share_number_to', 'is', null)
                .order('share_number_to', { ascending: false })
                .limit(1)
                .single()

            const maxNumber = maxRow?.share_number_to ?? 0
            assignedFrom = maxNumber + 1
            assignedTo = maxNumber + sharesCount
        }

        const { data, error } = await supabase
            .from('shareholders')
            .insert({
                name,
                ssn_org_nr: personalOrOrgNumber,
                shares: sharesCount,
                shares_count: sharesCount,
                share_class: shareClass,
                email: email ?? null,
                phone: phone ?? null,
                is_board_member: isBoardMember,
                board_role: boardRole ?? null,
                share_number_from: assignedFrom ?? null,
                share_number_to: assignedTo ?? null,
            })
            .select()
            .single()

        if (error) throw error

        return {
            id: data.id,
            name: data.name,
            personalOrOrgNumber: data.ssn_org_nr ?? '',
            sharesCount: data.shares_count ?? data.shares ?? 0,
            shareClass: data.share_class ?? 'A',
            ownershipPercentage: 0,
            votingPercentage: 0,
            isBoardMember: data.is_board_member ?? false,
            boardRole: data.board_role,
            email: data.email,
            phone: data.phone,
            acquisitionDate: data.acquisition_date,
            acquisitionPrice: data.acquisition_price,
            shareNumberFrom: assignedFrom,
            shareNumberTo: assignedTo,
        }
    },
}
