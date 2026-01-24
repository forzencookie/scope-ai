/**
 * LLM-based Intent Classification
 * 
 * Production-quality intent classification using actual LLM calls.
 * Falls back to pattern matching if LLM call fails.
 */

import type {
    Intent,
    IntentCategory,
    IntentEntity,
    AgentContext,
    AgentDomain,
} from '../types'
import { classifyIntent as patternClassify } from './router'

// =============================================================================
// Classification Prompt
// =============================================================================

const CLASSIFICATION_SYSTEM_PROMPT = `You are an intent classifier for a Swedish accounting platform called Scope.
Your job is to classify user messages into categories and extract entities.

## Categories
- RECEIPT: Handling receipts, expenses, uploads of receipt images
- INVOICE: Customer invoices, sending invoices, payment tracking
- BOOKKEEPING: Transactions, verifications, chart of accounts, booking entries
- PAYROLL: Salaries, benefits, AGI declarations, employee management
- TAX: VAT/moms, income tax, K10, periodiseringsfonder
- REPORTING: Financial reports, P&L, balance sheet, comparisons
- COMPLIANCE: Deadlines, authority filings, annual meetings
- STATISTICS: KPIs, company health, trends, analytics
- EVENTS: Activity timeline, corporate actions, history
- SETTINGS: Configuration, integrations, user management
- NAVIGATION: User wants to go to a specific page
- GENERAL: Chitchat, greetings, unclear requests
- MULTI_DOMAIN: Request spans multiple categories

## Entity Types
- amount: Money values (e.g., "450 kr", "10 000 SEK")
- date: Dates or time references
- account: Account numbers (e.g., "konto 5410")
- person: Names of people
- period: Time periods (e.g., "Q1", "januari", "förra året")
- company: Company names
- document: Document types

## Response Format
Return JSON only:
{
    "category": "CATEGORY_NAME",
    "confidence": 0.0-1.0,
    "subIntent": "create|query|update|delete|submit|analyze|compare|generate",
    "entities": [
        {"type": "amount", "value": "450", "raw": "450 kr"}
    ],
    "requiresMultiAgent": false,
    "suggestedAgents": ["agent1", "agent2"]
}

Be concise. Always respond with valid JSON only.`

// =============================================================================
// LLM Classification
// =============================================================================

interface ClassificationResult {
    category: IntentCategory
    confidence: number
    subIntent?: string
    entities: Array<{ type: string; value: string; raw: string }>
    requiresMultiAgent?: boolean
    suggestedAgents?: string[]
}

/**
 * Classify intent using LLM.
 */
export async function classifyWithLLM(
    message: string,
    context: AgentContext,
    options: {
        model?: string
        provider?: 'openai' | 'anthropic' | 'google'
        timeout?: number
    } = {}
): Promise<Intent> {
    const { model = 'gpt-4o-mini', provider = 'openai', timeout = 5000 } = options

    try {
        const result = await callLLMForClassification(message, context, provider, model, timeout)
        return parseClassificationResult(result)
    } catch (error) {
        console.warn('[IntentClassifier] LLM classification failed, falling back to patterns:', error)
        return patternClassify(message, context)
    }
}

/**
 * Call the LLM for classification.
 */
async function callLLMForClassification(
    message: string,
    context: AgentContext,
    provider: string,
    model: string,
    timeout: number
): Promise<ClassificationResult> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
        if (provider === 'openai') {
            return await classifyWithOpenAI(message, context, model, controller.signal)
        } else if (provider === 'anthropic') {
            return await classifyWithAnthropic(message, context, model, controller.signal)
        } else if (provider === 'google') {
            return await classifyWithGoogle(message, context, model, controller.signal)
        }
        throw new Error(`Unknown provider: ${provider}`)
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * OpenAI classification.
 */
async function classifyWithOpenAI(
    message: string,
    context: AgentContext,
    model: string,
    signal: AbortSignal
): Promise<ClassificationResult> {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await openai.chat.completions.create({
        model,
        messages: [
            { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
            { role: 'user', content: buildClassificationPrompt(message, context) }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 200,
        temperature: 0,
    }, { signal })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No response from OpenAI')
    
    return JSON.parse(content)
}

/**
 * Anthropic classification.
 */
async function classifyWithAnthropic(
    message: string,
    context: AgentContext,
    model: string,
    signal: AbortSignal
): Promise<ClassificationResult> {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: CLASSIFICATION_SYSTEM_PROMPT,
        messages: [
            { role: 'user', content: buildClassificationPrompt(message, context) }
        ],
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')
    
    return JSON.parse(content.text)
}

/**
 * Google classification.
 */
async function classifyWithGoogle(
    message: string,
    context: AgentContext,
    model: string,
    signal: AbortSignal
): Promise<ClassificationResult> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
    
    const genModel = genAI.getGenerativeModel({ 
        model: model || 'gemini-2.0-flash',
        generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 200,
            temperature: 0,
        }
    })

    const result = await genModel.generateContent([
        CLASSIFICATION_SYSTEM_PROMPT,
        buildClassificationPrompt(message, context)
    ])

    const text = result.response.text()
    return JSON.parse(text)
}

/**
 * Build the classification prompt with context.
 */
function buildClassificationPrompt(message: string, context: AgentContext): string {
    let prompt = `Classify this message:\n\n"${message}"\n\n`
    
    if (context.companyType) {
        prompt += `Context: Company type is ${context.companyType}.\n`
    }
    
    if (context.locale) {
        prompt += `Language: ${context.locale === 'sv' ? 'Swedish' : 'English'}\n`
    }
    
    return prompt
}

/**
 * Parse and validate the classification result.
 */
function parseClassificationResult(result: ClassificationResult): Intent {
    // Validate category
    const validCategories: IntentCategory[] = [
        'RECEIPT', 'INVOICE', 'BOOKKEEPING', 'PAYROLL', 'TAX',
        'REPORTING', 'COMPLIANCE', 'STATISTICS', 'EVENTS', 'SETTINGS',
        'NAVIGATION', 'GENERAL', 'MULTI_DOMAIN'
    ]
    
    const category = validCategories.includes(result.category as IntentCategory)
        ? result.category as IntentCategory
        : 'GENERAL'

    // Validate confidence
    const confidence = typeof result.confidence === 'number'
        ? Math.max(0, Math.min(1, result.confidence))
        : 0.5

    // Parse entities
    const entities: IntentEntity[] = (result.entities || []).map(e => ({
        type: e.type as IntentEntity['type'],
        value: e.value || '',
        raw: e.raw || e.value || '',
        confidence: 0.8,
    }))

    // Parse suggested agents
    const suggestedAgents = result.suggestedAgents?.map(a => a as AgentDomain)

    return {
        category,
        confidence,
        subIntent: result.subIntent,
        entities,
        requiresMultiAgent: result.requiresMultiAgent || false,
        suggestedAgents,
    }
}

/**
 * Smart classification that uses LLM in production, patterns in development.
 */
export async function smartClassify(
    message: string,
    context: AgentContext
): Promise<Intent> {
    // Use LLM in production if API keys are available
    if (process.env.NODE_ENV === 'production' && process.env.OPENAI_API_KEY) {
        return classifyWithLLM(message, context)
    }
    
    // Fall back to pattern matching
    return patternClassify(message, context)
}
