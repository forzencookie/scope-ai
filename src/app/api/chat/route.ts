import { NextRequest } from 'next/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter'
import { validateChatMessages, validateJsonBody } from '@/lib/validation'
import { db } from '@/lib/server-db'
import { getModelById, DEFAULT_MODEL_ID } from '@/lib/ai-models'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { authorizeModel, logUnauthorizedModelAccess, trackUsage } from '@/lib/model-auth'

// Token limits for input validation
const MAX_INPUT_TOKENS = 3500
const AVG_CHARS_PER_TOKEN = 4

function estimateTokenCount(text: string): number {
    const nonAsciiRatio = (text.match(/[^\x00-\x7F]/g) || []).length / Math.max(text.length, 1)
    const charsPerToken = nonAsciiRatio > 0.2 ? 2.5 : AVG_CHARS_PER_TOKEN
    return Math.ceil(text.length / charsPerToken)
}

function validateTokenLimits(messages: Array<{ role: string; content: string }>): { valid: boolean; error?: string } {
    let totalTokens = 0
    for (const message of messages) {
        totalTokens += estimateTokenCount(message.content || '')
    }
    if (totalTokens > MAX_INPUT_TOKENS) {
        return {
            valid: false,
            error: `Message content too long. Please reduce your message size. (Estimated ${totalTokens} tokens, max ${MAX_INPUT_TOKENS})`
        }
    }
    return { valid: true }
}

function validateRequestOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')

    if (!origin && !referer) {
        const apiKey = request.headers.get('x-api-key')
        if (apiKey) return true
        if (process.env.NODE_ENV === 'development') return true
        return false
    }

    const requestOrigin = origin || (referer ? new URL(referer).origin : null)
    if (!requestOrigin) return process.env.NODE_ENV === 'development'

    try {
        const originHost = new URL(requestOrigin).host
        if (host && originHost === host) return true
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || []
        if (allowedOrigins.includes(requestOrigin) || allowedOrigins.includes(originHost)) return true
        if (process.env.NODE_ENV === 'development') return true
        return false
    } catch {
        return false
    }
}

