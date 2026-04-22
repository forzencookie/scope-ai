/**
 * Chat API - Vercel AI SDK Integration
 *
 * Architecture: Gate → Stream → Persist
 * - Gate: Auth, budget, company type (blocking, ~50ms)
 * - Stream: Build prompt, call OpenAI, stream immediately
 * - Persist: Save messages + consume tokens in onFinish
 *
 * Sources:
 * - https://sdk.vercel.ai/docs/ai-sdk-ui/storing-messages
 * - https://developers.openai.com/api/docs/guides/latency-optimization
 */

import { NextRequest } from 'next/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter'
import { validateJsonBody } from '@/lib/validation'
import { getAuthContext, verifyAuth, ApiResponse } from "@/lib/database/auth-server"
import {
    checkUsageLimits,
    consumeTokens,
    authorizeModel
} from '@/lib/model-auth'
import { DEFAULT_MODEL_ID } from '@/lib/ai/models'
import { getContextWindow } from '@/lib/ai/model-registry'
import fs from 'fs'
import path from 'path'
import { initializeAITools } from '@/lib/ai-tools'
import { createAgentContext } from '@/lib/agents/types'
import type { AgentContext } from '@/lib/agents/types'
import { selectModel, getModelId } from '@/lib/agents/scope-brain/model-selector'
import { createDeferredToolConfig } from '@/lib/ai-tools/vercel-adapter'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

// =============================================================================
// System Prompt — cold load only (main.md + context block)
// Skills load on demand via read_skill. Domain tools via request_tools.
// =============================================================================

const PROMPT_DIR = path.join(process.cwd(), 'src', 'lib', 'agents', 'scope-brain', 'prompt')

const COMPANY_TYPE_NAMES: Record<string, string> = {
    AB: 'Aktiebolag (AB)',
    EF: 'Enskild firma (EF)',
    HB: 'Handelsbolag (HB)',
    KB: 'Kommanditbolag (KB)',
    FORENING: 'Förening',
}

function buildSystemPrompt(context: AgentContext): string {
    const parts: string[] = []

    const mainPath = path.join(PROMPT_DIR, 'main.md')
    const main = fs.existsSync(mainPath) ? fs.readFileSync(mainPath, 'utf-8').trim() : ''
    if (main) parts.push(main)

    const today = new Date().toISOString().slice(0, 10)
    if (!context.companyId || !context.companyType) {
        parts.push(
            `## Context\n\nDatum: **${today}**\n\n⚠️ Ingen företagsprofil kopplad. Du kan svara på allmänna frågor men inte bokföra, fakturera eller köra löner. När användaren vill göra något som kräver företagsuppgifter — fråga efter företagsnamn, organisationsnummer och företagsform och spara med update_company_info.`
        )
    } else {
        const typeName = COMPANY_TYPE_NAMES[context.companyType] ?? context.companyType
        parts.push(
            `## Context\n\nDatum: **${today}**\nFöretagstyp: **${typeName}**\n\nAnvänd get_company_info när du behöver specifika företagsuppgifter.`
        )
    }

    const msgLines: string[] = []
    if (context.sharedMemory?.currentPage) {
        msgLines.push(`**Aktuell sida:** ${context.sharedMemory.currentPage}`)
    }
    if (context.sharedMemory?.mentions && Array.isArray(context.sharedMemory.mentions)) {
        const mentionContexts = (context.sharedMemory.mentions as Array<{ type: string; label: string; aiContext?: string; walkthroughType?: string }>)
            .filter(m => m.aiContext)
            .map(m => m.aiContext as string)
        if (mentionContexts.length > 0) {
            msgLines.push(`**Förvalt intent (mention):**\n${mentionContexts.join('\n\n')}`)
        }
    }
    if (context.sharedMemory?.attachments) {
        msgLines.push(`**Bilagor:** ${JSON.stringify(context.sharedMemory.attachments)}`)
    }
    if (msgLines.length > 0) parts.push(`## Message Context\n\n${msgLines.join('\n')}`)

    return parts.join('\n\n---\n\n')
}

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
// Helpers
// =============================================================================

