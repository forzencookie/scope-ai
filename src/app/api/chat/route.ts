/**
 * Chat API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement for message persistence
 */

import { NextRequest } from 'next/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter'
import { validateChatMessages, validateJsonBody } from '@/lib/validation'
import { createUserScopedDb } from '@/lib/database/user-scoped-db'
import { DEFAULT_MODEL_ID } from '@/lib/ai/models'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { 
    authorizeModel, 
    logUnauthorizedModelAccess, 
    trackUsage, 
    isDemoMode, 
    checkUsageLimits, 
    consumeTokens 
} from '@/lib/model-auth'
import { initializeAITools, aiToolRegistry } from '@/lib/ai-tools'
import { validateTokenLimits, validateRequestOrigin } from './validation'
import { streamText } from './streaming'
import { handleGoogleProvider, handleAnthropicProvider, handleOpenAIProvider } from './providers'
import type { AIContentPart, AIMessage, AIToolDefinition } from './types'

const RATE_LIMIT_CONFIG = {
    maxRequests: 20,
    windowMs: 60 * 1000,
}

let toolsInitialized = false
function ensureToolsInitialized() {
    if (!toolsInitialized) {
        initializeAITools()
        toolsInitialized = true
    }
}

export async function POST(request: NextRequest) {
    try {
        // === AUTHENTICATION ===
        const auth = await verifyAuth(request)
        if (!auth) {
            return ApiResponse.unauthorized('Authentication required')
        }
        const userId = auth.userId

        // === USER-SCOPED DB (RLS enforced) ===
        const userDb = await createUserScopedDb()
        if (!userDb) {
            return ApiResponse.unauthorized('User session not found')
        }

        if (!validateRequestOrigin(request)) {
            return new Response(
                JSON.stringify({ error: 'Invalid request origin', code: 'CSRF_ERROR' }), 
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            )
        }

        const clientId = getClientIdentifier(request)
        const rateLimitResult = await checkRateLimit(clientId, RATE_LIMIT_CONFIG)

        if (!rateLimitResult.success) {
            return new Response(
                JSON.stringify({ error: 'Too many requests.', retryAfter: rateLimitResult.retryAfter }), 
                { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rateLimitResult.retryAfter) } }
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { messages, confirmationId, conversationId: reqConversationId, attachments, mentions, model: requestedModel } = body as any
        const messageValidation = validateChatMessages(messages)
        if (!messageValidation.valid || !messageValidation.data) {
            return new Response(JSON.stringify({ error: messageValidation.error }), { status: 400 })
        }

        // Token limit check
        const tokenValidation = validateTokenLimits(messageValidation.data)
        if (!tokenValidation.valid) {
            return new Response(JSON.stringify({ error: tokenValidation.error }), { status: 400 })
        }

        // === SERVER-SIDE MODEL AUTHORIZATION ===
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

        if (!authResult.authorized) {
            console.warn(`[Security] User ${userId} attempted unauthorized model access: ${requestedModel} → downgraded to ${authResult.modelId}`)
            await logUnauthorizedModelAccess(
                userId,
                requestedModel || 'default',
                authResult.modelId,
                authResult.userTier,
                request
            )
        }

        const modelId = authResult.modelId
        const modelInfo = authResult.model
        const provider = modelInfo.provider

        const latestUserMessage = messageValidation.data[messageValidation.data.length - 1]
        const latestContent = latestUserMessage?.content || ''

        // === PERSISTENCE START ===
        let conversationId = reqConversationId
        if (!conversationId) {
            const title = latestContent.slice(0, 50) + (latestContent.length > 50 ? '...' : '') || 'Ny konversation'
            const conv = await userDb.conversations.create({ title })
            if (conv && 'id' in conv) conversationId = conv.id
        }

        if (conversationId) {
            await userDb.messages.create({
                conversation_id: conversationId,
                role: 'user',
                content: latestUserMessage.content,
                user_id: userDb.userId
            })
        }
        // === PERSISTENCE END ===

        ensureToolsInitialized()
        const tools = aiToolRegistry.getAll()

        // Build Messages
        console.log('[Chat] Building messages. Attachments:', attachments?.length || 0)
        const messagesForAI = buildMessagesForAI(messageValidation.data, attachments, mentions)

        // === CONTEXT INJECTION ===
        await injectCompanyContext(messagesForAI, userDb)

        // Create Stream
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const providerParams = {
                        modelId,
                        messagesForAI: messagesForAI as AIMessage[],
                        controller,
                        conversationId,
                        tools: tools as AIToolDefinition[],
                        userDb,
                        confirmationId,
                        userId
                    }

                    if (provider === 'anthropic') {
                        await handleAnthropicProvider(providerParams)
                    } else if (provider === 'openai') {
                        await handleOpenAIProvider(providerParams)
                    } else {
                        await handleGoogleProvider(providerParams)
                    }

                    // Track usage after successful response
                    const estimatedTokens = 2000
                    await trackUsage(userId, modelId, provider, estimatedTokens)
                    await consumeTokens(userId, estimatedTokens, modelId)
                } catch (error: unknown) {
                    console.error('Provider error:', error)
                    const err = error as { stack?: string; message?: string; error?: { message?: string } }
                    console.error('Provider error stack:', err.stack)
                    const errorDetail = err.message || err.error?.message || 'Okänt fel'
                    streamText(controller, `\n\nEtt fel uppstod: ${errorDetail}`)
                } finally {
                    controller.close()
                }
            }
        })

        return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })

    } catch (error) {
        console.error('Chat API error:', error)
        return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), { status: 500 })
    }
}

