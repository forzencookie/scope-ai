import OpenAI, { APIError, APIConnectionError, RateLimitError, APIConnectionTimeoutError } from 'openai'
import { NextRequest } from 'next/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter'
import { validateChatMessages, validateJsonBody } from '@/lib/validation'
import { db } from '@/lib/server-db'

// OpenAI client configuration with timeout
const OPENAI_TIMEOUT_MS = 30000 // 30 seconds
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: OPENAI_TIMEOUT_MS,
    maxRetries: 2, // Automatic retry for transient errors
})

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
        totalTokens += estimateTokenCount(message.content)
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

function handleOpenAIError(error: unknown): Response {
    if (error instanceof APIConnectionTimeoutError) {
        console.error('OpenAI timeout error:', error.message)
        return new Response(JSON.stringify({ error: 'The AI service is taking too long to respond. Please try again.', code: 'TIMEOUT' }), { status: 504, headers: { 'Content-Type': 'application/json' } })
    }
    if (error instanceof RateLimitError) {
        console.error('OpenAI rate limit error:', error.message)
        return new Response(JSON.stringify({ error: 'AI service is temporarily overloaded. Please try again in a moment.', code: 'RATE_LIMITED', retryAfter: 60 }), { status: 503, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } })
    }
    if (error instanceof APIConnectionError) {
        console.error('OpenAI connection error:', error.message)
        return new Response(JSON.stringify({ error: 'Unable to connect to AI service. Please try again.', code: 'CONNECTION_ERROR' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
    }
    if (error instanceof APIError) {
        console.error('OpenAI API error:', error.status, error.message)
        if (error.status === 400) return new Response(JSON.stringify({ error: 'Invalid request to AI service. Please try rephrasing your message.', code: 'INVALID_REQUEST' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
        if (error.status === 401 || error.status === 403) return new Response(JSON.stringify({ error: 'AI service configuration error. Please contact support.', code: 'AUTH_ERROR' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
        if (error.status === 429) return new Response(JSON.stringify({ error: 'AI service quota exceeded. Please try again later.', code: 'QUOTA_EXCEEDED', retryAfter: 60 }), { status: 503, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } })
    }
    console.error('Unexpected OpenAI error:', error)
    return new Response(JSON.stringify({ error: 'An unexpected error occurred. Please try again.', code: 'UNKNOWN_ERROR' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
}

const SYSTEM_PROMPT = `Du är SCOPE AI, en intelligent assistent med FULL kontroll över bokföringssystemet. Du hjälper företagsägare (INTE revisorer) med:

- Bokföring och redovisning
- Momsdeklarationer och skattefrågor
- Lönehantering, AGI och arbetsgivaravgifter
- Årsredovisning och rapporter
- Företagsstatistik och analys
- Fakturering och transaktioner
- **Registrering av kvitton och transaktioner rapporterade av användaren**

## Dina förmågor

Du har tillgång till verktyg för att:
1. **Läsa data** - Hämta transaktioner, kvitton, lönebesked, momsrapporter, resultaträkning, balansräkning
2. **Navigera** - Öppna relevanta sidor i dashboarden för användaren
3. **Registrera data** - Skapa kvitton, transaktioner, fakturor baserat på användarens rapportering
4. **Utföra åtgärder** - Kategorisera transaktioner, köra lönekörning (kräver bekräftelse)
5. **Visa data** - Visa tabeller, kort och förhandsgranskningar direkt i chatten

## KRITISKA SÄKERHETSREGLER

### Data från användare
1. **SKAPA ALDRIG falska transaktioner eller kvitton** - All data måste komma från användaren
2. **FRÅGA ALLTID om bekräftelse** innan du skapar någon bokföringspost
3. **BEKRÄFTA alla belopp och datum** med användaren innan sparande
4. **Om något är oklart, FRÅGA** - gissa ALDRIG belopp, datum eller leverantörer
5. **All data märks som "user_reported"** (rapporterad av användare, inte från bank-API)

### Förbjudna operationer
- ❌ Skapa backdaterade poster utan explicit datum från användaren
- ❌ Ta bort data (endast arkivering är tillåten)
- ❌ Ändra låsta bokföringsperioder
- ❌ Gissa eller hitta på belopp, leverantörer eller datum

### Tillåtna operationer
- ✅ Läsa och sammanfatta all data
- ✅ Ge bokföringsråd och förklaringar
- ✅ Hjälpa med momsberäkningar
- ✅ Förklara BAS-kontoplanen
- ✅ Registrera data som användaren rapporterar

## NÄR ANVÄNDAREN RAPPORTERAR KVITTO/TRANSAKTION
 
⚠️ **KRITISKT FÖR BOKFÖRINGSLAGEN:** Du får ALDRIG skapa en bokföringspost utan dokumentation!

### OM ANVÄNDAREN HAR BIFOGAT EN BILD:
Om meddelandet innehåller en bild (du kan se den), behandla den som kvitto/dokument:
1. **Analysera bilden** - Extrahera leverantör, belopp, datum, moms från bilden
2. **Visa förhandsgranskning** - Bekräfta uppgifterna du läste ut
3. **Använd verktyg** - Anropa create_receipt med extraherad data
4. **Vänta på bekräftelse** - Användaren måste bekräfta innan sparande

### OM ANVÄNDAREN INTE HAR BIFOGAT BILD:
Om användaren bara skriver text utan bild (t.ex. "Jag köpte kaffe för 45 kr"):
1. **Be om kvitto:**
   "📝 Förstår! För att jag ska kunna registrera detta behöver jag se kvittot.
   Ladda upp en bild eller PDF på kvittot så fortsätter vi!"
2. **Vänta på dokumentuppladdning** - SKAPA INGET utan dokument

## Viktiga regler

1. **Användarna är företagsägare, INTE revisorer.** Undvik facktermer. Förklara enkelt.
2. **För destruktiva åtgärder (moms, AGI, lönekörning): ALLTID be om bekräftelse först.**
3. **Svara på svenska** om inte användaren skriver på engelska.
4. **Var koncis men hjälpsam.** Använd markdown för formatering.
5. **När du visar data, erbjud alltid "Öppna full vy"** för mer detaljer.
`

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

interface ChatResponse {
    content: string
    toolResults?: Array<{
        toolName: string
        result: AIToolResult
    }>
    display?: AIDisplayInstruction
    navigation?: AINavigationInstruction
    confirmationRequired?: AIConfirmationRequest
    conversationId?: string
}

// Helper to stream text
const textEncoder = new TextEncoder()
function streamText(controller: ReadableStreamDefaultController, text: string) {
    if (!text) return
    // Sanitize newlines to avoid breaking protocol (replace \n with \\n or handle in frontend?)
    // Actually, protocol T: <content>\n means we can't have raw \n in content breaking the line.
    // Better protocol: T:<json_string>\n
    // Or just encode newlines? 
    // Simple approach: Replace \n with a placeholder or just assume frontend reads until next T:?
    // Robust approach: T:JSON.stringify(text)\n
    controller.enqueue(textEncoder.encode(`T:${JSON.stringify(text)}\n`))
}

function streamData(controller: ReadableStreamDefaultController, data: any) {
    controller.enqueue(textEncoder.encode(`D:${JSON.stringify(data)}\n`))
}

export async function POST(request: NextRequest) {
    try {
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

        const { messages, confirmationId, conversationId: reqConversationId, attachments, mentions } = body as any
        const messageValidation = validateChatMessages(messages)
        if (!messageValidation.valid || !messageValidation.data) return new Response(JSON.stringify({ error: messageValidation.error }), { status: 400 })

        // Token limit check
        const tokenValidation = validateTokenLimits(messageValidation.data)
        if (!tokenValidation.valid) return new Response(JSON.stringify({ error: tokenValidation.error }), { status: 400 })

        const latestUserMessage = messageValidation.data[messageValidation.data.length - 1];

        // === PERSISTENCE START ===
        let conversationId = reqConversationId;
        if (!conversationId) {
            const title = latestUserMessage.content.slice(0, 50) + (latestUserMessage.content.length > 50 ? '...' : '');
            const conv = await db.createConversation(title, 'user-1');
            if (conv && 'id' in conv) conversationId = conv.id;
        }

        if (conversationId) {
            await db.addMessage({
                conversation_id: conversationId,
                role: 'user',
                content: latestUserMessage.content,
                metadata: {
                    mentions: mentions || [],
                    attachments: attachments?.map((a: any) => ({ name: a.name, type: a.type })) || []
                }
            });
        }
        // === PERSISTENCE END ===

        ensureToolsInitialized()
        const tools = aiToolRegistry.getAll()
        const openAITools = toolsToOpenAIFunctions(tools)

        // Build Messages (Same as before)
        const messagesForAI = messageValidation.data!.map((m, index) => {
            if (m.role === 'user' && index === messageValidation.data!.length - 1 && ((attachments && attachments.length > 0) || (mentions && mentions.length > 0))) {
                const content: any[] = [{ type: 'text', text: m.content || ' ' }]

                if (attachments) {
                    for (const attachment of attachments) {
                        if (attachment.type.startsWith('image/')) {
                            content.push({ type: 'image_url', image_url: { url: `data:${attachment.type};base64,${attachment.data}`, detail: 'auto' } })
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

        // Create Stream
        const stream = new ReadableStream({
            async start(controller) {
                // Buffer for DB persistence
                let fullContent = ''
                let allToolResults: any[] = []
                let finalToolCalls: any[] = []

                try {
                    const aiStream = await openai.chat.completions.create({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: SYSTEM_PROMPT },
                            ...messagesForAI as any
                        ],
                        tools: openAITools.length > 0 ? openAITools : undefined,
                        tool_choice: openAITools.length > 0 ? 'auto' : undefined,
                        temperature: 0.7,
                        max_tokens: 1500,
                        stream: true,
                    })

                    const toolCallsBuffer: Record<number, any> = {}

                    for await (const chunk of aiStream) {
                        const delta = chunk.choices[0]?.delta
                        if (!delta) continue

                        // Stream Text
                        if (delta.content) {
                            fullContent += delta.content
                            streamText(controller, delta.content)
                        }

                        // Accumulate Tool Calls
                        if (delta.tool_calls) {
                            for (const tc of delta.tool_calls) {
                                const index = tc.index
                                if (!toolCallsBuffer[index]) {
                                    toolCallsBuffer[index] = { ...tc, function: { name: '', arguments: '' } }
                                }
                                if (tc.function?.name) toolCallsBuffer[index].function.name += tc.function.name
                                if (tc.function?.arguments) toolCallsBuffer[index].function.arguments += tc.function.arguments
                                if (tc.id) toolCallsBuffer[index].id = tc.id
                                if (tc.type) toolCallsBuffer[index].type = tc.type
                            }
                        }
                    }

                    // Process Tool Calls if any
                    const toolCalls = Object.values(toolCallsBuffer)
                    if (toolCalls.length > 0) {
                        finalToolCalls = toolCalls
                        // We have tool calls. Execute them.
                        // Can't stream intermediate status easily unless we introduce new protocol events.
                        // For now we just execute and send result.

                        const toolResults: Array<{ toolName: string; result: AIToolResult }> = []
                        let display: AIDisplayInstruction | undefined
                        let navigation: AINavigationInstruction | undefined
                        let confirmationRequired: AIConfirmationRequest | undefined

                        for (const toolCall of toolCalls) {
                            if (toolCall.type !== 'function') continue
                            const funcCall = toolCall
                            const toolName = funcCall.function.name
                            let params: unknown
                            try { params = JSON.parse(funcCall.function.arguments) } catch { params = {} }

                            // Maybe stream a "Thinking" update here?
                            // streamText(controller, `\n\n(Kör verktyg: ${toolName}...)`)

                            const result = await aiToolRegistry.execute(toolName, params, { confirmationId, userId: 'user-1' })
                            toolResults.push({ toolName, result })

                            if (result.display && !display) display = result.display
                            if (result.navigation && !navigation) navigation = result.navigation
                            if (result.confirmationRequired && !confirmationRequired) confirmationRequired = result.confirmationRequired

                            // Append tool output to content for history/context
                            if (result.message) {
                                const msg = `\n\n${result.message}`
                                fullContent += msg
                                streamText(controller, msg)
                            }
                            if (result.error) {
                                const msg = `\n\n⚠️ ${result.error}`
                                fullContent += msg
                                streamText(controller, msg)
                            }
                        }

                        // Send Data Packet
                        allToolResults = toolResults
                        if (display || navigation || confirmationRequired) {
                            if (confirmationRequired) {
                                const msg = '\n\n👆 Granska informationen ovan och bekräfta för att fortsätta.'
                                fullContent += msg
                                streamText(controller, msg)
                            }

                            streamData(controller, {
                                display,
                                navigation,
                                confirmationRequired,
                                toolResults // for debugging/history
                            })
                        }
                    }

                } catch (error: any) {
                    console.error("Streaming error:", error)
                    const errorMsg = "\n\nEtt fel uppstod vid generering."
                    fullContent += errorMsg
                    streamText(controller, errorMsg)
                } finally {
                    // === PERSISTENCE: Save AI Response ===
                    if (conversationId && fullContent) {
                        // Fire and forget persistence? No, we should ensure it saves.
                        // But we don't want to delay closing stream?
                        // Just await it.
                        try {
                            await db.addMessage({
                                conversation_id: conversationId,
                                role: 'assistant',
                                content: fullContent,
                                tool_calls: finalToolCalls.length > 0 ? finalToolCalls : undefined,
                                tool_results: allToolResults.length > 0 ? allToolResults : undefined
                            })
                        } catch (e) {
                            console.error("Failed to save message", e)
                        }
                    }
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
