/**
 * Chat API - Scope Brain (Single Agent)
 *
 * Unified chat endpoint using the ScopeBrain agent.
 * Features:
 * - Single agent with all 60+ tools
 * - Smart model selection (Haiku/Sonnet/Sonnet+thinking)
 * - Streaming responses
 * - Budget and usage tracking
 */

import { NextRequest } from 'next/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter'
import { validateChatMessages, validateJsonBody } from '@/lib/validation'
import { createUserScopedDb, type UserScopedDb } from '@/lib/database/user-scoped-db'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import {
    checkUsageLimits,
    consumeTokens,
    isDemoMode,
    authorizeModel
} from '@/lib/model-auth'
import { DEFAULT_MODEL_ID } from '@/lib/ai/models'
import { initializeAITools } from '@/lib/ai-tools'
import { createAgentContext, type AgentContext } from '@/lib/agents/types'
import { ScopeBrain, selectModel, getRelativeCost } from '@/lib/agents/scope-brain'

// =============================================================================
// Configuration
// =============================================================================

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

// =============================================================================
// Streaming Helpers
// =============================================================================

const textEncoder = new TextEncoder()

function streamText(controller: ReadableStreamDefaultController, text: string) {
    if (!text) return
    controller.enqueue(textEncoder.encode(`T:${JSON.stringify(text)}\n`))
}

function streamData(controller: ReadableStreamDefaultController, data: unknown) {
    controller.enqueue(textEncoder.encode(`D:${JSON.stringify(data)}\n`))
}

function streamError(controller: ReadableStreamDefaultController, error: string) {
    controller.enqueue(textEncoder.encode(`E:${JSON.stringify({ error })}\n`))
}

function streamThinking(controller: ReadableStreamDefaultController, thinking: string) {
    if (!thinking) return
    controller.enqueue(textEncoder.encode(`TH:${JSON.stringify(thinking)}\n`))
}

function streamToolResult(controller: ReadableStreamDefaultController, toolName: string, result: unknown) {
    controller.enqueue(textEncoder.encode(`D:${JSON.stringify({ tool: toolName, result })}\n`))
}

// =============================================================================
// Stream Handler using ScopeBrain
// =============================================================================

async function streamScopeBrainResponse(
    message: string,
    context: AgentContext,
    controller: ReadableStreamDefaultController,
    userDb: UserScopedDb | null,
    conversationId: string | null,
    userId: string
): Promise<{ fullContent: string; tokensUsed: number }> {
    let fullContent = ''
    let tokensUsed = 0
    const startTime = Date.now()

    try {
        const brain = new ScopeBrain()

        // Log model selection for monitoring
        const modelConfig = selectModel(message)
        console.log(`[Chat] Model: ${modelConfig.model}, thinking: ${modelConfig.thinking}, cost: ${getRelativeCost(modelConfig)}x`)

        // Stream response
        for await (const chunk of brain.handleStream(message, context)) {
            switch (chunk.type) {
                case 'text':
                    if (chunk.content) {
                        fullContent += chunk.content
                        streamText(controller, chunk.content)
                    }
                    break

                case 'thinking':
                    if (chunk.content) {
                        streamThinking(controller, chunk.content)
                    }
                    break

                case 'tool_start':
                    streamData(controller, { toolStarted: chunk.toolName })
                    break

                case 'tool_result':
                    if (chunk.toolResult) {
                        streamToolResult(controller, chunk.toolName || 'unknown', chunk.toolResult)
                    }
                    break

                case 'error':
                    streamError(controller, chunk.error || 'Ett fel uppstod')
                    break

                case 'done':
                    // Response complete
                    break
            }
        }

        // Estimate tokens (rough: 4 chars per token)
        tokensUsed = Math.ceil((message.length + fullContent.length) / 4)

        // Persist assistant response
        if (conversationId && fullContent && userDb) {
            try {
                await userDb.messages.create({
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: fullContent,
                    user_id: userId
                })
            } catch (e) {
                console.error('[Chat] Failed to save message:', e)
            }
        }

        const elapsed = Date.now() - startTime
        console.log(`[Chat] Response completed in ${elapsed}ms, ${fullContent.length} chars`)

    } catch (error) {
        console.error('[Chat] Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Ett oväntat fel uppstod'
        streamError(controller, errorMessage)
        fullContent = `Fel: ${errorMessage}`
    }

    return { fullContent, tokensUsed }
}

// =============================================================================
// Demo Mode Handler
// =============================================================================

async function handleDemoMode(messages: Array<{ role: string; content: string }>) {
    const { getSimulatedChatResponse } = await import('@/lib/ai-simulation')
    const latestUserMessage = messages[messages.length - 1]
    const latestContent = latestUserMessage?.content || ''

    const simulated = getSimulatedChatResponse(latestContent)

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()

            await new Promise(r => setTimeout(r, simulated.delay))

            const words = simulated.content.split(' ')
            for (let i = 0; i < words.length; i++) {
                const word = words[i] + (i < words.length - 1 ? ' ' : '')
                controller.enqueue(encoder.encode(`T:${JSON.stringify(word)}\n`))
                await new Promise(r => setTimeout(r, 20 + Math.random() * 30))
            }

            controller.enqueue(encoder.encode(`D:${JSON.stringify({ demoMode: true })}\n`))
            controller.close()
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'X-Demo-Mode': 'true'
        }
    })
}