// =============================================================================
// Helper Functions
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

function buildMessagesForAI(
    messages: Array<{ role: string; content: string }>,
    attachments?: Array<{ name: string; type: string; data: string }>,
    mentions?: Array<{ type: string; label: string; pageType?: string }>
) {
    return messages.map((m, index) => {
        if (m.role === 'user' && index === messages.length - 1 && ((attachments && attachments.length > 0) || (mentions && mentions.length > 0))) {
            const content: AIContentPart[] = [{ type: 'text', text: m.content || ' ' }]

            if (attachments) {
                for (const attachment of attachments) {
                    console.log(`[Chat] Processing attachment: ${attachment.name}, type: ${attachment.type}, data length: ${attachment.data?.length || 0}`)
                    if (attachment.type.startsWith('image/')) {
                        content.push({ 
                            type: 'image_url', 
                            image_url: { url: `data:${attachment.type};base64,${attachment.data}`, detail: 'low' } 
                        })
                    } else {
                        try {
                            const textContent = Buffer.from(attachment.data, 'base64').toString('utf-8')
                            content.push({ type: 'text', text: `\n\n[Bifogad fil: ${attachment.name}]\n${textContent.slice(0, 2000)}` })
                        } catch {
                            content.push({ type: 'text', text: `[Bifogad fil: ${attachment.name} (kunde inte läsas)]` })
                        }
                    }
                }
            }

            if (mentions && mentions.length > 0) {
                const mentionsText = mentions.map((m) => 
                    m.type === 'page' ? `Active Page: ${m.label} (${m.pageType})` : `Mention: ${m.label}`
                ).join('\n')
                content.push({ type: 'text', text: `\n\n[Context]\n${mentionsText}` })
            }
            
            return { role: m.role, content }
        }
        return m
    })
}

async function injectCompanyContext(
    messagesForAI: Array<{ role: string; content: string | AIContentPart[] }>,
    userDb: { roadmaps: { listActive: () => Promise<unknown[]> }; getCompanyKPIs: () => Promise<{ unpaid_invoices_count: number; unread_inbox_count: number }> }
) {
    try {
        const [activeRoadmaps, kpis] = await Promise.all([
            userDb.roadmaps.listActive(),
            userDb.getCompanyKPIs()
        ])

        let contextBlock = `\n\n## LIVE COMPANY STATUS (Auto-Injected)\n`
        contextBlock += `**KPIs:**\n`
        contextBlock += `- Unpaid Invoices: ${kpis.unpaid_invoices_count}\n`
        contextBlock += `- Unread Inbox: ${kpis.unread_inbox_count}\n`

        if (activeRoadmaps && activeRoadmaps.length > 0) {
            contextBlock += `\n**Active Logical Plans (Roadmaps):**\n`
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            activeRoadmaps.forEach((r: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const steps = r.steps?.sort((a: any, b: any) => a.order_index - b.order_index)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const pendingSteps = steps?.filter((s: any) => s.status !== 'completed').slice(0, 3)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const completedCount = steps?.filter((s: any) => s.status === 'completed').length || 0

                contextBlock += `- Plan: "${r.title}" (${completedCount}/${steps?.length || 0} done)\n`
                if (pendingSteps && pendingSteps.length > 0) {
                    contextBlock += `  Next steps:\n`
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    pendingSteps.forEach((s: any) => {
                        contextBlock += `  * [ ] ${s.title}\n`
                    })
                }
            })
        } else {
            contextBlock += `\n(No active roadmaps found. You can suggest creating one if the user's goal is complex.)\n`
        }

        const lastMsg = messagesForAI[messagesForAI.length - 1]
        if (lastMsg.role === 'user') {
            const contextInjection = `\n\n[SYSTEM NOTE: ${contextBlock}]`

            if (Array.isArray(lastMsg.content)) {
                lastMsg.content.push({ type: 'text', text: contextInjection })
            } else {
                lastMsg.content += contextInjection
            }
        }

    } catch (ctxError) {
        console.warn('Failed to inject context:', ctxError)
    }
}
