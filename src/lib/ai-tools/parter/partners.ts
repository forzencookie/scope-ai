/**
 * Parter AI Tools - Partners (HB/KB Delägare)
 *
 * Tools for managing partners in HB/KB companies.
 */

import { defineTool } from '../registry'

// =============================================================================
// Partner Tools
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPartnersTool = defineTool<Record<string, never>, any>({
    name: 'get_partners',
    description: 'Hämta alla delägare i handelsbolag eller kommanditbolag.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        try {
            const { supabase } = await import('@/lib/database/supabase')
            const { data, error } = await supabase.rpc('get_partner_stats')

            if (!error && data) {
                return {
                    success: true,
                    data: data,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    message: `Hittade ${(data as any).partnerCount || 0} delägare.`,
                }
            }
        } catch (error) {
            console.error('Failed to fetch partners:', error)
        }

        return { success: false, error: 'Kunde inte hämta delägare.' }
    },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getMembersTool = defineTool<Record<string, never>, any>({
    name: 'get_members',
    description: 'Hämta alla medlemmar i ekonomisk förening.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        try {
            const { supabase } = await import('@/lib/database/supabase')
            const { data, error } = await supabase.rpc('get_member_stats')

            if (!error && data) {
                return {
                    success: true,
                    data: data,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    message: `Föreningen har ${(data as any).totalMembers || 0} medlemmar, varav ${(data as any).activeMembers || 0} aktiva.`,
                }
            }
        } catch (error) {
            console.error('Failed to fetch members:', error)
        }

        return { success: false, error: 'Kunde inte hämta medlemmar.' }
    },
})

export const partnerTools = [
    getPartnersTool,
    getMembersTool,
]
