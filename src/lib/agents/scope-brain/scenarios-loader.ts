/**
 * Scenarios Loader
 * 
 * Loads ai-conversation-scenarios.md and formats it for inclusion
 * in the system prompt as few-shot examples.
 */

import fs from 'fs'
import path from 'path'

// Cache the scenarios to avoid repeated file reads
let cachedScenarios: string | null = null

/**
 * Load scenarios from the markdown file.
 * Returns formatted scenarios for system prompt injection.
 */
export function loadScenarios(): string {
    if (cachedScenarios) {
        return cachedScenarios
    }

    try {
        // Try multiple possible paths (dev vs production)
        const possiblePaths = [
            path.join(process.cwd(), 'docs', 'ai-conversation-scenarios.md'),
            path.join(process.cwd(), '..', 'docs', 'ai-conversation-scenarios.md'),
        ]

        let content: string | null = null
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                content = fs.readFileSync(p, 'utf-8')
                break
            }
        }

        if (!content) {
            console.warn('[Scenarios] Could not find ai-conversation-scenarios.md')
            return getFallbackScenarios()
        }

        // Format for prompt injection
        cachedScenarios = formatScenariosForPrompt(content)
        return cachedScenarios
    } catch (error) {
        console.error('[Scenarios] Error loading scenarios:', error)
        return getFallbackScenarios()
    }
}

/**
 * Format the raw markdown scenarios for prompt inclusion.
 * Cleans up and structures for few-shot learning.
 */
function formatScenariosForPrompt(rawContent: string): string {
    // Keep most of the content but add framing
    const intro = `
## Scenarios (Few-Shot Examples)

The following are example conversations showing how to handle common situations.
Match the user's request to the closest scenario and follow that pattern.
If no scenario matches exactly, use your judgment based on the patterns shown.

---
`

    // The raw content is already well-structured, just clean it up
    const cleanedContent = rawContent
        // Remove the title (already have our own)
        .replace(/^# AI Conversation Scenarios\n+/, '')
        // Keep everything else
        .trim()

    return intro + cleanedContent
}

/**
 * Fallback scenarios if file can't be loaded.
 * Includes essential patterns.
 */
function getFallbackScenarios(): string {
    return `
## Scenarios (Fallback)

### Overdue Invoices
User: "har nån kund inte betalat?"
You: List overdue invoices with amounts and days overdue. Offer to send reminders.

### New User, Confused
User: "jag är ny här, vad ska jag göra?"
You: Welcome them, explain the basics, offer to help with first task.

### Quick Action Request
User: "kontera januari"
You: Show dynamic walkthrough with transactions, auto-matches, and approval button.

### Specific Question
User: "vad är transaktion #3891?"
You: Show transaction details directly. No walkthrough needed.

### Tax Question
User: "ska jag dra moms på det här?"
You: Explain the rule, apply to their case, offer to book if clear.
`
}

/**
 * Get an estimate of token count for the scenarios.
 * Rough estimate: 4 characters per token.
 */
export function estimateScenariosTokenCount(): number {
    const scenarios = loadScenarios()
    return Math.ceil(scenarios.length / 4)
}
