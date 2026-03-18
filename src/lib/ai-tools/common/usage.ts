/**
 * Common AI Tools - Usage
 *
 * Tools for AI to discretely notify users about token usage.
 * The AI calls this to check and output usage reminders at thresholds.
 */

import { defineTool } from '../registry'
import { usageService } from '@/services/usage-service'
import type { AIUsageStatus } from '@/lib/ai-schema'

// =============================================================================
// Check Usage Tool
// =============================================================================

export const checkUsageTool = defineTool<Record<string, never>, AIUsageStatus>({
  name: 'check_ai_usage',
  description: `Kontrollera användarens AI-tokenanvändning och returnera status.
Använd detta diskret för att:
- Påminna användaren när de når 50%, 75%, 90% av sin månadsgräns
- Informera om att de kan köpa fler credits vid behov
- Aldrig avbryta ett svar, bara nämna det i slutet av svaret

VIKTIGT: Var diskret. Lägg till påminnelsen naturligt i slutet av ditt svar, inte mitt i.`,
  parameters: { type: 'object' as const, properties: {} },
  requiresConfirmation: false,
  allowedCompanyTypes: [],
  category: 'read',
  domain: 'common',
  keywords: ['användning', 'tokens', 'budget', 'kvot'],
  execute: async (_params, context) => {
    const userId = context.userId
    if (!userId) {
      return {
        success: false,
        error: 'Ingen inloggad användare',
      }
    }

    try {
      const status = await usageService.getUsageStatus(userId)

      return {
        success: true,
        data: status,
        message: status.shouldShowReminder && status.reminderMessage
          ? status.reminderMessage
          : `AI-användning: ${status.usagePercent}% av månadsbudget`,
      }
    } catch (error) {
      console.error('[AI Tool] check_ai_usage failed:', error)
      return { success: false, error: 'Kunde inte hämta användningsstatistik.' }
    }
  },
})

// =============================================================================
// Get Usage Stats Tool (for display in chat)
// =============================================================================

export const getUsageStatsTool = defineTool<Record<string, never>, AIUsageStatus>({
  name: 'get_ai_usage_stats',
  description: 'Hämta detaljerad statistik om användarens AI-tokenanvändning denna månad. Använd detta om användaren specifikt frågar om sin användning.',
  parameters: { type: 'object' as const, properties: {} },
  requiresConfirmation: false,
  allowedCompanyTypes: [],
  category: 'read',
  domain: 'common',
  keywords: ['statistik', 'användning', 'tokens', 'AI'],
  execute: async (_params, context) => {
    const userId = context.userId
    if (!userId) {
      return { success: false, error: 'Ingen inloggad användare' }
    }

    try {
      const data = await usageService.getUsageStatus(userId)

      // Format for display
      const formatTokens = (tokens: number): string => {
        if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
        if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}k`
        return tokens.toString()
      }

      return {
        success: true,
        data,
        message: `Din AI-användning denna månad:
• Använt: ${formatTokens(data.tokensUsed)} tokens (${data.usagePercent}%)
• Budget: ${formatTokens(data.totalAvailable)} tokens
• Kvar: ${formatTokens(data.totalAvailable - data.tokensUsed)} tokens

${data.thresholdLevel === 'exceeded'
            ? '⚠️ Du har överskridit din budget. Köp fler credits för att fortsätta.'
            : data.thresholdLevel === 'critical'
              ? '📊 Du närmar dig gränsen. Överväg att köpa fler credits.'
              : 'Allt ser bra ut! Du har gott om tokens kvar.'}`,
      }
    } catch (error) {
      console.error('[AI Tool] get_ai_usage_stats failed:', error)
      return { success: false, error: 'Kunde inte hämta användningsstatistik.' }
    }
  },
})

// =============================================================================
// Buy Credits Tool
// =============================================================================

export interface BuyCreditsParams {
  /** Token package size (2000000, 5000000, or 15000000) */
  tokens: number
}

export interface BuyCreditsResult {
  /** Checkout URL to redirect user */
  checkoutUrl?: string
  /** Available credit packages */
  packages: Array<{
    tokens: number
    price: number
    label: string
    popular?: boolean
    savings?: string
  }>
}

export const buyCreditsToolDef = defineTool<BuyCreditsParams, BuyCreditsResult>({
  name: 'buy_ai_credits',
  description: `Hjälp användaren köpa fler AI-credits.
Använd detta verktyg när:
- Användaren vill köpa fler tokens/credits
- Användaren har slut på sin AI-budget
- Användaren frågar om priser för credits

Om användaren inte angett hur många tokens, visa tillgängliga paket.
Om användaren valt ett paket, returnera checkout-länken.`,
  domain: 'common',
  keywords: ['köpa', 'credits', 'tokens', 'prenumeration'],
  parameters: {
    type: 'object' as const,
    properties: {
      tokens: {
        type: 'number',
        description: 'Antal tokens att köpa (2000000, 5000000, eller 15000000). Utelämna för att visa alla paket.',
      },
    },
  },
  requiresConfirmation: false,
  allowedCompanyTypes: [],
  category: 'read',
  execute: async (params, _context) => {
    const { CREDIT_PACKAGES } = await import('@/lib/subscription')

    const packages = CREDIT_PACKAGES.map(pkg => ({
      tokens: pkg.tokens,
      price: pkg.price,
      label: pkg.label,
      popular: pkg.popular,
      savings: pkg.savings,
    }))

    // If no specific package requested, just show options
    if (!params.tokens) {
      return {
        success: true,
        data: { packages },
        message: `Här är våra credit-paket:

${packages.map(p => `• **${p.label}** - ${p.price} kr${p.popular ? ' ⭐ Populär' : ''}${p.savings ? ` (${p.savings})` : ''}`).join('\n')}

Vilket paket vill du köpa?`,
      }
    }

    // Validate package selection
    const selectedPackage = CREDIT_PACKAGES.find(p => p.tokens === params.tokens)
    if (!selectedPackage) {
      return {
        success: false,
        data: { packages },
        error: `Ogiltigt paket. Välj mellan: ${packages.map(p => p.label).join(', ')}`,
      }
    }

    // Return display with buy button that triggers the checkout
    return {
      success: true,
      data: {
        packages,
      },
      message: `Du vill köpa **${selectedPackage.label}** för ${selectedPackage.price} kr. Klicka på knappen nedan för att gå till kassan.`,
    }
  },
})

// =============================================================================
// Export all usage tools
// =============================================================================

export const usageTools = [
  checkUsageTool,
  getUsageStatsTool,
  buyCreditsToolDef,
]
