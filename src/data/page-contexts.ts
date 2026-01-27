/**
 * Page Context Data for AI Mentions
 * 
 * Provides rich context about each page so the AI understands
 * what the user is referring to when they mention a page.
 */

import {
    BookOpen,
    FileText,
    PiggyBank,
    CheckSquare,
    PieChart,
    Scale,
    Send,
    Users,
    Building2,
    Coins,
    Vote,
    Landmark,
    Settings,
    Calendar,
    Captions,
    Gift,
    type LucideIcon,
} from "lucide-react"

// =============================================================================
// Types
// =============================================================================

export interface PageContext {
    /** Unique identifier for the page */
    id: string
    /** Display title */
    title: string
    /** Short title for UI */
    shortTitle: string
    /** Category this page belongs to */
    category: PageCategory
    /** URL path to the page */
    url: string
    /** Icon component */
    icon: LucideIcon
    /** Description of what this page is for */
    description: string
    /** What the AI can help with on this page */
    aiCapabilities: string[]
    /** Key data/entities managed on this page */
    dataEntities: string[]
    /** Related tools the AI can use */
    relatedTools: string[]
    /** Keywords for search matching */
    keywords: string[]
}

export type PageCategory = 
    | 'bokforing' 
    | 'rapporter' 
    | 'loner' 
    | 'agare' 
    | 'ovrigt'

export interface PageCategoryInfo {
    id: PageCategory
    label: string
    labelEnglish: string
    description: string
}

// =============================================================================
// Category Definitions
// =============================================================================

export const PAGE_CATEGORIES: PageCategoryInfo[] = [
    {
        id: 'bokforing',
        label: 'Bokföring',
        labelEnglish: 'Accounting',
        description: 'Hantera transaktioner, fakturor, kvitton och verifikationer',
    },
    {
        id: 'rapporter',
        label: 'Rapporter & Deklarationer',
        labelEnglish: 'Reports & Declarations',
        description: 'Finansiella rapporter och skattedeklarationer',
    },
    {
        id: 'loner',
        label: 'Löner & Personal',
        labelEnglish: 'Payroll & Staff',
        description: 'Lönekörning, förmåner och personalhantering',
    },
    {
        id: 'agare',
        label: 'Ägare & Styrning',
        labelEnglish: 'Owners & Governance',
        description: 'Aktiebok, styrelseprotokoll och bolagsstämma',
    },
    {
        id: 'ovrigt',
        label: 'Övrigt',
        labelEnglish: 'Other',
        description: 'Inställningar, händelser och statistik',
    },
]

// =============================================================================
// Page Definitions
// =============================================================================

