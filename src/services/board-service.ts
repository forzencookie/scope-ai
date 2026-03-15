import { createBrowserClient } from '@/lib/database/client'

/**
 * Board member from shareholders table
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
        const supabase = createBrowserClient()

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
            const metadata = row.metadata as Record<string, unknown> | null

            return {
                id: row.id,
                name: row.name,
                personalNumber: row.ssn_org_nr || row.personal_number,
                role,
                email: row.email,
                phone: row.phone,
                appointedDate: row.acquisition_date,
                isSignatory: !!(metadata?.isSignatory) || role === 'Ordförande' || role === 'VD'
            }
        })
    },

    /**
     * Get company signatories (firmatecknare)
     * In Swedish companies, signatories are typically specified in bolagsordningen
     */
    async getSignatories(): Promise<Signatory[]> {
        const supabase = createBrowserClient()

        const { data, error } = await supabase
            .from('shareholders')
            .select('id, name, ssn_org_nr, personal_number, board_role, email, metadata')
            .eq('is_board_member', true)

        if (error) throw error

        if (!data || data.length === 0) {
            return []
        }

        return data
            .filter((row) => {
                const role = row.board_role || ''
                const metadata = row.metadata as Record<string, unknown> | null
                return role === 'Ordförande' || role === 'VD' || metadata?.isSignatory
            })
            .map((row) => {
                const role = row.board_role || 'Ledamot'
                const metadata = row.metadata as Record<string, unknown> | null

                let signingAuthority = 'Två i förening'
                if (role === 'VD' || role === 'Ordförande') {
                    signingAuthority = 'Ensam'
                }
                if (metadata?.signingAuthority) {
                    signingAuthority = String(metadata.signingAuthority)
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
     * Get board meeting minutes from corporate_documents (canonical data source).
     * Previously read from `boardminutes` table which was never populated by the UI.
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
        const supabase = createBrowserClient()

        let query = supabase
            .from('corporate_documents' as any)
            .select('*', { count: 'exact' })
            .eq('type', 'board_meeting_minutes')
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1)

        if (status) {
            // Map our status to corporate_documents status values
            const statusMap: Record<string, string> = {
                'draft': 'draft',
                'approved': 'signed',
                'archived': 'archived',
            }
            query = query.eq('status', statusMap[status] || status)
        }

        const { data, error, count } = await query

        if (error) throw error

        if (!data || data.length === 0) {
            return { minutes: [], totalCount: 0 }
        }

        const minutes: BoardMeetingMinutes[] = data.map((row: any) => {
            let content: Record<string, any> = {}
            try {
                content = JSON.parse(row.content || '{}')
            } catch { /* ignore */ }

            // Map corporate_documents status to BoardMeetingMinutes status
            const docStatus = row.status as string
            const mappedStatus: 'draft' | 'approved' | 'archived' =
                docStatus === 'signed' ? 'approved' :
                docStatus === 'archived' ? 'archived' : 'draft'

            return {
                id: row.id,
                title: row.title || 'Styrelseprotokoll',
                meetingDate: row.date || row.created_at || '',
                status: mappedStatus,
                attendees: Array.isArray(content.attendees) ? content.attendees : [],
                decisions: Array.isArray(content.agendaItems)
                    ? content.agendaItems.filter((item: any) => item.decision).map((item: any) => item.decision)
                    : [],
                documentUrl: null,
            }
        })

        return { minutes, totalCount: count || 0 }
    },

    /**
     * Get company meetings (stämmor) from corporate_documents (canonical data source).
     * Previously read from `companymeetings` table which was never populated by the UI.
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
        const supabase = createBrowserClient()

        // Determine which document types to fetch
        let docType: string | null = null
        if (type === 'board') {
            docType = 'board_meeting_minutes'
        } else if (type === 'annual' || type === 'extraordinary') {
            docType = 'general_meeting_minutes'
        }

        let query = supabase
            .from('corporate_documents' as any)
            .select('*', { count: 'exact' })
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1)

        if (docType) {
            query = query.eq('type', docType)
        } else {
            // All meeting types
            query = query.in('type', ['general_meeting_minutes', 'board_meeting_minutes'])
        }

        const { data, error, count } = await query

        if (error) throw error

        if (!data || data.length === 0) {
            return { meetings: [], totalCount: 0 }
        }

        const meetings: CompanyMeeting[] = data.map((row: any) => {
            let content: Record<string, any> = {}
            try {
                content = JSON.parse(row.content || '{}')
            } catch { /* ignore */ }

            const isBoard = row.type === 'board_meeting_minutes'

            // Determine meeting type
            let meetingType: 'annual' | 'extraordinary' | 'board' = 'board'
            if (!isBoard) {
                meetingType = content.type === 'extra' ? 'extraordinary' : 'annual'
            }

            // Filter by subtype if needed (annual vs extraordinary within general_meeting_minutes)
            if (type === 'annual' && content.type === 'extra') return null
            if (type === 'extraordinary' && content.type !== 'extra') return null

            // Map corporate_documents status to CompanyMeeting status
            const docStatus = row.status as string
            const mappedStatus: 'scheduled' | 'held' | 'cancelled' =
                docStatus === 'signed' || docStatus === 'archived' ? 'held' : 'scheduled'

            return {
                id: row.id,
                title: row.title || 'Möte',
                type: meetingType,
                meetingDate: row.date,
                scheduledDate: row.date,
                status: mappedStatus,
                location: content.location || null,
                agenda: Array.isArray(content.agenda) ? content.agenda.join(', ') : null,
                attendees: Array.isArray(content.attendees) ? content.attendees : [],
                decisions: Array.isArray(content.decisions)
                    ? content.decisions.map((d: any) => d.decision || d.title || '')
                    : [],
            }
        }).filter(Boolean) as CompanyMeeting[]

        return { meetings, totalCount: type ? meetings.length : (count || 0) }
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
