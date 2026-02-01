// ============================================================================
// BAS Account options for manual selection
// ============================================================================

export const BAS_ACCOUNTS = [
    { value: "1210", label: "1210 - Maskiner och inventarier" },
    { value: "1930", label: "1930 - Företagskonto / checkkonto" },
    { value: "2440", label: "2440 - Leverantörsskulder" },
    { value: "2611", label: "2611 - Utgående moms 25%" },
    { value: "2621", label: "2621 - Utgående moms 12%" },
    { value: "2631", label: "2631 - Utgående moms 6%" },
    { value: "2641", label: "2641 - Ingående moms" },
    { value: "2650", label: "2650 - Momsredovisningskonto" },
    { value: "3010", label: "3010 - Försäljning varor" },
    { value: "3040", label: "3040 - Försäljning tjänster" },
    { value: "4010", label: "4010 - Inköp varor" },
    { value: "5010", label: "5010 - Lokalhyra" },
    { value: "5020", label: "5020 - El för lokaler" },
    { value: "5410", label: "5410 - Förbrukningsinventarier" },
    { value: "5420", label: "5420 - Programvara" },
    { value: "5600", label: "5600 - Kostnader för transportmedel" },
    { value: "5800", label: "5800 - Resekostnader" },
    { value: "6071", label: "6071 - Representation, avdragsgill" },
    { value: "6072", label: "6072 - Representation, ej avdragsgill" },
    { value: "6110", label: "6110 - Kontorsmaterial" },
    { value: "6212", label: "6212 - Mobiltelefon" },
    { value: "6250", label: "6250 - Porto" },
    { value: "6310", label: "6310 - Företagsförsäkringar" },
    { value: "6540", label: "6540 - IT-tjänster" },
    { value: "6570", label: "6570 - Bankkostnader" },
    { value: "6990", label: "6990 - Övriga externa kostnader" },
]

export const BOOKING_CATEGORIES = [
    "Intäkter",
    "IT & Programvara",
    "Kontorsmaterial",
    "Programvara",
    "Representation",
    "Resor",
    "Material",
    "Lokalhyra",
    "Telefon",
    "Fordon",
    "Porto",
    "Lokalkostnader",
    "Energi",
    "Försäkringar",
    "Övriga kostnader",
]

// ============================================================================
// Types
// ============================================================================

export type BookingStep = 'details' | 'booking' | 'confirm'

export interface BookableEntity {
    id: string
    name: string
    date: string
    amount: string
    status?: string
    account?: string
    category?: string
    type?: 'transaction' | 'invoice' | 'receipt'
}

export interface BookingData {
    entityId: string
    entityType?: 'transaction' | 'invoice' | 'receipt'
    useAiSuggestion: boolean
    category: string
    debitAccount: string
    creditAccount: string
    description: string
    amount?: number
    attachmentUrl?: string
    attachmentName?: string
}
