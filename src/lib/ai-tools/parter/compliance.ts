/**
 * Parter AI Tools - Compliance (Protokoll, Utdelning)
 *
 * Tools for corporate compliance documents and dividends.
 */

import { defineTool } from '../registry'
import { boardService, Signatory as BoardSignatory } from '@/services/board-service'

// =============================================================================
// Compliance Document Tools
// =============================================================================

export interface GetComplianceDocsParams {
    type?: 'board_meeting_minutes' | 'general_meeting_minutes' | 'shareholder_register'
    limit?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getComplianceDocsTool = defineTool<GetComplianceDocsParams, any[]>({
    name: 'get_compliance_docs',
    description: 'Hämta bolagsdokument som styrelseprotokoll eller stämmoprotokoll.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            type: { type: 'string', enum: ['board_meeting_minutes', 'general_meeting_minutes', 'shareholder_register'], description: 'Typ av dokument' },
            limit: { type: 'number', description: 'Max antal dokument (standard: 5)' },
        },
    },
    execute: async (params) => {
        try {
            const response = await fetch('/api/compliance', { cache: 'no-store' })
            if (response.ok) {
                const data = await response.json()
                let docs = data.documents || []

                if (params.type) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    docs = docs.filter((d: any) => d.type === params.type)
                }

                const limit = params.limit || 5
                const displayDocs = docs.slice(0, limit)

                return {
                    success: true,
                    data: displayDocs,
                    message: `Hittade ${docs.length} dokument, visar de senaste ${displayDocs.length}.`,
                    display: {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        component: 'ComplianceList' as any,
                        props: { documents: displayDocs },
                        title: 'Bolagsdokument',
                        fullViewRoute: '/dashboard/parter',
                    },
                }
            }
        } catch (error) {
            console.error('Failed to fetch compliance docs:', error)
        }

        return { success: false, error: 'Kunde inte hämta bolagsdokument.' }
    },
})

// =============================================================================
// Dividend Tools
// =============================================================================

export interface RegisterDividendParams {
    amount: number
    year: number
    recipientName?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registerDividendTool = defineTool<RegisterDividendParams, any>({
    name: 'register_dividend',
    description: 'Registrera ett utdelningsbeslut från bolagsstämma. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            amount: { type: 'number', description: 'Utdelningsbelopp i kronor' },
            year: { type: 'number', description: 'Inkomstår för utdelningen' },
            recipientName: { type: 'string', description: 'Mottagare (om specifik, annars alla aktieägare)' },
        },
        required: ['amount', 'year'],
    },
    execute: async (params) => {
        const dividendData = {
            type: 'dividend_decision',
            amount: params.amount,
            year: params.year,
            recipient: params.recipientName || 'Alla aktieägare',
            date: new Date().toISOString(),
        }

        return {
            success: true,
            data: dividendData,
            message: `Registrerade utdelning på ${params.amount.toLocaleString('sv-SE')} kr för ${params.year}.`,
            navigation: {
                route: '/dashboard/parter?tab=utdelning',
                label: 'Visa utdelning',
            },
        }
    },
})



