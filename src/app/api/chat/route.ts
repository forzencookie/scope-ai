import OpenAI, { APIError, APIConnectionError, RateLimitError, APIConnectionTimeoutError } from 'openai'
import { NextRequest } from 'next/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter'
import { validateChatMessages, validateJsonBody } from '@/lib/validation'

// OpenAI client configuration with timeout
const OPENAI_TIMEOUT_MS = 30000 // 30 seconds
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: OPENAI_TIMEOUT_MS,
    maxRetries: 2, // Automatic retry for transient errors
})

// Token limits for input validation
// Using conservative limit with buffer for estimation errors
// gpt-4o-mini has 128k context, but we limit input to leave room for response
const MAX_INPUT_TOKENS = 3500 // Conservative limit with ~12% buffer for estimation errors
const AVG_CHARS_PER_TOKEN = 4 // Rough estimate - actual varies by language/content

/**
 * Estimates token count from text (rough approximation)
 * 
 * NOTE: This is an approximation. Actual token counts vary based on:
 * - Language (non-ASCII characters often use more tokens)
 * - Special characters and whitespace
 * - Common vs rare words
 * 
 * For production with strict limits, consider using the tiktoken library.
 * We use a conservative buffer in MAX_INPUT_TOKENS to account for estimation errors.
 * 
 * @param text - The text to estimate tokens for
 * @returns Estimated token count (may be under-estimated for non-English text)
 */
function estimateTokenCount(text: string): number {
    // For non-ASCII heavy text, use a more conservative estimate
    const nonAsciiRatio = (text.match(/[^\x00-\x7F]/g) || []).length / Math.max(text.length, 1)

    // If >20% non-ASCII, use smaller chars-per-token ratio (more conservative)
    const charsPerToken = nonAsciiRatio > 0.2 ? 2.5 : AVG_CHARS_PER_TOKEN

    return Math.ceil(text.length / charsPerToken)
}

/**
 * Validates that message content doesn't exceed token limits
 */
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

/**
 * Validate request origin for CSRF protection
 * Only allows requests from same origin or configured allowed origins
 */
function validateRequestOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')

    // Allow requests without origin (non-browser clients, same-origin in some cases)
    // But require at least one identifier
    if (!origin && !referer) {
        // Check for API key or other authentication that indicates legitimate API usage
        const apiKey = request.headers.get('x-api-key')
        if (apiKey) {
            return true // API clients with keys are allowed
        }
        // In development, allow requests without origin
        if (process.env.NODE_ENV === 'development') {
            return true
        }
        // In production, reject requests without any origin info
        return false
    }

    // Extract hostname from origin or referer
    const requestOrigin = origin || (referer ? new URL(referer).origin : null)
    if (!requestOrigin) {
        return process.env.NODE_ENV === 'development'
    }

    try {
        const originHost = new URL(requestOrigin).host

        // Check if origin matches the host
        if (host && originHost === host) {
            return true
        }

        // Check against allowed origins from environment
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || []
        if (allowedOrigins.includes(requestOrigin) || allowedOrigins.includes(originHost)) {
            return true
        }

        // In development, be more permissive
        if (process.env.NODE_ENV === 'development') {
            return true
        }

        return false
    } catch {
        return false
    }
}

/**
 * Handles OpenAI-specific errors with appropriate responses
 */
