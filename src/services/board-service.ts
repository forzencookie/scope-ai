import { getSupabaseClient } from '@/lib/database/supabase'

/**
 * Board member from shareholders table or companymeetings
 */
export interface BoardMember {
    id: string
    name: string
    personalNumber: string | null
    role: 'Ordförande' | 'VD' | 'Ledamot' | 'Suppleant' | string
    email: string | null
    phone: string | null
    appointedDate: string | null
    isSignatory: boolean
}

/**
 * Company signatory (firmatecknare)
 */
export interface Signatory {
    id: string
    name: string
    personalNumber: string | null
    role: string
    signingAuthority: 'Ensam' | 'Två i förening' | 'I förening med annan' | string
    email: string | null
}

/**
 * Board meeting minutes summary
 */
export interface BoardMeetingMinutes {
    id: string
    title: string
    meetingDate: string
    status: 'draft' | 'approved' | 'archived'
    attendees: string[]
    decisions: string[]
    documentUrl: string | null
}

/**
 * Company meeting (stämma)
 */
export interface CompanyMeeting {
    id: string
    title: string
    type: 'annual' | 'extraordinary' | 'board'
    meetingDate: string | null
    scheduledDate: string | null
    status: 'scheduled' | 'held' | 'cancelled'
    location: string | null
    agenda: string | null
    attendees: string[]
    decisions: string[]
}

export const boardService = {
    /**
     * Get board members from shareholders with is_board_member = true
     */
    async getBoardMembers(): Promise<BoardMember[]> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('shareholders')
            .select('id, name, ssn_org_nr, personal_number, board_role, email, phone, is_board_member, acquisition_date, metadata')
            .eq('is_board_member', true)
            .order('board_role', { ascending: true })

        if (error) throw error

        if (!data || data.length === 0) {
            return []
        }

        return data.map((row) => {
            const role = row.board_role || 'Ledamot'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const metadata = row.metadata as any
            
            return {
                id: row.id,
                name: row.name,
                personalNumber: row.ssn_org_nr || row.personal_number,
                role,
                email: row.email,
                phone: row.phone,
                appointedDate: row.acquisition_date,
                isSignatory: metadata?.isSignatory || role === 'Ordförande' || role === 'VD'
            }
        })
    },

    /**
     * Get company signatories (firmatecknare)
     * In Swedish companies, signatories are typically specified in bolagsordningen
     */
    async getSignatories(): Promise<Signatory[]> {
        const supabase = getSupabaseClient()

        // Get board members who are signatories
        const { data, error } = await supabase
            .from('shareholders')
            .select('id, name, ssn_org_nr, personal_number, board_role, email, metadata')
            .eq('is_board_member', true)

        if (error) throw error

        if (!data || data.length === 0) {
            return []
        }

        // Filter to those who are signatories
        // Default: VD och Ordförande can sign alone, others in pairs
        return data
            .filter((row) => {
                const role = row.board_role || ''
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const metadata = row.metadata as any
                return role === 'Ordförande' || role === 'VD' || metadata?.isSignatory
            })
            .map((row) => {
                const role = row.board_role || 'Ledamot'
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const metadata = row.metadata as any
                
                let signingAuthority = 'Två i förening'
                if (role === 'VD' || role === 'Ordförande') {
                    signingAuthority = 'Ensam'
                }
                if (metadata?.signingAuthority) {
                    signingAuthority = metadata.signingAuthority
                }

                return {
                    id: row.id,
                    name: row.name,
                    personalNumber: row.ssn_org_nr || row.personal_number,
                    role,
                    signingAuthority,
                    email: row.email
                }
            })
    },

    /**
     * Get board meeting minutes
     */
    async getBoardMeetingMinutes({
        limit = 20,
        offset = 0,
        status
    }: {
        limit?: number
        offset?: number
        status?: 'draft' | 'approved' | 'archived'
    } = {}): Promise<{ minutes: BoardMeetingMinutes[]; totalCount: number }> {
        const supabase = getSupabaseClient()

        let query = supabase
            .from('boardminutes')
            .select('*', { count: 'exact' })
            .order('meeting_date', { ascending: false })
            .range(offset, offset + limit - 1)

        if (status) {
            query = query.eq('status', status)
        }

        const { data, error, count } = await query

        if (error) throw error

        if (!data || data.length === 0) {
            return { minutes: [], totalCount: 0 }
        }

        const minutes: BoardMeetingMinutes[] = data.map((row) => ({
            id: row.id,
            title: row.title || 'Styrelseprotokoll',
            meetingDate: row.meeting_date || row.created_at || '',
            status: (row.status as 'draft' | 'approved' | 'archived') || 'draft',
            attendees: (row.attendees as string[]) || [],
            decisions: (row.decisions as string[]) || [],
            documentUrl: row.document_url
        }))

        return { minutes, totalCount: count || 0 }
    },

    /**
     * Get company meetings (stämmor)
     */
    async getCompanyMeetings({
        limit = 20,
        offset = 0,
        type
    }: {
        limit?: number
        offset?: number
        type?: 'annual' | 'extraordinary' | 'board'
    } = {}): Promise<{ meetings: CompanyMeeting[]; totalCount: number }> {
        const supabase = getSupabaseClient()

        let query = supabase
            .from('companymeetings')
            .select('*', { count: 'exact' })
            .order('meeting_date', { ascending: false })
            .range(offset, offset + limit - 1)

        if (type) {
            query = query.eq('type', type)
        }

        const { data, error, count } = await query

        if (error) throw error

        if (!data || data.length === 0) {
            return { meetings: [], totalCount: 0 }
        }

        const meetings: CompanyMeeting[] = data.map((row) => ({
            id: row.id,
            title: row.title || 'Möte',
            type: (row.type || row.meeting_type || 'board') as 'annual' | 'extraordinary' | 'board',
            meetingDate: row.meeting_date,
            scheduledDate: row.scheduled_date,
            status: (row.status || 'scheduled') as 'scheduled' | 'held' | 'cancelled',
            location: row.location,
            agenda: row.agenda,
            attendees: (row.attendees as string[]) || [],
            decisions: (row.decisions as string[]) || []
        }))

        return { meetings, totalCount: count || 0 }
    },

    /**
     * Get next annual meeting deadline
     * Swedish AB must hold årsstämma within 6 months of fiscal year end
     */
    async getAnnualMeetingDeadline(fiscalYearEnd: string = '12-31'): Promise<{
        deadline: string
        daysRemaining: number
        isOverdue: boolean
    }> {
        const today = new Date()
        const currentYear = today.getFullYear()
        
        // Parse fiscal year end (format: MM-DD)
        const [month, day] = fiscalYearEnd.split('-').map(Number)
        
        // Calculate fiscal year end date
        let fiscalEnd = new Date(currentYear - 1, month - 1, day)
        if (fiscalEnd > today) {
            fiscalEnd = new Date(currentYear - 2, month - 1, day)
        }
        
        // Annual meeting must be held within 6 months
        const deadline = new Date(fiscalEnd)
        deadline.setMonth(deadline.getMonth() + 6)
        
        const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
            deadline: deadline.toISOString().split('T')[0],
            daysRemaining,
            isOverdue: daysRemaining < 0
        }
    }
}
