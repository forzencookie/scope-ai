// INK2 Field Definitions
// ============================================

export interface FieldDefinition {
    code: number
    description: string
    type: 'number' | 'string' | 'date'
    section: string
}

export const INK2_MAIN_FIELDS: FieldDefinition[] = [
    { code: 7011, description: 'Räkenskapsårets början', type: 'date', section: 'main' },
    { code: 7012, description: 'Räkenskapsårets slut', type: 'date', section: 'main' },
    { code: 7104, description: 'Överskott', type: 'number', section: 'main' },
    { code: 7114, description: 'Underskott', type: 'number', section: 'main' },
]

export const INK2R_BALANCE_SHEET_FIELDS: FieldDefinition[] = [
    // Assets
    { code: 7201, description: 'Immateriella anläggningstillgångar', type: 'number', section: 'balance_assets' },
    { code: 7214, description: 'Byggnader och mark', type: 'number', section: 'balance_assets' },
    { code: 7215, description: 'Maskiner och inventarier', type: 'number', section: 'balance_assets' },
    // ... add more as needed
]

export const INK2R_INCOME_STATEMENT_FIELDS: FieldDefinition[] = [
    // Revenue
    { code: 7410, description: 'Nettoomsättning', type: 'number', section: 'income_revenue' },
    // Expenses
    { code: 7511, description: 'Råvaror och förnödenheter', type: 'number', section: 'income_expenses' },
]

export const INK2S_FIELDS: FieldDefinition[] = [
    { code: 7650, description: 'Bokfört resultat (vinst)', type: 'number', section: 'tax_adjustment' },
    { code: 7750, description: 'Bokfört resultat (förlust)', type: 'number', section: 'tax_adjustment' },
]