export const PAGE_CONTEXTS: PageContext[] = [
    // =========================================================================
    // Bokföring
    // =========================================================================
    {
        id: 'transaktioner',
        title: 'Transaktioner',
        shortTitle: 'Transaktioner',
        category: 'bokforing',
        url: '/dashboard/bokforing?tab=transaktioner',
        icon: BookOpen,
        description: 'Alla banktransaktioner och kontorörelser. Här ser du importerade transaktioner från banken och kan kontera dem till rätt konton.',
        aiCapabilities: [
            'Kategorisera och kontera transaktioner',
            'Matcha betalningar mot fakturor',
            'Hitta transaktioner som saknar kvitto',
            'Masskategorisera liknande transaktioner',
            'Förklara okända transaktioner',
        ],
        dataEntities: ['Transaktioner', 'Bankkonton', 'Konteringar'],
        relatedTools: ['get_transactions', 'categorize_transaction', 'bulk_categorize_transactions', 'match_payment_to_invoice'],
        keywords: ['transaktion', 'bank', 'konto', 'kontering', 'betalning', 'överföring'],
    },
    {
        id: 'fakturor',
        title: 'Fakturor',
        shortTitle: 'Fakturor',
        category: 'bokforing',
        url: '/dashboard/bokforing?tab=fakturor',
        icon: FileText,
        description: 'Skapa, skicka och hantera kundfakturor. Följ upp betalningar och skicka påminnelser.',
        aiCapabilities: [
            'Skapa nya fakturor',
            'Skicka betalningspåminnelser',
            'Visa förfallna fakturor',
            'Makulera fakturor',
            'Bokföra inbetalningar',
        ],
        dataEntities: ['Fakturor', 'Kunder', 'Betalningar', 'Påminnelser'],
        relatedTools: ['get_invoices', 'create_invoice', 'send_invoice_reminder', 'void_invoice', 'book_invoice_payment'],
        keywords: ['faktura', 'kund', 'betalning', 'förfallen', 'påminnelse', 'kredit'],
    },
    {
        id: 'kvitton',
        title: 'Kvitton',
        shortTitle: 'Kvitton',
        category: 'bokforing',
        url: '/dashboard/bokforing?tab=kvitton',
        icon: PiggyBank,
        description: 'Fota och spara kvitton. AI extraherar automatiskt datum, belopp och leverantör.',
        aiCapabilities: [
            'Extrahera data från kvitton med OCR',
            'Matcha kvitton mot transaktioner',
            'Hitta omatchade kvitton',
            'Kategorisera utgifter',
        ],
        dataEntities: ['Kvitton', 'Leverantörer', 'Utgiftskategorier'],
        relatedTools: ['get_receipts', 'match_receipt_to_transaction', 'get_unmatched_receipts'],
        keywords: ['kvitto', 'utgift', 'leverantör', 'inköp', 'utlägg', 'OCR'],
    },
    {
        id: 'inventarier',
        title: 'Inventarier',
        shortTitle: 'Inventarier',
        category: 'bokforing',
        url: '/dashboard/bokforing?tab=inventarier',
        icon: CheckSquare,
        description: 'Hantera anläggningstillgångar och inventarier. Beräkna och bokför avskrivningar.',
        aiCapabilities: [
            'Visa alla inventarier',
            'Skapa nya inventarier',
            'Beräkna avskrivningar',
            'Bokföra periodavskrivningar',
            'Avyttra/skrota inventarier',
        ],
        dataEntities: ['Inventarier', 'Avskrivningar', 'Anläggningsregister'],
        relatedTools: ['get_assets', 'create_asset', 'calculate_depreciation', 'book_depreciation', 'dispose_asset'],
        keywords: ['inventarie', 'avskrivning', 'tillgång', 'anläggning', 'maskin', 'utrustning'],
    },
    {
        id: 'verifikationer',
        title: 'Verifikationer',
        shortTitle: 'Verifikationer',
        category: 'bokforing',
        url: '/dashboard/bokforing?tab=verifikationer',
        icon: CheckSquare,
        description: 'Alla bokföringsverifikationer. Skapa manuella verifikationer och justera bokföringen.',
        aiCapabilities: [
            'Skapa manuella verifikationer',
            'Periodisera kostnader',
            'Omföra felaktiga bokningar',
            'Skapa periodiseringar',
        ],
        dataEntities: ['Verifikationer', 'Konteringsrader', 'Bokföringsperioder'],
        relatedTools: ['create_verification', 'periodize_expense', 'reverse_verification', 'create_accrual'],
        keywords: ['verifikation', 'bokning', 'kontering', 'periodisering', 'omföring'],
    },

    // =========================================================================
    // Rapporter
    // =========================================================================
    {
        id: 'resultatrakning',
        title: 'Resultaträkning',
        shortTitle: 'Resultat',
        category: 'rapporter',
        url: '/dashboard/rapporter?tab=resultatrakning',
        icon: PieChart,
        description: 'Visar intäkter, kostnader och resultat för en period. Ger överblick över lönsamheten.',
        aiCapabilities: [
            'Generera resultaträkning',
            'Jämföra med föregående period',
            'Analysera kostnadsposter',
            'Förklara avvikelser',
        ],
        dataEntities: ['Intäkter', 'Kostnader', 'Resultat'],
        relatedTools: ['get_income_statement', 'generate_financial_report'],
        keywords: ['resultat', 'intäkt', 'kostnad', 'vinst', 'förlust', 'lönsamhet'],
    },
    {
        id: 'balansrakning',
        title: 'Balansräkning',
        shortTitle: 'Balans',
        category: 'rapporter',
        url: '/dashboard/rapporter?tab=balansrakning',
        icon: Scale,
        description: 'Visar tillgångar, skulder och eget kapital. Ger en ögonblicksbild av företagets finansiella ställning.',
        aiCapabilities: [
            'Generera balansräkning',
            'Analysera kapitalbindning',
            'Visa nyckeltal',
        ],
        dataEntities: ['Tillgångar', 'Skulder', 'Eget kapital'],
        relatedTools: ['get_balance_sheet', 'generate_financial_report'],
        keywords: ['balans', 'tillgång', 'skuld', 'kapital', 'soliditet'],
    },
    {
        id: 'momsdeklaration',
        title: 'Momsdeklaration',
        shortTitle: 'Moms',
        category: 'rapporter',
        url: '/dashboard/rapporter?tab=momsdeklaration',
        icon: FileText,
        description: 'Beräkna och deklarera moms till Skatteverket. Visar ingående och utgående moms.',
        aiCapabilities: [
            'Beräkna momsdeklaration',
            'Generera XML för Skatteverket',
            'Visa momssammanställning',
            'Kontrollera momsavdrag',
        ],
        dataEntities: ['Utgående moms', 'Ingående moms', 'Momsperioder'],
        relatedTools: ['calculate_vat', 'generate_vat_xml', 'get_vat_summary'],
        keywords: ['moms', 'mervärdesskatt', 'skatteverket', 'deklaration', 'utgående', 'ingående'],
    },
    {
        id: 'inkomstdeklaration',
        title: 'Inkomstdeklaration',
        shortTitle: 'Inkomst',
        category: 'rapporter',
        url: '/dashboard/rapporter?tab=inkomstdeklaration',
        icon: FileText,
        description: 'Förbered inkomstdeklaration (INK2) för aktiebolag. Beräknar skatt och justeringar.',
        aiCapabilities: [
            'Förbereda INK2-underlag',
            'Beräkna skattemässiga justeringar',
            'Visa icke avdragsgilla kostnader',
        ],
        dataEntities: ['Skatteberäkning', 'Justeringar', 'Deklarationsunderlag'],
        relatedTools: ['prepare_ink2', 'calculate_corporate_tax'],
        keywords: ['inkomstdeklaration', 'ink2', 'bolagsskatt', 'skatteverket'],
    },
    {
        id: 'agi',
        title: 'Arbetsgivardeklaration',
        shortTitle: 'AGI',
        category: 'rapporter',
        url: '/dashboard/rapporter?tab=agi',
        icon: Send,
        description: 'Månatlig arbetsgivardeklaration (AGI) till Skatteverket med löner och arbetsgivaravgifter.',
        aiCapabilities: [
            'Generera AGI-underlag',
            'Skapa XML för Skatteverket',
            'Visa arbetsgivaravgifter',
        ],
        dataEntities: ['Löneunderlag', 'Arbetsgivaravgifter', 'Skatteavdrag'],
        relatedTools: ['generate_agi', 'calculate_employer_contributions'],
        keywords: ['agi', 'arbetsgivardeklaration', 'arbetsgivaravgift', 'skatteverket', 'lön'],
    },
    {
        id: 'arsredovisning',
        title: 'Årsredovisning',
        shortTitle: 'Årsredovisning',
        category: 'rapporter',
        url: '/dashboard/rapporter?tab=arsredovisning',
        icon: FileText,
        description: 'Formell årsredovisning för inlämning till Bolagsverket. Resultat- och balansräkning, noter och förvaltningsberättelse.',
        aiCapabilities: [
            'Generera årsredovisning',
            'Skapa förvaltningsberättelse',
            'Förbereda för digital inlämning',
        ],
        dataEntities: ['Årsredovisning', 'Noter', 'Förvaltningsberättelse'],
        relatedTools: ['generate_annual_report', 'generate_management_report'],
        keywords: ['årsredovisning', 'bolagsverket', 'årsbokslut', 'förvaltningsberättelse'],
    },
    {
        id: 'arsbokslut',
        title: 'Årsbokslut',
        shortTitle: 'Årsbokslut',
        category: 'rapporter',
        url: '/dashboard/rapporter?tab=arsbokslut',
        icon: FileText,
        description: 'Avsluta räkenskapsåret. Bokför bokslutstransaktioner och stäng perioden.',
        aiCapabilities: [
            'Förbereda årsbokslut',
            'Bokföra bokslutstransaktioner',
            'Stänga räkenskapsår',
        ],
        dataEntities: ['Bokslutsverifikationer', 'Periodavslut'],
        relatedTools: ['close_fiscal_year', 'prepare_year_end'],
        keywords: ['årsbokslut', 'bokslut', 'periodavslut', 'stänga'],
    },
    {
        id: 'k10',
        title: 'K10 - Kvalificerade andelar',
        shortTitle: 'K10',
        category: 'rapporter',
        url: '/dashboard/rapporter?tab=k10',
        icon: FileText,
        description: 'K10-blankett för fåmansföretagsägare. Beräkna gränsbelopp och utdelningsutrymme.',
        aiCapabilities: [
            'Beräkna gränsbelopp',
            'Optimera 3:12-reglerna',
            'Visa sparat utdelningsutrymme',
        ],
        dataEntities: ['Gränsbelopp', 'Utdelningsutrymme', 'Löneunderlag'],
        relatedTools: ['calculate_k10', 'optimize_312'],
        keywords: ['k10', '3:12', 'gränsbelopp', 'utdelning', 'fåmansföretag'],
    },

    // =========================================================================
    // Löner
    // =========================================================================
    {
        id: 'lonebesked',
        title: 'Lönekörning',
        shortTitle: 'Löner',
        category: 'loner',
        url: '/dashboard/loner?tab=lonebesked',
        icon: PiggyBank,
        description: 'Kör löner och skapa lönebesked. Beräknar skatt, arbetsgivaravgifter och nettolön.',
        aiCapabilities: [
            'Beräkna lön',
            'Skapa lönebesked',
            'Visa lönekostnader',
            'Beräkna arbetsgivaravgifter',
        ],
        dataEntities: ['Lönebesked', 'Anställda', 'Lönekörningar'],
        relatedTools: ['run_payroll', 'get_payslips', 'calculate_salary'],
        keywords: ['lön', 'lönebesked', 'lönekörning', 'brutto', 'netto', 'skatt'],
    },
    {
        id: 'formaner',
        title: 'Förmåner',
        shortTitle: 'Förmåner',
        category: 'loner',
        url: '/dashboard/loner?tab=benefits',
        icon: Gift,
        description: 'Hantera personalförmåner som friskvård, tjänstebil och pension.',
        aiCapabilities: [
            'Tilldela förmåner',
            'Beräkna förmånsvärde',
            'Visa skatteeffekt',
        ],
        dataEntities: ['Förmåner', 'Förmånsvärden', 'Anställda'],
        relatedTools: ['assign_benefit', 'calculate_benefit_value'],
        keywords: ['förmån', 'friskvård', 'tjänstebil', 'pension', 'förmånsvärde'],
    },
    {
        id: 'team',
        title: 'Team & Rapportering',
        shortTitle: 'Team',
        category: 'loner',
        url: '/dashboard/loner?tab=team',
        icon: Users,
        description: 'Översikt över anställda och lönerapporter. Hantera personalregister.',
        aiCapabilities: [
            'Visa anställda',
            'Generera lönerapporter',
            'Exportera löneunderlag',
        ],
        dataEntities: ['Anställda', 'Lönerapporter', 'Personalregister'],
        relatedTools: ['get_employees', 'generate_payroll_report'],
        keywords: ['team', 'anställd', 'personal', 'rapport'],
    },
    {
        id: 'egenavgifter',
        title: 'Egenavgifter',
        shortTitle: 'Egenavgifter',
        category: 'loner',
        url: '/dashboard/loner?tab=egenavgifter',
        icon: PiggyBank,
        description: 'Beräkna egenavgifter för enskild firma eller handelsbolag.',
        aiCapabilities: [
            'Beräkna egenavgifter',
            'Visa schablonavdrag',
            'Beräkna nettoresultat',
        ],
        dataEntities: ['Egenavgifter', 'Näringsverksamhet'],
        relatedTools: ['calculate_self_employment_fees'],
        keywords: ['egenavgift', 'enskild firma', 'näringsverksamhet'],
    },
    {
        id: 'delagaruttag',
        title: 'Delägaruttag',
        shortTitle: 'Uttag',
        category: 'loner',
        url: '/dashboard/loner?tab=delagaruttag',
        icon: Coins,
        description: 'Hantera uttag för delägare i fåmansföretag. Lön vs utdelning.',
        aiCapabilities: [
            'Registrera ägaruttag',
            'Jämföra lön vs utdelning',
            'Optimera skatteeffekt',
        ],
        dataEntities: ['Ägaruttag', 'Utdelning', 'Delägare'],
        relatedTools: ['register_owner_withdrawal', 'optimize_312'],
        keywords: ['uttag', 'delägare', 'utdelning', 'lön', 'ägare'],
    },

    // =========================================================================
    // Ägare & Styrning
    // =========================================================================
    {
        id: 'aktiebok',
        title: 'Aktiebok',
        shortTitle: 'Aktiebok',
        category: 'agare',
        url: '/dashboard/agare?tab=aktiebok',
        icon: BookOpen,
        description: 'Det officiella aktieägarregistret. Visar ägare, aktieinnehav och aktieslag.',
        aiCapabilities: [
            'Visa aktieboken',
            'Registrera aktieöverlåtelse',
            'Lägga till aktieägare',
        ],
        dataEntities: ['Aktieägare', 'Aktieinnehav', 'Aktieslag'],
        relatedTools: ['get_shareholders', 'add_shareholder', 'transfer_shares'],
        keywords: ['aktiebok', 'aktieägare', 'aktie', 'ägare', 'andel'],
    },
    {
        id: 'delagare',
        title: 'Delägare',
        shortTitle: 'Delägare',
        category: 'agare',
        url: '/dashboard/agare?tab=delagare',
        icon: Users,
        description: 'Information om delägare och deras ägarandelar.',
        aiCapabilities: [
            'Visa delägare',
            'Beräkna ägarandelar',
        ],
        dataEntities: ['Delägare', 'Ägarandelar'],
        relatedTools: ['get_shareholders'],
        keywords: ['delägare', 'ägare', 'andel'],
    },
    {
        id: 'utdelning',
        title: 'Utdelning',
        shortTitle: 'Utdelning',
        category: 'agare',
        url: '/dashboard/agare?tab=utdelning',
        icon: Coins,
        description: 'Besluta och registrera aktieutdelning.',
        aiCapabilities: [
            'Registrera utdelningsbeslut',
            'Beräkna utdelning per aktie',
            'Visa utdelningshistorik',
        ],
        dataEntities: ['Utdelningsbeslut', 'Aktieägare'],
        relatedTools: ['register_dividend'],
        keywords: ['utdelning', 'vinstutdelning', 'aktieägare'],
    },
    {
        id: 'styrelseprotokoll',
        title: 'Styrelseprotokoll',
        shortTitle: 'Styrelse',
        category: 'agare',
        url: '/dashboard/agare?tab=styrelseprotokoll',
        icon: FileText,
        description: 'Skapa och arkivera protokoll från styrelsemöten.',
        aiCapabilities: [
            'Skapa styrelseprotokoll',
            'Visa tidigare protokoll',
            'Föreslå dagordning',
        ],
        dataEntities: ['Protokoll', 'Styrelsemöten', 'Beslut'],
        relatedTools: ['draft_board_minutes', 'get_compliance_docs'],
        keywords: ['protokoll', 'styrelse', 'styrelsemöte', 'beslut'],
    },
    {
        id: 'bolagsstamma',
        title: 'Bolagsstämma',
        shortTitle: 'Stämma',
        category: 'agare',
        url: '/dashboard/agare?tab=bolagsstamma',
        icon: Landmark,
        description: 'Förbered och dokumentera bolagsstämma (årsstämma/extra stämma).',
        aiCapabilities: [
            'Förbereda årsstämma',
            'Skapa kallelse',
            'Skapa stämmoprotokoll',
        ],
        dataEntities: ['Stämmoprotokoll', 'Kallelser', 'Dagordning'],
        relatedTools: ['prepare_agm', 'draft_board_minutes'],
        keywords: ['bolagsstämma', 'årsstämma', 'stämma', 'kallelse'],
    },
    {
        id: 'arsmote',
        title: 'Årsmöte',
        shortTitle: 'Årsmöte',
        category: 'agare',
        url: '/dashboard/agare?tab=arsmote',
        icon: Vote,
        description: 'Årsmöte för föreningar och ekonomiska föreningar.',
        aiCapabilities: [
            'Förbereda årsmöte',
            'Skapa protokoll',
        ],
        dataEntities: ['Årsmötesprotokoll', 'Medlemmar'],
        relatedTools: ['draft_board_minutes'],
        keywords: ['årsmöte', 'förening', 'protokoll'],
    },
    {
        id: 'firmatecknare',
        title: 'Firmatecknare',
        shortTitle: 'Firmateckning',
        category: 'agare',
        url: '/dashboard/agare?tab=firmatecknare',
        icon: FileText,
        description: 'Visa och hantera firmatecknare och deras behörigheter.',
        aiCapabilities: [
            'Visa firmatecknare',
            'Kontrollera teckningsrätt',
        ],
        dataEntities: ['Firmatecknare', 'Behörigheter'],
        relatedTools: ['get_signatories'],
        keywords: ['firmatecknare', 'signatur', 'behörighet', 'teckna'],
    },
    {
        id: 'myndigheter',
        title: 'Myndigheter',
        shortTitle: 'Myndigheter',
        category: 'agare',
        url: '/dashboard/agare?tab=myndigheter',
        icon: Building2,
        description: 'Kontaktuppgifter och ärenden hos myndigheter (Bolagsverket, Skatteverket).',
        aiCapabilities: [
            'Visa kommande deadlines',
            'Kontrollera registreringar',
        ],
        dataEntities: ['Registreringar', 'Deadlines'],
        relatedTools: ['get_compliance_deadlines'],
        keywords: ['myndighet', 'bolagsverket', 'skatteverket', 'registrering'],
    },

    // =========================================================================
    // Övrigt
    // =========================================================================
    {
        id: 'handelser',
        title: 'Händelser',
        shortTitle: 'Händelser',
        category: 'ovrigt',
        url: '/dashboard/handelser',
        icon: Calendar,
        description: 'Aktivitetslogg och kalender. Visa händelser, deadlines och planering.',
        aiCapabilities: [
            'Visa händelser',
            'Skapa påminnelser',
            'Visa kommande deadlines',
            'Sammanfatta aktivitet',
        ],
        dataEntities: ['Händelser', 'Deadlines', 'Planer'],
        relatedTools: ['get_events', 'create_event', 'get_upcoming_deadlines', 'get_activity_summary'],
        keywords: ['händelse', 'kalender', 'deadline', 'påminnelse', 'aktivitet'],
    },
    {
        id: 'installningar',
        title: 'Inställningar',
        shortTitle: 'Inställningar',
        category: 'ovrigt',
        url: '/dashboard/installningar',
        icon: Settings,
        description: 'Företagsinställningar, integrationer, notifikationer och prenumeration.',
        aiCapabilities: [
            'Visa prenumerationsstatus',
            'Hantera notifikationer',
            'Visa integrationer',
            'Ansluta bankkonto',
        ],
        dataEntities: ['Inställningar', 'Integrationer', 'Prenumeration'],
        relatedTools: ['get_subscription_status', 'get_notification_preferences', 'list_active_integrations', 'connect_bank_account'],
        keywords: ['inställning', 'integration', 'notifikation', 'prenumeration', 'bank'],
    },
    {
        id: 'foretagsstatistik',
        title: 'Företagsstatistik',
        shortTitle: 'Statistik',
        category: 'ovrigt',
        url: '/dashboard/foretagsstatistik',
        icon: Captions,
        description: 'Översikt och nyckeltal för företaget. Grafer och trender.',
        aiCapabilities: [
            'Visa nyckeltal',
            'Analysera trender',
            'Jämföra perioder',
        ],
        dataEntities: ['Nyckeltal', 'Statistik', 'Trender'],
        relatedTools: ['get_company_stats'],
        keywords: ['statistik', 'nyckeltal', 'graf', 'trend', 'översikt'],
    },
]

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get all pages grouped by category
 */