const SYSTEM_PROMPT = `# Scope AI Assistant Knowledge Base

## Context
Scope is a Swedish accounting platform for small businesses (AB, enskild firma, handelsbolag, kommanditbolag, föreningar). Users manage bookkeeping, receipts, invoices, payroll, taxes, shareholders, and compliance. The goal is autonomous AI-assisted accounting with human confirmation for important actions.

## Available Capabilities
- **create_receipt**: Create expense entries from extracted receipt data
- **get_receipts**: Search and retrieve existing receipts  
- **get_transactions**: Query bookkeeping transactions
- **navigate**: Direct users to specific pages in the app

## Swedish Accounting Reference
- BAS kontoplan: Standard chart of accounts (1xxx assets, 2xxx liabilities, 3xxx revenue, 4-7xxx expenses, 8xxx financial)
- Common accounts: 1930 (bank), 2440 (supplier debt), 2610 (output VAT), 2640 (input VAT), 5410 (consumables), 6212 (phone)
- VAT rates: 25% (standard), 12% (food/hotels), 6% (books/transport), 0% (exempt)
- Company types: AB (aktiebok, bolagsstämma), EF (F-skatt, egenavgifter), HB/KB (delägare, kapitalinsats)

## Behavioral Patterns (Reference, Not Rules)

**Proactive Suggestion Pattern**
When analyzing information, effective assistants offer interpretations with reasoning rather than asking open questions. This respects the user's time and demonstrates competence.
- Instead of: "What would you like me to do with this?"
- Pattern: "This looks like [observation] — I'd suggest [action] because [reason]. Want me to proceed?"

**Confirmation Pattern**  
Before executing changes to data, showing a preview with clear options (Confirm/Edit/Cancel) prevents mistakes and builds trust. The more significant the action, the more detail in the preview.

**Disambiguation Pattern**
When information is unclear, presenting 2-3 likely interpretations as concrete options keeps conversations efficient.
- Pattern: "I see a few possibilities: 1) [option A], 2) [option B]. Which fits?"

**Context Awareness Pattern**
The AI naturally adapts based on company type (AB vs EF), onboarding status, and conversation history. Missing information is noted conversationally, not demanded.

**Language Matching Pattern**
Responses match the user's language. Swedish input → Swedish response. English input → English response.

## Example Interactions (Library)

**Receipt image uploaded:**
"Detta ser ut som ett kvitto från Clas Ohlson på 450 kr 🧾 Verkar vara kontorsmaterial — jag föreslår konto 5410 Förbrukningsinventarier med 25% moms. Vill du att jag skapar posten?"

**User: "hur går det för företaget?"**
Pull current metrics. Summarize P&L, cash position, trends. Proactively note anything interesting: "Omsättningen är upp 12% mot förra månaden 📈 Jag ser dock att kundfordringar växer — vill du att jag kollar om några fakturor är försenade?"

**User: "jag har SIE-filer från mitt gamla system"**
"Perfekt! Jag kan importera SIE4-filer — det tar med kontoplanen och alla transaktioner. Ladda upp filen så visar jag en sammanfattning innan vi kör igång."

**User: "jag behöver betala ut lön"**
Understand context. If employee count/salary unknown, ask naturally. Then calculate: gross, tax (skattetabell), arbetsgivaravgifter, net. Show payslip preview for confirmation.

**User: "vilka deadlines har jag?"**
"Närmaste deadlines: Moms Q1 ska in 12 april 📅 AGI för mars senast 12 maj. Vill du att jag förbereder någon av dessa?"

**Random/non-accounting image:**
Be friendly but note the mismatch: "Fin bild! 😊 Osäker på hur jag bokför den dock — är det kopplat till verksamheten, eller råkade du skicka fel?"

**Unclear request:**
Offer interpretations: "Jag är osäker om du menar: 1) Leverantörsfaktura (skuldbokning) 2) Kvitto (direkt kostnad) 3) Något annat — vilken passar?"

**User skipped onboarding:**
When relevant info is missing, weave it into conversation: "Jag ser att vi inte har organisationsnumret ännu — ska jag slå upp det hos Bolagsverket?"

## Tone Reference
- Professional but warm, like a knowledgeable colleague
- Uses emojis sparingly to add warmth (📊 🧾 📈 ✅)
- Concise responses — respects user's time
- Celebrates wins, offers help with problems
- Never condescending, always collaborative`

const RATE_LIMIT_CONFIG = {
    maxRequests: 20,
    windowMs: 60 * 1000,
}

import {
    initializeAITools,
    aiToolRegistry,
    toolsToOpenAIFunctions,
    type AIToolResult,
    type AIDisplayInstruction,
    type AINavigationInstruction,
    type AIConfirmationRequest,
} from '@/lib/ai-tools'

let toolsInitialized = false
function ensureToolsInitialized() {
    if (!toolsInitialized) {
        initializeAITools()
        toolsInitialized = true
    }
}

// Helper to stream text
const textEncoder = new TextEncoder()
function streamText(controller: ReadableStreamDefaultController, text: string) {
    if (!text) return
    controller.enqueue(textEncoder.encode(`T:${JSON.stringify(text)}\n`))
}

function streamData(controller: ReadableStreamDefaultController, data: any) {
    controller.enqueue(textEncoder.encode(`D:${JSON.stringify(data)}\n`))
}

// ============================================================================
// Provider-specific implementations
// ============================================================================

