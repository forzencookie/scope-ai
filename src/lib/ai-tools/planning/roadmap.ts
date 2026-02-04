/**
 * Planning AI Tools - Roadmap Management
 *
 * Tools for creating, viewing, and managing business roadmaps.
 */

import { defineTool } from '../registry'
import { createRoadmap, getRoadmaps, updateStep } from '@/services/roadmap-service'
import type { Roadmap, RoadmapStep } from '@/types/roadmap'

// =============================================================================
// Get Roadmaps Tool
// =============================================================================

export const getRoadmapsTool = defineTool<{ status?: string }, Roadmap[]>({
    name: 'get_roadmaps',
    description: 'Visa alla affärsplaner och deras framsteg.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            status: { type: 'string', enum: ['active', 'completed', 'paused'], description: 'Filtrera på status' },
        },
    },
    execute: async (params) => {
        try {
            const roadmaps = await getRoadmaps()

            // Filter by status if provided
            let filtered = roadmaps
            if (params.status) {
                filtered = roadmaps.filter(r => r.status === params.status)
            }

            // Calculate progress for each
            const withProgress = filtered.map(r => {
                const totalSteps = r.steps?.length || 0
                const completedSteps = r.steps?.filter(s => s.status === 'completed').length || 0
                const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
                return { ...r, progress, completedSteps, totalSteps }
            })

            return {
                success: true,
                data: filtered,
                message: `Du har ${filtered.length} ${params.status ? (params.status === 'active' ? 'aktiva' : params.status === 'completed' ? 'slutförda' : 'pausade') : ''} planer.`,
            }
        } catch (error) {
            console.error('Failed to fetch roadmaps:', error)
            return {
                success: false,
                error: 'Kunde inte hämta planer.',
            }
        }
    },
})

// =============================================================================
// Create Roadmap Tool
// =============================================================================

export interface CreateRoadmapParams {
    title: string
    description?: string
    steps: Array<{
        title: string
        description: string
        metadata?: Record<string, unknown>
    }>
}

export const createRoadmapTool = defineTool<CreateRoadmapParams, Roadmap>({
    name: 'create_roadmap',
    description: 'Skapa en ny affärsplan med steg. Använd för att bryta ner stora mål i hanterbara delar.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Titel på planen (t.ex. "Starta AB", "Anställ första medarbetaren")' },
            description: { type: 'string', description: 'Beskrivning av målet' },
            steps: {
                type: 'array',
                items: { type: 'object' },
                description: 'Lista med steg (title, description, metadata)',
            },
        },
        required: ['title', 'steps'],
    },
    execute: async (params) => {
        try {
            const roadmap = await createRoadmap({
                title: params.title,
                description: params.description || `Plan för: ${params.title}`,
                steps: params.steps,
            })

            return {
                success: true,
                data: roadmap,
                message: `Plan "${params.title}" skapad med ${params.steps.length} steg.`,
                confirmationRequired: {
                    title: 'Skapa affärsplan',
                    description: `En ny plan med ${params.steps.length} steg kommer att skapas.`,
                    summary: [
                        { label: 'Titel', value: params.title },
                        { label: 'Antal steg', value: String(params.steps.length) },
                        { label: 'Första steget', value: params.steps[0]?.title || '-' },
                    ],
                    action: { toolName: 'create_roadmap', params },
                },
                navigation: {
                    route: '/dashboard/handelser?view=roadmap',
                    label: 'Visa planer',
                },
            }
        } catch (error) {
            console.error('Failed to create roadmap:', error)
            return {
                success: false,
                error: 'Kunde inte skapa plan.',
            }
        }
    },
})

// =============================================================================
// Update Roadmap Step Tool
// =============================================================================

export interface UpdateRoadmapStepParams {
    roadmapId: string
    stepId: string
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
    notes?: string
}

export const updateRoadmapStepTool = defineTool<UpdateRoadmapStepParams, RoadmapStep>({
    name: 'update_roadmap_step',
    description: 'Uppdatera status för ett steg i en affärsplan.',
    category: 'write',
    requiresConfirmation: false, // Low-risk status toggle
    parameters: {
        type: 'object',
        properties: {
            roadmapId: { type: 'string', description: 'ID för planen' },
            stepId: { type: 'string', description: 'ID för steget' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'skipped'], description: 'Ny status' },
            notes: { type: 'string', description: 'Anteckningar (valfritt)' },
        },
        required: ['roadmapId', 'stepId', 'status'],
    },
    execute: async (params) => {
        try {
            await updateStep(params.stepId, {
                status: params.status,
            })

            const statusLabels: Record<string, string> = {
                pending: 'väntar',
                in_progress: 'pågående',
                completed: 'slutfört',
                skipped: 'hoppat över',
            }

            return {
                success: true,
                data: { id: params.stepId, status: params.status } as RoadmapStep,
                message: `Steg markerat som ${statusLabels[params.status]}.`,
            }
        } catch (error) {
            console.error('Failed to update step:', error)
            return {
                success: false,
                error: 'Kunde inte uppdatera steget.',
            }
        }
    },
})

