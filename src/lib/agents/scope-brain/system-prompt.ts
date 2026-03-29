/**
 * Unified System Prompt for Scope Brain - v3
 *
 * Architecture: Instinct-first design with deferred tool loading.
 *
 * Structure (static → dynamic for prompt caching):
 * 1. Core Instincts          (static — never changes)        ← cacheable
 * 2. Knowledge master        (static — changes on deploy)    ← cacheable
 * 3. Tool index              (static — changes on deploy)    ← cacheable
 * --- cache boundary ---
 * 4. Company context         (dynamic — per request)
 * 5. Activity snapshot       (dynamic — per request)
 * 6. User memories           (dynamic — per request)
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
You start with a few core tools (search, transactions, verifications, navigation, knowledge).
If you need a capability beyond these, USE search_tools FIRST.
After searching you gain access to the found tools and can call them directly.
Search broadly — e.g. "skapa faktura", "kör lönerna", "beräkna skatt".

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
// Context Builder
// =============================================================================

/**
 * Build the complete system prompt with context.
 *
 * Token budget (~3-4k total):
 * - Core instincts: ~500 tokens
 * - Knowledge master: ~500 tokens
 * - Tool index: ~300 tokens
 * - Company context: ~2k tokens
 * - Buffer for memory: ~1k tokens
 */
export function buildSystemPrompt(context: AgentContext): string {
    const parts: string[] = []

    // === STATIC SECTION (cacheable) ===

    // 1. Core instincts
    parts.push(CORE_INSTINCTS)

    // 2. Knowledge master (Scooby's reference data + knowledge index)
    const knowledgeMaster = loadKnowledgeMaster()
    if (knowledgeMaster) {
        parts.push(knowledgeMaster)
    }

    // 3. Tool index (compact list of all tools by domain — ~300 tokens)
    const toolIndex = aiToolRegistry.getToolIndex()
    parts.push(`## Tools\n\nYou have access to the following tools:\n\n${toolIndex}\n\nUse \`search_tools\` to discover and activate a tool before calling it.`)

    // === DYNAMIC SECTION (per request) ===

    // 4. Company context
    parts.push(buildCompanyContext(context))

    // 5. Integration state (if available)
    const integrations = formatIntegrationState(context.sharedMemory)
    if (integrations) {
        parts.push(integrations)
    }

    // 6. Activity snapshot (if available)
    const snapshot = formatActivitySnapshot(context.sharedMemory)
    if (snapshot) {
        parts.push(snapshot)
    }

    // 7. User memory (if provided in context)
    const memory = formatUserMemory(context.sharedMemory)
    if (memory) {
        parts.push(memory)
    }

    return parts.join('\n\n---\n\n')
}

/**
 * Build company context section.
 * When no company is linked, injects a deficiency notice so Scooby
 * can guide users to complete onboarding or fill in settings.
 */
function buildCompanyContext(context: AgentContext): string {
    let section = `## Current Context\n\n`

    if (!context.companyId || !context.companyType) {
        section += `**⚠️ Företagsuppgifter saknas.**\n\n`
        section += `Användaren har inte fyllt i företagsuppgifter ännu.\n\n`
        section += `**Du KAN:**\n`
        section += `- Svara på allmänna frågor om bokföring, skatt, löner och företagande\n`
        section += `- Förklara regler och begrepp\n`
        section += `- Hjälpa användaren förstå vad Scope kan göra\n\n`
        section += `**Du KAN INTE utan företagsuppgifter:**\n`
        section += `- Bokföra transaktioner\n`
        section += `- Skapa fakturor\n`
        section += `- Köra löner eller beräkna skatt\n`
        section += `- Generera rapporter\n\n`
        section += `**När användaren vill göra något som kräver företagsuppgifter**, erbjud dig att samla in dem direkt i chatten. `
        section += `Fråga efter: företagsnamn, organisationsnummer och företagsform (AB, EF, HB, KB eller förening). `
        section += `Använd sedan verktyget update_company_info för att spara. `
        section += `Du behöver INTE skicka dem till en annan sida — du kan hantera det själv här.\n`
        return section
    }

    section += `**Company type:** ${formatCompanyType(context.companyType)}\n`

    if (context.companyName) {
        section += `**Company:** ${context.companyName}\n`
    }

    // Granular setup state — tells Scooby exactly what's missing
    const setupState = context.sharedMemory?.companySetupState as Record<string, boolean> | undefined
    if (setupState) {
        const missing = Object.entries(setupState)
            .filter(([, filled]) => !filled)
            .map(([key]) => key)

        if (missing.length > 0) {
            const labelMap: Record<string, string> = {
                orgNumber: 'Organisationsnummer',
                companyType: 'Företagstyp',
                address: 'Adress',
                city: 'Ort',
                zipCode: 'Postnummer',
                email: 'E-post',
                phone: 'Telefon',
                vatNumber: 'Momsregistreringsnummer',
                hasFSkatt: 'F-skatt (ja/nej)',
                hasMomsRegistration: 'Momsregistrering (ja/nej)',
                hasEmployees: 'Har anställda (ja/nej)',
                accountingMethod: 'Bokföringsmetod (fakturering/kontant)',
                fiscalYearEnd: 'Räkenskapsårets slut',
                registrationDate: 'Registreringsdatum',
            }

            const missingLabels = missing
                .filter(k => labelMap[k])
                .map(k => labelMap[k])

            section += `\n**⚠️ Ofullständig företagsprofil — saknas:** ${missingLabels.join(', ')}\n`
            section += `När användaren försöker göra något som kräver dessa uppgifter, fråga efter dem direkt i chatten `
            section += `och spara med update_company_info. Du behöver inte hänvisa till inställningar.\n`
        }
    }

    // Add page context if available
    if (context.sharedMemory?.currentPage) {
        section += `**Current page:** ${context.sharedMemory.currentPage}\n`
    }

    // Add any page mentions with their AI context
    if (context.sharedMemory?.mentions && Array.isArray(context.sharedMemory.mentions)) {
        const pageContexts = (context.sharedMemory.mentions as Array<{
            type: string
            label: string
            aiContext?: string
        }>)
            .filter(m => m.type === 'page' && m.aiContext)
            .map(m => m.aiContext)

        if (pageContexts.length > 0) {
            section += `\n**Page data:**\n${pageContexts.join('\n\n')}\n`
        }
    }

    // Add attachments if any
    if (context.sharedMemory?.attachments) {
        section += `\n**Attachments:** ${JSON.stringify(context.sharedMemory.attachments)}\n`
    }

    // Add selected items if any
    const selectedItems = ['selectedTransaction', 'selectedInvoice', 'selectedReceipt']
    for (const key of selectedItems) {
        if (context.sharedMemory?.[key]) {
            section += `\n**${key}:** ${JSON.stringify(context.sharedMemory[key])}\n`
        }
    }

    return section
}