async function handleGoogleProvider(
    modelId: string,
    messagesForAI: any[],
    controller: ReadableStreamDefaultController,
    conversationId: string | null,
    tools: any[],
    confirmationId?: string
) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

    // Map model IDs to actual Google model names
    const googleModelMap: Record<string, string> = {
        'gemini-2.0-flash': 'gemini-2.0-flash',
        'gemini-2.0-pro-low': 'gemini-2.0-pro',
        'gemini-2.0-pro-high': 'gemini-2.0-pro',
    }

    const actualModel = googleModelMap[modelId] || 'gemini-2.0-flash'
    const model = genAI.getGenerativeModel({ model: actualModel })

    // Convert messages to Google format
    const history = messagesForAI.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: typeof m.content === 'string' ? m.content : m.content.map((c: any) => c.text || '').join('\n') }]
    }))

    const lastMessage = messagesForAI[messagesForAI.length - 1]
    const lastContent = typeof lastMessage.content === 'string'
        ? lastMessage.content
        : lastMessage.content.map((c: any) => c.text || '').join('\n')

    const { toolsToGoogleFunctions } = await import('@/lib/ai-tools')
    const googleTools = toolsToGoogleFunctions(tools as any[])

    const chat = model.startChat({
        history,
        systemInstruction: SYSTEM_PROMPT,
        tools: googleTools.length > 0 ? [{ functionDeclarations: googleTools }] : undefined,
    })

    let fullContent = ''
    let currentMessage = lastContent

    // Loop to handle tool calls (max 5 turns)
    for (let i = 0; i < 5; i++) {
        try {
            const result = await chat.sendMessageStream(currentMessage)
            let gotFunctionCall = false
            let functionCalls: any[] = []

            for await (const chunk of result.stream) {
                // Check for text
                const text = chunk.text()
                if (text) {
                    fullContent += text
                    streamText(controller, text)
                }

                // Check for function calls
                // Note: handling depends on exact SDK version, assuming chunk.functionCalls() exists
                const calls = typeof chunk.functionCalls === 'function' ? chunk.functionCalls() : undefined
                if (calls && calls.length > 0) {
                    gotFunctionCall = true
                    functionCalls.push(...calls)
                }
            }

            if (!gotFunctionCall) {
                break
            }

            // Execute tools
            const functionResponses = []
            for (const call of functionCalls) {
                const tool = tools.find(t => t.name === call.name)
                if (tool) {
                    // Execute
                    // streamData(controller, { toolCall: { name: call.name } }) // Optional: notify frontend
                    try {
                        const toolResult = await tool.execute(call.args)

                        // Send data to frontend
                        if (toolResult.display || toolResult.navigation || toolResult.confirmationRequired) {
                            streamData(controller, {
                                display: toolResult.display,
                                navigation: toolResult.navigation,
                                confirmationRequired: toolResult.confirmationRequired,
                                toolResults: [{ toolName: call.name, result: toolResult }]
                            })
                        }

                        functionResponses.push({
                            functionResponse: {
                                name: call.name,
                                response: resultToGoogleResponse(toolResult)
                            }
                        })
                    } catch (err: any) {
                        functionResponses.push({
                            functionResponse: {
                                name: call.name,
                                response: { name: call.name, content: { error: err.message } }
                            }
                        })
                    }
                } else {
                    functionResponses.push({
                        functionResponse: {
                            name: call.name,
                            response: { error: 'Tool not found' }
                        }
                    })
                }
            }

            // Send responses back to model
            // Google SDK: sendMessage(functionResponses) usually works for single turn, but for stream?
            // Actually usually you send the responses as the next message
            currentMessage = functionResponses as any

        } catch (error: any) {
            console.error('Google AI error:', error)
            const errorMsg = '\n\nEtt fel uppstod vid generering.'
            fullContent += errorMsg
            streamText(controller, errorMsg)
            break
        }
    }

    // Helper to format tool result for Google
    function resultToGoogleResponse(result: any) {
        // Must return object expected by Google
        // usually { name: string, content: object }
        // But the SDK wrapper { functionResponse: ... } handles the wrapper
        // The response content itself:
        return { result: result.data || result.message || result.success }
    }

    // Persist message
    if (conversationId && fullContent) {
        try {
            await db.addMessage({
                conversation_id: conversationId,
                role: 'assistant',
                content: fullContent,
            })
        } catch (e) {
            console.error('Failed to save message', e)
        }
    }

    return fullContent
}

