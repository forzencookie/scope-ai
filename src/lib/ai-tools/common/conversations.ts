/**
 * Conversation History AI Tools
 *
 * Layer 2 of Scooby's memory architecture — deep archive search.
 * Scooby can search past conversations by date range and keyword,
 * then read specific conversations for full context.
 *
 * Layer 1 (user_memory) = rolling summary, always fresh, ~20 entries
 * Layer 2 (conversations) = full archive, searchable on demand
 */

import { defineTool } from '../registry'
import { createServerClient } from '@/lib/database/server'

// =============================================================================
// Search Conversations Tool
// =============================================================================

export interface SearchConversationsParams {
    startDate?: string
    endDate?: string
    keyword?: string
    limit?: number
}

export interface ConversationSummary {
    id: string
    title: string
    date: string
    messageCount: number
    preview: string
}

export const searchConversationsTool = defineTool<SearchConversationsParams, ConversationSummary[]>({
    name: 'search_conversations',
    description: 'Sök i konversationshistoriken. Filtrera på datum och/eller nyckelord. Returnerar en lista med konversationer och förhandsvisning. Använd read_conversation för att läsa en specifik konversation.',
    category: 'read',
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    domain: 'common',
    keywords: ['konversation', 'historik', 'förra', 'tidigare', 'diskuterade', 'pratade'],
    parameters: {
        type: 'object',
        properties: {
            startDate: {
                type: 'string',
                description: 'Startdatum (YYYY-MM-DD). T.ex. "2026-02-01" för att söka från februari.',
            },
            endDate: {
                type: 'string',
                description: 'Slutdatum (YYYY-MM-DD). T.ex. "2026-02-28" för att söka till och med februari.',
            },
            keyword: {
                type: 'string',
                description: 'Sökord i konversationstitlar (t.ex. "moms", "utdelning", "faktura")',
            },
            limit: {
                type: 'number',
                description: 'Max antal resultat (standard: 10)',
            },
        },
    },
    execute: async (params, context) => {
        if (!context.userId) {
            return {
                success: false,
                error: 'Inte inloggad.',
            }
        }

        const supabase = await createServerClient()
        const limit = Math.min(params.limit ?? 10, 20)

        let query = supabase
            .from('conversations')
            .select('id, title, created_at, updated_at')
            .eq('user_id', context.userId)
            .order('updated_at', { ascending: false })
            .limit(limit)

        if (params.startDate) {
            query = query.gte('created_at', `${params.startDate}T00:00:00`)
        }
        if (params.endDate) {
            query = query.lte('created_at', `${params.endDate}T23:59:59`)
        }
        if (params.keyword) {
            query = query.ilike('title', `%${params.keyword}%`)
        }

        const { data: conversations, error } = await query

        if (error) {
            console.error('[SearchConversations] Error:', error)
            return {
                success: false,
                error: 'Kunde inte söka i konversationshistoriken.',
            }
        }

        if (!conversations || conversations.length === 0) {
            return {
                success: true,
                data: [],
                message: 'Hittade inga konversationer för den perioden.',
            }
        }

        // Get message counts and previews for each conversation
        const summaries: ConversationSummary[] = []

        for (const conv of conversations) {
            const { data: messages, count } = await supabase
                .from('messages')
                .select('content, role', { count: 'exact' })
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: true })
                .limit(3)

            const firstUserMsg = messages?.find(m => m.role === 'user')
            const preview = firstUserMsg?.content?.slice(0, 100) || conv.title || ''

            summaries.push({
                id: conv.id,
                title: conv.title || 'Utan titel',
                date: (conv.created_at || '').split('T')[0],
                messageCount: count ?? 0,
                preview,
            })
        }

        return {
            success: true,
            data: summaries,
            message: `Hittade ${summaries.length} konversationer.`,
        }
    },
})

// =============================================================================
// Read Conversation Tool
// =============================================================================

export interface ReadConversationParams {
    conversationId: string
}

export interface ConversationDetail {
    title: string
    date: string
    messages: Array<{
        role: string
        content: string
    }>
}

export const readConversationTool = defineTool<ReadConversationParams, ConversationDetail>({
    name: 'read_conversation',
    description: 'Läs en specifik konversation för att se vad som diskuterades. Använd conversation-ID från search_conversations. Sammanfatta innehållet för användaren — dumpa INTE råtext.',
    category: 'read',
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    domain: 'common',
    keywords: ['läs', 'konversation', 'detalj', 'transcript'],
    parameters: {
        type: 'object',
        properties: {
            conversationId: {
                type: 'string',
                description: 'ID för konversationen att läsa',
            },
        },
        required: ['conversationId'],
    },
    execute: async (params, context) => {
        if (!context.userId) {
            return {
                success: false,
                error: 'Inte inloggad.',
            }
        }

        const supabase = await createServerClient()

        // Verify ownership
        const { data: conv } = await supabase
            .from('conversations')
            .select('id, title, created_at')
            .eq('id', params.conversationId)
            .eq('user_id', context.userId)
            .single()

        if (!conv) {
            return {
                success: false,
                error: 'Konversationen hittades inte.',
            }
        }

        // Get messages (cap at 50 to stay within token budget)
        const { data: messages } = await supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', params.conversationId)
            .order('created_at', { ascending: true })
            .limit(50)

        if (!messages || messages.length === 0) {
            return {
                success: true,
                data: {
                    title: conv.title || 'Utan titel',
                    date: (conv.created_at || '').split('T')[0],
                    messages: [],
                },
                message: 'Konversationen är tom.',
            }
        }

        // Condense messages — truncate long ones to save context window
        const condensed = messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
                role: m.role === 'user' ? 'Användare' : 'Scooby',
                content: (m.content || '').slice(0, 300),
            }))

        return {
            success: true,
            data: {
                title: conv.title || 'Utan titel',
                date: (conv.created_at || '').split('T')[0],
                messages: condensed,
            },
            message: `Konversation "${conv.title}" med ${condensed.length} meddelanden.`,
        }
    },
})

// =============================================================================
// Export
// =============================================================================

export const conversationTools = [
    searchConversationsTool,
    readConversationTool,
]
