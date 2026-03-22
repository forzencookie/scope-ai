/**
 * Centralized Localization Constants
 * 
 * This file contains all user-facing Swedish strings used throughout the application.
 * Using constants ensures consistency and makes future i18n implementation easier.
 * 
 * Convention: Use SCREAMING_SNAKE_CASE for keys, Swedish strings for values.
 */

// =============================================================================
// Common Actions
// =============================================================================

export const ACTIONS = {
    ADD: "Lägg till",
    APPROVE: "Godkänn",
    APPROVE_ALL: "Godkänn alla",
    CANCEL: "Avbryt",
    CLEAR: "Rensa",
    CLOSE: "Stäng",
    CONFIRM: "Bekräfta",
    DELETE: "Ta bort",
    EDIT: "Redigera",
    NEW: "Ny",
    REJECT: "Avvisa",
    SAVE: "Spara",
    SEARCH: "Sök",
    SEND: "Skicka",
    FILTER: "Filtrera",
    SORT: "Sortera",
    SORT_BY: "Sortera efter",
    CLEAR_FILTER: "Rensa filter",
} as const

// =============================================================================
// Transaction Statuses (Bokföring)
// =============================================================================

export const TRANSACTION_STATUS_LABELS = {
    UNBOOKED: "Obokförd",
    RECORDED: "Bokförd",
    IGNORED: "Ignorerad",
} as const

// =============================================================================
// Invoice Statuses (Fakturor)
// =============================================================================

export const INVOICE_STATUS_LABELS = {
    DRAFT: "Utkast",
    SENT: "Skickad",
    PAID: "Betald",
    CANCELLED: "Makulerad",
} as const

// =============================================================================
// Receipt Statuses (Kvitton/Underlag)
// =============================================================================

export const RECEIPT_STATUS_LABELS = {
    NEW: "Ny",
    RECORDED: "Bokförd",
    REJECTED: "Avvisad",
} as const

// =============================================================================
// General/Shared Statuses
// =============================================================================

export const GENERAL_STATUS_LABELS = {
    SUBMITTED: "Inskickad",
    UPCOMING: "Kommande",
    COMPLETED: "Klar",
    INCOMPLETE: "Ofullständig",
    PLANNED: "Planerad",
    PAID_OUT: "Utbetald",
    APPROVED: "Godkänd",
    DECIDED: "Beslutad",
    // Verifikationer statuses
    TRANSACTION_LINKED: "Transaktion kopplad",
    TRANSACTION_MISSING: "Transaktion saknas",
    DOCUMENT_EXISTS: "Underlag finns",
    DOCUMENT_MISSING: "Underlag saknas",
    UNBALANCED: "Obalanserad",
    // Account type labels
    ASSET: "Tillgång",
    LIABILITY: "Skuld",
    EQUITY: "Eget kapital",
    REVENUE: "Intäkt",
    EXPENSE: "Kostnad",
    // Partner types (HB/KB)
    KOMPLEMENTAR: "Komplementär",
    KOMMANDITDELAGARE: "Kommanditdelägare",
    // Withdrawal types
    UTTAG: "Uttag",
    INSATTNING: "Insättning",
    LON: "Lön",
} as const

// Type for GeneralStatus values
export type GeneralStatus = (typeof GENERAL_STATUS_LABELS)[keyof typeof GENERAL_STATUS_LABELS]

// =============================================================================
// Supplier Invoice Statuses (Leverantörsfakturor)
// =============================================================================

export const SUPPLIER_INVOICE_STATUS_LABELS = {
    RECEIVED: "Mottagen",
    APPROVED: "Godkänd",
    PAID: "Betald",
} as const

// =============================================================================
// Ownership/Stock Transaction Types (Aktiebok)
// =============================================================================

export const STOCK_TRANSACTION_TYPE_LABELS = {
    NEW_ISSUE: "Nyemission",
    PURCHASE: "Köp",
    SALE: "Försäljning",
    GIFT: "Gåva",
    INHERITANCE: "Arv",
    SPLIT: "Split",
} as const

// =============================================================================
// Membership Statuses (Medlemsregister)
// =============================================================================

