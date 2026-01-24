/**
 * Intent Router
 * 
 * Classifies user intent using LLM or rule-based matching.
 * Fast classification to determine which agent should handle a request.
 */

import type {
    Intent,
    IntentCategory,
    IntentEntity,
    AgentContext,
    AgentDomain,
} from '../types'

// =============================================================================
// Intent Classification
// =============================================================================

/**
 * Keyword patterns for quick classification.
 */
const INTENT_PATTERNS: Record<IntentCategory, RegExp[]> = {
    RECEIPT: [
        /kvitto/i,
        /utgift/i,
        /utlägg/i,
        /expense/i,
        /receipt/i,
        /kostnad.*bokför/i,
        /ladda.*upp.*bild/i,
    ],
    INVOICE: [
        /faktura/i,
        /invoice/i,
        /kund.*faktura/i,
        /skicka.*faktura/i,
        /betalning.*kund/i,
        /förfall/i,
        /påminnelse/i,
    ],
    BOOKKEEPING: [
        /bokför/i,
        /verifikation/i,
        /kontering/i,
        /transaktion/i,
        /konto\s*\d/i,
        /debet|kredit/i,
        /huvudbok/i,
        /BAS\s*konto/i,
    ],
    PAYROLL: [
        /lön/i,
        /salary/i,
        /payroll/i,
        /anställd/i,
        /arbetsgivar/i,
        /skatteavdrag/i,
        /skattetabell/i,
        /AGI/i,
        /förmån/i,
        /friskvård/i,
        /tjänstebil/i,
    ],
    TAX: [
        /moms/i,
        /VAT/i,
        /skatt(?!e.*tabell)/i,
        /deklaration/i,
        /ink2/i,
        /periodisering/i,
        /K10/i,
        /skatteverket/i,
        /F-skatt/i,
    ],
    REPORTING: [
        /rapport/i,
        /resultaträkning/i,
        /balansräkning/i,
        /P&L/i,
        /nyckeltal/i,
        /jämför.*period/i,
        /årsredovisning/i,
        /bokslut/i,
    ],
    COMPLIANCE: [
        /deadline/i,
        /förfall.*datum/i,
        /myndighet/i,
        /bolagsverket/i,
        /anmäl/i,
        /registrer/i,
        /årsstämma/i,
        /styrelse/i,
    ],
    STATISTICS: [
        /statistik/i,
        /KPI/i,
        /soliditet/i,
        /kassalikviditet/i,
        /hur.*går.*det/i,
        /trend/i,
        /utveckling/i,
        /jämför.*förra/i,
    ],
    EVENTS: [
        /händelse/i,
        /aktivitet/i,
        /tidslinje/i,
        /historik/i,
        /vad.*hänt/i,
        /logg/i,
        /utdelning/i,
        /kapitalförändring/i,
    ],
    SETTINGS: [
        /inställning/i,
        /settings/i,
        /koppla.*bank/i,
        /integration/i,
        /användare/i,
        /team/i,
        /prenumeration/i,
        /plan/i,
        /språk/i,
        /notis/i,
    ],
    NAVIGATION: [
        /^gå till/i,
        /^öppna/i,
        /^visa/i,
        /^navigate/i,
        /^go to/i,
        /^open/i,
        /^show me/i,
    ],
    GENERAL: [],  // Fallback
    MULTI_DOMAIN: [],  // Detected by having multiple high-confidence matches
}

/**
 * Entity extraction patterns.
 */
