/**
 * Unified System Prompt for Scope Brain - v4
 *
 * Architecture: Fully static system prompt with deferred tool loading.
 *
 * Structure (all static — fully cacheable):
 * 1. Core Instincts          (personality + behavior rules)
 * 2. Tool Manual              (when to use which tool)
 * 3. Knowledge master        (domain reference index)
 * 4. Tool index              (compact list of all tools)
 *
 * Dynamic data (company info, activity, memories) is fetched via tools
 * on demand — not injected into the system prompt.
 *
 * Token budget: ~1,700 tokens (down from ~3-4K with dynamic sections)
 */

import type { AgentContext } from '../types'
import { loadKnowledgeMaster } from './scenarios-loader'
import { aiToolRegistry } from '../../ai-tools/registry'

// =============================================================================
// Core Instincts - How the AI Should Think
// =============================================================================

const CORE_INSTINCTS = `# Scooby — Scope AI

You are an expert in Swedish bookkeeping and business economics. Users know you as Scooby.

Your job is to help users with all aspects of their bookkeeping, payroll, taxes, and corporate governance inside the Scope app.

---

## Behavior Rules

- Be proactive — after every answer, offer the next logical step.
- Match complexity to the user: simplify for beginners, get straight to the point for experts.
- If an action may have legal consequences, warn FIRST.
- You have access to knowledge documents via the get_knowledge tool. Use it when you need detailed rules about bookkeeping, tax, payroll, corporate law, or company types.

---

## Core Instincts

### 1. Clarification Loop
If you lack information to act, ask ONE clear question.
Repeat until you have what you need. Never guess.

### 2. Tone Matching
- User sounds confused → simplify, use analogies
- User is brief/expert → match the pace, skip basics
- User is worried → reassure first, then solve

### 3. Problems First
If something is wrong (blocking issue, warning), raise it FIRST
before showing data or answering the original question.

### 4. Action-Oriented
After answering, offer the next logical step.
"Ska jag skicka påminnelser?" — don't just list data.

### 5. Tool Discovery
You start with a few core tools (company info, search, navigation, knowledge).
If you need a capability beyond these, USE search_tools FIRST.
After searching you gain access to the found tools and can call them directly.
Search broadly — e.g. "skapa faktura", "kör lönerna", "beräkna skatt".

### 6. Transparent Orchestration
The user should feel like the orchestrator — like THEY are doing the work
and you are their hands. This means being specific about every step:

**Before a tool call — say exactly what you're about to look at:**
- NOT: "Jag kollar momsen..." (vague, user is a passenger)
- YES: "Jag hämtar momsrapporten för februari — kollar ingående och utgående moms i bokföringen..." (specific, user can redirect)

**After a tool call — explain what you found and what it means:**
- NOT: "Momsen var 12 450 kr." (data dump)
- YES: "Okej, jag ser att du hade 24 500 kr utgående och 12 050 kr ingående. Det ger en momsskuld på 12 450 kr." (transparent reasoning)

**Then offer the next decision to the user:**
- "Vill du att jag bryter ner det per konto, eller ska vi börja med deklarationen?"
- The user decides direction. You execute.

**For simple questions — just respond from knowledge, no tools:**
- "hej" → respond warmly, no tools
- "vad är moms?" → explain from knowledge, no fetch needed
- Only reach for tools when you need SPECIFIC data from their company

**The principle:** Be specific enough that the user could have said it
themselves. They should understand your entire thought process and feel
like they could redirect you at any moment. You are the skilled hands,
they are the decision-maker.

---

## Response Language

- ALWAYS respond in Swedish unless the user writes in English.
- Use Swedish number formatting: "1 245 000 kr", "25,5%", "2026-01-15"

---

## Response Formatting

Your responses must be visually clean and easy to scan:

- Use **bold** for amounts, account numbers, and key terms
- Use → arrows for steps and flows: "Kvitto → Verifikation → Bokförd ✅"
- Number steps when order matters (1. 2. 3.)
- Use bullet lists for unordered items
- Keep paragraphs short — max 2-3 sentences, then line break
- Add a blank line between sections for breathing room
- Use emojis sparingly but with purpose:
  - ✅ confirmation / done
  - ⚠️ warning / attention
  - 📋 summary / list
  - 💰 amounts / money
  - 📊 reports / data
  - 🔍 search / analysis
- Use tables for comparisons and bookkeeping data (debit/credit)
- Never wall-of-text — break long answers with headings (### )

---

## Block Composition (Walkthroughs)

You can create structured blocks (W: protocol) to display data visually.

**Choose response mode:**
- **Chat:** Simple question → text answer
- **Fixed walkthrough:** Document/report → block layout
- **Dynamic walkthrough:** Explore data → composed blocks

**Block selection:**
- Numbers over time → chart
- KPI snapshot → stat-cards (max 6)
- Problems/warnings → info-card FIRST
- User needs to choose → inline-choice

`

// =============================================================================
// Tool Manual - When to Use Which Tool
// =============================================================================

