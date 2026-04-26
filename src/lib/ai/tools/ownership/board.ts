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
} from '@/services/corporate'

// =============================================================================
// Get Board Members Tool
// =============================================================================

export const getBoardMembersTool = defineTool<Record<string, never>, BoardMember[]>({
    name: 'get_board_members',
    description: 'Hämta lista över styrelsemedlemmar (ordförande, VD, ledamöter, suppleanter).',
    category: 'read',
    requiresConfirmation: false,
    allowedCompanyTypes: ['ab', 'forening'],
    domain: 'parter',
    keywords: ['styrelse', 'ledamöter', 'styrelsemedlem'],
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
    description: 'Hämta styrelseprotokoll. Kan filtrera på status.',
    category: 'read',
    requiresConfirmation: false,
    allowedCompanyTypes: ['ab', 'forening'],
    domain: 'parter',
    keywords: ['styrelsemöte', 'protokoll', 'mötesprotokoll'],
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
    allowedCompanyTypes: ['ab', 'forening'],
    domain: 'parter',
    keywords: ['bolagsstämma', 'möten', 'stämma'],
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
    allowedCompanyTypes: ['ab'],
    domain: 'parter',
    keywords: ['årsstämma', 'deadline', 'datum'],
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

// =============================================================================
// assign_board_member
// =============================================================================

export interface AssignBoardMemberParams {
    name: string
    personnummer?: string
    role: 'ordförande' | 'ledamot' | 'suppleant' | 'vd' | 'revisor'
    email?: string
    startDate?: string
}

export const assignBoardMemberTool = defineTool<AssignBoardMemberParams, BoardMember>({
    name: 'assign_board_member',
    description: 'Tilldelar en ny styrelseroll (styrelseledamot, ordförande, VD, etc.). Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    allowedCompanyTypes: ['ab', 'forening'],
    domain: 'parter',
    keywords: ['styrelseledamot', 'ordförande', 'VD', 'styrelse', 'tilldela roll'],
    parameters: {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Personens fullständiga namn' },
            personnummer: { type: 'string', description: 'Personnummer (YYYYMMDD-XXXX)' },
            role: { type: 'string', enum: ['ordförande', 'ledamot', 'suppleant', 'vd', 'revisor'], description: 'Styrelseroll' },
            email: { type: 'string', description: 'E-postadress' },
            startDate: { type: 'string', description: 'Startdatum (YYYY-MM-DD), standard: idag' },
        },
        required: ['name', 'role'],
    },
    execute: async (params, context) => {
        const roleLabels: Record<AssignBoardMemberParams['role'], string> = {
            ordförande: 'Ordförande',
            ledamot: 'Ledamot',
            suppleant: 'Suppleant',
            vd: 'VD',
            revisor: 'Revisor',
        }
        const roleLabel = roleLabels[params.role]
        const date = params.startDate ?? new Date().toISOString().split('T')[0]
        if (context?.isConfirmed) {
            try {
                const { shareholderService } = await import('@/services/corporate/shareholder-service')
                const member = await shareholderService.addShareholder({
                    name: params.name,
                    personalOrOrgNumber: params.personnummer ?? '',
                    sharesCount: 0,
                    shareClass: 'A',
                    email: params.email,
                    isBoardMember: true,
                    boardRole: roleLabel,
                })
                return {
                    success: true,
                    data: {
                        id: member.id,
                        name: member.name,
                        personalNumber: member.personalOrOrgNumber ?? null,
                        role: roleLabel,
                        email: member.email ?? null,
                        phone: member.phone ?? null,
                        appointedDate: date,
                        isSignatory: params.role === 'ordförande' || params.role === 'vd',
                    },
                    message: `${params.name} tilldelad rollen ${roleLabel} från ${date}.`,
                }
            } catch {
                return { success: false, error: 'Kunde inte tilldela styrelseroll.' }
            }
        }
        const summaryItems: Array<{ label: string; value: string }> = [
            { label: 'Namn', value: params.name },
            { label: 'Roll', value: roleLabel },
            { label: 'Startdatum', value: date },
        ]
        if (params.personnummer) summaryItems.push({ label: 'Personnummer', value: params.personnummer })
        if (params.email) summaryItems.push({ label: 'E-post', value: params.email })
        return {
            success: true,
            data: { id: '', name: params.name, personalNumber: params.personnummer ?? null, role: roleLabel, email: params.email ?? null, phone: null, appointedDate: date, isSignatory: params.role === 'ordförande' || params.role === 'vd' },
            message: `Förbereder tilldelning av rollen ${roleLabel} till ${params.name}.`,
            confirmationRequired: {
                title: 'Tilldela styrelseroll',
                description: `Lägger till ${params.name} i styrelsen med rollen ${roleLabel}.`,
                summary: summaryItems,
                action: { toolName: 'assign_board_member', params },
            },
        }
    },
})

// =============================================================================
// schedule_meeting
// =============================================================================

export interface ScheduleMeetingParams {
    meetingType: 'styrelseprotokoll' | 'bolagsstamma' | 'extrastamma'
    date: string
    location?: string
    agenda?: string[]
}

export const scheduleMeetingTool = defineTool<ScheduleMeetingParams, CompanyMeeting>({
    name: 'schedule_meeting',
    description: 'Schemalägger ett styrelsemöte, bolagsstämma eller extrastämma. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    allowedCompanyTypes: ['ab', 'forening'],
    domain: 'parter',
    keywords: ['boka möte', 'styrelsesammanträde', 'bolagsstämma', 'extrastämma'],
    parameters: {
        type: 'object',
        properties: {
            meetingType: { type: 'string', enum: ['styrelseprotokoll', 'bolagsstamma', 'extrastamma'], description: 'Typ av möte' },
            date: { type: 'string', description: 'Datum för mötet (YYYY-MM-DD)' },
            location: { type: 'string', description: 'Plats för mötet' },
            agenda: { type: 'array', items: { type: 'string' }, description: 'Dagordningspunkter' },
        },
        required: ['meetingType', 'date'],
    },
    execute: async (params, context) => {
        const typeMap: Record<ScheduleMeetingParams['meetingType'], { dbType: 'board_meeting_minutes' | 'general_meeting_minutes'; label: string; category: 'bolagsstamma' | 'styrelsemote' }> = {
            styrelseprotokoll: { dbType: 'board_meeting_minutes', label: 'Styrelsemöte', category: 'styrelsemote' },
            bolagsstamma: { dbType: 'general_meeting_minutes', label: 'Bolagsstämma', category: 'bolagsstamma' },
            extrastamma: { dbType: 'general_meeting_minutes', label: 'Extrastämma', category: 'bolagsstamma' },
        }
        const { dbType, label, category } = typeMap[params.meetingType]
        const agendaItems = params.agenda?.map(item => ({ title: item }))
        if (context?.isConfirmed) {
            try {
                const meeting = await boardService.createMeeting({
                    title: `${label} ${params.date}`,
                    type: dbType,
                    meetingCategory: category,
                    date: params.date,
                    location: params.location,
                    agenda: agendaItems,
                    status: 'draft',
                })
                return {
                    success: true,
                    data: meeting,
                    message: `${label} schemalagd till ${params.date}${params.location ? ` — plats: ${params.location}` : ''}.`,
                }
            } catch {
                return { success: false, error: 'Kunde inte schemalägga mötet.' }
            }
        }
        const summaryItems: Array<{ label: string; value: string }> = [
            { label: 'Typ', value: label },
            { label: 'Datum', value: params.date },
        ]
        if (params.location) summaryItems.push({ label: 'Plats', value: params.location })
        if (params.agenda?.length) summaryItems.push({ label: 'Dagordning', value: `${params.agenda.length} punkter` })
        return {
            success: true,
            data: { id: '', title: `${label} ${params.date}`, date: params.date, year: new Date(params.date).getFullYear(), type: params.meetingType === 'extrastamma' ? 'extra' : 'ordinarie', meetingType: 'bolagsstamma', meetingCategory: category, status: 'planerad', location: params.location ?? 'Ej angivet', chairperson: '', secretary: '', attendeesCount: 0, attendees: [], decisions: [] },
            message: `Förbereder schemaläggning av ${label} den ${params.date}.`,
            confirmationRequired: {
                title: `Schemalägg ${label}`,
                description: 'Skapar ett nytt möte i systemet.',
                summary: summaryItems,
                action: { toolName: 'schedule_meeting', params },
            },
        }
    },
})

// =============================================================================
// Record Board Decision Tool
// =============================================================================

export interface RecordBoardDecisionParams {
    decisionType: 'appoint_ceo' | 'approve_contract' | 'other'
    description: string
    personName?: string
    role?: string
    salary?: number
    effectiveDate?: string
    contractCounterparty?: string
    contractAmount?: number
    meetingDate?: string
}

export const recordBoardDecisionTool = defineTool<RecordBoardDecisionParams, { id: string; title: string }>({
    name: 'record_board_decision',
    description: 'Dokumentera ett styrelsebeslut — utse VD, godkänn avtal, eller annat. Skapar ett styrelsemötesprotokoll. Kräver bekräftelse. Endast AB.',
    category: 'write',
    requiresConfirmation: true,
    allowedCompanyTypes: ['ab'],
    domain: 'parter',
    keywords: ['styrelsebeslut', 'VD', 'avtal', 'protokoll', 'styrelse'],
    parameters: {
        type: 'object',
        properties: {
            decisionType: { type: 'string', description: 'Typ: appoint_ceo | approve_contract | other' },
            description: { type: 'string', description: 'Beskrivning av beslutet' },
            personName: { type: 'string', description: 'Person som berörs (VD, firmatecknare etc.)' },
            role: { type: 'string', description: 'Roll/titel' },
            salary: { type: 'number', description: 'Lön i kr/mån (om relevant)' },
            effectiveDate: { type: 'string', description: 'Startdatum (YYYY-MM-DD)' },
            contractCounterparty: { type: 'string', description: 'Motpart (om avtalsbeslut)' },
            contractAmount: { type: 'number', description: 'Avtalsbelopp (om avtalsbeslut)' },
            meetingDate: { type: 'string', description: 'Mötesdatum (YYYY-MM-DD, standard: idag)' },
        },
        required: ['decisionType', 'description'],
    },
    execute: async (params, context) => {
        const titleMap: Record<RecordBoardDecisionParams['decisionType'], string> = {
            appoint_ceo: `Utse VD${params.personName ? ` — ${params.personName}` : ''}`,
            approve_contract: `Godkänn avtal${params.contractCounterparty ? ` — ${params.contractCounterparty}` : ''}`,
            other: params.description,
        }
        const title = titleMap[params.decisionType]
        const date = params.meetingDate ?? new Date().toISOString().split('T')[0]

        if (context?.isConfirmed) {
            try {
                const meeting = await boardService.createMeeting({
                    title: `Styrelsebeslut: ${title}`,
                    type: 'board_meeting_minutes',
                    meetingCategory: 'styrelsemote',
                    date,
                    agenda: [{ title, decision: params.description }],
                    status: 'draft',
                })
                return {
                    success: true,
                    data: { id: meeting.id, title: meeting.title },
                    message: `Styrelsebeslut dokumenterat: ${title}.`,
                }
            } catch {
                return { success: false, error: 'Kunde inte spara styrelsebeslut.' }
            }
        }

        const summary: Array<{ label: string; value: string }> = [
            { label: 'Beslut', value: title },
            { label: 'Datum', value: date },
        ]
        if (params.personName) summary.push({ label: 'Person', value: params.personName })
        if (params.role) summary.push({ label: 'Roll', value: params.role })
        if (params.salary) summary.push({ label: 'Lön', value: `${params.salary.toLocaleString('sv-SE')} kr/mån` })
        if (params.contractCounterparty) summary.push({ label: 'Motpart', value: params.contractCounterparty })
        if (params.effectiveDate) summary.push({ label: 'Gäller från', value: params.effectiveDate })

        return {
            success: true,
            data: { id: '', title },
            message: `Styrelsebeslut förberett: ${title}. Bekräfta för att spara protokollet.`,
            confirmationRequired: {
                title: 'Styrelsebeslut',
                description: title,
                summary,
                action: { toolName: 'record_board_decision', params },
            },
        }
    },
})

export const boardTools = [
    getBoardMembersTool,
    getBoardMeetingMinutesTool,
    getCompanyMeetingsTool,
    getAnnualMeetingDeadlineTool,
    assignBoardMemberTool,
    scheduleMeetingTool,
    recordBoardDecisionTool,
]