/**
 * Extract text content from a message regardless of format.
 * Vercel AI SDK v4+ may send `parts` array instead of flat `content` string.
 */
function extractMessageContent(msg: Record<string, unknown>): string {
    // Standard format: content is a string
    if (typeof msg.content === 'string') return msg.content

    // Vercel AI SDK v4 format: content is an array of parts
    if (Array.isArray(msg.content)) {
        const textPart = msg.content.find(
            (p: unknown) => typeof p === 'object' && p !== null && (p as Record<string, unknown>).type === 'text'
        )
        if (textPart && typeof (textPart as Record<string, unknown>).text === 'string') {
            return (textPart as Record<string, string>).text
        }
    }

    // UIMessage format: parts array at top level
    if (Array.isArray(msg.parts)) {
        const textPart = msg.parts.find(
            (p: unknown) => typeof p === 'object' && p !== null && (p as Record<string, unknown>).type === 'text'
        )
        if (textPart && typeof (textPart as Record<string, unknown>).text === 'string') {
            return (textPart as Record<string, string>).text
        }
    }

    return ''
}

const COMPACT_AT_PERCENT = 0.80
const SYSTEM_PROMPT_RESERVED = 1_500
const KEEP_RECENT = 8

function estimateMessageTokens(messages: Array<{ content: string }>): number {
    return messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0)
}

function getCompactThreshold(modelId: string): number {
    const contextWindow = getContextWindow(modelId)
    return Math.floor(contextWindow * COMPACT_AT_PERCENT) - SYSTEM_PROMPT_RESERVED
}

// Compact long conversation history into a summary + recent messages.
// Scooby always has full context — old messages are summarised, never silently dropped.
async function compactMessageHistory(
    messages: Array<Record<string, unknown>>,
    modelId: string,
): Promise<Array<{ role: string; content: string }>> {
    const mapped = messages.map(m => ({
        role: m.role as string,
        content: extractMessageContent(m),
    }))

    if (estimateMessageTokens(mapped) <= getCompactThreshold(modelId)) return mapped

    const oldMessages = mapped.slice(0, mapped.length - KEEP_RECENT)
    const recentMessages = mapped.slice(mapped.length - KEEP_RECENT)

    const transcript = oldMessages
        .map(m => `${m.role === 'user' ? 'Användare' : 'Scooby'}: ${m.content.slice(0, 500)}`)
        .join('\n\n')

    try {
        const { default: OpenAI } = await import('openai')
        const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const completion = await openaiClient.chat.completions.create({
            model: 'gpt-5-mini',
            temperature: 0.1,
            max_tokens: 400,
            messages: [
                {
                    role: 'system',
                    content: 'Sammanfatta konversationen koncist på svenska. Fokusera på: beslut som tagits, åtgärder som utförts, och viktigt kontext för att förstå de senaste meddelandena. Max 300 ord.',
                },
                { role: 'user', content: transcript },
            ],
        })

        const summary = completion.choices[0]?.message?.content
        if (summary) {
            return [
                { role: 'system', content: `[Tidigare konversation — sammanfattning]\n${summary}` },
                ...recentMessages,
            ]
        }
    } catch (e) {
        console.warn('[Chat] Compaction failed, using recent messages only:', e)
    }

    return recentMessages
}

/**
 * Map company_type string from DB to strict union type.
 */
function parseCompanyType(raw: string | null): 'AB' | 'EF' | 'HB' | 'KB' | 'FORENING' {
    const upper = (raw || '').toUpperCase()
    if (upper === 'EF') return 'EF'
    if (upper === 'HB') return 'HB'
    if (upper === 'KB') return 'KB'
    if (upper === 'FORENING') return 'FORENING'
    return 'AB'
}