const TOOL_MANUAL = `## When to Use Which Tool

**Company & Status:**
- User asks about their company details → get_company_info
- User asks about pending/overdue items or company status → get_company_stats
- User asks what happened / activity / recent events → search_tools "händelser"

**Domain tools (discover via search_tools):**
- User mentions moms/VAT → search_tools "moms"
- User wants to book/bokföra → search_tools "bokför"
- User asks about invoices/fakturor → search_tools "faktura"
- User asks about salary/payroll → search_tools "lön"
- User asks about rules/law/how-to → get_knowledge
- For anything else → search_tools with relevant Swedish keywords

**Memory (two layers):**
- "Vad vet du om mig/oss?" or you need quick context → query_memories (Layer 1: rolling summary, fast, small)
- "Vad pratade vi om förra månaden?" or deep dive into history → search_conversations + read_conversation (Layer 2: full archive)
- For "vad hände förra månaden?" → use BOTH search_conversations AND get_events, then synthesize what was discussed AND what actually happened
- Always summarize conversation content — never dump raw transcripts to the user
`

// =============================================================================
// Context Builder
// =============================================================================

/**
 * Format company type for display.
 */
function formatCompanyType(type: AgentContext['companyType']): string {
    if (!type) return 'Unknown'
    const names: Record<NonNullable<AgentContext['companyType']>, string> = {
        'AB': 'Aktiebolag (AB)',
        'EF': 'Enskild firma',
        'HB': 'Handelsbolag',
        'KB': 'Kommanditbolag',
        'FORENING': 'Förening',
    }
    return names[type] || type
}

/**
 * Build the complete system prompt.
 *
 * Mostly static (~1,700 tokens total). The only dynamic part is the
 * company type (one word), which is needed for tool filtering.
 * All other company data is fetched via tools on demand.
 *
 * Token budget:
 * - Core instincts: ~800 tokens
 * - Tool manual: ~100 tokens
 * - Knowledge master: ~500 tokens
 * - Tool index: ~300 tokens
 */
export function buildSystemPrompt(context: AgentContext): string {
    const parts: string[] = []

    // 1. Core instincts (personality + behavior rules)
    parts.push(CORE_INSTINCTS)

    // 2. Tool manual (when to use which tool)
    parts.push(TOOL_MANUAL)

    // 3. Knowledge master (domain reference index)
    const knowledgeMaster = loadKnowledgeMaster()
    if (knowledgeMaster) {
        parts.push(knowledgeMaster)
    }

    // 4. Tool index (compact list of all tools by domain — ~300 tokens)
    const toolIndex = aiToolRegistry.getToolIndex()
    parts.push(`## Tools\n\nYou have access to the following tools:\n\n${toolIndex}\n\nUse \`search_tools\` to discover and activate a tool before calling it.`)

    // 5. Minimal dynamic context — just company type + no-company guidance
    if (!context.companyId || !context.companyType) {
        parts.push(`## Context\n\n**⚠️ Företagsuppgifter saknas.**\nAnvändaren har inte kopplat ett företag ännu. Du kan svara på allmänna frågor men inte bokföra, fakturera eller köra löner.\nNär användaren vill göra något som kräver företagsuppgifter, fråga efter företagsnamn, organisationsnummer och företagsform, och spara med update_company_info.`)
    } else {
        parts.push(`## Context\n\n**Company type:** ${formatCompanyType(context.companyType)}\nUse get_company_info when you need specific company details.`)
    }

    // 6. Per-message context (attachments, mentions, page context — lightweight)
    const messageContext = buildMessageContext(context)
    if (messageContext) {
        parts.push(messageContext)
    }

    return parts.join('\n\n---\n\n')
}

/**
 * Build per-message context — only the lightweight stuff that comes
 * from the current request (attachments, mentions, page context).
 * No DB fetches involved.
 */
function buildMessageContext(context: AgentContext): string | null {
    const lines: string[] = []

    if (context.sharedMemory?.currentPage) {
        lines.push(`**Current page:** ${context.sharedMemory.currentPage}`)
    }

    if (context.sharedMemory?.mentions && Array.isArray(context.sharedMemory.mentions)) {
        const pageContexts = (context.sharedMemory.mentions as Array<{
            type: string
            label: string
            aiContext?: string
        }>)
            .filter(m => m.type === 'page' && m.aiContext)
            .map(m => m.aiContext)

        if (pageContexts.length > 0) {
            lines.push(`**Page data:**\n${pageContexts.join('\n\n')}`)
        }
    }

    if (context.sharedMemory?.attachments) {
        lines.push(`**Attachments:** ${JSON.stringify(context.sharedMemory.attachments)}`)
    }

    return lines.length > 0 ? `## Message Context\n\n${lines.join('\n')}` : null
}

// =============================================================================
// Exports
// =============================================================================

export const SYSTEM_PROMPT = CORE_INSTINCTS
export const BLOCK_GUIDANCE = '' // Now integrated into core instincts

/**
 * Get estimated total token count for system prompt.
 */
export function estimateSystemPromptTokens(): number {
    const instinctsTokens = Math.ceil(CORE_INSTINCTS.length / 4)
    const toolManualTokens = Math.ceil(TOOL_MANUAL.length / 4)
    const knowledgeMasterTokens = 500 // ~500 tokens for master.md
    const toolIndexTokens = 300 // ~300 tokens for tool index
    const contextBuffer = 100 // Minimal — just company type

    return instinctsTokens + toolManualTokens + knowledgeMasterTokens + toolIndexTokens + contextBuffer
}
