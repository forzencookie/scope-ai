/**
 * Parter AI Tools - Board (Styrelse)
 *
 * Tools for managing board members and board meetings.
 * Note: getSignatoriesTool is in compliance.ts
 */

import { defineTool } from '../registry'
import { 
    boardService, 
    BoardMember, 
    BoardMeetingMinutes,
    CompanyMeeting 
} from '@/services/board-service'

// =============================================================================
// Get Board Members Tool
// =============================================================================

export const getBoardMembersTool = defineTool<Record<string, never>, BoardMember[]>({
    name: 'get_board_members',
    description: 'Hämta lista över styrelsemedlemmar (ordförande, VD, ledamöter, suppleanter).',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        try {
            const members = await boardService.getBoardMembers()

            if (members.length === 0) {
                return {
                    success: true,
                    data: [] as BoardMember[],
                    message: 'Inga styrelsemedlemmar registrerade.',
                }
            }

            // Group by role
            const chairperson = members.find(m => m.role === 'Ordförande')
            const ceo = members.find(m => m.role === 'VD')
            const regularMembers = members.filter(m => m.role === 'Ledamot')
            const substitutes = members.filter(m => m.role === 'Suppleant')

            let summary = `Styrelsen består av ${members.length} personer`
            if (chairperson) summary += `, ordförande: ${chairperson.name}`
            if (ceo) summary += `, VD: ${ceo.name}`

            return {
                success: true,
                data: members,
                message: summary,
                display: {
                    component: 'BoardMembersList',
                    props: { 
                        members,
                        chairperson,
                        ceo,
                        regularMembers,
                        substitutes
                    },
                    title: 'Styrelse',
                    fullViewRoute: '/dashboard/agare?tab=styrelseprotokoll',
                },
            }
        } catch (error) {
            console.error('Failed to fetch board members:', error)
            return { success: false, error: 'Kunde inte hämta styrelsemedlemmar.' }
        }
    },
})

// =============================================================================
// Get Board Meeting Minutes Tool
// =============================================================================

export interface GetBoardMeetingMinutesParams {
    status?: 'draft' | 'approved' | 'archived'
    limit?: number
}

export const getBoardMeetingMinutesTool = defineTool<GetBoardMeetingMinutesParams, BoardMeetingMinutes[]>({
    name: 'get_board_meeting_minutes',
    description: 'Hämta styrelseprotokoll. Kan filtreras på status.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            status: { type: 'string', enum: ['draft', 'approved', 'archived'], description: 'Filtrera på status' },
            limit: { type: 'number', description: 'Max antal (standard: 20)' },
        },
    },
    execute: async (params) => {
        try {
            const { minutes, totalCount } = await boardService.getBoardMeetingMinutes({
                status: params?.status,
                limit: params?.limit || 20
            })

            if (minutes.length === 0) {
                return {
                    success: true,
                    data: [] as BoardMeetingMinutes[],
                    message: 'Inga styrelseprotokoll hittades.',
                }
            }

            return {
                success: true,
                data: minutes,
                message: `Hittade ${totalCount} styrelseprotokoll, visar ${minutes.length}.`,
                display: {
                    component: 'BoardMeetingMinutesList',
                    props: { minutes },
                    title: 'Styrelseprotokoll',
                    fullViewRoute: '/dashboard/agare?tab=styrelseprotokoll',
                },
            }
        } catch (error) {
            console.error('Failed to fetch board meeting minutes:', error)
            return { success: false, error: 'Kunde inte hämta styrelseprotokoll.' }
        }
    },
})

// =============================================================================
// Get Company Meetings Tool
// =============================================================================

export interface GetCompanyMeetingsParams {
    type?: 'annual' | 'extraordinary' | 'board'
    limit?: number
}

export const getCompanyMeetingsTool = defineTool<GetCompanyMeetingsParams, CompanyMeeting[]>({
    name: 'get_company_meetings',
    description: 'Hämta bolagsstämmor och styrelsemöten.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            type: { type: 'string', enum: ['annual', 'extraordinary', 'board'], description: 'Typ av möte' },
            limit: { type: 'number', description: 'Max antal (standard: 20)' },
        },
    },
    execute: async (params) => {
        try {
            const { meetings, totalCount } = await boardService.getCompanyMeetings({
                type: params?.type,
                limit: params?.limit || 20
            })

            if (meetings.length === 0) {
                return {
                    success: true,
                    data: [] as CompanyMeeting[],
                    message: 'Inga möten hittades.',
                }
            }

            const typeLabel = {
                'annual': 'årsstämmor',
                'extraordinary': 'extra bolagsstämmor',
                'board': 'styrelsemöten'
            }

            return {
                success: true,
                data: meetings,
                message: params?.type 
                    ? `Hittade ${totalCount} ${typeLabel[params.type]}, visar ${meetings.length}.`
                    : `Hittade ${totalCount} möten, visar ${meetings.length}.`,
                display: {
                    component: 'CompanyMeetingsList',
                    props: { meetings },
                    title: 'Bolagsmöten',
                    fullViewRoute: '/dashboard/agare?tab=bolagsstamma',
                },
            }
        } catch (error) {
            console.error('Failed to fetch company meetings:', error)
            return { success: false, error: 'Kunde inte hämta möten.' }
        }
    },
})

// =============================================================================
// Get Annual Meeting Deadline Tool
// =============================================================================

export const getAnnualMeetingDeadlineTool = defineTool<{ fiscalYearEnd?: string }, {
    deadline: string
    daysRemaining: number
    isOverdue: boolean
}>({
    name: 'get_annual_meeting_deadline',
    description: 'Beräkna deadline för årsstämma baserat på räkenskapsårets slut.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            fiscalYearEnd: { type: 'string', description: 'Räkenskapsårets slut (MM-DD), standard 12-31' },
        },
    },
    execute: async (params) => {
        try {
            const result = await boardService.getAnnualMeetingDeadline(params?.fiscalYearEnd)

            let message = `Årsstämma ska hållas senast ${result.deadline}. `
            if (result.isOverdue) {
                message += `⚠️ Deadline har passerat med ${Math.abs(result.daysRemaining)} dagar!`
            } else if (result.daysRemaining <= 30) {
                message += `⚠️ Endast ${result.daysRemaining} dagar kvar!`
            } else {
                message += `${result.daysRemaining} dagar kvar.`
            }

            return {
                success: true,
                data: result,
                message,
            }
        } catch (error) {
            console.error('Failed to calculate annual meeting deadline:', error)
            return { success: false, error: 'Kunde inte beräkna deadline för årsstämma.' }
        }
    },
})

export const boardTools = [
    getBoardMembersTool,
    getBoardMeetingMinutesTool,
    getCompanyMeetingsTool,
    getAnnualMeetingDeadlineTool,
]