export const MEMBERSHIP_STATUS_LABELS = {
    ACTIVE: "Aktiv",
    DORMANT: "Vilande",
    TERMINATED: "Avslutad",
} as const

// =============================================================================
// Membership Change Types (Medlemsregister)
// =============================================================================

export const MEMBERSHIP_CHANGE_TYPE_LABELS = {
    JOINED: "Gått med",
    LEFT: "Lämnat",
    STATUS_CHANGE: "Statusändring",
    ROLE_CHANGE: "Rollbyte",
} as const

// =============================================================================
// Meeting Status (Styrelseprotokoll/Bolagsstämma)
// =============================================================================

export const MEETING_STATUS_LABELS = {
    PLANNED: "Planerad",
    CALLED: "Kallad",
    COMPLETED: "Genomförd",
    SIGNED: "Signerat",
} as const

// =============================================================================
// Benefit Statuses (Förmåner)
// =============================================================================

export const BENEFIT_STATUS_LABELS = {
    TAX_FREE: "Skattefri",
    TAXABLE: "Skattepliktig",
    DEDUCTION: "Löneväxling",
} as const

// =============================================================================
// Payslip Statuses (Lönespecifikationer)
// =============================================================================

export const PAYSLIP_STATUS_LABELS = {
    DRAFT: "Utkast",
    APPROVED: "Godkänd",
    SENT: "Skickad",
} as const

// =============================================================================
// AGI Report Statuses (Arbetsgivardeklaration)
// =============================================================================

export const AGI_STATUS_LABELS = {
    DRAFT: "Utkast",
    READY: "Klar",
    SUBMITTED: "Inskickad",
} as const

// =============================================================================
// Employee Statuses (Anställda)
// =============================================================================

export const EMPLOYEE_STATUS_LABELS = {
    ACTIVE: "Aktiv",
    INACTIVE: "Inaktiv",
} as const

// =============================================================================
// Pending Booking Statuses (Väntande bokföringar)
// =============================================================================

export const PENDING_BOOKING_STATUS_LABELS = {
    PENDING: "Väntande",
    BOOKED: "Bokförd",
    DISMISSED: "Avfärdad",
} as const

// =============================================================================
// Table Headers & Labels
// =============================================================================

export const TABLE_LABELS = {
    NAME: "Namn",
    DATE: "Datum",
    AMOUNT: "Belopp",
    STATUS: "Status",
    ACCOUNT: "Konto",
    DESCRIPTION: "Beskrivning",
    CATEGORY: "Kategori",
    AI_CATEGORIZATION: "AI-kategorisering",
    AI_SUGGESTION: "AI-förslag",
    ACTIONS: "Åtgärder",
} as const

// =============================================================================
// Transaction Strings
// =============================================================================

export const TRANSACTIONS = {
    TITLE: "Alla transaktioner",
    NEW_TRANSACTION: "Ny transaktion",
    ADD_TRANSACTION: "Lägg till transaktion",
    SEARCH_PLACEHOLDER: "Sök transaktioner...",
    NO_TRANSACTIONS: "Inga transaktioner ännu",
    NO_MATCHES: "Inga transaktioner matchar din sökning",
    TRY_OTHER_TERMS: "Försök med andra söktermer eller filter",
    FILTER_BY_STATUS: "Filtrera på status",
    TRANSACTION_COUNT: (count: number) => `${count} transaktioner`,
    TRANSACTION_DETAILS: "Transaktionsdetaljer",
    RECORD: "Bokför",
} as const

// =============================================================================
// AI Suggestions
// =============================================================================

export const AI_SUGGESTIONS = {
    APPROVED: "Godkänd",
    NOT_APPROVED: "Inte godkänd",
    APPROVE_SUGGESTION: "Godkänn förslag",
    REJECT_SUGGESTION: "Avvisa förslag",
    CATEGORIZATION_SUGGESTIONS: (count: number) => `AI har ${count} kategoriseringsförslag`,
    REVIEW_FOR_FASTER_BOOKING: "Granska och godkänn för snabbare bokföring",
    APPROVE_ALL_ABOVE: (threshold: number) => `Godkänn alla (${threshold}%+)`,
    RECORD_AS_TAX_EXPENSE: "Bokför som skattekostnad",
    RECORD_AS_VEHICLE_EXPENSE: "Bokför som fordonskostnad",
} as const