// =============================================================================
// POST handler
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        // =====================================================================
        // GATE — blocking checks (~50ms total)
        // =====================================================================

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

        const typedBody = body as Record<string, unknown>
        const messages = typedBody.messages as Array<Record<string, unknown>>
        const conversationId = typeof typedBody.conversationId === 'string' ? typedBody.conversationId : undefined
        const attachments = typedBody.attachments as Array<{ name: string; type: string; data: string }> | undefined
        const mentions = typedBody.mentions as Array<{ type: string; label: string; aiContext?: string }> | undefined
        const requestedModel = typeof typedBody.model === 'string' ? typedBody.model : undefined
        const incognito = (typedBody.incognito as boolean) || false
        const confirmationId = typeof typedBody.confirmationId === 'string' ? typedBody.confirmationId : undefined

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(JSON.stringify({ error: 'Messages array is required' }), { status: 400 })
        }

        // Extract latest user content (handles both flat string and parts array)
        const latestUserMessage = messages.filter(m => m.role === 'user').pop()
        const latestContent = latestUserMessage ? extractMessageContent(latestUserMessage) : ''

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

        // Company type — fast path, one field only.
        // All other company data is fetched via get_company_info tool on demand.
        let companyType: 'AB' | 'EF' | 'HB' | 'KB' | 'FORENING' | null = null

        if (companyId) {
            const { data: company } = await supabase
                .from('companies')
                .select('company_type')
                .eq('id', companyId)
                .single()

            if (company) {
                companyType = parseCompanyType(company.company_type)
            }
        }

        // =====================================================================
        // STREAM — build context and start streaming immediately
        // No DB enrichment here — Scooby fetches data via tools on demand.
        // =====================================================================

        ensureToolsInitialized()

        const context = createAgentContext({
            userId,
            companyId,
            companyType,
            locale: 'sv',
            conversationId,
            messages: messages.map(m => {
                const role: 'user' | 'assistant' = m.role === 'user' ? 'user' : 'assistant'
                return {
                    id: crypto.randomUUID(),
                    role,
                    content: extractMessageContent(m),
                    timestamp: new Date(),
                }
            }),
        })

        // Lightweight per-message context (no DB calls)
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
            isConfirmed: !!confirmationId,
            confirmationId,
            companyType: context.companyType ?? undefined,
        })

        const modelConfig = selectModel(latestContent)
        const activeModelId = getModelId(modelConfig)

        const compactedMessages = await compactMessageHistory(messages, activeModelId)

        const result = streamText({
            model: openai(activeModelId),
            system: systemPrompt,
            messages: compactedMessages.map(m => ({
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content,
            })),
            ...deferredConfig,

            // =================================================================
            // PERSIST — save everything after stream completes
            // =================================================================
            onFinish: async ({ text, usage, toolCalls, toolResults }) => {
                // Consume tokens
                const totalTokens = usage?.totalTokens ?? 0
                if (totalTokens > 0) {
                    await consumeTokens(userId, totalTokens, authResult.modelId)
                        .catch(e => console.error('[Chat] Token consumption failed:', e))
                }

                // Save conversation + messages (both user and assistant)
                if (!incognito && conversationId) {
                    try {
                        // Ensure conversation exists
                        const title = latestContent.slice(0, 50) + (latestContent.length > 50 ? '...' : '') || 'Ny konversation'
                        await supabase
                            .from('conversations')
                            .upsert({ id: conversationId, title, user_id: userId }, { onConflict: 'id' })

                        // Save user message
                        if (latestContent) {
                            await supabase
                                .from('messages')
                                .insert({
                                    conversation_id: conversationId,
                                    role: 'user',
                                    content: latestContent,
                                    user_id: userId
                                })
                        }

                        // Save assistant message
                        const hasContent = text && text.trim().length > 0
                        const hasTools = toolCalls && toolCalls.length > 0
                        if (hasContent || hasTools) {
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
                        }
                    } catch (e) {
                        console.error('[Chat] Failed to persist conversation:', e)
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
            description: 'Vercel AI SDK architecture powered by GPT-5',
            features: [
                'Vercel AI SDK streamText',
                'All 60+ tools mapped',
                'Generative UI Ready',
            ],
            models: {
                default: 'gpt-5',
            },
        })
    } catch (error) {
        console.error('[Chat] GET error:', error)
        return Response.json({ error: 'Failed to get API info' }, { status: 500 })
    }
}
