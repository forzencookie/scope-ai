// ============================================
// Quick Actions — Command Palette Config
// Defines all available quick actions for the ⚡ menu
// ============================================

import type { CompanyType, FeatureKey } from "@/lib/company-types"
import type { LucideIcon } from "lucide-react"
import {
    FileText,
    Receipt,
    Calculator,
    TrendingUp,
    BarChart3,
    Percent,
    Users,
    Coins,
    Building2,
    BookOpen,
    CreditCard,
    ArrowRightLeft,
    ClipboardCheck,
    Calendar,
    PiggyBank,
    Scale,
    FileSpreadsheet,
    Landmark,
    UserPlus,
    FileDown,
} from "lucide-react"

// ============================================
// Types
// ============================================

export type QuickActionCategory =
    | "vanliga"
    | "rapporter"
    | "bokforing"
    | "loner"
    | "bolag"

export interface QuickAction {
    /** Unique identifier */
    id: string
    /** Display icon */
    icon: LucideIcon
    /** Swedish display label */
    label: string
    /** Short description */
    description: string
    /** Category for grouping in the dropdown */
    category: QuickActionCategory
    /** Pre-filled prompt text sent to chat */
    prompt: string
    /** If true, auto-send the prompt immediately */
    autoSend: boolean
    /** Search keywords (Swedish + English) for fuzzy matching */
    keywords: string[]
    /** Feature required (null = always available) */
    feature?: FeatureKey
    /** Company types this action is relevant for (empty = all) */
    companyTypes?: CompanyType[]
}

// ============================================
// Category Metadata
// ============================================

export const quickActionCategories: Record<QuickActionCategory, { label: string; order: number }> = {
    vanliga: { label: "Vanliga", order: 0 },
    bokforing: { label: "Bokföring", order: 1 },
    rapporter: { label: "Rapporter", order: 2 },
    loner: { label: "Löner", order: 3 },
    bolag: { label: "Bolag", order: 4 },
}

// ============================================
// Quick Actions
// ============================================