export function getPagesByCategory(): Record<PageCategory, PageContext[]> {
    const grouped: Record<PageCategory, PageContext[]> = {
        bokforing: [],
        rapporter: [],
        loner: [],
        agare: [],
        ovrigt: [],
    }

    PAGE_CONTEXTS.forEach(page => {
        grouped[page.category].push(page)
    })

    return grouped
}

/**
 * Get a single page context by ID
 */
export function getPageContext(id: string): PageContext | undefined {
    return PAGE_CONTEXTS.find(p => p.id === id)
}

/**
 * Search pages by query
 */
export function searchPages(query: string): PageContext[] {
    const q = query.toLowerCase()
    return PAGE_CONTEXTS.filter(page => 
        page.title.toLowerCase().includes(q) ||
        page.shortTitle.toLowerCase().includes(q) ||
        page.keywords.some(k => k.includes(q)) ||
        page.description.toLowerCase().includes(q)
    )
}

// =============================================================================
// Simplified Page Context for AI (tool-focused)
// Now that tools query real data, we keep context minimal and action-oriented
// =============================================================================

const RICH_PAGE_CONTEXTS: Record<string, string> = {
    transaktioner: `Användaren tittar på Transaktioner-sidan som visar banktransaktioner.
Använd 'get_transactions' för att hämta deras transaktioner med filter (datum, status, belopp).
Använd 'categorize_transaction' för att bokföra en enskild transaktion.
Använd 'bulk_categorize_transactions' för att kategorisera flera liknande transaktioner.
Använd 'match_payment_to_invoice' för att matcha inbetalningar mot fakturor.`,

    fakturor: `Användaren tittar på Fakturor-sidan som visar kund- och leverantörsfakturor.
Använd 'get_invoices' för att hämta fakturor med filter (status, kund, typ).
Använd 'create_invoice' för att skapa en ny kundfaktura.
Använd 'send_invoice_reminder' för att skicka påminnelse på förfallna fakturor.
Använd 'void_invoice' för att makulera en faktura.
Använd 'book_invoice_payment' för att bokföra en inbetalning.`,

    kvitton: `Användaren tittar på Kvitton-sidan som visar uppladdade kvitton.
Använd 'get_receipts' för att hämta kvitton med filter (status, leverantör, datum).
Använd 'match_receipt_to_transaction' för att koppla ett kvitto till en transaktion.
AI kan läsa bifogade kvittobilder och extrahera data via OCR.`,

    inventarier: `Användaren tittar på Inventarier-sidan som visar anläggningstillgångar.
Använd 'get_assets' för att lista alla inventarier med värden och avskrivningar.
Använd 'create_asset' för att registrera en ny inventarie.
Använd 'calculate_depreciation' för att beräkna avskrivning för en period.
Använd 'book_depreciation' för att bokföra periodens avskrivningar.
Använd 'dispose_asset' för att avyttra eller skrota en inventarie.`,

    verifikationer: `Användaren tittar på Verifikationer-sidan som visar bokföringsverifikationer.
Använd 'get_verifications' för att hämta verifikationer med filter (datum, nummer, belopp).
Använd 'create_manual_verification' för att skapa en manuell verifikation.
Använd 'periodize_expense' för att periodisera en kostnad.
Använd 'reverse_verification' för att vända en felaktig verifikation.`,

    kontoplan: `Användaren tittar på Kontoplan-sidan som visar BAS-kontoplanen.
Använd 'get_accounts' för att hämta kontoplanen med saldon.
Använd 'get_account_balance' för att visa saldo på ett specifikt konto.
Kan förklara vad olika BAS-konton (1000-8999) används till och rekommendera rätt konto för transaktioner.`,

    moms: `Användaren tittar på Moms-sidan som visar momsrapportering.
Använd 'get_vat_report' för att hämta momsunderlag för en period.
Använd 'submit_vat_declaration' för att förbereda momsdeklaration.
Momssatser: 25% (standard), 12% (livsmedel/hotell), 6% (kultur/böcker), 0% (export).`,

    ink2: `Användaren tittar på INK2-sidan för inkomstdeklaration (aktiebolag).
Kan förklara SRU-koder och skattemässiga justeringar.
Bolagsskatt är 20.6%. Deklaration lämnas 1 juli året efter räkenskapsårets slut.`,

    arsredovisning: `Användaren tittar på Årsredovisning-sidan.
Använd 'generate_annual_report' för att skapa årsredovisning.
Kan hjälpa med förvaltningsberättelse, noter och nyckeltal.
K2 för mindre företag, K3 för större. Inlämning till Bolagsverket inom 6 månader.`,

    foretagsstatistik: `Användaren tittar på Företagsstatistik-sidan med nyckeltal och grafer.
Använd 'get_company_statistics' för att hämta KPI:er (omsättning, resultat, kassaflöde, marginaler).
Kan analysera trender, jämföra perioder och förklara nyckeltal.`,

    loner: `Användaren tittar på Löner-sidan för lönehantering.
Använd 'get_employees' för att lista anställda.
Använd 'get_payslips' för att hämta lönebesked.
Använd 'run_payroll' för att köra löner.
Använd 'submit_agi' för arbetsgivardeklaration.
Arbetsgivaravgifter: 31.42%.`,

    lonebesked: `Användaren tittar på Lönebesked-sidan.
Använd 'get_payslips' för att hämta lönebesked.
Använd 'run_payroll' för att skapa nya lönebesked.
Kan beräkna brutto till netto och visa arbetsgivaravgifter.`,

    formaner: `Användaren tittar på Förmåner-sidan.
Använd 'get_benefits' för att lista tillgängliga förmåner.
Använd 'create_benefit' för att skapa en ny förmån.
Använd 'calculate_benefit_value' för att beräkna förmånsvärde och skatteeffekt.`,

    team: `Användaren tittar på Team-sidan med personalöversikt.
Använd 'get_employees' för att lista anställda med löneuppgifter.
Använd 'register_employee' för att registrera en ny anställd.`,

    egenavgifter: `Användaren tittar på Egenavgifter-sidan (enskild firma).
Kan beräkna egenavgifter (~28.97%) och schablonavdrag.`,

    delagaruttag: `Användaren tittar på Delägaruttag-sidan.
Använd 'register_owner_withdrawal' för att registrera ett ägaruttag.
Använd 'calculate_owner_fees' för att beräkna avgifter och skatteeffekt.
Kan jämföra lön vs utdelning för optimal skatteplanering.`,

    "3-12": `Användaren tittar på 3:12-sidan för fåmansbolagsregler.
Använd 'calculate_qualified_dividend_allowance' för att beräkna gränsbelopp.
Använd 'optimize_salary_dividend_split' för att optimera lön vs utdelning.
Förenklingsregeln: 2.75 IBB. Huvudregeln: kapitalunderlag + lönebaserat utrymme.
Utdelning inom gränsbelopp beskattas 20%, över som tjänst (~55%).`,

    aktiebok: `Användaren tittar på Aktiebok-sidan.
Använd 'get_shareholders' för att visa aktieboken med ägare och andelar.
Använd 'add_shareholder' för att lägga till ny aktieägare.
Använd 'transfer_shares' för att registrera aktieöverlåtelse.`,

    delagare: `Användaren tittar på Delägare-sidan.
Använd 'get_shareholders' för att visa delägare och ägarandelar.`,

    utdelning: `Användaren tittar på Utdelning-sidan.
Använd 'register_dividend' för att registrera utdelningsbeslut.
Kan beräkna utdelning per aktie och visa utdelningshistorik.`,

    styrelseprotokoll: `Användaren tittar på Styrelseprotokoll-sidan.
Använd 'get_compliance_docs' för att lista protokoll.
Använd 'get_board_members' för att visa styrelsesammansättning.
Kan hjälpa till att skriva protokoll och föreslå dagordning.`,

    bolagsstamma: `Användaren tittar på Bolagsstämma-sidan.
Använd 'prepare_annual_meeting' för att förbereda årsstämma.
Kan skapa kallelse, dagordning och stämmoprotokoll.
Årsstämma ska hållas inom 6 månader efter räkenskapsårets slut.`,

    firmatecknare: `Användaren tittar på Firmatecknare-sidan.
Använd 'get_board_members' för att visa firmatecknare och behörigheter.`,

    myndigheter: `Användaren tittar på Myndigheter-sidan.
Använd 'get_compliance_deadlines' för att visa kommande deadlines.
Visar kontaktuppgifter och ärenden hos Bolagsverket och Skatteverket.`,

    agande: `Användaren tittar på Ägande-sidan.
Använd 'get_shareholders' för att visa ägarstruktur.
Använd 'transfer_shares' för att registrera överlåtelser.`,

    styrelse: `Användaren tittar på Styrelse-sidan.
Använd 'get_board_members' för att visa styrelseledamöter och suppleanter.`,

    handelser: `Användaren tittar på Händelser-sidan med kalender och aktivitetslogg.
Använd 'get_events' för att hämta händelser och deadlines.
Använd 'create_event' för att skapa en ny händelse eller påminnelse.
Använd 'get_upcoming_deadlines' för att visa kommande frister.
Använd 'get_activity_summary' för att sammanfatta aktivitet.
Använd 'export_to_calendar' för att exportera till iCal/Google Calendar.`,

    installningar: `Användaren tittar på Inställningar-sidan.
Använd 'get_subscription_status' för att visa prenumeration och plan.
Använd 'get_notification_preferences' och 'update_notification_preferences' för notifieringar.
Använd 'list_active_integrations' för att visa kopplade banker och system.
Använd 'connect_bank_account' för att koppla ett nytt bankkonto.
Använd 'sync_bank_transactions' för att synka transaktioner från banken.`,

    resultatrakning: `Användaren tittar på Resultaträkning-sidan.
Använd 'get_financial_summary' för att hämta intäkter, kostnader och resultat.
Kan jämföra med föregående period och analysera avvikelser.`,

    balansrakning: `Användaren tittar på Balansräkning-sidan.
Använd 'get_financial_summary' för att hämta tillgångar, skulder och eget kapital.
Kan analysera soliditet, likviditet och kapitalbindning.`,

    momsdeklaration: `Användaren tittar på Momsdeklaration-sidan.
Använd 'get_vat_report' för att hämta momssammanställning.
Använd 'submit_vat_declaration' för att förbereda inlämning.
Deadline: 12:e i andra månaden efter periodens slut.`,

    inkomstdeklaration: `Användaren tittar på Inkomstdeklaration-sidan (INK2).
Kan förklara skattemässiga justeringar och SRU-koder.
Bolagsskatt 20.6%, deadline 1 juli.`,

    agi: `Användaren tittar på AGI-sidan för arbetsgivardeklaration.
Använd 'submit_agi' för att generera och skicka AGI.
Visar löneunderlag, arbetsgivaravgifter och skatteavdrag.`,

    arsbokslut: `Användaren tittar på Årsbokslut-sidan.
Kan hjälpa med bokslutstransaktioner och periodavslut.`,

    k10: `Användaren tittar på K10-sidan för kvalificerade andelar.
Använd 'calculate_qualified_dividend_allowance' för att beräkna gränsbelopp.
Använd 'optimize_salary_dividend_split' för skatteoptimering.`,

    arsmote: `Användaren tittar på Årsmöte-sidan (för föreningar).
Kan hjälpa med årsmötesprotokoll och dagordning.`,

    egetuttag: `Användaren tittar på Eget uttag-sidan (enskild firma).
Använd 'register_owner_withdrawal' för att registrera uttag.
Uttag påverkar inte resultatet, beskattning sker på årsvinst.`,

    default: `Användaren är på en sida i Scope - svensk bokföringsplattform.
Kan hjälpa med bokföring, moms, fakturor, löner, årsredovisning och skatteoptimering.
Alla beräkningar följer svensk lagstiftning och BAS-kontoplan.`
}

/**
 * Format page context for AI system prompt - COMPREHENSIVE VERSION
 */
export function formatPageContextForAI(page: PageContext): string {
    // Get rich context if available, otherwise use default
    const richContext = RICH_PAGE_CONTEXTS[page.id] || RICH_PAGE_CONTEXTS['default']
    
    return richContext.trim()
}
