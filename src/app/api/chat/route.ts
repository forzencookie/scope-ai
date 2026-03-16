/**
 * Chat API - Vercel AI SDK Integration
 *
 * Unified chat endpoint using Vercel AI SDK and OpenAI.
 */

import { NextRequest } from 'next/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter'
import { validateChatMessages, validateJsonBody } from '@/lib/validation'
import { getAuthContext, verifyAuth, ApiResponse } from '@/lib/database/auth'
import {
    checkUsageLimits,
    consumeTokens,
    authorizeModel
} from '@/lib/model-auth'
import { DEFAULT_MODEL_ID } from '@/lib/ai/models'
import { initializeAITools } from '@/lib/ai-tools'
import { createAgentContext } from '@/lib/agents/types'
import { selectModel, getModelId } from '@/lib/agents/scope-brain/model-selector'
import { buildSystemPrompt } from '@/lib/agents/scope-brain/system-prompt'
import { createDeferredToolConfig } from '@/lib/ai-tools/vercel-adapter'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

const RATE_LIMIT_CONFIG = {
    maxRequests: 30,
    windowMs: 60 * 1000,
}

let toolsInitialized = false
function ensureToolsInitialized() {
    if (!toolsInitialized) {
        initializeAITools()
        toolsInitialized = true
        console.log('[Chat] AI Tools initialized')
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request)
        if (!auth) {
            return ApiResponse.unauthorized('Authentication required')
        }
        const userId = auth.userId

        const ctx = await getAuthContext()
        if (!ctx) {
            return ApiResponse.unauthorized('User session not found')
        }
        const { supabase, companyId } = ctx

        const clientId = getClientIdentifier(request)
        const rateLimitResult = await checkRateLimit(clientId, RATE_LIMIT_CONFIG)

        if (!rateLimitResult.success) {
            return new Response(
                JSON.stringify({ error: 'Too many requests.', retryAfter: rateLimitResult.retryAfter }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(rateLimitResult.retryAfter)
                    }
                }
            )
        }

        let body: unknown
        try {
            body = await request.json()
        } catch {
            return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
        }

        const bodyValidation = validateJsonBody(body)
        if (!bodyValidation.valid) {
            return new Response(JSON.stringify({ error: bodyValidation.error }), { status: 400 })
        }

        const {
            messages,
            conversationId: reqConversationId,
            attachments,
            mentions,
            model: requestedModel,
            incognito,
        } = body as {
            messages: Array<{ role: string; content: string }>
            conversationId?: string
            attachments?: Array<{ name: string; type: string; data: string }>
            mentions?: Array<{ type: string; label: string; aiContext?: string }>
            model?: string
            incognito?: boolean
        }

        // Vercel AI passes standard CoreMessages
        // For compatibility with previous validation we map them or skip strict validation if needed
        // Here we just extract the last user message for DB saving and context building.
        const latestUserMessage = messages.filter(m => m.role === 'user').pop()
        const latestContent = latestUserMessage?.content || ''

        const authResult = await authorizeModel(userId, requestedModel || DEFAULT_MODEL_ID)

        const budgetCheck = await checkUsageLimits(userId)
        if (!budgetCheck.withinLimits) {
            return new Response(JSON.stringify({
                error: 'Du har förbrukat din AI-budget för denna månad. Köp fler credits under Inställningar > Fakturering.',
                code: 'BUDGET_EXHAUSTED',
                usage: {
                    tokensRemaining: budgetCheck.tokensRemaining,
                    tierTokensRemaining: budgetCheck.tierTokensRemaining,
                    purchasedCreditsRemaining: budgetCheck.purchasedCreditsRemaining,
                }
            }), {
                status: 402,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        let conversationId = reqConversationId
        if (!incognito) {
            if (!conversationId) {
                const title = latestContent.slice(0, 50) + (latestContent.length > 50 ? '...' : '') || 'Ny konversation'
                const { data: conv } = await supabase
                    .from('conversations')
                    .insert({ title, user_id: userId })
                    .select()
                    .single()
                if (conv && 'id' in conv) conversationId = conv.id
            }

            if (conversationId && latestContent) {
                await supabase
                    .from('messages')
                    .insert({
                        conversation_id: conversationId,
                        role: 'user',
                        content: latestContent,
                        user_id: userId
                    })
                    .select()
                    .single()
            }
        }

        ensureToolsInitialized()

        let activitySnapshot: Record<string, unknown> | undefined
        try {
            const { count: pendingTx } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')

            const today = new Date().toISOString().split('T')[0]
            const { data: overdueInv } = await supabase
                .from('customer_invoices')
                .select('total_amount')
                .eq('status', 'sent')
                .lt('due_date', today)

            const overdueCount = overdueInv?.length ?? 0
            const overdueTotal = overdueInv?.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0) ?? 0

            activitySnapshot = {
                pendingTransactions: pendingTx ?? 0,
                overdueInvoices: overdueCount,
                overdueInvoiceTotal: overdueTotal,
            }
        } catch (e) {
            console.error('[Chat] Activity snapshot failed:', e)
        }

        const companyType = 'AB' as const
        const context = createAgentContext({
            userId,
            companyId: companyId || '',
            companyType,
            locale: 'sv',
            conversationId: conversationId || undefined,
            messages: messages.map(m => ({
                id: crypto.randomUUID(),
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: new Date(),
            })),
        })

        if (activitySnapshot) {
            context.sharedMemory.activitySnapshot = activitySnapshot
        }

        try {
            const { userMemoryService } = await import('@/services/user-memory-service')
            if (companyId) {
                const memories = await userMemoryService.getMemoriesForCompany(companyId)
                if (memories && memories.length > 0) {
                    const injected = memories.slice(0, 20).map(m => ({
                        content: m.content,
                        category: m.category,
                    }))
                    context.sharedMemory.userMemories = injected
                }
            }
        } catch (e) {
            console.error('[Chat] Memory injection failed:', e)
        }

        if (attachments && attachments.length > 0) {
            context.sharedMemory.attachments = attachments.map(a => ({
                name: a.name,
                type: a.type,
                hasImage: a.type.startsWith('image/'),
            }))
        }

        if (mentions && mentions.length > 0) {
            context.sharedMemory.mentions = mentions
        }

        const systemPrompt = buildSystemPrompt(context)
        const deferredConfig = createDeferredToolConfig({
            userId: context.userId,
            companyId: context.companyId,
        })

        // Model Selection
        const modelConfig = selectModel(latestContent)
        const activeModelId = getModelId(modelConfig)

        const result = streamText({
            model: openai(activeModelId),
            system: systemPrompt,
            messages: messages as Array<{ role: 'user' | 'assistant'; content: string }>,
            ...deferredConfig,
            onFinish: async ({ text, usage, toolCalls, toolResults }) => {
                if (usage && usage.totalTokens && usage.totalTokens > 0) {
                    await consumeTokens(userId, usage.totalTokens, authResult.modelId)
                }

                if (conversationId && !incognito) {
                    // Save assistant message even if text is empty (tool-only responses)
                    const hasContent = text && text.trim().length > 0
                    const hasTools = toolCalls && toolCalls.length > 0
                    if (hasContent || hasTools) {
                        try {
                            await supabase
                                .from('messages')
                                .insert({
                                    conversation_id: conversationId,
                                    role: 'assistant',
                                    content: text || '',
                                    user_id: userId,
                                    tool_calls: toolCalls && toolCalls.length > 0 ? JSON.stringify(toolCalls) : null,
                                    tool_results: toolResults && toolResults.length > 0 ? JSON.stringify(toolResults) : null,
                                })
                                .select()
                                .single()
                        } catch (e) {
                            console.error('[Chat] Failed to save message:', e)
                        }
                    }
                }
            }
        })

        return result.toUIMessageStreamResponse({
            headers: {
                'X-Conversation-Id': conversationId || '',
            }
        })

    } catch (error) {
        console.error('[Chat] Fatal error:', error)
        return new Response(
            JSON.stringify({ error: 'An unexpected error occurred.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request)
        if (!auth) {
            return ApiResponse.unauthorized()
        }

        ensureToolsInitialized()

        return Response.json({
            agent: 'vercel-ai-sdk',
            description: 'Vercel AI SDK architecture powered by GPT-4o',
            features: [
                'Vercel AI SDK streamText',
                'All 60+ tools mapped',
                'Generative UI Ready',
            ],
            models: {
                default: 'gpt-4o',
            },
        })
    } catch (error) {
        console.error('[Chat] GET error:', error)
        return Response.json({ error: 'Failed to get API info' }, { status: 500 })
    }
}
