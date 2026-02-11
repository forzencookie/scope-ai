/**
 * SRU File Types for Skatteverket Declarations
 * Based on official Skatteverket specification (ersätter SKV 269)
 * 
 * Encoding: ISO-8859-1 (Latin-1)
 * Line endings: CR+LF
 */

// =============================================================================
// Sender Information (INFO.SRU)
// =============================================================================

export interface SRUSenderInfo {
    /** Organization number of the sender (redovisningsbyrå) */
    orgnr: string
    /** Company name */
    name: string
    /** Street address */
    address?: string
    /** Postal code */
    postalCode?: string
    /** City */
    city?: string
    /** Department */
    department?: string
    /** Contact person name */
    contact?: string
    /** Email */
    email?: string
    /** Phone number */
    phone?: string
    /** Fax number */
    fax?: string
}

// =============================================================================
// Declaration (BLANKETTER.SRU)
// =============================================================================

/** Blankett type identifiers */
export type BlankettType =
    | 'INK1'  // Inkomstdeklaration 1 (privatpersoner)
    | 'INK2'  // Inkomstdeklaration 2 (aktiebolag)
    | 'INK2R' // INK2 Räkenskapsschema
    | 'INK2S' // INK2 Skattemässiga justeringar
    | 'INK3'  // Inkomstdeklaration 3 (handelsbolag)
    | 'INK4'  // Inkomstdeklaration 4 (ideella föreningar)
    | 'K2'    // Försäljning av fastighet
    | 'K4'    // Försäljning av värdepapper
    | 'K10'   // Kvalificerade andelar

/** Tax period identifiers (e.g., 2025P4 = beskattningsperiod 4, 2025) */
export type TaxPeriod = `${number}P${1 | 2 | 3 | 4}`

/** A single field value in a declaration */
export interface SRUField {
    /** Field code (e.g., 7011, 7012, 7104) */
    code: string | number
    /** Field value */
    value: string | number
}

/** A complete declaration block */
export interface SRUDeclaration {
    /** Blankett type with period (e.g., "INK2-2025P4") */
    blankettType: BlankettType
    /** Tax period */
    period: TaxPeriod
    /** Organization number of the declaring entity */
    orgnr: string
    /** Name of the declaring entity */
    name: string
    /** Optional system info (internal tracking) */
    systemInfo?: string
    /** Declaration fields */
    fields: SRUField[]
}

// =============================================================================
// INK2 Specific Field Mappings
// =============================================================================

/** INK2 Main form field codes */
export const INK2_FIELDS = {
    // Räkenskapsår
    FISCAL_YEAR_START: 7011,
    FISCAL_YEAR_END: 7012,

    // Resultat
    PROFIT: 7104,           // Överskott av näringsverksamhet
    LOSS: 7114,             // Underskott av näringsverksamhet

    // Underlag för skatter
    RISK_TAX_BASE: 7131,    // Kreditinstituts underlag för riskskatt
    PENSION_TAX_BASE: 7132, // Underlag för särskild löneskatt på pensionskostnader
    PENSION_TAX_NEG: 7133,  // Negativt underlag för särskild löneskatt

    // Försäkringsskatter
    INSURANCE_15_A: 7153,
    INSURANCE_15_B: 7154,
    INSURANCE_30_A: 7155,
    INSURANCE_30_B: 7156,

    // Fastighetsavgift
    PROPERTY_HOUSE: 80,
    PROPERTY_APARTMENT: 93,
    PROPERTY_LAND_HOUSE: 84,
    PROPERTY_LAND_APT: 86,
    PROPERTY_COMMERCIAL: 95,
    PROPERTY_INDUSTRIAL: 96,
    PROPERTY_HYDRO: 97,
    PROPERTY_WIND: 98,

    // Övrigt
    OTHER_INFO: 90,         // Övriga upplysningar på bilaga
    RENEWABLE_ENERGY_KWH: 1582, // Förnybar el (kWh)
} as const

