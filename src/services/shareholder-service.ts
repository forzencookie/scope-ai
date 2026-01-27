import { getSupabaseClient } from '@/lib/database/supabase'

/**
 * Shareholder as stored in the database
 */
export interface ShareholderRow {
    id: string
    name: string
    ssn_org_nr: string | null
    personal_number: string | null
    shares: number
    shares_count: number | null
    share_class: string | null
    share_percentage: number | null
    ownership_percentage: number | null
    voting_power: number | null
    voting_percentage: number | null
    is_board_member: boolean | null
    board_role: string | null
    email: string | null
    phone: string | null
    address: string | null
    acquisition_date: string | null
    acquisition_price: number | null
    company_id: string | null
    user_id: string | null
    metadata: Record<string, unknown> | null
    created_at: string | null
    updated_at: string | null
}

/**
 * Shareholder for display in UI
 */
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

/**
 * Shareholder query options
 */
export interface GetShareholdersOptions {
    limit?: number
    offset?: number
    search?: string
    shareClass?: 'A' | 'B'
    boardMembersOnly?: boolean
}

/**
 * Share register summary
 */
export interface ShareRegisterSummary {
    totalShares: number
    totalShareholderCount: number
    sharesByClass: { classA: number; classB: number }
    totalCapital: number // Based on quota value
    quotaValue: number
}

/**
 * Share transaction as stored in the database
 */
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

export const shareholderService = {
    /**
     * Get all shareholders with optional filters
     */
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

        if (!data || data.length === 0) {
            return {
                shareholders: [],
                totalCount: 0
            }
        }

        // Calculate totals for percentage calculations
        const totalShares = data.reduce((sum, row) => sum + (row.shares_count || row.shares || 0), 0)

        const shareholders: Shareholder[] = data.map((row) => {
            const sharesCount = row.shares_count || row.shares || 0
            const ownershipPct = row.ownership_percentage || row.share_percentage || 
                (totalShares > 0 ? (sharesCount / totalShares) * 100 : 0)

            return {
                id: row.id,
                name: row.name,
                personalOrOrgNumber: row.ssn_org_nr || row.personal_number || '',
                sharesCount,
                shareClass: row.share_class || 'A',
                ownershipPercentage: Math.round(ownershipPct * 100) / 100,
                votingPercentage: row.voting_percentage || row.voting_power || ownershipPct,
                isBoardMember: row.is_board_member || false,
                boardRole: row.board_role,
                email: row.email,
                phone: row.phone,
                acquisitionDate: row.acquisition_date,
                acquisitionPrice: row.acquisition_price
            }
        })

        return {
            shareholders,
            totalCount: count || 0
        }
    },

    /**
     * Get a single shareholder by ID
     */
    async getShareholderById(id: string): Promise<Shareholder | null> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('shareholders')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !data) return null

        return {
            id: data.id,
            name: data.name,
            personalOrOrgNumber: data.ssn_org_nr || data.personal_number || '',
            sharesCount: data.shares_count || data.shares || 0,
            shareClass: data.share_class || 'A',
            ownershipPercentage: data.ownership_percentage || data.share_percentage || 0,
            votingPercentage: data.voting_percentage || data.voting_power || 0,
            isBoardMember: data.is_board_member || false,
            boardRole: data.board_role,
            email: data.email,
            phone: data.phone,
            acquisitionDate: data.acquisition_date,
            acquisitionPrice: data.acquisition_price
        }
    },

    /**
     * Get share register summary
     */
    async getShareRegisterSummary(quotaValue: number = 100): Promise<ShareRegisterSummary> {
        const supabase = getSupabaseClient()

        const { data } = await supabase
            .from('shareholders')
            .select('shares, shares_count, share_class')

        if (!data || data.length === 0) {
            return {
                totalShares: 0,
                totalShareholderCount: 0,
                sharesByClass: { classA: 0, classB: 0 },
                totalCapital: 0,
                quotaValue
            }
        }

        let classA = 0
        let classB = 0
        let totalShares = 0

        for (const row of data) {
            const shares = row.shares_count || row.shares || 0
            totalShares += shares

            if (row.share_class === 'B') {
                classB += shares
            } else {
                classA += shares
            }
        }

        return {
            totalShares,
            totalShareholderCount: data.length,
            sharesByClass: { classA, classB },
            totalCapital: totalShares * quotaValue,
            quotaValue
        }
    },

    /**
     * Get board members from shareholders
     */
    async getBoardMembers() {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('shareholders')
            .select('*')
            .eq('is_board_member', true)
            .order('board_role', { ascending: true })

        if (error) throw error

        if (!data || data.length === 0) {
            return []
        }

        return data.map((row) => ({
            id: row.id,
            name: row.name,
            personalNumber: row.ssn_org_nr || row.personal_number || '',
            role: row.board_role || 'Ledamot',
            email: row.email,
            phone: row.phone
        }))
    },

    /**
     * Get share transactions history
     */
    async getShareTransactions({
        limit = 50,
        offset = 0
    } = {}) {
        const supabase = getSupabaseClient()

        const { data, error, count } = await supabase
            .from('sharetransactions')
            .select('*', { count: 'exact' })
            .order('registration_date', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) throw error

        if (!data || data.length === 0) {
            return {
                transactions: [],
                totalCount: 0
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transactions: ShareTransaction[] = (data as any[]).map((row) => ({
            id: row.id,
            fromShareholderId: row.from_shareholder_id || null,
            fromShareholderName: null, // Would need join or separate query
            toShareholderId: row.to_shareholder_id || null,
            toShareholderName: '', // Would need join
            shareCount: row.share_count || row.shares || 0,
            pricePerShare: row.price_per_share || null,
            totalPrice: row.price_per_share ? row.price_per_share * (row.share_count || row.shares || 0) : null,
            registrationDate: row.registration_date || row.transaction_date || row.created_at || '',
            documentReference: row.document_reference || row.document_url || null,
            notes: row.notes || null
        }))

        return {
            transactions,
            totalCount: count || 0
        }
    },

    /**
     * Add a new shareholder
     */
    async addShareholder({
        name,
        personalOrOrgNumber,
        sharesCount,
        shareClass = 'A',
        email,
        phone,
        isBoardMember = false,
        boardRole
    }: {
        name: string
        personalOrOrgNumber: string
        sharesCount: number
        shareClass?: 'A' | 'B'
        email?: string
        phone?: string
        isBoardMember?: boolean
        boardRole?: string
    }) {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('shareholders')
            .insert({
                name,
                ssn_org_nr: personalOrOrgNumber,
                shares: sharesCount,
                shares_count: sharesCount,
                share_class: shareClass,
                email,
                phone,
                is_board_member: isBoardMember,
                board_role: boardRole
            })
            .select()
            .single()

        if (error) throw error

        return {
            id: data.id,
            name: data.name,
            personalOrOrgNumber: data.ssn_org_nr || '',
            sharesCount: data.shares_count || data.shares || 0,
            shareClass: data.share_class || 'A',
            ownershipPercentage: 0, // Will be recalculated
            votingPercentage: 0,
            isBoardMember: data.is_board_member || false,
            boardRole: data.board_role,
            email: data.email,
            phone: data.phone,
            acquisitionDate: data.acquisition_date,
            acquisitionPrice: data.acquisition_price
        }
    }
}
