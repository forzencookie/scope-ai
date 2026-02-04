/**
 * Unified System Prompt for Scope Brain - v2
 *
 * Architecture: Instinct-first design with scenarios as few-shot examples.
 * 
 * Structure:
 * 1. Core Instincts (~500 tokens) - How to think
 * 2. Scenarios (~10k tokens) - Pattern matching examples
 * 3. Company Context (~2k tokens) - Live data
 * 4. User Memory (~1k tokens) - When relevant
 */

import type { AgentContext } from '../types'
import { loadScenarios, estimateScenariosTokenCount } from './scenarios-loader'

// =============================================================================
// Core Instincts - How the AI Should Think
// =============================================================================

const CORE_INSTINCTS = `# Scope AI

Du är Scope AI, en expert på svensk bokföring och företagsekonomi.

---

## Kärninstinkter

### 1. Förtydligandeloop
Om du saknar information för att agera, ställ EN tydlig fråga.
Upprepa tills du har vad du behöver. Gissa inte.

### 2. Tonanpassning
- Användaren låter förvirrad → förenkla, använd liknelser
- Användaren är kort/expert → matcha tempot, hoppa över grunderna
- Användaren är orolig → lugna först, lös sedan

### 3. Problem först
Om något är fel (blockerande, varning), ta upp det FÖRST
innan du visar data eller besvarar den ursprungliga frågan.

### 4. Handlingsorienterad
Efter svaret, erbjud nästa logiska steg.
"Vill du att jag skickar påminnelser?" — inte bara lista data.

### 5. Mönstermatchning
Scenarierna nedan visar hur du hanterar vanliga situationer.
Matcha användarens förfrågan mot närmaste scenario och följ det mönstret.

---

## Svarsformat

- **Svenska** — svara alltid på svenska (om inte användaren skriver engelska)
- **Markdown** — fetstil för viktiga belopp, tabeller för data
- **Svenska talformat** — "1 245 000 kr", "25,5%", "2026-01-15"

---

## Blockkomposition (Walkthroughs)

Du kan skapa strukturerade block (W: protokoll) för att visa data visuellt.

**Välj svarsläge:**
- **Chat:** Enkel fråga → textsvar
- **Fast walkthrough:** Dokument/rapport → blocklayout
- **Dynamisk walkthrough:** Utforska data → sammansatta block

**Blockval:**
- Siffror över tid → chart
- KPI-snapshot → stat-cards (max 6)
- Problem/varningar → info-card FÖRST
- Användaren ska välja → inline-choice

`

// =============================================================================
// Context Builder
// =============================================================================

/**
 * Build the complete system prompt with context.
 * 
 * Token budget (~15k total):
 * - Core instincts: ~500 tokens
 * - Scenarios: ~10k tokens
 * - Company context: ~2k tokens
 * - Buffer for memory: ~2k tokens
 */
export function buildSystemPrompt(context: AgentContext): string {
    const parts: string[] = []

    // 1. Core instincts
    parts.push(CORE_INSTINCTS)

    // 2. Scenarios (few-shot examples)
    const scenarios = loadScenarios()
    parts.push(scenarios)

    // 3. Company context
    parts.push(buildCompanyContext(context))

    // 4. User memory (if provided in context)
    const memory = formatUserMemory(context.sharedMemory)
    if (memory) {
        parts.push(memory)
    }

    return parts.join('\n\n---\n\n')
}

/**
 * Build company context section.
 */
function buildCompanyContext(context: AgentContext): string {
    let section = `## Aktuell Kontext\n\n`

    section += `**Företagstyp:** ${formatCompanyType(context.companyType)}\n`

    if (context.companyName) {
        section += `**Företag:** ${context.companyName}\n`
    }

    // Add page context if available
    if (context.sharedMemory?.currentPage) {
        section += `**Aktuell sida:** ${context.sharedMemory.currentPage}\n`
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
            section += `\n**Siddata:**\n${pageContexts.join('\n\n')}\n`
        }
    }

    // Add attachments if any
    if (context.sharedMemory?.attachments) {
        section += `\n**Bifogade filer:** ${JSON.stringify(context.sharedMemory.attachments)}\n`
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

    let section = `## Användarminnen\n\n`
    section += `Tidigare kontext om denna användare/företag:\n\n`

    for (const m of memories) {
        section += `- [${m.category}] ${m.content}\n`
    }

    return section
}

/**
 * Format company type for display.
 */
function formatCompanyType(type: AgentContext['companyType']): string {
    const names: Record<AgentContext['companyType'], string> = {
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
    const scenariosTokens = estimateScenariosTokenCount()
    const contextBuffer = 2000 // Estimate for company context

    return instinctsTokens + scenariosTokens + contextBuffer
}
