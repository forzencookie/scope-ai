/**
 * Parter AI Tools - Partners (HB/KB Delägare)
 *
 * Tools for managing partners in HB/KB companies.
 */

import { defineTool } from '../registry'

// =============================================================================
// Partner Tools
// =============================================================================

export const getPartnersTool = defineTool<Record<string, never>, any[]>({
    name: 'get_partners',
    description: 'Hämta alla delägare i handelsbolag eller kommanditbolag.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        try {
            const { supabase } = await import('@/lib/supabase')
            const { data, error } = await supabase.rpc('get_partner_stats')

            if (!error && data) {
                return {
                    success: true,
                    data: data,
                    message: `Hittade ${data.partnerCount || 0} delägare.`,
                    display: {
                        component: 'PartnerList' as any,
                        props: { stats: data },
                        title: 'Delägare',
                        fullViewRoute: '/dashboard/parter?tab=delagare',
                    },
                }
            }
        } catch (error) {
            console.error('Failed to fetch partners:', error)
        }

        return { success: false, error: 'Kunde inte hämta delägare.' }
    },
})

export const getMembersTool = defineTool<Record<string, never>, any[]>({
    name: 'get_members',
    description: 'Hämta alla medlemmar i ekonomisk förening.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        try {
            const { supabase } = await import('@/lib/supabase')
            const { data, error } = await supabase.rpc('get_member_stats')

            if (!error && data) {
                return {
                    success: true,
                    data: data,
                    message: `Föreningen har ${data.totalMembers || 0} medlemmar, varav ${data.activeMembers || 0} aktiva.`,
                    display: {
                        component: 'MemberList' as any,
                        props: { stats: data },
                        title: 'Medlemsregister',
                        fullViewRoute: '/dashboard/parter?tab=medlemsregister',
                    },
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