async function handleAnthropicProvider(
    modelId: string,
    messagesForAI: any[],
    controller: ReadableStreamDefaultController,
    conversationId: string | null,
    tools: any[],
    confirmationId?: string
) {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Map model IDs to actual Anthropic model names
    const anthropicModelMap: Record<string, string> = {
        'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
        'claude-opus-4-20250514': 'claude-opus-4-20250514',
    }

    const actualModel = anthropicModelMap[modelId] || 'claude-sonnet-4-20250514'

    // Convert messages to Anthropic format
    const anthropicMessages = messagesForAI.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : m.content.map((c: any) => {
            if (c.type === 'text') return { type: 'text' as const, text: c.text }
            if (c.type === 'image_url') {
                // Extract base64 data from data URL
                const match = c.image_url.url.match(/^data:([^;]+);base64,(.+)$/)
                if (match) {
                    return {
                        type: 'image' as const,
                        source: {
                            type: 'base64' as const,
                            media_type: match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                            data: match[2]
                        }
                    }
                }
            }
            return { type: 'text' as const, text: c.text || '' }
        })
    }))

    let fullContent = ''

    try {
        const stream = await anthropic.messages.stream({
            model: actualModel,
            max_tokens: 1500,
            system: SYSTEM_PROMPT,
            messages: anthropicMessages,
        })

        for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                const text = event.delta.text
                if (text) {
                    fullContent += text
                    streamText(controller, text)
                }
            }
        }
    } catch (error: any) {
        console.error('Anthropic API error:', error)
        const errorMsg = '\n\nEtt fel uppstod vid generering.'
        fullContent += errorMsg
        streamText(controller, errorMsg)
    }

    // Persist message
    if (conversationId && fullContent) {
        try {
            await db.addMessage({
                conversation_id: conversationId,
                role: 'assistant',
                content: fullContent,
            })
        } catch (e) {
            console.error('Failed to save message', e)
        }
    }

    return fullContent
}

