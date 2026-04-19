import { defineTool } from '../registry'

type Domain = 'bokforing' | 'loner' | 'skatt' | 'parter' | 'common' | 'planning'

export const requestToolsTool = defineTool<{ domains: Domain[] }, { acknowledged: boolean; domains: Domain[] }>({
    name: 'request_tools',
    description: 'Ladda verktygsscheman för ett eller flera domänområden. Anropa detta INNAN du försöker använda domänspecifika verktyg. Se Tool Manual för vilka domäner som finns.',
    category: 'read',
    domain: 'common',
    coreTool: true,
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    keywords: ['ladda verktyg', 'hämta verktyg', 'arsenal'],
    parameters: {
        type: 'object',
        properties: {
            domains: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: ['bokforing', 'loner', 'skatt', 'parter', 'common', 'planning'],
                },
                description: 'Domäner att ladda. Du kan begära flera samtidigt.',
            },
        },
        required: ['domains'],
    },
    execute: async (params) => ({
        success: true,
        data: { acknowledged: true, domains: params.domains },
        message: `Verktyg laddade för: ${params.domains.join(', ')}. Fortsätt nu med det du ville göra.`,
    }),
})

export const requestToolsTools = [requestToolsTool]