function handleOpenAIError(error: unknown): Response {
    // Handle specific OpenAI error types
    if (error instanceof APIConnectionTimeoutError) {
        console.error('OpenAI timeout error:', error.message)
        return new Response(
            JSON.stringify({
                error: 'The AI service is taking too long to respond. Please try again.',
                code: 'TIMEOUT'
            }),
            { status: 504, headers: { 'Content-Type': 'application/json' } }
        )
    }

    if (error instanceof RateLimitError) {
        console.error('OpenAI rate limit error:', error.message)
        return new Response(
            JSON.stringify({
                error: 'AI service is temporarily overloaded. Please try again in a moment.',
                code: 'RATE_LIMITED',
                retryAfter: 60
            }),
            {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': '60'
                }
            }
        )
    }

    if (error instanceof APIConnectionError) {
        console.error('OpenAI connection error:', error.message)
        return new Response(
            JSON.stringify({
                error: 'Unable to connect to AI service. Please try again.',
                code: 'CONNECTION_ERROR'
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
    }

    if (error instanceof APIError) {
        console.error('OpenAI API error:', error.status, error.message)

        // Handle specific API error codes
        if (error.status === 400) {
            return new Response(
                JSON.stringify({
                    error: 'Invalid request to AI service. Please try rephrasing your message.',
                    code: 'INVALID_REQUEST'
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        if (error.status === 401 || error.status === 403) {
            console.error('OpenAI authentication error - check API key')
            return new Response(
                JSON.stringify({
                    error: 'AI service configuration error. Please contact support.',
                    code: 'AUTH_ERROR'
                }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
            )
        }

        if (error.status === 429) {
            return new Response(
                JSON.stringify({
                    error: 'AI service quota exceeded. Please try again later.',
                    code: 'QUOTA_EXCEEDED',
                    retryAfter: 60
                }),
                {
                    status: 503,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': '60'
                    }
                }
            )
        }
    }

    // Generic error fallback
    console.error('Unexpected OpenAI error:', error)
    return new Response(
        JSON.stringify({
            error: 'An error occurred while processing your request. Please try again.',
            code: 'UNKNOWN_ERROR'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
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

## Exempel på bra svar

Användare: "Registrera ett kvitto på 500 kr från Amazon"
Du: "📝 Jag förstår! Innan jag kan registrera detta behöver jag se kvittot. Kan du ladda upp en bild eller PDF? 👇"

Användare: "Hur mycket moms ska jag betala?"
Du: Använd get_vat_report verktyget, sammanfatta beloppet i enkla termer, visa förhandsgranskning.

Användare: "Visa mina transaktioner"
Du: Använd get_transactions med limit 10, visa mini-tabell med option att se alla.

Användare: "Skicka in moms"
Du: Förbered momsdeklaration, visa sammanfattning, BE OM BEKRÄFTELSE innan inskickning.`

// Rate limit configuration: 20 requests per minute per IP
const RATE_LIMIT_CONFIG = {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
}

// Import AI tools
import {
    initializeAITools,
    aiToolRegistry,
    toolsToOpenAIFunctions,
    type AIToolResult,
    type AIDisplayInstruction,
    type AINavigationInstruction,
    type AIConfirmationRequest,
} from '@/lib/ai-tools'

// Initialize tools on first request
let toolsInitialized = false

function ensureToolsInitialized() {
    if (!toolsInitialized) {
        initializeAITools()
        toolsInitialized = true
    }
}

// Response type for the frontend
interface ChatResponse {
    content: string
    toolResults?: Array<{
        toolName: string
        result: AIToolResult
    }>
    display?: AIDisplayInstruction
    navigation?: AINavigationInstruction
    confirmationRequired?: AIConfirmationRequest
}

export async function POST(request: NextRequest) {
    try {
        // === 0. CSRF Protection ===
        if (!validateRequestOrigin(request)) {
            return new Response(
                JSON.stringify({
                    error: 'Invalid request origin',
                    code: 'CSRF_ERROR'
                }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // === 1. Rate Limiting ===
        const clientId = getClientIdentifier(request)
        const rateLimitResult = await checkRateLimit(clientId, RATE_LIMIT_CONFIG)

        if (!rateLimitResult.success) {
            return new Response(
                JSON.stringify({
                    error: 'Too many requests. Please try again later.',
                    retryAfter: rateLimitResult.retryAfter,
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(rateLimitResult.retryAfter),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(rateLimitResult.resetTime),
                    },
                }
            )
        }

        // === 2. API Key Check ===
        if (!process.env.OPENAI_API_KEY) {
            console.error('OpenAI API key not configured')
            return new Response(
                JSON.stringify({ error: 'Service temporarily unavailable' }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // === 3. Parse and Validate Request Body ===
        let body: unknown
        try {
            body = await request.json()
        } catch {
            return new Response(
                JSON.stringify({ error: 'Invalid JSON in request body' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        const bodyValidation = validateJsonBody(body)
        if (!bodyValidation.valid) {
            return new Response(
                JSON.stringify({ error: bodyValidation.error }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // === 4. Validate and Sanitize Messages ===
        const { messages, confirmationId } = body as { messages: unknown; confirmationId?: string }
        const messageValidation = validateChatMessages(messages)

        if (!messageValidation.valid || !messageValidation.data) {
            return new Response(
                JSON.stringify({ error: messageValidation.error }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // === 5. Token Limit Validation ===
        const tokenValidation = validateTokenLimits(messageValidation.data)
        if (!tokenValidation.valid) {
            return new Response(
                JSON.stringify({ error: tokenValidation.error, code: 'TOKEN_LIMIT_EXCEEDED' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // === 6. Initialize AI Tools ===
        ensureToolsInitialized()
        const tools = aiToolRegistry.getAll()
        const openAITools = toolsToOpenAIFunctions(tools)

        // === 7. Call OpenAI API with Function Calling ===
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

        // === 8. Handle Tool Calls ===
        if (message.tool_calls && message.tool_calls.length > 0) {
            const toolResults: Array<{ toolName: string; result: AIToolResult }> = []
            let display: AIDisplayInstruction | undefined
            let navigation: AINavigationInstruction | undefined
            let confirmationRequired: AIConfirmationRequest | undefined

            for (const toolCall of message.tool_calls) {
                // Handle function tool calls only
                if (toolCall.type !== 'function') continue

                // Access function properties (type-safe after the check above)
                const funcCall = toolCall as { type: 'function'; function: { name: string; arguments: string } }
                const toolName = funcCall.function.name
                let params: unknown

                try {
                    params = JSON.parse(funcCall.function.arguments)
                } catch {
                    params = {}
                }

                // Execute the tool
                const result = await aiToolRegistry.execute(toolName, params, {
                    confirmationId,
                    userId: 'user-1', // TODO: Get from auth
                })

                toolResults.push({ toolName, result })

                // Collect display/navigation/confirmation instructions
                if (result.display && !display) {
                    display = result.display
                }
                if (result.navigation && !navigation) {
                    navigation = result.navigation
                }
                if (result.confirmationRequired && !confirmationRequired) {
                    confirmationRequired = result.confirmationRequired
                }
            }

            // Build response message from tool results
            let responseContent = message.content || ''

            // Add tool result messages
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

            // If there was a confirmation request, add helpful message
            if (confirmationRequired) {
                if (responseContent) responseContent += '\n\n'
                responseContent += '👆 Granska informationen ovan och bekräfta för att fortsätta.'
            }

            // Return structured response
            const chatResponse: ChatResponse = {
                content: responseContent,
                toolResults,
                display,
                navigation,
                confirmationRequired,
            }

            return new Response(
                JSON.stringify(chatResponse),
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                        'X-RateLimit-Reset': String(rateLimitResult.resetTime),
                    },
                }
            )
        }

        // === 9. No Tool Calls - Return Text Response ===
        // For simple responses, we can still use streaming
        const chatResponse: ChatResponse = {
            content: message.content || '',
        }

        return new Response(
            JSON.stringify(chatResponse),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                    'X-RateLimit-Reset': String(rateLimitResult.resetTime),
                },
            }
        )
    } catch (error) {
        console.error('Chat API error:', error)

        // Don't expose internal error details to client
        return new Response(
            JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}