async function handleOpenAIProvider(
    modelId: string,
    messagesForAI: any[],
    controller: ReadableStreamDefaultController,
    conversationId: string | null,
    tools: any[],
    confirmationId?: string
) {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    })

    // Map model IDs to actual OpenAI model names
    const openaiModelMap: Record<string, string> = {
        'gpt-4o': 'gpt-4o',
        'gpt-4o-mini': 'gpt-4o-mini',
        'gpt-4-turbo': 'gpt-4-turbo',
    }

    const actualModel = openaiModelMap[modelId] || 'gpt-4o-mini'

    // Convert messages to OpenAI format with null safety
    const openaiMessages = [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        ...messagesForAI.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: typeof m.content === 'string'
                ? m.content
                : Array.isArray(m.content)
                    ? m.content.map((c: any) => {
                        if (c.type === 'text') return { type: 'text' as const, text: c.text || '' }
                        if (c.type === 'image_url' && c.image_url?.url) {
                            return {
                                type: 'image_url' as const,
                                image_url: { url: c.image_url.url, detail: 'low' as const }
                            }
                        }
                        return { type: 'text' as const, text: '' }
                    })
                    : m.content || ''
        }))
    ]

    // Convert tools to OpenAI function format
    const openaiTools = tools.length > 0 ? toolsToOpenAIFunctions(tools) : undefined

    // Debug: Log tools being passed
    console.log(`[OpenAI] Passing ${openaiTools?.length || 0} tools to model ${actualModel}`)
    if (openaiTools && openaiTools.length > 0) {
        console.log(`[OpenAI] Tool names:`, openaiTools.map(t => t.function.name).join(', '))
    }

    let fullContent = ''

    // Debug: Log message structure
    console.log('[OpenAI] Messages structure:')
    for (const msg of openaiMessages) {
        if (typeof msg.content === 'string') {
            console.log(`  ${msg.role}: string (${msg.content.length} chars)`)
        } else if (Array.isArray(msg.content)) {
            console.log(`  ${msg.role}: array with ${msg.content.length} parts:`)
            for (const part of msg.content) {
                if (part.type === 'text') {
                    console.log(`    - text: "${part.text?.slice(0, 50)}..."`)
                } else if (part.type === 'image_url') {
                    const url = part.image_url?.url || ''
                    console.log(`    - image_url: ${url.slice(0, 50)}... (${url.length} chars)`)
                } else {
                    console.log(`    - unknown type: ${JSON.stringify(part).slice(0, 100)}`)
                }
            }
        } else {
            console.log(`  ${msg.role}: ${typeof msg.content}`)
        }
    }

    try {
        const stream = await openai.chat.completions.create({
            model: actualModel,
            messages: openaiMessages as any,
            stream: true,
            tools: openaiTools,
            tool_choice: openaiTools ? 'auto' : undefined,
        })

        // Accumulate tool calls across chunks (OpenAI streams them incrementally)
        const toolCallsInProgress: Map<number, { id: string; name: string; arguments: string }> = new Map()

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta
            const finishReason = chunk.choices[0]?.finish_reason

            // Handle text content
            if (delta?.content) {
                fullContent += delta.content
                streamText(controller, delta.content)
            }

            // Accumulate tool call chunks
            if (delta?.tool_calls) {
                for (const toolCall of delta.tool_calls) {
                    const index = toolCall.index
                    const existing = toolCallsInProgress.get(index) || { id: '', name: '', arguments: '' }

                    if (toolCall.id) existing.id = toolCall.id
                    if (toolCall.function?.name) existing.name += toolCall.function.name
                    if (toolCall.function?.arguments) existing.arguments += toolCall.function.arguments

                    toolCallsInProgress.set(index, existing)
                }
            }

            // When streaming completes with tool_calls finish reason, execute them
            if (finishReason === 'tool_calls' || finishReason === 'stop') {
                for (const [, toolCall] of toolCallsInProgress) {
                    if (toolCall.name && toolCall.arguments) {
                        console.log(`[OpenAI] Executing tool: ${toolCall.name}`)
                        try {
                            const toolArgs = JSON.parse(toolCall.arguments)
                            const tool = aiToolRegistry.get(toolCall.name)

                            if (tool) {
                                const result = await tool.execute(toolArgs) as AIToolResult

                                // Stream back the result data
                                if (result.display) {
                                    streamData(controller, { display: result.display })
                                }
                                if (result.navigation) {
                                    streamData(controller, { navigation: result.navigation })
                                }
                                if (result.confirmationRequired) {
                                    streamData(controller, { confirmationRequired: result.confirmationRequired })
                                }
                                streamData(controller, { toolResults: [{ tool: toolCall.name, result: result.data }] })
                            } else {
                                console.error(`[OpenAI] Tool not found: ${toolCall.name}`)
                            }
                        } catch (parseError) {
                            console.error(`[OpenAI] Tool ${toolCall.name} failed:`, parseError)
                        }
                    }
                }
                toolCallsInProgress.clear()
            }
        }
    } catch (error: any) {
        console.error('OpenAI API error:', error)
        // Extract meaningful error message from OpenAI error
        let errorDetail = error.message || 'Ett fel uppstod vid generering.'
        if (error.error?.message) {
            errorDetail = error.error.message
        }
        // Check for common image-related errors
        if (errorDetail.includes('image') || errorDetail.includes('content_policy')) {
            errorDetail = 'Kunde inte behandla bilden. Försök med en annan bild eller mindre storlek.'
        }
        const errorMsg = `\n\nFel: ${errorDetail}`
        fullContent += errorMsg
        streamText(controller, errorMsg)
    }

    // Persist message
    if (conversationId && fullContent) {
        try {
            await db.addMessage({
                conversation_id: conversationId,
                role: 'assistant',
                content: fullContent,
            })
        } catch (e) {
            console.error('Failed to save message', e)
        }
    }

    return fullContent
}