const ENTITY_PATTERNS: Record<IntentEntity['type'], RegExp[]> = {
    amount: [
        /(\d[\d\s]*(?:[,\.]\d{1,2})?)(?:\s*(?:kr|sek|kronor|:-|SEK))/gi,
        /SEK\s*(\d[\d\s]*(?:[,\.]\d{1,2})?)/gi,
    ],
    date: [
        /(\d{4}-\d{2}-\d{2})/g,
        /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/g,
        /(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\s*\d{4}/gi,
        /(Q[1-4])\s*\d{4}/gi,
    ],
    account: [
        /konto\s*(\d{4})/gi,
        /(\d{4})\s*(?:debet|kredit)/gi,
    ],
    person: [
        /(?:för|till|från)\s+([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)?)/g,
    ],
    period: [
        /(denna månad|förra månaden|i år|förra året)/gi,
        /(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)/gi,
        /(Q[1-4])/gi,
    ],
    company: [],
    document: [],
    other: [],
}

// =============================================================================
// Classification Logic
// =============================================================================

/**
 * Classify user intent using pattern matching.
 * For production, this would call an LLM for more accurate classification.
 */
export async function classifyIntent(
    message: string,
    context: AgentContext
): Promise<Intent> {
    const scores: Record<IntentCategory, number> = {
        RECEIPT: 0,
        INVOICE: 0,
        BOOKKEEPING: 0,
        PAYROLL: 0,
        TAX: 0,
        REPORTING: 0,
        COMPLIANCE: 0,
        STATISTICS: 0,
        EVENTS: 0,
        SETTINGS: 0,
        NAVIGATION: 0,
        GENERAL: 0,
        MULTI_DOMAIN: 0,
    }

    // Score each category based on pattern matches
    for (const [category, patterns] of Object.entries(INTENT_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(message)) {
                scores[category as IntentCategory] += 1
            }
        }
    }

    // Find the best match
    let bestCategory: IntentCategory = 'GENERAL'
    let bestScore = 0
    let secondBestScore = 0

    for (const [category, score] of Object.entries(scores)) {
        if (score > bestScore) {
            secondBestScore = bestScore
            bestScore = score
            bestCategory = category as IntentCategory
        } else if (score > secondBestScore) {
            secondBestScore = score
        }
    }

    // Check if multiple domains are equally relevant
    const requiresMultiAgent = secondBestScore > 0 && (bestScore - secondBestScore) <= 1

    // Extract entities
    const entities = extractEntities(message)

    // Calculate confidence
    const confidence = bestScore > 0 ? Math.min(0.5 + (bestScore * 0.15), 0.95) : 0.3

    return {
        category: bestCategory,
        confidence,
        subIntent: detectSubIntent(message, bestCategory),
        entities,
        requiresMultiAgent,
        suggestedAgents: requiresMultiAgent ? getSuggestedAgents(scores) : undefined,
    }
}

/**
 * Extract entities from the message.
 */
function extractEntities(message: string): IntentEntity[] {
    const entities: IntentEntity[] = []

    for (const [type, patterns] of Object.entries(ENTITY_PATTERNS)) {
        for (const pattern of patterns) {
            const regex = new RegExp(pattern.source, pattern.flags)
            let match

            while ((match = regex.exec(message)) !== null) {
                entities.push({
                    type: type as IntentEntity['type'],
                    value: match[1] || match[0],
                    raw: match[0],
                    confidence: 0.8,
                })
            }
        }
    }

    return entities
}

/**
 * Detect sub-intent (action type).
 */
function detectSubIntent(message: string, category: IntentCategory): string {
    const lowerMessage = message.toLowerCase()

    if (/skapa|ny|lägg till|create|add|new/.test(lowerMessage)) return 'create'
    if (/visa|hämta|get|show|list/.test(lowerMessage)) return 'query'
    if (/uppdatera|ändra|edit|update|change/.test(lowerMessage)) return 'update'
    if (/ta bort|radera|delete|remove/.test(lowerMessage)) return 'delete'
    if (/skicka|submit|send/.test(lowerMessage)) return 'submit'
    if (/analysera|analys|analyze|analysis/.test(lowerMessage)) return 'analyze'
    if (/jämför|compare/.test(lowerMessage)) return 'compare'
    if (/generera|generate/.test(lowerMessage)) return 'generate'

    return 'query'  // Default
}

/**
 * Get suggested agents for multi-domain requests.
 */
function getSuggestedAgents(scores: Record<IntentCategory, number>): AgentDomain[] {
    const categoryToAgent: Record<IntentCategory, AgentDomain> = {
        RECEIPT: 'receipts',
        INVOICE: 'invoices',
        BOOKKEEPING: 'bokforing',
        PAYROLL: 'loner',
        TAX: 'skatt',
        REPORTING: 'rapporter',
        COMPLIANCE: 'compliance',
        STATISTICS: 'statistik',
        EVENTS: 'handelser',
        SETTINGS: 'installningar',
        NAVIGATION: 'orchestrator',
        GENERAL: 'orchestrator',
        MULTI_DOMAIN: 'orchestrator',
    }

    return Object.entries(scores)
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => categoryToAgent[category as IntentCategory])
}

// =============================================================================
// LLM-based Classification (Production)
// =============================================================================

/**
 * Classify intent using LLM for more accurate results.
 * Use this in production for complex queries.
 */
export async function classifyIntentWithLLM(
    message: string,
    context: AgentContext,
    model = 'gpt-4o-mini'
): Promise<Intent> {
    // For now, fall back to pattern matching
    // In production, this would call the LLM
    return classifyIntent(message, context)
    
    // Production implementation would be:
    // const response = await openai.chat.completions.create({
    //     model,
    //     messages: [
    //         { role: 'system', content: CLASSIFICATION_PROMPT },
    //         { role: 'user', content: message }
    //     ],
    //     response_format: { type: 'json_object' }
    // })
    // return parseClassificationResponse(response)
}
