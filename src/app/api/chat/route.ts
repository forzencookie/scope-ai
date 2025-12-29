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

Exempel: "Jag köpte kontorsmaterial för 450 kr på Staples"

1. **Bekräfta och be om kvitto:**
   "📝 Förstår! Ett inköp på Staples för 450 kr.
   
   👉 För att jag ska kunna registrera detta behöver jag se kvittot.
   Ladda upp en bild eller PDF på kvittot så fortsätter vi!"

2. **Vänta på dokumentuppladdning** - SKAPA INGET utan dokument
3. **Efter uppladdning:** Extrahera data från dokumentet
4. **Visa förhandsgranskning** med kvittokort
5. **Vänta på bekräftelse** ("Bekräfta"-knappen)
6. **Spara först efter bekräftelse**

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

export async function POST(request: NextRequest) {
    try {
        if (!validateRequestOrigin(request)) {
            return new Response(JSON.stringify({ error: 'Invalid request origin', code: 'CSRF_ERROR' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
        }

        const clientId = getClientIdentifier(request)
        const rateLimitResult = await checkRateLimit(clientId, RATE_LIMIT_CONFIG)

        if (!rateLimitResult.success) {
            return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.', retryAfter: rateLimitResult.retryAfter }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rateLimitResult.retryAfter) } })
        }

        if (!process.env.OPENAI_API_KEY) {
            return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
        }

        let body: unknown
        try { body = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } }) }

        const bodyValidation = validateJsonBody(body)
        if (!bodyValidation.valid) {
            return new Response(JSON.stringify({ error: bodyValidation.error }), { status: 400, headers: { 'Content-Type': 'application/json' } })
        }

        const { messages, confirmationId, conversationId: reqConversationId } = body as { messages: unknown; confirmationId?: string; conversationId?: string }
        const messageValidation = validateChatMessages(messages)

        if (!messageValidation.valid || !messageValidation.data) {
            return new Response(JSON.stringify({ error: messageValidation.error }), { status: 400, headers: { 'Content-Type': 'application/json' } })
        }

        const tokenValidation = validateTokenLimits(messageValidation.data)
        if (!tokenValidation.valid) {
            return new Response(JSON.stringify({ error: tokenValidation.error, code: 'TOKEN_LIMIT_EXCEEDED' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
        }

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
                content: latestUserMessage.content
            });
        }
        // === PERSISTENCE END ===

        ensureToolsInitialized()
        const tools = aiToolRegistry.getAll()
        const openAITools = toolsToOpenAIFunctions(tools)

        let response
        try {
            response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...messageValidation.data
                ],
                tools: openAITools.length > 0 ? openAITools : undefined,
                tool_choice: openAITools.length > 0 ? 'auto' : undefined,
                temperature: 0.7,
                max_tokens: 1500,
            })
        } catch (error) {
            return handleOpenAIError(error)
        }

        const choice = response.choices[0]
        const message = choice.message

        if (message.tool_calls && message.tool_calls.length > 0) {
            const toolResults: Array<{ toolName: string; result: AIToolResult }> = []
            let display: AIDisplayInstruction | undefined
            let navigation: AINavigationInstruction | undefined
            let confirmationRequired: AIConfirmationRequest | undefined

            for (const toolCall of message.tool_calls) {
                if (toolCall.type !== 'function') continue
                const funcCall = toolCall as { type: 'function'; function: { name: string; arguments: string } }
                const toolName = funcCall.function.name
                let params: unknown
                try { params = JSON.parse(funcCall.function.arguments) } catch { params = {} }

                const result = await aiToolRegistry.execute(toolName, params, { confirmationId, userId: 'user-1' })
                toolResults.push({ toolName, result })

                if (result.display && !display) display = result.display
                if (result.navigation && !navigation) navigation = result.navigation
                if (result.confirmationRequired && !confirmationRequired) confirmationRequired = result.confirmationRequired
            }

            let responseContent = message.content || ''
            for (const { toolName, result } of toolResults) {
                if (result.message) {
                    if (responseContent) responseContent += '\n\n'
                    responseContent += result.message
                }
                if (result.error) {
                    if (responseContent) responseContent += '\n\n'
                    responseContent += `⚠️ ${result.error}`
                }
            }
            if (confirmationRequired) {
                if (responseContent) responseContent += '\n\n'
                responseContent += '👆 Granska informationen ovan och bekräfta för att fortsätta.'
            }

            // === PERSISTENCE: Save AI Response ===
            if (conversationId) {
                await db.addMessage({
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: responseContent,
                    tool_calls: message.tool_calls,
                    tool_results: toolResults
                });
            }

            const chatResponse: ChatResponse = {
                content: responseContent,
                conversationId,
                toolResults,
                display,
                navigation,
                confirmationRequired,
            }

            return new Response(JSON.stringify(chatResponse), { headers: { 'Content-Type': 'application/json', 'X-RateLimit-Remaining': String(rateLimitResult.remaining), 'X-RateLimit-Reset': String(rateLimitResult.resetTime) } })
        }

        const responseContent = message.content || ''

        // === PERSISTENCE: Save Simple Response ===
        if (conversationId) {
            await db.addMessage({
                conversation_id: conversationId,
                role: 'assistant',
                content: responseContent
            });
        }

        const chatResponse: ChatResponse = {
            content: responseContent,
            conversationId
        }

        return new Response(JSON.stringify(chatResponse), { headers: { 'Content-Type': 'application/json', 'X-RateLimit-Remaining': String(rateLimitResult.remaining), 'X-RateLimit-Reset': String(rateLimitResult.resetTime) } })

    } catch (error) {
        console.error('Chat API error:', error)
        return new Response(JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
