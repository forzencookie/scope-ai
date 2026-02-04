/**
 * Query Memory AI Tool
 * 
 * Allows the AI to query user/company-specific memories when relevant.
 * Part of AI Architecture v2.
 * 
 * The AI should use this tool when:
 * - It suspects the user has discussed a topic before
 * - It wants to personalize the response based on past interactions
 * - It needs to recall past decisions or preferences
 */

import { defineTool } from '../registry'
import { userMemoryService, type MemoryCategory, type UserMemory } from '@/services/user-memory-service'

// =============================================================================
// Query Memories Tool
// =============================================================================

export interface QueryMemoriesParams {
    query?: string
    category?: MemoryCategory
    limit?: number
}

export interface QueryMemoriesResult {
    memories: Array<{
        content: string
        category: string
        confidence: number
        createdAt: string
    }>
    count: number
}

export const queryMemoriesTool = defineTool<QueryMemoriesParams, QueryMemoriesResult>({
    name: 'query_memories',
    description: 'Sök i användarens minnesbank för att hitta relevant tidigare kontext. Använd när du misstänker att användaren har diskuterat ett ämne tidigare, eller för att personalisera svaret baserat på deras preferenser och tidigare beslut.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Sökord för att hitta relevanta minnen (t.ex. "utdelning", "anställning")',
            },
            category: {
                type: 'string',
                enum: ['decision', 'preference', 'pending'],
                description: 'Filtrera på kategori: decision (tidigare beslut), preference (användarpreferenser), pending (saker under övervägande)',
            },
            limit: {
                type: 'number',
                description: 'Max antal minnen att returnera (standard: 5)',
            },
        },
    },
    execute: async (params, context) => {
        if (!context.companyId) {
            return {
                success: false,
                error: 'Inget företag valt. Kan inte söka minnen.',
            }
        }

        const limit = params.limit ?? 5
        let memories: UserMemory[] = []

        try {
            if (params.query) {
                // Search by query
                memories = await userMemoryService.searchMemories(context.companyId, params.query)
            } else if (params.category) {
                // Get by category
                memories = await userMemoryService.getMemoriesByCategory(context.companyId, params.category)
            } else {
                // Get all memories
                memories = await userMemoryService.getMemoriesForCompany(context.companyId)
            }

            // Apply limit
            memories = memories.slice(0, limit)

            const result: QueryMemoriesResult = {
                memories: memories.map(m => ({
                    content: m.content,
                    category: m.category,
                    confidence: m.confidence,
                    createdAt: m.createdAt,
                })),
                count: memories.length,
            }

            return {
                success: true,
                data: result,
                message: memories.length > 0
                    ? `Hittade ${memories.length} relevanta minnen.`
                    : 'Inga relevanta minnen hittades.',
            }
        } catch (error) {
            console.error('[QueryMemories] Error:', error)
            return {
                success: false,
                error: 'Kunde inte söka i minnesbanken.',
            }
        }
    },
})

// =============================================================================
// Add Memory Tool
// =============================================================================

export interface AddMemoryParams {
    content: string
    category: MemoryCategory
    expiresInDays?: number
}

export interface AddMemoryResult {
    id: string
    content: string
    category: string
}

export const addMemoryTool = defineTool<AddMemoryParams, AddMemoryResult>({
    name: 'add_memory',
    description: 'Spara ett nytt minne om användaren. Använd för att komma ihåg viktiga beslut, preferenser, eller pågående överväganden som användaren nämner.',
    category: 'write',
    requiresConfirmation: false, // Low-risk, can be undone
    parameters: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'Minnesinnehållet (t.ex. "Användaren föredrar korta svar")',
            },
            category: {
                type: 'string',
                enum: ['decision', 'preference', 'pending'],
                description: 'Kategori: decision (beslut taget), preference (preferens), pending (under övervägande)',
            },
            expiresInDays: {
                type: 'number',
                description: 'Antal dagar tills minnet förfaller (standard: aldrig för decision/preference, 30 för pending)',
            },
        },
        required: ['content', 'category'],
    },
    execute: async (params, context) => {
        if (!context.companyId) {
            return {
                success: false,
                error: 'Inget företag valt. Kan inte spara minne.',
            }
        }

        // Default expiry for pending items
        const expiresInDays = params.expiresInDays ?? (params.category === 'pending' ? 30 : undefined)

        try {
            const memory = await userMemoryService.addMemory({
                companyId: context.companyId,
                content: params.content,
                category: params.category,
                expiresInDays,
            })

            if (!memory) {
                return {
                    success: false,
                    error: 'Kunde inte spara minnet.',
                }
            }

            return {
                success: true,
                data: {
                    id: memory.id,
                    content: memory.content,
                    category: memory.category,
                },
                message: `Minne sparat: "${params.content}"`,
            }
        } catch (error) {
            console.error('[AddMemory] Error:', error)
            return {
                success: false,
                error: 'Kunde inte spara minnet.',
            }
        }
    },
})

// =============================================================================
// Export
// =============================================================================

export const memoryTools = [
    queryMemoriesTool,
    addMemoryTool,
]
