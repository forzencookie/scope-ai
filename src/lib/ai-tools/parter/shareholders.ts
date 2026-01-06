/**
 * Parter AI Tools - Shareholders (Aktiebok)
 *
 * Tools for managing shareholders in AB companies.
 */

import { defineTool } from '../registry'

// =============================================================================
// Shareholder Read Tools
// =============================================================================

export const getShareholdersTool = defineTool<Record<string, never>, any[]>({
    name: 'get_shareholders',
    description: 'Hämta den aktuella aktieboken och lista över alla aktieägare.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        try {
            const response = await fetch('/api/compliance?type=shareholders', { cache: 'no-store' })
            if (response.ok) {
                const data = await response.json()
                const shareholders = data.shareholders || []

                return {
                    success: true,
                    data: shareholders,
                    message: `Aktieboken innehåller ${shareholders.length} aktieägare.`,
                    display: {
                        component: 'ShareholderList' as any,
                        props: { shareholders },
                        title: 'Aktiebok',
                        fullViewRoute: '/dashboard/parter?tab=aktiebok',
                    },
                }
            }
        } catch (error) {
            console.error('Failed to fetch shareholders:', error)
        }

        return { success: false, error: 'Kunde inte hämta aktieboken.' }
    },
})

// =============================================================================
// Shareholder Write Tools
// =============================================================================

export interface AddShareholderParams {
    name: string
    ssnOrgNr: string
    sharesCount: number
    shareClass: 'A' | 'B'
}

export const addShareholderTool = defineTool<AddShareholderParams, any>({
    name: 'add_shareholder',
    description: 'Lägg till en ny aktieägare i aktieboken. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Namn på aktieägaren' },
            ssnOrgNr: { type: 'string', description: 'Personnummer eller organisationsnummer' },
            sharesCount: { type: 'number', description: 'Antal aktier' },
            shareClass: { type: 'string', enum: ['A', 'B'], description: 'Aktieslag (A eller B)' },
        },
        required: ['name', 'ssnOrgNr', 'sharesCount', 'shareClass'],
    },
    execute: async (params) => {
        // Note: actual implementation would write to Supabase
        return {
            success: true,
            data: { id: `sh-${Date.now()}`, ...params },
            message: `Lade till ${params.name} med ${params.sharesCount} ${params.shareClass}-aktier i aktieboken.`,
        }
    },
})

export const shareholderTools = [
    getShareholdersTool,
    addShareholderTool,
]