export async function POST(request: NextRequest) {
    try {
        // === AUTHENTICATION ===
        const auth = await verifyAuth(request)
        if (!auth) {
            return ApiResponse.unauthorized('Authentication required')
        }
        const userId = auth.userId

        if (!validateRequestOrigin(request)) {
            return new Response(JSON.stringify({ error: 'Invalid request origin', code: 'CSRF_ERROR' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
        }

        const clientId = getClientIdentifier(request)
        const rateLimitResult = await checkRateLimit(clientId, RATE_LIMIT_CONFIG)

        if (!rateLimitResult.success) {
            return new Response(JSON.stringify({ error: 'Too many requests.', retryAfter: rateLimitResult.retryAfter }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rateLimitResult.retryAfter) } })
        }

        let body: unknown
        try { body = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }

        const bodyValidation = validateJsonBody(body)
        if (!bodyValidation.valid) return new Response(JSON.stringify({ error: bodyValidation.error }), { status: 400 })

        const { messages, confirmationId, conversationId: reqConversationId, attachments, mentions, model: requestedModel } = body as any
        const messageValidation = validateChatMessages(messages)
        if (!messageValidation.valid || !messageValidation.data) return new Response(JSON.stringify({ error: messageValidation.error }), { status: 400 })

        // Token limit check
        const tokenValidation = validateTokenLimits(messageValidation.data)
        if (!tokenValidation.valid) return new Response(JSON.stringify({ error: tokenValidation.error }), { status: 400 })

        // === SERVER-SIDE MODEL AUTHORIZATION ===
        // CRITICAL: Never trust client-supplied model ID - validate against user's tier
        const authResult = await authorizeModel(userId, requestedModel || DEFAULT_MODEL_ID)

        if (!authResult.authorized) {
            // Log the unauthorized attempt for security monitoring
            console.warn(`[Security] User ${userId} attempted unauthorized model access: ${requestedModel} → downgraded to ${authResult.modelId}`)
            await logUnauthorizedModelAccess(
                userId,
                requestedModel || 'default',
                authResult.modelId,
                authResult.userTier,
                request
            )
        }

        // Use the authorized model (original if allowed, fallback if not)
        const modelId = authResult.modelId
        const modelInfo = authResult.model
        const provider = modelInfo.provider

        const latestUserMessage = messageValidation.data[messageValidation.data.length - 1];
        const latestContent = latestUserMessage?.content || ''

        // === PERSISTENCE START ===
        let conversationId = reqConversationId;
        if (!conversationId) {
            const title = latestContent.slice(0, 50) + (latestContent.length > 50 ? '...' : '') || 'Ny konversation';
            const conv = await db.createConversation(title, userId);
            if (conv && 'id' in conv) conversationId = conv.id;
        }

        if (conversationId) {
            await db.addMessage({
                conversation_id: conversationId,
                role: 'user',
                content: latestUserMessage.content,
                metadata: {
                    mentions: mentions || [],
                    attachments: attachments?.map((a: any) => ({ name: a.name, type: a.type })) || [],
                    model: modelId
                }
            });
        }
        // === PERSISTENCE END ===

        ensureToolsInitialized()
        const tools = aiToolRegistry.getAll()

        // Build Messages
        console.log('[Chat] Building messages. Attachments:', attachments?.length || 0)
        const messagesForAI = messageValidation.data!.map((m, index) => {
            if (m.role === 'user' && index === messageValidation.data!.length - 1 && ((attachments && attachments.length > 0) || (mentions && mentions.length > 0))) {
                const content: any[] = [{ type: 'text', text: m.content || ' ' }]

                if (attachments) {
                    for (const attachment of attachments) {
                        console.log(`[Chat] Processing attachment: ${attachment.name}, type: ${attachment.type}, data length: ${attachment.data?.length || 0}`)
                        if (attachment.type.startsWith('image/')) {
                            content.push({ type: 'image_url', image_url: { url: `data:${attachment.type};base64,${attachment.data}`, detail: 'low' } })
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
                    const mentionsText = mentions.map((m: any) => m.type === 'page' ? `Active Page: ${m.label} (${m.pageType})` : `Mention: ${m.label}`).join('\n')
                    content.push({ type: 'text', text: `\n\n[Context]\n${mentionsText}` })
                }
                return { role: m.role, content }
            }
            return m
        })

        // === CONTEXT INJECTION ===
        // Fetch active roadmaps and KPIs to inject into the system prompt
        // This gives the AI "Long Term Memory" about the company status
        try {
            const [activeRoadmaps, kpis] = await Promise.all([
                db.getRoadmaps(userId),
                db.getCompanyKPIs()
            ]);

            // Construct Context Block
            let contextBlock = `\n\n## LIVE COMPANY STATUS (Auto-Injected)\n`;

            // 1. KPIs
            contextBlock += `**KPIs:**\n`;
            contextBlock += `- Unpaid Invoices: ${kpis.unpaid_invoices_count}\n`;
            contextBlock += `- Unread Inbox: ${kpis.unread_inbox_count}\n`;

            // 2. Roadmaps
            if (activeRoadmaps && activeRoadmaps.length > 0) {
                contextBlock += `\n**Active Logical Plans (Roadmaps):**\n`;
                activeRoadmaps.forEach((r: any) => {
                    const steps = r.steps?.sort((a: any, b: any) => a.order_index - b.order_index);
                    const pendingSteps = steps?.filter((s: any) => s.status !== 'completed').slice(0, 3); // Showing next 3 pending steps
                    const completedCount = steps?.filter((s: any) => s.status === 'completed').length || 0;

                    contextBlock += `- Plan: "${r.title}" (${completedCount}/${steps?.length || 0} done)\n`;
                    if (pendingSteps && pendingSteps.length > 0) {
                        contextBlock += `  Next steps:\n`;
                        pendingSteps.forEach((s: any) => {
                            contextBlock += `  * [ ] ${s.title}\n`;
                        });
                    }
                });
            } else {
                contextBlock += `\n(No active roadmaps found. You can suggest creating one if the user's goal is complex.)\n`;
            }

            // Prepend to the first user message or append to system prompt
            // Strategy: Append to system prompt for every request so it's fresh
            // Since SYSTEM_PROMPT is const, we'll modify the messages array for OpenAI/Anthropic/Google

            // We'll wrap this logic in the provider handlers or just pre-process messages?
            // Easier: Attach it to the LAST user message as hidden context if it's not too long.
            // OR: Prepend to the first system message. 

            // Let's modify the SYSTEM_PROMPT passed to handlers. 
            // Since we can't easily change the const SYSTEM_PROMPT, we'll handle it inside the provider calls 
            // by passing an `extendedSystemPrompt` or appending to the first message.

            // NOTE: For simplicity in this codebase, I will append it to the last user message as a "System Note".
            const lastMsg = messagesForAI[messagesForAI.length - 1];
            if (lastMsg.role === 'user') {
                const contextinjection = `\n\n[SYSTEM NOTE: ${contextBlock}]`;

                if (Array.isArray(lastMsg.content)) {
                    lastMsg.content.push({ type: 'text', text: contextinjection });
                } else {
                    lastMsg.content += contextinjection;
                }
            }

        } catch (ctxError) {
            console.warn('Failed to inject context:', ctxError);
        }

        // Create Stream
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    if (provider === 'anthropic') {
                        await handleAnthropicProvider(modelId, messagesForAI, controller, conversationId, tools, confirmationId)
                    } else if (provider === 'openai') {
                        await handleOpenAIProvider(modelId, messagesForAI, controller, conversationId, tools, confirmationId)
                    } else {
                        // Default to Google
                        await handleGoogleProvider(modelId, messagesForAI, controller, conversationId, tools, confirmationId)
                    }

                    // Track usage after successful response
                    // Note: For more accurate tracking, pass token count from provider response
                    await trackUsage(userId, modelId, provider, 0)
                } catch (error: any) {
                    console.error('Provider error:', error)
                    console.error('Provider error stack:', error.stack)
                    const errorDetail = error.message || error.error?.message || 'Okänt fel'
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
