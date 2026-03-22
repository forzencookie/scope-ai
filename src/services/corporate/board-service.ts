import { createBrowserClient } from '@/lib/database/client'
import type { GeneralMeeting } from '@/types/ownership'

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

export type CompanyMeeting = GeneralMeeting

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
            .from('meetings')
            .select('*', { count: 'exact' })
            .eq('type', 'board_meeting_minutes')
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1)

        if (status) {
            // Map our status to meetings status values
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

        type MeetingsRow = typeof data[number]

        const minutes: BoardMeetingMinutes[] = data.map((row: MeetingsRow) => {
            let agendaItems: Array<{ decision?: string }> = []
            const rawAgenda = row.agenda_items
            if (Array.isArray(rawAgenda)) {
                agendaItems = rawAgenda as Array<{ decision?: string }>
            }

            // Map meetings status to BoardMeetingMinutes status
            const docStatus = row.status
            const mappedStatus: 'draft' | 'approved' | 'archived' =
                docStatus === 'signed' ? 'approved' :
                docStatus === 'archived' ? 'archived' : 'draft'

            const attendeesList = Array.isArray(row.attendees) ? row.attendees as string[] : []

            return {
                id: row.id,
                title: row.title || 'Styrelseprotokoll',
                meetingDate: row.date || row.created_at || '',
                status: mappedStatus,
                attendees: attendeesList,
                decisions: agendaItems
                    .filter((item) => item.decision)
                    .map((item) => item.decision as string),
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
            .from('meetings')
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

        type MeetingsRow = typeof data[number]

        const meetings = data.map((row: MeetingsRow) => {
            const isBoard = row.type === 'board_meeting_minutes'

            // Parse agenda_items and decisions from JSONB columns
            const agendaItems = row.agenda_items as Array<{ type?: string; location?: string; decision?: string }> | null
            const decisionsJson = row.decisions as Array<{ decision?: string; title?: string }> | null
            const attendeesList = Array.isArray(row.attendees) ? row.attendees as string[] : []

            // Determine meeting subtype from agenda_items metadata
            const meetingMeta = agendaItems?.[0]

            // Determine meeting type
            let meetingType: 'bolagsstamma' | 'arsmote' = 'bolagsstamma'
            if (!isBoard) {
                meetingType = meetingMeta?.type === 'extra' ? 'bolagsstamma' : 'arsmote'
            }

            // Filter by subtype if needed
            if (type === 'annual' && meetingMeta?.type === 'extra') return null
            if (type === 'extraordinary' && meetingMeta?.type !== 'extra') return null

            // Map meetings status to GeneralMeeting status
            const docStatus = row.status
            const mappedStatus: GeneralMeeting['status'] =
                docStatus === 'signed' ? 'protokoll signerat' :
                docStatus === 'archived' ? 'genomförd' : 'planerad'

            const meeting: GeneralMeeting = {
                id: row.id,
                title: row.title || 'Möte',
                date: row.date || new Date().toISOString().split('T')[0],
                year: row.date ? new Date(row.date).getFullYear() : new Date().getFullYear(),
                type: (meetingMeta?.type === 'extra' ? 'extra' : 'ordinarie'),
                meetingType,
                meetingCategory: isBoard ? 'styrelsemote' : 'bolagsstamma',
                status: mappedStatus,
                location: row.location || 'Ej angivet',
                chairperson: '',
                secretary: '',
                attendeesCount: attendeesList.length,
                attendees: attendeesList,
                decisions: Array.isArray(decisionsJson)
                    ? decisionsJson.map((d, i) => ({
                        id: String(i),
                        title: d.title || d.decision || 'Beslut',
                        decision: d.decision || d.title || '',
                    }))
                    : [],
            }
            return meeting
        }).filter((m): m is GeneralMeeting => m !== null)

        return { meetings, totalCount: type ? meetings.length : (count || 0) }
    },

    /**
     * Create a new meeting record
     */
    async createMeeting(params: {
        title: string
        type: 'board_meeting_minutes' | 'general_meeting_minutes'
        meetingCategory?: 'bolagsstamma' | 'styrelsemote'
        date: string
        location?: string
        agenda?: Array<{ title?: string; decision?: string }>
        attendees?: string[]
        status?: string
    }): Promise<GeneralMeeting> {
        const supabase = createBrowserClient()

        // Get user and company context
        const [{ data: { user } }, { data: company }] = await Promise.all([
            supabase.auth.getUser(),
            supabase.from('companies').select('id').single()
        ])

        if (!user || !company) throw new Error('Ej inloggad eller företag saknas.')

        const { data, error } = await supabase
            .from('meetings')
            .insert({
                user_id: user.id,
                company_id: company.id,
                title: params.title,
                type: params.type,
                date: params.date,
                location: params.location || null,
                agenda_items: params.agenda || null,
                attendees: params.attendees || [],
                status: params.status || 'draft',
            })
            .select()
            .single()

        if (error) throw error

        const isBoard = data.type === 'board_meeting_minutes'
        const meetingCategory = params.meetingCategory || (isBoard ? 'styrelsemote' : 'bolagsstamma')

        // Map back to our domain model
        return {
            id: data.id,
            title: data.title || 'Möte',
            date: data.date,
            year: new Date(data.date).getFullYear(),
            type: 'ordinarie',
            meetingType: 'bolagsstamma',
            meetingCategory,
            status: 'planerad',
            location: data.location || 'Ej angivet',
            chairperson: '',
            secretary: '',
            attendeesCount: (data.attendees as string[])?.length || 0,
            attendees: data.attendees as string[] || [],
            decisions: [],
        }
    },

    /**
     * Update an existing meeting
     */
    async updateMeeting(id: string, updates: Partial<CompanyMeeting>): Promise<void> {
        const supabase = createBrowserClient()

        // Get company context for explicit filtering
        const { data: company } = await supabase.from('companies').select('id').single()
        if (!company) throw new Error('Företag saknas.')

        const dbUpdates: any = {}
        if (updates.title) dbUpdates.title = updates.title
        if (updates.status) {
            const statusMap: Record<string, string> = {
                'planerad': 'Planerad',
                'kallad': 'Kallad',
                'genomförd': 'Genomförd',
                'protokoll signerat': 'Signerat',
            }
            dbUpdates.status = statusMap[updates.status] || 'Planerad'
        }
        if (updates.location) dbUpdates.location = updates.location
        if (updates.attendees) dbUpdates.attendees = updates.attendees

        const { error } = await supabase
            .from('meetings')
            .update(dbUpdates)
            .eq('id', id)
            .eq('company_id', company.id)

        if (error) throw error
    },

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
    },

    /**
     * Get all compliance-related documents
     */
    async getComplianceDocuments() {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
            .from('meetings')
            .select('*')
            .order('date', { ascending: false })
        
        if (error) throw error
        return data || []
    }
}