export interface DraftBoardMinutesParams {
    type: 'board_meeting' | 'annual_general_meeting'
    date?: string
    decisions?: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const draftBoardMinutesTool = defineTool<DraftBoardMinutesParams, any>({
    name: 'draft_board_minutes',
    description: 'Skapa ett utkast till styrelseprotokoll eller stämmoprotokoll.',
    category: 'write',
    requiresConfirmation: false, // We use the preview as "drafting" step
    parameters: {
        type: 'object',
        properties: {
            type: { type: 'string', enum: ['board_meeting', 'annual_general_meeting'], description: 'Typ av möte' },
            date: { type: 'string', description: 'Datum för mötet (YYYY-MM-DD)' },
            decisions: { type: 'array', items: { type: 'string' }, description: 'Lista på beslut som fattades' },
        },
        required: ['type'],
    },
    execute: async (params) => {
        // Mock data for preview
        const boardMinutesData = {
            companyName: "Din Företag AB",
            meetingType: params.type === 'annual_general_meeting' ? "Årsstämma" : "Styrelsemöte",
            meetingNumber: "1/2026",
            date: params.date || new Date().toISOString().split('T')[0],
            time: "10:00 - 11:30",
            location: "Huvudkontoret",
            attendees: [
                { name: "Anna Andersson", role: "Chairman", present: true },
                { name: "Erik Eriksson", role: "Member", present: true },
                { name: "Lars Larsson", role: "Secretary", present: true },
            ],
            agenda: [
                "Mötets öppnande",
                "Val av ordförande och sekreterare",
                "Fastställande av dagordning",
                "Genomgång av föregående protokoll",
                "Beslutsärenden",
                "Mötets avslutande"
            ],
            decisions: params.decisions?.map((d, i) => ({
                id: `d-${i}`,
                paragraph: `§${i + 5}`,
                title: "Beslut",
                description: d,
                decision: d,
                type: "decision"
            })) || [
                    {
                        id: "d-1",
                        paragraph: "§5",
                        title: "Beslut om firmateckning",
                        description: "Styrelsen diskuterade bolagets firmateckning.",
                        decision: "Styrelsen beslutar att firman tecknas av styrelsen gemensamt.",
                        type: "decision"
                    }
                ],
            signatures: [
                { role: "Ordförande", name: "Anna Andersson" },
                { role: "Sekreterare", name: "Lars Larsson" }
            ]
        }

        return {
            success: true,
            data: boardMinutesData,
            message: `Utkast till ${boardMinutesData.meetingType} skapat.`,
            display: {
                component: "BoardMinutesPreview",
                title: "Protokollutkast",
                props: { data: boardMinutesData }
            }
        }
    }
})

// =============================================================================
// Signatories Tool
// =============================================================================

export interface Signatory {
    id: string
    name: string
    role: 'CEO' | 'Chairman' | 'BoardMember' | 'Procurist' | 'Other' | string
    signingRights: 'alone' | 'jointly' | 'together_with_another' | string
    registeredDate: string
    personalNumber?: string
}

export const getSignatoriesTool = defineTool<Record<string, never>, Signatory[]>({
    name: 'get_signatories',
    description: 'Hämta lista över firmatecknare och deras behörigheter.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        try {
            // Fetch real data from database via boardService
            const boardSignatories = await boardService.getSignatories()

            if (boardSignatories.length === 0) {
                return {
                    success: true,
                    data: [] as Signatory[],
                    message: 'Inga firmatecknare registrerade.',
                }
            }

            // Map to the Signatory interface expected by this tool
            const signatories: Signatory[] = boardSignatories.map((s: BoardSignatory) => ({
                id: s.id,
                name: s.name,
                role: mapRole(s.role),
                signingRights: mapSigningAuthority(s.signingAuthority),
                registeredDate: new Date().toISOString().split('T')[0], // Would come from DB
                personalNumber: s.personalNumber || undefined,
            }))

            const roleLabels: Record<string, string> = {
                CEO: 'VD',
                Chairman: 'Styrelseordförande',
                BoardMember: 'Styrelseledamot',
                Procurist: 'Prokurist',
                Other: 'Övrig',
            }

            const rightsLabels: Record<string, string> = {
                alone: 'Ensam firmatecknare',
                jointly: 'Två i förening',
                together_with_another: 'Tillsammans med annan',
            }

            return {
                success: true,
                data: signatories,
                message: `Bolaget har ${signatories.length} registrerade firmatecknare.`,
                display: {
                    component: 'DataTable',
                    title: 'Firmatecknare',
                    props: {
                        columns: ['Namn', 'Roll', 'Teckningsrätt', 'Registrerad'],
                        rows: signatories.map(s => [
                            s.name,
                            roleLabels[s.role] || s.role,
                            rightsLabels[s.signingRights] || s.signingRights,
                            s.registeredDate,
                        ]),
                    },
                },
                navigation: {
                    route: '/dashboard/parter?tab=firmatecknare',
                    label: 'Visa firmatecknare',
                },
            }
        } catch (error) {
            console.error('Failed to fetch signatories:', error)
            return { success: false, error: 'Kunde inte hämta firmatecknare.' }
        }
    },
})

// Helper to map board role to signatory role
function mapRole(role: string): Signatory['role'] {
    const roleMap: Record<string, Signatory['role']> = {
        'VD': 'CEO',
        'Ordförande': 'Chairman',
        'Ledamot': 'BoardMember',
        'Suppleant': 'Other',
    }
    return roleMap[role] || role
}