// =============================================================================
// Form Labels
// =============================================================================

export const FORM_LABELS = {
    DESCRIPTION: "Beskrivning",
    AMOUNT: "Belopp",
    DATE: "Datum",
    ACCOUNT: "Konto",
    CATEGORY: "Kategori",
    ENTER_DESCRIPTION: "Ange beskrivning...",
    SELECT_ACCOUNT: "Välj konto...",
    SELECT_CATEGORY: "Välj kategori...",
} as const

// =============================================================================
// Navigation
// =============================================================================

export const NAV = {
    DASHBOARD: "Översikt",
    TRANSACTIONS: "Transaktioner",
    INVOICES: "Fakturor",
    RECEIPTS: "Kvitton",
    BOOKKEEPING: "Bokföring",
    REPORTS: "Rapporter",
    SETTINGS: "Inställningar",

    PAYROLL: "Lön",
    INTEGRATIONS: "Integrationer",
    TEAM: "Team",
    VOUCHERS: "Verifikationer",
} as const

// =============================================================================
// Time & Date
// =============================================================================

export const TIME = {
    TODAY: "Idag",
    YESTERDAY: "Igår",
    THIS_WEEK: "Denna vecka",
    THIS_MONTH: "Denna månad",
    THIS_YEAR: "Detta år",
    LAST_30_DAYS: "Senaste 30 dagarna",
    CUSTOM_RANGE: "Anpassat intervall",
} as const

// =============================================================================
// Months (Swedish)
// =============================================================================

export const MONTHS = {
    JANUARY: "Januari",
    FEBRUARY: "Februari",
    MARCH: "Mars",
    APRIL: "April",
    MAY: "Maj",
    JUNE: "Juni",
    JULY: "Juli",
    AUGUST: "Augusti",
    SEPTEMBER: "September",
    OCTOBER: "Oktober",
    NOVEMBER: "November",
    DECEMBER: "December",
} as const

export const MONTHS_SHORT = {
    JAN: "Jan",
    FEB: "Feb",
    MAR: "Mar",
    APR: "Apr",
    MAY: "Maj",
    JUN: "Jun",
    JUL: "Jul",
    AUG: "Aug",
    SEP: "Sep",
    OCT: "Okt",
    NOV: "Nov",
    DEC: "Dec",
} as const

// =============================================================================
// Error Messages
// =============================================================================

export const ERRORS = {
    GENERIC: "Något gick fel",
    TRY_AGAIN: "Försök igen",
    NOT_FOUND: "Sidan kunde inte hittas",
    UNAUTHORIZED: "Du har inte behörighet att se denna sida",
    NETWORK_ERROR: "Nätverksfel. Kontrollera din internetanslutning.",
    VALIDATION_REQUIRED: "Detta fält är obligatoriskt",
    VALIDATION_EMAIL: "Ange en giltig e-postadress",
    VALIDATION_NUMBER: "Ange ett giltigt nummer",
} as const

// =============================================================================
// Success Messages
// =============================================================================

export const SUCCESS = {
    SAVED: "Sparat",
    DELETED: "Borttagen",
    SENT: "Skickat",
    RECORDED: "Bokförd",
    APPROVED: "Godkänd",
    UPDATED: "Uppdaterad",
} as const

// =============================================================================
// Confirmation Dialogs
// =============================================================================

export const CONFIRMATIONS = {
    DELETE_TITLE: "Är du säker?",
    DELETE_MESSAGE: "Denna åtgärd kan inte ångras.",
    UNSAVED_CHANGES: "Du har osparade ändringar. Vill du verkligen lämna?",
} as const

// =============================================================================
// Empty States
// =============================================================================

export const EMPTY_STATES = {
    NO_DATA: "Ingen data att visa",
    NO_RESULTS: "Inga resultat hittades",
    GET_STARTED: "Kom igång",
} as const

// =============================================================================
// Currency
// =============================================================================

export const CURRENCY = {
    SEK: "kr",
    FORMAT: (amount: number) => `${amount.toLocaleString("sv-SE")} kr`,
} as const
