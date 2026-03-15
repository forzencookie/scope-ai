/**
 * Common AI Tools - Usage
 *
 * Tools for AI to discretely notify users about token usage.
 * The AI calls this to check and output usage reminders at thresholds.
 */

import { defineTool } from '../registry'
import { TIER_TOKEN_LIMITS, getModelMultiplier } from '@/lib/subscription'

// =============================================================================
// Types
// =============================================================================

export interface UsageStatus {
  /** Effective tokens used (with model multipliers) */
  tokensUsed: number
  /** Token limit for tier */
  tokenLimit: number
  /** Extra credits purchased */
  extraCredits: number
  /** Total available */
  totalAvailable: number
  /** Usage percentage */
  usagePercent: number
  /** Threshold level reached */
  thresholdLevel: 'ok' | 'moderate' | 'high' | 'critical' | 'exceeded'
  /** Whether to show a reminder */
  shouldShowReminder: boolean
  /** Suggested reminder message (Swedish) */
  reminderMessage?: string
}

// Threshold percentages for reminders
const USAGE_THRESHOLDS = {
  moderate: 50,   // 50% - subtle mention
  high: 75,       // 75% - clear reminder
  critical: 90,   // 90% - urgent reminder
  exceeded: 100,  // 100% - out of tokens
}

// =============================================================================
// Check Usage Tool
// =============================================================================

export const checkUsageTool = defineTool<Record<string, never>, UsageStatus>({
  name: 'check_ai_usage',
  description: `Kontrollera användarens AI-tokenanvändning och returnera status.
Använd detta diskret för att:
- Påminna användaren när de når 50%, 75%, 90% av sin månadsgräns
- Informera om att de kan köpa fler credits vid behov
- Aldrig avbryta ett svar, bara nämna det i slutet av svaret

VIKTIGT: Var diskret. Lägg till påminnelsen naturligt i slutet av ditt svar, inte mitt i.`,
  parameters: { type: 'object' as const, properties: {} },
  requiresConfirmation: false,
  category: 'read',
  domain: 'common',
  keywords: ['användning', 'tokens', 'budget', 'kvot'],
  execute: async (_params, context) => {
    // Get usage from database
    const { createBrowserClient } = await import('@/lib/database/client')
    const supabase = createBrowserClient()

    const userId = context.userId
    if (!userId) {
      return {
        success: false,
        error: 'Ingen inloggad användare',
      }
    }

    // Get current billing period
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Fetch usage for current period
    const { data: usageData } = await supabase
      .from('aiusage')
      .select('tokens_used, model_id')
      .eq('user_id', userId)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString())

    // Calculate effective tokens with multipliers
    let effectiveTokensUsed = 0
    if (usageData) {
      for (const row of usageData) {
        const tokens = row.tokens_used || 0
        const modelId = row.model_id || 'gpt-4o-mini'
        const multiplier = getModelMultiplier(modelId)
        effectiveTokensUsed += tokens * multiplier
      }
    }

    // Fetch user's actual subscription tier
    const { data: profileData } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    const tier = (profileData?.subscription_tier as keyof typeof TIER_TOKEN_LIMITS) || 'free'
    const tokenLimit = TIER_TOKEN_LIMITS[tier] || 0

    // Fetch purchased credits from user_credits table
    const { data: creditsData } = await supabase
      .from('usercredits')
      .select('credits_remaining')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())

    const extraCredits = creditsData?.reduce((sum, row) => sum + (row.credits_remaining || 0), 0) || 0

    const totalAvailable = tokenLimit + extraCredits
    const usagePercent = totalAvailable > 0
      ? Math.round((effectiveTokensUsed / totalAvailable) * 100)
      : 0

    // Determine threshold level
    let thresholdLevel: UsageStatus['thresholdLevel'] = 'ok'
    let shouldShowReminder = false
    let reminderMessage: string | undefined

    if (usagePercent >= USAGE_THRESHOLDS.exceeded) {
      thresholdLevel = 'exceeded'
      shouldShowReminder = true
      reminderMessage = '⚠️ Du har förbrukat din månadskvot. Köp fler credits under Inställningar > Fakturering för att fortsätta använda AI.'
    } else if (usagePercent >= USAGE_THRESHOLDS.critical) {
      thresholdLevel = 'critical'
      shouldShowReminder = true
      reminderMessage = `📊 Du har använt ${usagePercent}% av din månatliga AI-budget. Du kan köpa fler credits under Inställningar om du behöver.`
    } else if (usagePercent >= USAGE_THRESHOLDS.high) {
      thresholdLevel = 'high'
      shouldShowReminder = true
      reminderMessage = `💡 Du har använt ${usagePercent}% av din AI-budget denna månad.`
    } else if (usagePercent >= USAGE_THRESHOLDS.moderate) {
      thresholdLevel = 'moderate'
      // Only show moderate reminder occasionally (every 5th check at this level)
      shouldShowReminder = Math.random() < 0.2
      if (shouldShowReminder) {
        reminderMessage = `📈 Du har använt ${usagePercent}% av din AI-budget.`
      }
    }

    const result: UsageStatus = {
      tokensUsed: effectiveTokensUsed,
      tokenLimit,
      extraCredits,
      totalAvailable,
      usagePercent,
      thresholdLevel,
      shouldShowReminder,
      reminderMessage,
    }

    return {
      success: true,
      data: result,
      message: shouldShowReminder && reminderMessage
        ? reminderMessage
        : `AI-användning: ${usagePercent}% av månadsbudget`,
    }
  },
})

// =============================================================================
// Get Usage Stats Tool (for display in chat)
// =============================================================================

export const getUsageStatsTool = defineTool<Record<string, never>, UsageStatus>({
  name: 'get_ai_usage_stats',
  description: 'Hämta detaljerad statistik om användarens AI-tokenanvändning denna månad. Använd detta om användaren specifikt frågar om sin användning.',
  parameters: { type: 'object' as const, properties: {} },
  requiresConfirmation: false,
  category: 'read',
  domain: 'common',
  keywords: ['statistik', 'användning', 'tokens', 'AI'],
  execute: async (_params, context) => {
    // Same logic as checkUsageTool but always returns full data
    const result = await checkUsageTool.execute({}, context)

    if (!result.success || !result.data) {
      return result
    }

    const data = result.data

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