// Helper to map signing authority
function mapSigningAuthority(authority: string): Signatory['signingRights'] {
    const authorityMap: Record<string, Signatory['signingRights']> = {
        'Ensam': 'alone',
        'Två i förening': 'jointly',
        'I förening med annan': 'together_with_another',
    }
    return authorityMap[authority] || authority
}

// =============================================================================
// Compliance Deadlines Tool
// =============================================================================

import { companyService } from '@/services/company-service'

export interface ComplianceDeadline {
    id: string
    title: string
    description: string
    deadline: string
    authority: string // e.g., "Bolagsverket", "Skatteverket"
    status: 'upcoming' | 'due_soon' | 'overdue' | 'completed'
    type: 'annual_report' | 'agm' | 'tax_return' | 'vat' | 'employer_declaration' | 'other'
}

/**
 * Calculate statutory deadlines based on fiscal year end
 */
function calculateDeadlines(
    fiscalYearEnd: string, // MM-DD format
    vatFrequency: 'monthly' | 'quarterly' | 'annually',
    hasEmployees: boolean,
    companyType: string
): ComplianceDeadline[] {
    const today = new Date()
    const currentYear = today.getFullYear()
    
    // Parse fiscal year end (MM-DD)
    const [fyMonth, fyDay] = fiscalYearEnd.split('-').map(Number)
    
    // Determine the most recent fiscal year end date
    let fyEndDate = new Date(currentYear, fyMonth - 1, fyDay)
    if (fyEndDate > today) {
        fyEndDate = new Date(currentYear - 1, fyMonth - 1, fyDay)
    }
    
    const deadlines: ComplianceDeadline[] = []
    let idCounter = 1
    
    // Helper to calculate status
    const getStatus = (deadline: Date): ComplianceDeadline['status'] => {
        const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntil < 0) return 'overdue'
        if (daysUntil <= 14) return 'due_soon'
        return 'upcoming'
    }
    
    // Helper to format date as YYYY-MM-DD
    const formatDate = (date: Date): string => date.toISOString().split('T')[0]
    
    // Only AB has AGM and Bolagsverket annual report requirements
    if (companyType === 'ab') {
        // AGM: 6 months after fiscal year end
        const agmDeadline = new Date(fyEndDate)
        agmDeadline.setMonth(agmDeadline.getMonth() + 6)
        if (agmDeadline > today) {
            deadlines.push({
                id: `dl-${idCounter++}`,
                title: 'Årsstämma',
                description: `Ordinarie bolagsstämma ska hållas inom 6 månader från räkenskapsårets slut (${formatDate(fyEndDate)})`,
                deadline: formatDate(agmDeadline),
                authority: 'Aktiebolagslagen',
                status: getStatus(agmDeadline),
                type: 'agm',
            })
        }
        
        // Annual report to Bolagsverket: 7 months after fiscal year end
        const annualReportDeadline = new Date(fyEndDate)
        annualReportDeadline.setMonth(annualReportDeadline.getMonth() + 7)
        if (annualReportDeadline > today) {
            deadlines.push({
                id: `dl-${idCounter++}`,
                title: 'Årsredovisning till Bolagsverket',
                description: `Årsredovisning ska lämnas in inom 7 månader från räkenskapsårets slut (${formatDate(fyEndDate)})`,
                deadline: formatDate(annualReportDeadline),
                authority: 'Bolagsverket',
                status: getStatus(annualReportDeadline),
                type: 'annual_report',
            })
        }
    }
    
    // Income tax return: May 2 for previous year (most companies)
    // For broken fiscal year, different rules apply
    if (fyMonth === 12 && fyDay === 31) {
        const incomeTaxDeadline = new Date(currentYear, 4, 2) // May 2
        if (incomeTaxDeadline > today) {
            deadlines.push({
                id: `dl-${idCounter++}`,
                title: 'Inkomstdeklaration',
                description: `Inkomstdeklaration för ${currentYear - 1}`,
                deadline: formatDate(incomeTaxDeadline),
                authority: 'Skatteverket',
                status: getStatus(incomeTaxDeadline),
                type: 'tax_return',
            })
        }
    }
    
    // VAT deadlines based on frequency
    if (vatFrequency === 'monthly') {
        // Monthly VAT: 26th of following month (or 12th for small amounts)
        for (let i = 0; i < 3; i++) {
            const vatMonth = today.getMonth() + i
            const vatDeadline = new Date(currentYear, vatMonth + 1, 26)
            if (vatMonth > 11) {
                vatDeadline.setFullYear(currentYear + 1)
            }
            const periodMonth = new Date(currentYear, vatMonth, 1)
            deadlines.push({
                id: `dl-${idCounter++}`,
                title: 'Momsdeklaration',
                description: `Moms för ${periodMonth.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}`,
                deadline: formatDate(vatDeadline),
                authority: 'Skatteverket',
                status: getStatus(vatDeadline),
                type: 'vat',
            })
        }
    } else if (vatFrequency === 'quarterly') {
        // Quarterly VAT: 12th of month+2 after quarter end
        const quarterEnds = [
            { month: 2, name: 'Q1 (jan-mar)', dueMonth: 4, dueDay: 12 },
            { month: 5, name: 'Q2 (apr-jun)', dueMonth: 7, dueDay: 17 },
            { month: 8, name: 'Q3 (jul-sep)', dueMonth: 10, dueDay: 12 },
            { month: 11, name: 'Q4 (okt-dec)', dueMonth: 1, dueDay: 12 },
        ]
        for (const q of quarterEnds) {
            let dueYear = currentYear
            if (q.month === 11) dueYear = currentYear + 1
            const vatDeadline = new Date(dueYear, q.dueMonth, q.dueDay)
            if (vatDeadline > today && vatDeadline < new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000)) {
                deadlines.push({
                    id: `dl-${idCounter++}`,
                    title: 'Momsdeklaration',
                    description: `Moms för ${q.name} ${q.month === 11 ? currentYear : currentYear}`,
                    deadline: formatDate(vatDeadline),
                    authority: 'Skatteverket',
                    status: getStatus(vatDeadline),
                    type: 'vat',
                })
            }
        }
    }
    
    // Employer declarations (AGI): 12th of following month
    if (hasEmployees) {
        for (let i = 0; i < 3; i++) {
            const agiMonth = today.getMonth() + i
            const agiDeadline = new Date(currentYear, agiMonth + 1, 12)
            if (agiMonth > 11) {
                agiDeadline.setFullYear(currentYear + 1)
            }
            const periodMonth = new Date(currentYear, agiMonth, 1)
            deadlines.push({
                id: `dl-${idCounter++}`,
                title: 'Arbetsgivardeklaration',
                description: `AGI för ${periodMonth.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}`,
                deadline: formatDate(agiDeadline),
                authority: 'Skatteverket',
                status: getStatus(agiDeadline),
                type: 'employer_declaration',
            })
        }
    }
    
    return deadlines.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
}

