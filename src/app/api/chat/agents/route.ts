/**
 * Agent Chat API Route - Streaming
 * 
 * Production-ready multi-agent chat endpoint with streaming support.
 * Uses the orchestrator to route requests to specialized domain agents.
 */

import { NextRequest } from 'next/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter'
import { validateChatMessages, validateJsonBody } from '@/lib/validation'
import { createUserScopedDb, type UserScopedDb } from '@/lib/database/user-scoped-db'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { authorizeModel } from '@/lib/model-auth'
import { DEFAULT_MODEL_ID } from '@/lib/ai/models'
import { initializeAgents, agentRegistry } from '@/lib/agents'
import { createAgentContext, type AgentContext, type AgentDomain } from '@/lib/agents/types'
import { smartClassify } from '@/lib/agents/orchestrator/classifier'
import { initializeAITools } from '@/lib/ai-tools'
import { agentMetrics, createTimer } from '@/lib/agents/metrics'

import { streamText, streamData, streamAgent, streamError } from './streaming'
import { handleSingleAgentStream, handleMultiAgentStream } from './handlers'
import { mapIntentToAgent } from './intent-mapper'
import { handleConfirmation } from './confirmation'

// =============================================================================
// Configuration
// =============================================================================

const RATE_LIMIT_CONFIG = {
    maxRequests: 20,
    windowMs: 60 * 1000,
}

const AGENT_SYSTEM_ENABLED = process.env.AGENT_SYSTEM_ENABLED === 'true' ||
    process.env.NODE_ENV === 'development'

let initialized = false
function ensureInitialized() {
    if (!initialized) {
        initializeAITools()
        initializeAgents()
        initialized = true
    }
}

// =============================================================================
// Agent Streaming Handler
// =============================================================================

