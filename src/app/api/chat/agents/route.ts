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
import { createAgentContext, type AgentContext, type AgentDomain, type IntentCategory } from '@/lib/agents/types'
import { smartClassify } from '@/lib/agents/orchestrator/classifier'
import { initializeAITools } from '@/lib/ai-tools'
import { agentMetrics, createTimer } from '@/lib/agents/metrics'

// =============================================================================
// Configuration
// =============================================================================

const RATE_LIMIT_CONFIG = {
    maxRequests: 20,
    windowMs: 60 * 1000,
}

// Feature flag: Enable agent system
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

function streamAgent(controller: ReadableStreamDefaultController, agentInfo: {
    activeAgent: AgentDomain
    agentName: string
    routing?: string
}) {
    controller.enqueue(textEncoder.encode(`A:${JSON.stringify(agentInfo)}\n`))
}

function streamError(controller: ReadableStreamDefaultController, error: string) {
    controller.enqueue(textEncoder.encode(`E:${JSON.stringify({ error })}\n`))
}

// =============================================================================
// Confirmation Handler
// =============================================================================

/**
 * Handle a confirmation response for a pending action.
 */
async function handleConfirmation(
    confirmationId: string,
    action: 'confirm' | 'cancel',
    context: AgentContext,
    controller: ReadableStreamDefaultController,
    userDb: UserScopedDb | null
): Promise<string> {
    try {
        // Look up the pending confirmation from shared memory or database
        const pendingConfirmation = context.sharedMemory.pendingConfirmation as {
            id: string
            toolName: string
            toolParams: Record<string, unknown>
            actionDescription: string
        } | undefined

        if (!pendingConfirmation || pendingConfirmation.id !== confirmationId) {
            streamText(controller, 'Bekräftelsen kunde inte hittas eller har redan behandlats.')
            return 'Bekräftelsen kunde inte hittas eller har redan behandlats.'
        }

        if (action === 'cancel') {
            streamText(controller, 'Åtgärden avbröts. ✋')
            return 'Åtgärden avbröts.'
        }

        // Execute the confirmed action
        streamText(controller, `Utför: ${pendingConfirmation.actionDescription}...\n`)
        
        const tool = (await import('@/lib/ai-tools')).aiToolRegistry.get(pendingConfirmation.toolName)
        if (!tool) {
            streamError(controller, `Verktyget "${pendingConfirmation.toolName}" kunde inte hittas.`)
            return `Fel: Verktyget kunde inte hittas.`
        }

        const result = await tool.execute(pendingConfirmation.toolParams)

        if (result.success) {
            streamText(controller, '\nKlart! ✅')
            streamData(controller, { 
                toolResults: [{ 
                    tool: pendingConfirmation.toolName, 
                    result: result.data, 
                    success: true 
                }],
                display: result.display,
                navigation: result.navigation,
            })
            return 'Åtgärden genomfördes framgångsrikt.'
        } else {
            streamError(controller, result.error || 'Ett fel uppstod.')
            return `Fel: ${result.error}`
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Okänt fel'
        streamError(controller, errorMsg)
        return `Fel: ${errorMsg}`
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
    modelId?: string
): Promise<string> {
    let fullContent = ''
    const totalTimer = createTimer()
    let classificationTimeMs = 0
    let executionTimeMs = 0
    let targetDomain: AgentDomain = 'orchestrator'
    let intent: Awaited<ReturnType<typeof smartClassify>> | null = null
    let toolsCalled: string[] = []
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
            // Stream agent info to frontend
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
            // Multi-agent workflow
            fullContent = await handleMultiAgentStream(
                message,
                intent.suggestedAgents,
                agentContext,
                controller
            )
        } else {
            // Single agent handling
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
                    metadata: {
                        agent: targetDomain,
                        intent: intent.category,
                    }
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
                toolsSucceeded: 0, // Would need to track this from agent response
                toolsFailed: 0,
                responseSuccess,
                responseLength: fullContent.length,
                hasDisplay: false, // Would need to track from response
                hasConfirmation: false,
                hasNavigation: false,
                modelId,
                error: errorMessage,
            })
        }
    }

    return fullContent
}

/**
 * Handle single agent request with streaming.
 */