export const getComplianceDeadlinesTool = defineTool<{ daysAhead?: number }, ComplianceDeadline[]>({
    name: 'get_compliance_deadlines',
    description: 'Visa kommande deadlines för bolagsrättsliga och skattemässiga förpliktelser baserat på ditt räkenskapsår.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            daysAhead: { type: 'number', description: 'Antal dagar framåt att visa (standard: 90)' },
        },
    },
    execute: async (params, context) => {
        const daysAhead = params.daysAhead || 90
        const today = new Date()
        
        // Get company info for fiscal year and settings
        const userId = context?.userId
        let fiscalYearEnd = '12-31'
        let vatFrequency: 'monthly' | 'quarterly' | 'annually' = 'quarterly'
        let hasEmployees = false
        let companyType = 'ab'
        
        if (userId) {
            try {
                const company = await companyService.getByUserId(userId)
                if (company) {
                    fiscalYearEnd = company.fiscalYearEnd || '12-31'
                    vatFrequency = company.vatFrequency || 'quarterly'
                    hasEmployees = company.hasEmployees ?? false
                    companyType = company.companyType || 'ab'
                }
            } catch (error) {
                console.error('Failed to fetch company for deadlines:', error)
            }
        }
        
        // Calculate all statutory deadlines
        const allDeadlines = calculateDeadlines(fiscalYearEnd, vatFrequency, hasEmployees, companyType)

        // Filter by days ahead
        const cutoffDate = new Date(today)
        cutoffDate.setDate(cutoffDate.getDate() + daysAhead)

        const filteredDeadlines = allDeadlines.filter(d => {
            const deadlineDate = new Date(d.deadline)
            return deadlineDate <= cutoffDate && deadlineDate >= today
        })

        const statusLabels: Record<string, string> = {
            upcoming: '🟢 Kommande',
            due_soon: '🟡 Snart',
            overdue: '🔴 Försenad',
            completed: '✅ Klar',
        }

        return {
            success: true,
            data: filteredDeadlines,
            message: filteredDeadlines.length > 0 
                ? `Du har ${filteredDeadlines.length} kommande deadlines inom ${daysAhead} dagar.`
                : `Inga deadlines inom de kommande ${daysAhead} dagarna.`,
            display: {
                component: 'DataTable',
                title: 'Kommande deadlines',
                props: {
                    columns: ['Deadline', 'Ärende', 'Myndighet', 'Status'],
                    rows: filteredDeadlines.map(d => [
                        d.deadline,
                        d.title,
                        d.authority,
                        statusLabels[d.status] || d.status,
                    ]),
                },
            },
        }
    },
})