// =============================================================================
// POST Handler
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        // === AUTHENTICATION ===
        const auth = await verifyAuth(request)
        if (!auth) {
            return ApiResponse.unauthorized('Authentication required')
        }
        const userId = auth.userId

        // === USER-SCOPED DB ===
        const userDb = await createUserScopedDb()
        if (!userDb) {
            return ApiResponse.unauthorized('User session not found')
        }

        // === RATE LIMITING ===
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

        // === PARSE BODY ===
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
        } = body as {
            messages: Array<{ role: string; content: string }>
            conversationId?: string
            attachments?: Array<{ name: string; type: string; data: string }>
            mentions?: Array<{ type: string; label: string; aiContext?: string }>
            model?: string
        }

        // === VALIDATE MESSAGES ===
        const messageValidation = validateChatMessages(messages)
        if (!messageValidation.valid || !messageValidation.data) {
            return new Response(JSON.stringify({ error: messageValidation.error }), { status: 400 })
        }

        // === MODEL AUTHORIZATION ===
        const authResult = await authorizeModel(userId, requestedModel || DEFAULT_MODEL_ID)

        // === DEMO MODE HANDLING ===
        if (isDemoMode(authResult.userTier)) {
            return await handleDemoMode(messageValidation.data)
        }

        // === BUDGET CHECK ===
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

        // === GET LATEST MESSAGE ===
        const latestUserMessage = messageValidation.data[messageValidation.data.length - 1]
        const latestContent = latestUserMessage?.content || ''

        // === PERSISTENCE: CREATE CONVERSATION ===
        let conversationId = reqConversationId
        if (!conversationId) {
            const title = latestContent.slice(0, 50) + (latestContent.length > 50 ? '...' : '') || 'Ny konversation'
            const conv = await userDb.conversations.create({ title })
            if (conv && 'id' in conv) conversationId = conv.id
        }

        // === PERSIST USER MESSAGE ===
        if (conversationId) {
            await userDb.messages.create({
                conversation_id: conversationId,
                role: 'user',
                content: latestContent,
                user_id: userId
            })
        }

        // === INITIALIZE TOOLS ===
        ensureToolsInitialized()

        // === BUILD CONTEXT ===
        const companyType = 'AB' as const

        const context = createAgentContext({
            userId,
            companyId: userDb.companyId || '',
            companyType,
            locale: 'sv',
            conversationId: conversationId || undefined,
            messages: messageValidation.data.map(m => ({
                id: crypto.randomUUID(),
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: new Date(),
            })),
        })

        // Add attachments to context
        if (attachments && attachments.length > 0) {
            context.sharedMemory.attachments = attachments.map(a => ({
                name: a.name,
                type: a.type,
                hasImage: a.type.startsWith('image/'),
            }))
        }

        // Add mentions to context
        if (mentions && mentions.length > 0) {
            context.sharedMemory.mentions = mentions
        }

        // === CREATE STREAMING RESPONSE ===
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Send initial metadata
                    streamData(controller, {
                        conversationId,
                        agent: 'scope-brain'
                    })

                    const { tokensUsed } = await streamScopeBrainResponse(
                        latestContent,
                        context,
                        controller,
                        userDb,
                        conversationId || null,
                        userId
                    )

                    // Track usage
                    if (tokensUsed > 0) {
                        await consumeTokens(userId, tokensUsed, authResult.modelId)
                    }
                } catch (error) {
                    console.error('[Chat] Stream error:', error)
                    streamError(controller, 'Ett fel uppstod vid bearbetning.')
                } finally {
                    controller.close()
                }
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Agent': 'scope-brain'
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

// =============================================================================
// GET Handler - API Info
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request)
        if (!auth) {
            return ApiResponse.unauthorized()
        }

        ensureToolsInitialized()

        return Response.json({
            agent: 'scope-brain',
            description: 'Unified single-agent architecture with intelligent model selection',
            features: [
                'Smart model routing (Haiku/Sonnet/Sonnet+thinking)',
                'All 60+ tools available',
                'Extended thinking for complex queries',
                'Streaming responses',
            ],
            models: {
                simple: 'claude-haiku-3-5-20241022',
                standard: 'claude-sonnet-4-20250514',
                complex: 'claude-sonnet-4-20250514 + extended thinking',
            },
        })
    } catch (error) {
        console.error('[Chat] GET error:', error)
        return Response.json({ error: 'Failed to get API info' }, { status: 500 })
    }
}