/**
 * Format activity snapshot for inclusion in prompt.
 * Gives Scooby immediate awareness of the company's current state (~50 tokens).
 */
function formatActivitySnapshot(memory: Record<string, unknown>): string | null {
    const snapshot = memory?.activitySnapshot as {
        pendingTransactions?: number
        overdueInvoices?: number
        overdueInvoiceTotal?: number
        monthClosingStatus?: string
    } | undefined

    if (!snapshot) return null

    const lines: string[] = ['## Current Status\n']

    if (snapshot.pendingTransactions !== undefined && snapshot.pendingTransactions > 0) {
        lines.push(`- ${snapshot.pendingTransactions} unbooked transactions`)
    }
    if (snapshot.overdueInvoices !== undefined && snapshot.overdueInvoices > 0) {
        const total = snapshot.overdueInvoiceTotal
            ? ` (total ${snapshot.overdueInvoiceTotal.toLocaleString('sv-SE')} kr)`
            : ''
        lines.push(`- ${snapshot.overdueInvoices} overdue invoice${snapshot.overdueInvoices > 1 ? 's' : ''}${total}`)
    }
    if (snapshot.monthClosingStatus) {
        lines.push(`- Month closing: ${snapshot.monthClosingStatus}`)
    }

    // Only return if we have any data beyond the header
    return lines.length > 1 ? lines.join('\n') : null
}

/**
 * Format integration state for inclusion in prompt.
 * Tells Scooby which integrations are connected so it knows what data sources are available.
 */
function formatIntegrationState(memory: Record<string, unknown>): string | null {
    const integrations = memory?.integrationState as Array<{
        name: string
        type: string
        connected: boolean
    }> | undefined

    // undefined = not fetched (no company), skip entirely
    if (integrations === undefined) return null

    // Empty array = no integrations configured
    if (integrations.length === 0) {
        return `## Integrations\n\nNo integrations configured. Transactions must be entered manually.\nIf the user asks about bank import or auto-sync, explain this is available under [Integrationer i Inställningar →](/dashboard/installningar?tab=integrationer) (bank connection coming soon).`
    }

    const connected = integrations.filter(i => i.connected)
    const disconnected = integrations.filter(i => !i.connected)

    let section = `## Integrations\n\n`
    if (connected.length > 0) {
        section += `**Connected:** ${connected.map(i => i.name).join(', ')}\n`
    }
    if (disconnected.length > 0) {
        section += `**Not connected:** ${disconnected.map(i => i.name).join(', ')}\n`
    }

    return section
}

/**
 * Format user memory for inclusion in prompt.
 * Only included if there's relevant memory.
 */
function formatUserMemory(memory: Record<string, unknown>): string | null {
    if (!memory?.userMemories || !Array.isArray(memory.userMemories) || memory.userMemories.length === 0) {
        return null
    }

    const memories = memory.userMemories as Array<{
        content: string
        category: string
    }>

    let section = `## User Memories\n\n`
    section += `Prior context about this user/company:\n\n`

    for (const m of memories) {
        section += `- [${m.category}] ${m.content}\n`
    }

    return section
}

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
    const knowledgeMasterTokens = 500 // ~500 tokens for master.md
    const toolIndexTokens = 300 // ~300 tokens for tool index
    const contextBuffer = 2000 // Estimate for company context + memory

    return instinctsTokens + knowledgeMasterTokens + toolIndexTokens + contextBuffer
}