async function streamAgentResponse(
    message: string,
    context: AgentContext,
    controller: ReadableStreamDefaultController,
    userDb: UserScopedDb | null,
    conversationId: string | null,
    userId: string,
    modelId?: string
): Promise<string> {
    let fullContent = ''
    const totalTimer = createTimer()
    let classificationTimeMs = 0
    let executionTimeMs = 0
    let targetDomain: AgentDomain = 'orchestrator'
    let intent: Awaited<ReturnType<typeof smartClassify>> | null = null
    const toolsCalled: string[] = []
    let responseSuccess = true
    let errorMessage: string | undefined
    
    try {
        // 1. Classify intent
        const classifyTimer = createTimer()
        intent = await smartClassify(message, context)
        classificationTimeMs = classifyTimer.elapsed()
        
        // 2. Get the orchestrator
        const orchestrator = agentRegistry.get('orchestrator')
        if (!orchestrator) {
            throw new Error('Orchestrator not initialized')
        }

        // 3. Route to appropriate agent
        targetDomain = intent.suggestedAgents?.[0] || mapIntentToAgent(intent.category)
        const targetAgent = agentRegistry.get(targetDomain)
        
        if (targetAgent) {
            streamAgent(controller, {
                activeAgent: targetDomain,
                agentName: targetAgent.name,
                routing: `${intent.category} → ${targetDomain}`,
            })
        }

        // 4. Process message through agent system
        const agentContext: AgentContext = {
            ...context,
            currentIntent: intent,
        }

        const execTimer = createTimer()

        // Check if this needs multi-agent coordination
        if (intent.requiresMultiAgent && intent.suggestedAgents && intent.suggestedAgents.length > 1) {
            fullContent = await handleMultiAgentStream(
                message,
                intent.suggestedAgents,
                agentContext,
                controller
            )
        } else {
            fullContent = await handleSingleAgentStream(
                message,
                targetDomain,
                agentContext,
                controller
            )
        }
        
        executionTimeMs = execTimer.elapsed()

        // 5. Persist assistant response
        if (conversationId && fullContent && userDb) {
            try {
                await userDb.messages.create({
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: fullContent,
                    user_id: userId
                })
            } catch (e) {
                console.error('[AgentChat] Failed to save message:', e)
            }
        }

    } catch (error) {
        console.error('[AgentChat] Error:', error)
        errorMessage = error instanceof Error ? error.message : 'Ett oväntat fel uppstod'
        responseSuccess = false
        streamError(controller, errorMessage)
        fullContent = `Fel: ${errorMessage}`
    } finally {
        // Record metrics
        if (intent) {
            agentMetrics.record({
                timestamp: new Date(),
                userId: context.userId,
                companyId: context.companyId || undefined,
                conversationId: conversationId || undefined,
                intent: intent.category,
                intentConfidence: intent.confidence,
                selectedAgent: targetDomain,
                handoffs: intent.suggestedAgents?.filter(a => a !== targetDomain),
                isMultiAgent: !!intent.requiresMultiAgent,
                classificationTimeMs,
                executionTimeMs,
                totalTimeMs: totalTimer.elapsed(),
                toolsCalled,
                toolsSucceeded: 0,
                toolsFailed: 0,
                responseSuccess,
                responseLength: fullContent.length,
                hasDisplay: false,
                hasConfirmation: false,
                hasNavigation: false,
                modelId,
                error: errorMessage,
            })
        }
    }

    return fullContent
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
                { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rateLimitResult.retryAfter) } }
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
            confirmationId,
            confirmationAction,
        } = body as {
            messages: Array<{ role: string; content: string }>
            confirmationId?: string
            confirmationAction?: 'confirm' | 'cancel'
            conversationId?: string
            attachments?: Array<{ name: string; type: string; data: string }>
            mentions?: Array<{ type: string; label: string; pageType?: string }>
            model?: string
        }

        // === HANDLE CONFIRMATION RESPONSE ===
        if (confirmationId && confirmationAction) {
            ensureInitialized()
            
            const confirmContext = createAgentContext({
                userId,
                companyId: userDb.companyId || '',
                companyType: 'AB',
                locale: 'sv',
                conversationId: reqConversationId,
            })

            const stream = new ReadableStream({
                async start(controller) {
                    try {
                        await handleConfirmation(
                            confirmationId,
                            confirmationAction,
                            confirmContext,
                            controller,
                            userDb,
                            userId
                        )
                    } catch (error) {
                        console.error('[AgentChat] Confirmation error:', error)
                        streamError(controller, 'Fel vid bekräftelse.')
                    } finally {
                        controller.close()
                    }
                }
            })

            return new Response(stream, {
                headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Agent-Mode': 'true' }
            })
        }

        // === VALIDATE MESSAGES ===
        const messageValidation = validateChatMessages(messages)
        if (!messageValidation.valid || !messageValidation.data) {
            return new Response(JSON.stringify({ error: messageValidation.error }), { status: 400 })
        }

        // === MODEL AUTHORIZATION ===
        const authResult = await authorizeModel(userId, requestedModel || DEFAULT_MODEL_ID)
        const modelId = authResult.modelId

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

        // === INITIALIZE SYSTEMS ===
        ensureInitialized()

        // === BUILD AGENT CONTEXT ===
        const companyType = 'AB' as const

        const agentContext = createAgentContext({
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
            modelId,
        })

        // Add attachment info to context
        if (attachments && attachments.length > 0) {
            agentContext.sharedMemory.attachments = attachments.map(a => ({
                name: a.name,
                type: a.type,
                hasImage: a.type.startsWith('image/'),
            }))
        }

        // Add mentions to context
        if (mentions && mentions.length > 0) {
            agentContext.sharedMemory.mentions = mentions
        }

        // === CREATE STREAMING RESPONSE ===
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    streamData(controller, { agentMode: true, conversationId })

                    await streamAgentResponse(
                        latestContent,
                        agentContext,
                        controller,
                        userDb,
                        conversationId || null,
                        userId,
                        modelId
                    )
                } catch (error) {
                    console.error('[AgentChat] Stream error:', error)
                    streamError(controller, 'Ett fel uppstod vid bearbetning.')
                } finally {
                    controller.close()
                }
            }
        })

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Agent-Mode': 'true' }
        })

    } catch (error) {
        console.error('[AgentChat] Fatal error:', error)
        return new Response(
            JSON.stringify({ error: 'An unexpected error occurred.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}

// =============================================================================
// GET Handler - Agent Info
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request)
        if (!auth) {
            return ApiResponse.unauthorized()
        }

        ensureInitialized()

        const agents = agentRegistry.getAll().map(agent => ({
            id: agent.id,
            name: agent.name,
            description: agent.description,
            capabilities: agent.capabilities,
        }))

        return Response.json({
            enabled: AGENT_SYSTEM_ENABLED,
            agents,
            version: '1.0.0',
        })
    } catch (error) {
        console.error('[AgentChat] GET error:', error)
        return Response.json({ error: 'Failed to get agent info' }, { status: 500 })
    }
}