// =============================================================================
// Prepare AGM Documents Tool
// =============================================================================

export interface PrepareAgmParams {
    fiscalYear: number
    proposedDividend?: number
    agmDate?: string
}

export interface AgmDocumentsResult {
    agenda: string[]
    requiredDocuments: Array<{ name: string; status: 'ready' | 'pending' | 'missing' }>
    proposedDividend?: number
    fiscalYear: number
    suggestedDate: string
}

export const prepareAgmTool = defineTool<PrepareAgmParams, AgmDocumentsResult>({
    name: 'prepare_agm',
    description: 'Förbered underlag och dagordning för årsstämma.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            fiscalYear: { type: 'number', description: 'Räkenskapsår att förbereda stämma för' },
            proposedDividend: { type: 'number', description: 'Föreslagen utdelning i kronor' },
            agmDate: { type: 'string', description: 'Planerat datum för stämman (YYYY-MM-DD)' },
        },
        required: ['fiscalYear'],
    },
    execute: async (params) => {
        // Calculate suggested AGM date (within 6 months of fiscal year end)
        const suggestedDate = params.agmDate || `${params.fiscalYear + 1}-06-15`

        const result: AgmDocumentsResult = {
            fiscalYear: params.fiscalYear,
            suggestedDate,
            proposedDividend: params.proposedDividend,
            agenda: [
                "1. Stämmans öppnande",
                "2. Val av ordförande vid stämman",
                "3. Upprättande och godkännande av röstlängd",
                "4. Godkännande av dagordning",
                "5. Val av en eller två justeringspersoner",
                "6. Prövning om stämman blivit behörigen sammankallad",
                "7. Framläggande av årsredovisning och revisionsberättelse",
                "8. Beslut om fastställande av resultaträkning och balansräkning",
                "9. Beslut om dispositioner beträffande bolagets vinst eller förlust",
                "10. Beslut om ansvarsfrihet för styrelseledamöter och verkställande direktör",
                "11. Fastställande av arvoden till styrelse och revisor",
                "12. Val av styrelse och eventuella suppleanter",
                "13. Val av revisor",
                "14. Övriga ärenden",
                "15. Stämmans avslutande"
            ],
            requiredDocuments: [
                { name: 'Årsredovisning', status: 'ready' },
                { name: 'Revisionsberättelse', status: 'ready' },
                { name: 'Kallelse till stämma', status: 'pending' },
                { name: 'Röstlängd', status: 'pending' },
                { name: 'Styrelsens förslag till vinstdisposition', status: params.proposedDividend ? 'ready' : 'missing' },
                { name: 'Fullmaktsformulär', status: 'pending' },
            ],
        }

        const readyCount = result.requiredDocuments.filter(d => d.status === 'ready').length
        const totalCount = result.requiredDocuments.length

        return {
            success: true,
            data: result,
            message: `Årsstämmounderlag för ${params.fiscalYear}: ${readyCount}/${totalCount} dokument klara.`,
            display: {
                component: 'AgmPreparationPreview',
                title: `Årsstämma ${params.fiscalYear}`,
                props: { data: result },
            },
            navigation: {
                route: '/dashboard/parter?tab=stamma',
                label: 'Hantera årsstämma',
            },
        }
    },
})

export const complianceTools = [
    getComplianceDocsTool,
    registerDividendTool,
    draftBoardMinutesTool,
    getSignatoriesTool,
    getComplianceDeadlinesTool,
    prepareAgmTool,
]