/** INK2R (Räkenskapsschema) field codes */
export const INK2R_FIELDS = {
    // Anläggningstillgångar
    INTANGIBLE_ASSETS: 7201,
    INTANGIBLE_PREPAID: 7202,
    BUILDINGS_LAND: 7214,
    MACHINERY_EQUIPMENT: 7215,
    IMPROVEMENTS_OTHER: 7216,
    CONSTRUCTION_PROGRESS: 7217,

    // Finansiella anläggningstillgångar
    SHARES_GROUP: 7230,
    SHARES_ASSOCIATED: 7231,
    RECEIVABLES_GROUP: 7232,
    OTHER_SHARES: 7233,
    LOANS_SHAREHOLDERS: 7234,
    OTHER_LT_RECEIVABLES: 7235,

    // Varulager
    INVENTORY_RAW: 7241,
    INVENTORY_WIP: 7242,
    INVENTORY_FINISHED: 7243,
    INVENTORY_OTHER: 7244,
    INVENTORY_CONTRACTS: 7245,
    INVENTORY_PREPAID: 7246,

    // Kortfristiga fordringar
    ACCOUNTS_RECEIVABLE: 7251,
    RECEIVABLES_GROUP_ST: 7252,
    RECEIVABLES_OTHER: 7261,
    ACCRUED_REVENUE: 7262,
    PREPAID_EXPENSES: 7263,

    // Kortfristiga placeringar
    ST_SHARES_GROUP: 7270,
    ST_OTHER_INVESTMENTS: 7271,

    // Kassa och bank
    CASH_BANK: 7281,

    // Eget kapital
    EQUITY_RESTRICTED: 7301,
    EQUITY_UNRESTRICTED: 7302,

    // Obeskattade reserver
    UNTAXED_PERIODIZATION: 7321,
    UNTAXED_DEPRECIATION: 7322,
    UNTAXED_OTHER: 7323,

    // Avsättningar
    PROVISIONS_PENSION_LAW: 7331,
    PROVISIONS_PENSION_OTHER: 7332,
    PROVISIONS_OTHER: 7333,

    // Långfristiga skulder
    BONDS: 7350,
    OVERDRAFT_LT: 7351,
    BANK_LOANS_LT: 7352,
    LOANS_GROUP_LT: 7353,
    OTHER_LOANS_LT: 7354,

    // Kortfristiga skulder
    OVERDRAFT_ST: 7360,
    BANK_LOANS_ST: 7361,
    PREPAID_CUSTOMERS: 7362,
} as const

// =============================================================================
// K10 (Kvalificerade andelar) Field Codes
// =============================================================================

/** K10 blankett field codes for 3:12-reglerna */
export const K10_FIELDS = {
    // Andelsuppgifter
    OMKOSTNADSBELOPP: 3200,        // Omkostnadsbelopp (acquisition cost)
    AGARANDEL: 3210,               // Ägarandel (ownership %)

    // Gränsbelopp
    SCHABLONBELOPP: 3310,          // Förenklingsregeln (2.75 × IBB × ägarandel)
    LONEBASERAT_UTRYMME: 3320,     // Lönebaserat utrymme (50% × löner × ägarandel)
    SPARAT_UTRYMME: 3400,          // Sparat utdelningsutrymme (from prior years)
    TOTALT_GRANSBELOPP: 3420,      // Total gränsbelopp

    // Utdelning
    UTDELNING: 3430,               // Mottagen utdelning
    KAPITALINKOMST: 3440,          // Del som beskattas som kapital (within gränsbelopp)
    TJANSTEINKOMST: 3450,          // Del som beskattas som tjänst (above gränsbelopp)
    KVARSTAENDE_UTRYMME: 3460,     // Kvarstående utdelningsutrymme

    // Löneunderlag
    EGEN_LON: 3510,                // Egen lön
    KLARAR_LONEKRAV: 3520,         // Lönevillkoret uppfyllt (1 = ja, 0 = nej)
} as const

// =============================================================================
// Complete SRU Data Package
// =============================================================================

export interface SRUPackage {
    /** Sender information */
    sender: SRUSenderInfo
    /** List of declarations to include */
    declarations: SRUDeclaration[]
    /** Generation timestamp */
    generatedAt?: Date
    /** Program name and version */
    programName?: string
}
