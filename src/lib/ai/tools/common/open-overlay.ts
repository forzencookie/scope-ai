import { defineTool } from '../registry'

export const openSettingsTool = defineTool<Record<string, never>, { opened: boolean }>({
    name: 'open_settings',
    description: 'Öppna inställningspanelen. Använd när användaren vill ändra företagsinformation, fakturering, Scooby-inställningar eller andra konfigurationer.',
    category: 'navigation',
    domain: 'common',
    coreTool: true,
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    keywords: ['inställningar', 'settings', 'konfiguration', 'företagsinformation', 'fakturering'],
    parameters: {
        type: 'object',
        properties: {},
    },
    execute: async () => ({
        success: true,
        data: { opened: true },
        message: 'Öppnar inställningar.',
        navigation: { route: '/dashboard?settings=true', label: 'Inställningar' },
    }),
})

export const openDocumentsTool = defineTool<Record<string, never>, { opened: boolean }>({
    name: 'open_documents',
    description: 'Öppna dokumentbiblioteket. Använd när användaren vill se, ladda ner eller hantera dokument som årsredovisningar, styrelseprotokoll eller lönebesked.',
    category: 'navigation',
    domain: 'common',
    coreTool: true,
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    keywords: ['dokument', 'documents', 'årsredovisning', 'styrelseprotokoll', 'lönebesked', 'filer'],
    parameters: {
        type: 'object',
        properties: {},
    },
    execute: async () => ({
        success: true,
        data: { opened: true },
        message: 'Öppnar dokumentbiblioteket.',
        navigation: { route: '/dashboard/rapporter', label: 'Dokument' },
    }),
})

export const openOverlayTools = [openSettingsTool, openDocumentsTool]
