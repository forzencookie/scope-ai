/**
 * Skatt AI Tools - K10 (Fåmansföretag)
 *
 * Tools for K10 gränsbelopp calculations.
 */

import { defineTool } from '../registry'

// =============================================================================
// K10 Calculation Tools
// =============================================================================

export const calculateGransbeloppTool = defineTool({
    name: 'calculate_gransbelopp',
    description: 'Beräkna gränsbeloppet för K10-deklaration baserat på löneunderlag och anskaffningsvärde.',
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
        const IBB = 74300 // Inkomstbasbelopp 2024

        const acquisitionValue = params.acquisitionValue || 25000
        const annualSalary = params.annualSalary || 0
        const ownershipPercent = params.ownershipPercent || 100

        // Förenklingsregeln: 2.75 * IBB
        const forenklingsbeloppMax = 2.75 * IBB

        // Lönebaserat utrymme: 50% av löneunderlaget (if salary >= 6*IBB)
        const minSalaryForLoneutrymme = 6 * IBB
        const hasLoneutrymme = annualSalary >= minSalaryForLoneutrymme
        const loneutrymme = hasLoneutrymme ? annualSalary * 0.5 * (ownershipPercent / 100) : 0

        // Räntebaserat: 9.76% * anskaffningsvärde
        const rantebaserat = acquisitionValue * 0.0976 * (ownershipPercent / 100)

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
            display: {
                component: 'K10Summary' as any,
                props: { gransbelopp: Math.round(gransbelopp), year: params.year },
                title: 'K10 Beräkning',
                fullViewRoute: '/dashboard/skatt?tab=k10',
            },
        }
    },
})

export const k10Tools = [
    calculateGransbeloppTool,
]
