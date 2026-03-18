/**
 * Parter AI Tools - Partners (HB/KB Delägare)
 *
 * Tools for managing partners in HB/KB companies.
 */

import { defineTool } from '../registry'
import { shareholderService } from '@/services/shareholder-service'

// =============================================================================
// Partner Tools
// =============================================================================

interface PartnerStats {
    partnerCount?: number
    [key: string]: unknown
}

export const getPartnersTool = defineTool<Record<string, never>, PartnerStats>({
    name: 'get_partners',
    description: 'Hämta alla delägare i handelsbolag eller kommanditbolag.',
    category: 'read',
    requiresConfirmation: false,
  allowedCompanyTypes: ["hb","kb"],
  domain: 'parter',
    keywords: ['delägare', 'partners', 'ägare'],
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        try {
            const data = await shareholderService.getPartnerStats()
            const stats = data as unknown as PartnerStats
            return {
                success: true,
                data: stats,
                message: `Hittade ${stats.partnerCount || 0} delägare.`,
            }
        } catch (error) {
            console.error('Failed to fetch partners:', error)
        }

        return { success: false, error: 'Kunde inte hämta delägare.' }
    },
})

interface MemberStats {
    totalMembers?: number
    activeMembers?: number
    [key: string]: unknown
}

export const getMembersTool = defineTool<Record<string, never>, MemberStats>({
    name: 'get_members',
    description: 'Hämta alla medlemmar i ekonomisk förening.',
    category: 'read',
    requiresConfirmation: false,
  allowedCompanyTypes: ["hb","kb"],
  domain: 'parter',
    keywords: ['medlemmar', 'förening', 'register'],
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        try {
            const data = await shareholderService.getMemberStats()
            const stats = data as unknown as MemberStats
            return {
                success: true,
                data: stats,
                message: `Föreningen har ${stats.totalMembers || 0} medlemmar, varav ${stats.activeMembers || 0} aktiva.`,
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