// =============================================================================
// Generate Roadmap Suggestions Tool
// =============================================================================

export interface RoadmapSuggestion {
    title: string
    description: string
    suggestedSteps: Array<{
        title: string
        description: string
        estimatedDays?: number
    }>
    estimatedTotalDays: number
}

export const generateRoadmapSuggestionsTool = defineTool<{ goal: string; context?: string }, RoadmapSuggestion>({
    name: 'generate_roadmap_suggestions',
    description: 'Generera AI-förslag på steg för att uppnå ett affärsmål. Returnerar en plan som kan användas med create_roadmap.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            goal: { type: 'string', description: 'Målet att uppnå (t.ex. "Anställa första medarbetaren", "Exportera till Norge")' },
            context: { type: 'string', description: 'Kontext om företaget (bransch, storlek, etc.)' },
        },
        required: ['goal'],
    },
    execute: async (params) => {
        // This would normally call an AI service to generate suggestions
        // For now, return template suggestions based on common goals

        const goalLower = params.goal.toLowerCase()
        let suggestion: RoadmapSuggestion

        if (goalLower.includes('anställ') || goalLower.includes('medarbetare') || goalLower.includes('personal')) {
            suggestion = {
                title: 'Anställa första medarbetaren',
                description: 'Steg-för-steg guide för att anställa din första medarbetare',
                suggestedSteps: [
                    { title: 'Definiera rollen', description: 'Skapa arbetsbeskrivning och kravprofil', estimatedDays: 3 },
                    { title: 'Registrera som arbetsgivare', description: 'Registrera dig hos Skatteverket som arbetsgivare', estimatedDays: 2 },
                    { title: 'Publicera annons', description: 'Lägg ut jobbannonsen på relevanta plattformar', estimatedDays: 1 },
                    { title: 'Genomför intervjuer', description: 'Intervjua kandidater och ta referenser', estimatedDays: 14 },
                    { title: 'Skriv anställningsavtal', description: 'Upprätta anställningsavtal enligt gällande lagar', estimatedDays: 2 },
                    { title: 'Teckna försäkringar', description: 'Arbetsskadeförsäkring och ev. tjänstepension', estimatedDays: 3 },
                    { title: 'Förbered onboarding', description: 'Arbetsplats, verktyg och introduktionsplan', estimatedDays: 5 },
                ],
                estimatedTotalDays: 30,
            }
        } else if (goalLower.includes('starta') || goalLower.includes('ab') || goalLower.includes('bolag')) {
            suggestion = {
                title: 'Starta aktiebolag',
                description: 'Guide för att starta och registrera ett aktiebolag',
                suggestedSteps: [
                    { title: 'Välj bolagsnamn', description: 'Kontrollera att namnet är ledigt hos Bolagsverket', estimatedDays: 1 },
                    { title: 'Upprätta stiftelseurkund', description: 'Skapa stiftelseurkund med aktiekapital (minst 25 000 kr)', estimatedDays: 1 },
                    { title: 'Öppna bankkonto', description: 'Öppna konto och sätt in aktiekapitalet', estimatedDays: 3 },
                    { title: 'Registrera hos Bolagsverket', description: 'Skicka in registreringsansökan', estimatedDays: 7 },
                    { title: 'Registrera för F-skatt och moms', description: 'Ansök hos Skatteverket', estimatedDays: 5 },
                    { title: 'Sätt upp bokföring', description: 'Välj bokföringssystem och kontoplan', estimatedDays: 2 },
                ],
                estimatedTotalDays: 19,
            }
        } else {
            // Generic template
            suggestion = {
                title: params.goal,
                description: `Plan för att uppnå: ${params.goal}`,
                suggestedSteps: [
                    { title: 'Analysera nuläge', description: 'Kartlägg var du står idag', estimatedDays: 3 },
                    { title: 'Definiera mål', description: 'Sätt konkreta och mätbara mål', estimatedDays: 2 },
                    { title: 'Identifiera resurser', description: 'Vad behövs för att nå målet?', estimatedDays: 2 },
                    { title: 'Skapa handlingsplan', description: 'Bryt ner i konkreta åtgärder', estimatedDays: 3 },
                    { title: 'Genomför', description: 'Utför planerade aktiviteter', estimatedDays: 30 },
                    { title: 'Utvärdera', description: 'Följ upp och justera vid behov', estimatedDays: 5 },
                ],
                estimatedTotalDays: 45,
            }
        }

        return {
            success: true,
            data: suggestion,
            message: `Förslag för "${params.goal}": ${suggestion.suggestedSteps.length} steg, uppskattad tid ${suggestion.estimatedTotalDays} dagar.`,
        }
    },
})

// =============================================================================
// Export
// =============================================================================

export const roadmapTools = [
    getRoadmapsTool,
    createRoadmapTool,
    updateRoadmapStepTool,
    generateRoadmapSuggestionsTool,
]
