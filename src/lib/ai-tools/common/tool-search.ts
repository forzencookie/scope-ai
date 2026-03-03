/**
 * Tool Search - Meta Tool
 *
 * Allows Scooby to discover tools on demand instead of loading all 100+ tools
 * into every conversation. This reduces token overhead by ~80-95%.
 */

import { defineTool } from '../registry'
import { aiToolRegistry } from '../registry'
import type { AIToolDomain } from '../types'

export interface SearchToolsParams {
    query: string
    domain?: AIToolDomain
}

export interface SearchToolsResult {
    name: string
    description: string
    domain?: AIToolDomain
}

export const searchToolsTool = defineTool<SearchToolsParams, SearchToolsResult[]>({
    name: 'search_tools',
    description: 'Sök efter verktyg du kan använda. Beskriv vad du vill göra, t.ex. "skapa faktura", "kör lönerna", "beräkna skatt", "visa kvitton". Returnerar en lista med matchande verktyg som du sedan kan anropa.',
    category: 'read',
    requiresConfirmation: false,
    coreTool: true,
    domain: 'common',
    keywords: ['verktyg', 'sök', 'hitta', 'funktion', 'tool', 'search'],
    parameters: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Sökfråga — beskriv vad du vill göra (t.ex. "faktura", "lön", "moms", "bokföring")',
            },
            domain: {
                type: 'string',
                enum: ['bokforing', 'loner', 'skatt', 'parter', 'common', 'planning'],
                description: 'Filtrera på domän (valfritt)',
            },
        },
        required: ['query'],
    },
    execute: async (params) => {
        let results = aiToolRegistry.search(params.query, 10)

        // Filter by domain if specified
        if (params.domain) {
            results = results.filter(r => r.domain === params.domain)
        }

        if (results.length === 0) {
            return {
                success: true,
                data: [],
                message: `Hittade inga verktyg för "${params.query}". Försök med andra sökord.`,
            }
        }

        return {
            success: true,
            data: results,
            message: `Hittade ${results.length} verktyg. Anropa det verktyg du behöver.`,
        }
    },
})

export const toolSearchTools = [searchToolsTool]