async function handleSingleAgentStream(
    message: string,
    agentDomain: AgentDomain,
    context: AgentContext,
    controller: ReadableStreamDefaultController
): Promise<string> {
    const agent = agentRegistry.get(agentDomain)
    if (!agent) {
        streamText(controller, 'Kunde inte hitta rätt agent för din förfrågan.')
        return 'Kunde inte hitta rätt agent för din förfrågan.'
    }

    // Get the agent response
    const response = await agent.handle(message, context)
    const responseText = response.text || response.message

    // Stream the response text
    if (responseText) {
        // Simulate streaming by chunking the text
        const chunks = chunkText(responseText, 10)
        for (const chunk of chunks) {
            streamText(controller, chunk)
            await new Promise(r => setTimeout(r, 20)) // Small delay for smooth streaming
        }
    }

    // Stream any tool results
    if (response.toolResults && response.toolResults.length > 0) {
        streamData(controller, {
            toolResults: response.toolResults.map(tr => ({
                tool: tr.toolName,
                result: tr.result,
                success: tr.success,
            }))
        })
    }

    // Stream display instructions
    const displays = response.displayInstructions || (response.display ? [response.display] : [])
    if (displays.length > 0) {
        for (const display of displays) {
            streamData(controller, { display })
        }
    }

    // Stream confirmation requests
    if (response.confirmationRequired) {
        streamData(controller, { 
            confirmationRequired: response.confirmationRequired 
        })
    }

    // Stream navigation instructions
    if (response.navigationInstructions && response.navigationInstructions.length > 0) {
        for (const nav of response.navigationInstructions) {
            streamData(controller, { navigation: nav })
        }
    }

    return responseText || ''
}

/**
 * Handle multi-agent workflow with streaming.
 */
async function handleMultiAgentStream(
    message: string,
    agents: AgentDomain[],
    context: AgentContext,
    controller: ReadableStreamDefaultController
): Promise<string> {
    let combinedResponse = ''

    streamText(controller, 'Jag hämtar information från flera områden...\n\n')
    combinedResponse += 'Jag hämtar information från flera områden...\n\n'

    for (const agentDomain of agents) {
        const agent = agentRegistry.get(agentDomain)
        if (!agent) continue

        // Notify which agent is processing
        streamAgent(controller, {
            activeAgent: agentDomain,
            agentName: agent.name,
        })

        // Consult the agent
        const response = await agent.consult(message, context)
        const responseText = response.text || response.message

        if (responseText) {
            const header = `**${agent.name}:**\n`
            streamText(controller, header)
            combinedResponse += header

            const chunks = chunkText(responseText, 10)
            for (const chunk of chunks) {
                streamText(controller, chunk)
                await new Promise(r => setTimeout(r, 15))
            }
            combinedResponse += responseText + '\n\n'
        }

        // Stream any data
        if (response.toolResults && response.toolResults.length > 0) {
            streamData(controller, {
                toolResults: response.toolResults,
                agent: agentDomain,
            })
        }
    }

    return combinedResponse
}

/**
 * Chunk text into smaller pieces for streaming effect.
 */
function chunkText(text: string, wordsPerChunk: number): string[] {
    const words = text.split(' ')
    const chunks: string[] = []
    
    for (let i = 0; i < words.length; i += wordsPerChunk) {
        const chunk = words.slice(i, i + wordsPerChunk).join(' ')
        chunks.push(chunk + ' ')
    }
    
    return chunks
}

/**
 * Map intent category to agent domain.
 */
function mapIntentToAgent(category: string): AgentDomain {
    const mapping: Record<string, AgentDomain> = {
        'RECEIPT': 'receipts',
        'INVOICE': 'invoices',
        'BOOKKEEPING': 'bokforing',
        'PAYROLL': 'loner',
        'TAX': 'skatt',
        'REPORTING': 'rapporter',
        'COMPLIANCE': 'compliance',
        'STATISTICS': 'statistik',
        'EVENTS': 'handelser',
        'SETTINGS': 'installningar',
        'NAVIGATION': 'orchestrator',
        'GENERAL': 'orchestrator',
        'MULTI_DOMAIN': 'orchestrator',
    }
    return mapping[category] || 'orchestrator'
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
                JSON.stringify({ 
                    error: 'Too many requests.', 
                    retryAfter: rateLimitResult.retryAfter 
                }),
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
            useAgents?: boolean
        }

        // === HANDLE CONFIRMATION RESPONSE ===
        if (confirmationId && confirmationAction) {
            // Initialize systems first
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
                            userDb
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
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-Agent-Mode': 'true',
                }
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
                metadata: {
                    mentions: mentions || [],
                    attachments: attachments?.map(a => ({ name: a.name, type: a.type })) || [],
                    model: modelId,
                    agentMode: true,
                }
            })
        }

        // === INITIALIZE SYSTEMS ===
        ensureInitialized()

        // === BUILD AGENT CONTEXT ===
        // Note: Company data would be fetched via userDb if needed
        const companyType = 'AB' as const // Default, can be enhanced

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
                    // Stream agent header
                    streamData(controller, { 
                        agentMode: true,
                        conversationId,
                    })

                    // Process through agent system
                    await streamAgentResponse(
                        latestContent,
                        agentContext,
                        controller,
                        userDb,
                        conversationId || null,
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
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Agent-Mode': 'true',
            }
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

        // Return available agents info
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
