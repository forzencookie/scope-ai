/**
 * Skatt AI Tools - K10 (Fåmansföretag)
 *
 * Tools for K10 gränsbelopp calculations.
 */

import { defineTool } from '../registry'
import { taxService } from '@/services/tax'

// =============================================================================
// K10 Calculation Tools
// =============================================================================

export const calculateGransbeloppTool = defineTool({
    name: 'calculate_gransbelopp',
    description: 'Beräkna gränsbeloppet för K10-deklaration (fåmansföretag). Visar hur mycket utdelning som kan beskattas som kapitalinkomst (20%) istället för tjänsteinkomst. Använder förenklingsregeln eller löneunderlag. Vanliga frågor: "hur mycket utdelning kan jag ta", "vad blir gränsbeloppet".',
    domain: 'skatt',
    keywords: ['gränsbelopp', 'K10', '3:12', 'utdelning'],
    parameters: {
        type: 'object' as const,
        properties: {
            year: { type: 'number', description: 'Inkomstår' },
            acquisitionValue: { type: 'number', description: 'Anskaffningsvärde för aktierna (kr)' },
            annualSalary: { type: 'number', description: 'Årslön utbetald under året (kr)' },
            ownershipPercent: { type: 'number', description: 'Ägarandel i procent (0-100)' },
        },
        required: ['year'],
    },
    requiresConfirmation: false,
    category: 'read',
    execute: async (params: { year: number; acquisitionValue?: number; annualSalary?: number; ownershipPercent?: number }) => {
        const rates = await taxService.getAllTaxRates(params.year)
        if (!rates) {
            return { success: false, error: `Skattesatser för ${params.year} saknas i databasen — kan inte beräkna gränsbelopp.` }
        }

        const IBB = rates.ibb
        if (!params.acquisitionValue) {
            return { success: false, error: 'Anskaffningsvärde (aktiekapital vid förvärv) måste anges för K10-beräkning.' }
        }
        if (!params.ownershipPercent) {
            return { success: false, error: 'Ägarandel (%) måste anges för K10-beräkning. Kontrollera aktieboken.' }
        }
        const acquisitionValue = params.acquisitionValue
        const annualSalary = params.annualSalary || 0
        const ownershipPercent = params.ownershipPercent

        // Förenklingsregeln: 2.75 * IBB
        const forenklingsbeloppMax = 2.75 * IBB

        // Lönebaserat utrymme: 50% av löneunderlaget (if salary >= 6*IBB)
        const minSalaryForLoneutrymme = 6 * IBB
        const hasLoneutrymme = annualSalary >= minSalaryForLoneutrymme
        const loneutrymme = hasLoneutrymme ? annualSalary * 0.5 * (ownershipPercent / 100) : 0

        // Räntebaserat: rate * anskaffningsvärde
        const rantebaserat = acquisitionValue * rates.rantebaseratRate * (ownershipPercent / 100)

        // Total gränsbelopp is max of förenkling or (löne + ränte)
        const huvudregel = loneutrymme + rantebaserat
        const gransbelopp = Math.max(forenklingsbeloppMax * (ownershipPercent / 100), huvudregel)

        return {
            success: true,
            data: {
                year: params.year,
                gransbelopp: Math.round(gransbelopp),
                forenklingsbelopp: Math.round(forenklingsbeloppMax * (ownershipPercent / 100)),
                loneutrymme: Math.round(loneutrymme),
                rantebaserat: Math.round(rantebaserat),
                usedForenkling: gransbelopp === forenklingsbeloppMax * (ownershipPercent / 100),
            },
            message: `Gränsbelopp ${params.year}: ${Math.round(gransbelopp).toLocaleString('sv-SE')} kr`,
        }
    },
})

export const k10Tools = [
    calculateGransbeloppTool,
]