export const quickActions: QuickAction[] = [
    // --- Vanliga (Common) ---
    {
        id: "bokfor-kvitto",
        icon: Receipt,
        label: "Bokför kvitto",
        description: "Ladda upp och bokför ett kvitto",
        category: "vanliga",
        prompt: "Jag vill bokföra ett kvitto",
        autoSend: false,
        keywords: ["kvitto", "receipt", "bokför", "book", "upload", "ladda upp"],
    },
    {
        id: "skapa-faktura",
        icon: FileText,
        label: "Skapa faktura",
        description: "Skapa en ny kundfaktura",
        category: "vanliga",
        prompt: "Skapa en ny faktura till ",
        autoSend: false,
        keywords: ["faktura", "invoice", "skapa", "create", "ny", "new", "kundfaktura"],
        feature: "kundfakturor",
    },
    {
        id: "visa-saldon",
        icon: BarChart3,
        label: "Visa kontosaldon",
        description: "Se aktuella saldon i huvudboken",
        category: "vanliga",
        prompt: "Visa mina kontosaldon",
        autoSend: true,
        keywords: ["saldo", "balance", "konto", "account", "huvudbok", "ledger"],
        feature: "verifikationer",
    },
    {
        id: "obokade-transaktioner",
        icon: ArrowRightLeft,
        label: "Bokför transaktioner",
        description: "Hantera obokade banktransaktioner",
        category: "vanliga",
        prompt: "Visa mina obokade transaktioner och hjälp mig bokföra dem",
        autoSend: true,
        keywords: ["obokade", "unbooked", "transaktioner", "transactions", "bokföra", "bank"],
    },

    // --- Bokföring ---
    {
        id: "manadsavslut",
        icon: Calendar,
        label: "Månadsavslut",
        description: "Stäng en räkenskapsperiod",
        category: "bokforing",
        prompt: "Hjälp mig med månadsavslut",
        autoSend: true,
        keywords: ["månadsavslut", "month close", "period", "stäng", "close", "avslut"],
    },
    {
        id: "registrera-inventarier",
        icon: Building2,
        label: "Registrera inventarie",
        description: "Lägg till en ny anläggningstillgång",
        category: "bokforing",
        prompt: "Jag vill registrera en ny inventarie: ",
        autoSend: false,
        keywords: ["inventarie", "asset", "tillgång", "avskrivning", "depreciation"],
        feature: "inventarier",
    },
    {
        id: "periodiseringsfond",
        icon: PiggyBank,
        label: "Periodiseringsfond",
        description: "Beräkna och sätt av periodiseringsfond",
        category: "bokforing",
        prompt: "Hjälp mig beräkna periodiseringsfond",
        autoSend: true,
        keywords: ["periodiseringsfond", "avsättning", "fond", "tax deferral"],
    },

    // --- Rapporter ---
    {
        id: "gor-momsen",
        icon: Percent,
        label: "Gör momsen",
        description: "Skapa momsdeklaration",
        category: "rapporter",
        prompt: "Gör momsdeklarationen",
        autoSend: true,
        keywords: ["moms", "vat", "deklaration", "skatteverket", "momsdeklaration"],
        feature: "momsdeklaration",
    },
    {
        id: "gor-inkomstdeklaration",
        icon: FileSpreadsheet,
        label: "Gör inkomstdeklaration",
        description: "Skapa inkomstdeklaration (INK2/NE/INK4)",
        category: "rapporter",
        prompt: "Gör inkomstdeklarationen",
        autoSend: true,
        keywords: ["inkomst", "deklaration", "ink2", "ne", "ink4", "skatt", "tax return"],
        feature: "inkomstdeklaration",
    },
    {
        id: "arsredovisning",
        icon: BookOpen,
        label: "Skapa årsredovisning",
        description: "Generera årsredovisning eller årsbokslut",
        category: "rapporter",
        prompt: "Skapa årsredovisningen",
        autoSend: true,
        keywords: ["årsredovisning", "annual report", "k2", "k3", "årsbokslut"],
        feature: "arsredovisning",
        companyTypes: ["ab", "forening"],
    },
    {
        id: "arsbokslut",
        icon: BookOpen,
        label: "Gör årsbokslut",
        description: "Stäng räkenskapsåret",
        category: "rapporter",
        prompt: "Stäng räkenskapsåret och gör årsbokslutet",
        autoSend: true,
        keywords: ["årsbokslut", "year end", "stäng", "bokslutsbilagor"],
        feature: "arsbokslut",
        companyTypes: ["ef", "hb", "kb"],
    },
    {
        id: "berakna-k10",
        icon: Calculator,
        label: "Beräkna K10",
        description: "Beräkna gränsbeloppet för fåmansföretag",
        category: "rapporter",
        prompt: "Beräkna K10 och mitt gränsbelopp",
        autoSend: true,
        keywords: ["k10", "gränsbelopp", "fåmansföretag", "3:12", "utdelning"],
        feature: "k10",
        companyTypes: ["ab"],
    },
    {
        id: "resultatrakning",
        icon: TrendingUp,
        label: "Visa resultaträkning",
        description: "Se intäkter och kostnader",
        category: "rapporter",
        prompt: "Visa resultaträkningen",
        autoSend: true,
        keywords: ["resultaträkning", "income statement", "intäkter", "kostnader", "revenue"],
        feature: "resultatrakning",
    },
    {
        id: "balansrakning",
        icon: Scale,
        label: "Visa balansräkning",
        description: "Se tillgångar och skulder",
        category: "rapporter",
        prompt: "Visa balansräkningen",
        autoSend: true,
        keywords: ["balansräkning", "balance sheet", "tillgångar", "skulder", "assets"],
        feature: "balansrakning",
    },
    {
        id: "generera-sru",
        icon: FileDown,
        label: "Generera SRU-fil",
        description: "Ladda ner SRU-fil för Skatteverket",
        category: "rapporter",
        prompt: "Generera SRU-fil för ",
        autoSend: false,
        keywords: ["sru", "skatteverket", "fil", "file", "download", "ladda ner"],
    },

    // --- Löner ---
    {
        id: "kor-loner",
        icon: Coins,
        label: "Kör lönekörning",
        description: "Skapa lönebesked och beräkna skatt",
        category: "loner",
        prompt: "Kör lönerna för denna månad",
        autoSend: true,
        keywords: ["lön", "lönekörning", "payroll", "run payroll", "salary", "lönebesked"],
        feature: "lonebesked",
    },
    {
        id: "skapa-agi",
        icon: Landmark,
        label: "Skapa AGI",
        description: "Arbetsgivardeklaration på individnivå",
        category: "loner",
        prompt: "Skapa arbetsgivardeklaration (AGI)",
        autoSend: true,
        keywords: ["agi", "arbetsgivardeklaration", "employer declaration", "skatteverket"],
        feature: "agi",
    },
    {
        id: "lagg-till-anstalld",
        icon: UserPlus,
        label: "Lägg till anställd",
        description: "Registrera en ny medarbetare",
        category: "loner",
        prompt: "Lägg till en ny anställd: ",
        autoSend: false,
        keywords: ["anställd", "employee", "ny", "new", "personal", "staff", "registrera"],
        feature: "lonebesked",
    },

    // --- Bolag ---
    {
        id: "registrera-utdelning",
        icon: CreditCard,
        label: "Registrera utdelning",
        description: "Registrera utdelning till aktieägare",
        category: "bolag",
        prompt: "Registrera utdelning",
        autoSend: true,
        keywords: ["utdelning", "dividend", "aktieägare", "shareholder"],
        feature: "utdelning",
        companyTypes: ["ab"],
    },
    {
        id: "overfor-aktier",
        icon: ArrowRightLeft,
        label: "Överför aktier",
        description: "Registrera en aktieöverlåtelse",
        category: "bolag",
        prompt: "Jag vill registrera en aktieöverlåtelse",
        autoSend: true,
        keywords: ["aktier", "shares", "transfer", "överföring", "överlåtelse"],
        feature: "aktiebok",
        companyTypes: ["ab"],
    },
    {
        id: "bolagsstamma",
        icon: Users,
        label: "Skapa stämmoprotokoll",
        description: "Generera protokoll för bolagsstämma",
        category: "bolag",
        prompt: "Hjälp mig skapa protokoll för bolagsstämma",
        autoSend: true,
        keywords: ["stämma", "meeting", "protokoll", "minutes", "bolagsstämma", "årsstämma"],
        feature: "bolagsstamma",
        companyTypes: ["ab", "forening"],
    },
    {
        id: "berakna-egenavgifter",
        icon: ClipboardCheck,
        label: "Beräkna egenavgifter",
        description: "Beräkna egenavgifter på överskottet",
        category: "bolag",
        prompt: "Beräkna mina egenavgifter",
        autoSend: true,
        keywords: ["egenavgifter", "self-employment tax", "enskild firma", "överskott"],
        feature: "egenavgifter",
        companyTypes: ["ef", "hb", "kb"],
    },
]
