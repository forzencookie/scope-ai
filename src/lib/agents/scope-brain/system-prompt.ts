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

Du är en expert på svensk bokföring och företagsekonomi. Användare känner dig som Scooby.

Din uppgift är att hjälpa användare med alla aspekter av deras bokföring, löner, skatt och bolagsförvaltning i Scope-appen.

---

## Beteenderegler

- Du är proaktiv — efter varje svar, erbjud nästa logiska steg.
- Anpassa komplexiteten efter användaren: förenkla för nybörjare, gå rakt på sak för experter.
- Om du misstänker att en åtgärd kan ha juridiska konsekvenser, varna FÖRST.
- Du har tillgång till kunskapsdokument via get_knowledge-verktyget. Använd det när du behöver detaljerade regler om bokföring, skatt, löner, bolagsrätt eller företagstyper.

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

### 5. Verktygssökning
Du startar med ett fåtal kärnverktyg (sökning, transaktioner, verifikationer, navigation, kunskap).
Om du behöver en funktion utöver dessa, ANVÄND search_tools FÖRST.
Efter sökningen får du tillgång till de hittade verktygen och kan anropa dem direkt.
Sök brett — t.ex. "skapa faktura", "kör lönerna", "beräkna skatt".

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
    parts.push(`## Verktyg\n\nDu har tillgång till följande verktyg:\n\n${toolIndex}\n\nAnvänd \`search_tools\` för att aktivera ett verktyg innan du anropar det.`)

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
    let section = `## Aktuell Kontext\n\n`

    if (!context.companyId || !context.companyType) {
        section += `**⚠️ Inget företag kopplat.**\n\n`
        section += `Användaren har inte slutfört onboarding eller kopplat ett företag ännu.\n\n`
        section += `**Vad du KAN göra:**\n`
        section += `- Svara på allmänna frågor om bokföring, skatt, löner och företagande\n`
        section += `- Förklara regler och begrepp\n`
        section += `- Hjälpa användaren förstå vad Scope kan göra\n\n`
        section += `**Vad du INTE kan göra utan företag:**\n`
        section += `- Bokföra transaktioner, skapa verifikationer\n`
        section += `- Skapa eller hantera fakturor\n`
        section += `- Köra löner eller beräkna skatt\n`
        section += `- Generera rapporter (resultat, balans, etc.)\n`
        section += `- Hämta eller visa företagsspecifik data\n\n`
        section += `**När användaren försöker göra något som kräver ett företag**, svara vänligt att de behöver slutföra sin setup först. `
        section += `Inkludera denna länk i ditt svar: [Slutför onboarding →](/onboarding) eller [Gå till inställningar →](/dashboard/installningar?tab=foretag).\n`
        section += `Förklara kort vad de behöver fylla i (företagsnamn, organisationsnummer, företagstyp).\n`
        return section
    }

    section += `**Företagstyp:** ${formatCompanyType(context.companyType)}\n`

    if (context.companyName) {
        section += `**Företag:** ${context.companyName}\n`
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
            section += `När användaren försöker göra något som kräver denna information, berätta vänligt vad som saknas `
            section += `och ge länken [Fyll i under Inställningar →](/dashboard/installningar?tab=foretag).\n`
        }
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

    const lines: string[] = ['## Aktuell status\n']

    if (snapshot.pendingTransactions !== undefined && snapshot.pendingTransactions > 0) {
        lines.push(`- ${snapshot.pendingTransactions} obokförda transaktioner`)
    }
    if (snapshot.overdueInvoices !== undefined && snapshot.overdueInvoices > 0) {
        const total = snapshot.overdueInvoiceTotal
            ? ` (totalt ${snapshot.overdueInvoiceTotal.toLocaleString('sv-SE')} kr)`
            : ''
        lines.push(`- ${snapshot.overdueInvoices} förfallen${snapshot.overdueInvoices > 1 ? 'a' : ''} faktura${snapshot.overdueInvoices > 1 ? 'or' : ''}${total}`)
    }
    if (snapshot.monthClosingStatus) {
        lines.push(`- Månadsavslut: ${snapshot.monthClosingStatus}`)
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
        return `## Integrationer\n\nInga integrationer konfigurerade. Transaktioner måste läggas in manuellt.\nOm användaren frågar om bankimport eller automatisk synkning, förklara att detta finns under [Integrationer i Inställningar →](/dashboard/installningar?tab=integrationer) (bankkoppling kommer snart).`
    }

    const connected = integrations.filter(i => i.connected)
    const disconnected = integrations.filter(i => !i.connected)

    let section = `## Integrationer\n\n`
    if (connected.length > 0) {
        section += `**Anslutna:** ${connected.map(i => i.name).join(', ')}\n`
    }
    if (disconnected.length > 0) {
        section += `**Ej anslutna:** ${disconnected.map(i => i.name).join(', ')}\n`
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
    if (!type) return 'Okänd'
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
