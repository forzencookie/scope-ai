/**
 * Subscription Types and Feature Gates
 *
 * Central place for subscription tier logic and feature access control.
 * Tiers:
 *   - pro: Solo company owners (Enskild Firma) or Non-profits (Ideell Förening)
 *   - max: All company types (Aktiebolag, Handelsbolag, Kommanditbolag) + team features
 *   - enterprise: Custom integrations, unlimited usage via message us
 */

// ============================================================================
// Subscription Tiers
// ============================================================================

export type SubscriptionTier = "pro" | "max" | "enterprise"

/** Features that can be gated by subscription tier */
export type GatedFeature =
  | "ai_chat"              // AI conversation assistant
  | "ai_extraction"        // AI document data extraction
  | "ai_suggestions"       // AI-powered suggestions
  | "bank_connection"      // Real bank account connections
  | "gov_submission"       // Submission to Skatteverket/Bolagsverket (coming soon)
  | "team_members"         // Multiple team members
  | "priority_support"     // Priority customer support
  | "custom_integrations"  // Custom API integrations
  | "exports"              // Export/download data (always allowed)

// ============================================================================
// Token Budget System (monthly)
// ============================================================================

/** Base token budget per tier (monthly) */
export const TIER_TOKEN_LIMITS: Record<SubscriptionTier, number> = {
  pro: 10_000_000,       // 10M base tokens/month
  max: 50_000_000,       // 50M base tokens/month
  enterprise: 999_999_999 // Unlimited (custom)
}

/** 
 * Model cost multipliers - expensive models consume more of the budget
 * 1x = base rate (cheapest models)
 * 
 * Note: These should match ASSISTANT_TIERS in lib/ai/models.ts
 */
export const MODEL_COST_MULTIPLIERS: Record<string, number> = {
  // Snabb tier (1x) - cheapest, for daily use
  'gpt-5-mini': 1,

  // Smart tier (3x) - balanced cost/performance
  'gpt-5': 3,

  // Expert tier (10x) - premium, for complex tasks
  'gpt-5-turbo': 10,
}

/** Get multiplier for a model (defaults to 1x for unknown models) */
export function getModelMultiplier(modelId: string): number {
  return MODEL_COST_MULTIPLIERS[modelId] ?? 1
}

/** Calculate effective token cost for a model */
export function calculateEffectiveTokens(actualTokens: number, modelId: string): number {
  return actualTokens * getModelMultiplier(modelId)
}

// ============================================================================
// Credit Packages (top-up when budget runs out)
// ============================================================================

/** Credit package options - ~80% margin */
export interface CreditPackage {
  tokens: number
  price: number
  label: string
  popular?: boolean
  savings?: string
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { tokens: 2_000_000, price: 99, label: "2M tokens" },
  { tokens: 5_000_000, price: 199, label: "5M tokens", popular: true, savings: "Spara 20%" },
  { tokens: 15_000_000, price: 499, label: "15M tokens", savings: "Spara 33%" },
]

/** Feature access by tier */
const FEATURE_ACCESS: Record<SubscriptionTier, Record<GatedFeature, "full" | "simulated" | "disabled">> = {
  pro: {
    ai_chat: "full",
    ai_extraction: "full",
    ai_suggestions: "full",
    bank_connection: "full",
    gov_submission: "disabled",
    team_members: "disabled", // Only 1 user
    priority_support: "disabled",
    custom_integrations: "disabled",
    exports: "full",
  },
  max: {
    ai_chat: "full",
    ai_extraction: "full",
    ai_suggestions: "full",
    bank_connection: "full",
    gov_submission: "disabled",
    team_members: "full", // Multiple users allowed
    priority_support: "full",
    custom_integrations: "disabled",
    exports: "full",
  },
  enterprise: {
    ai_chat: "full",
    ai_extraction: "full",
    ai_suggestions: "full",
    bank_connection: "full",
    gov_submission: "full",
    team_members: "full",
    priority_support: "full",
    custom_integrations: "full",
    exports: "full",
  }
}

// ============================================================================
// Feature Access Helpers
// ============================================================================

/**
 * Check if a feature is available for a given tier
 */
export function getFeatureAccess(
  tier: SubscriptionTier,
  feature: GatedFeature
): "full" | "simulated" | "disabled" {
  return FEATURE_ACCESS[tier]?.[feature] ?? "disabled"
}

/**
 * Check if user can use a feature (full or simulated)
 */
export function canUseFeature(tier: SubscriptionTier, feature: GatedFeature): boolean {
  const access = getFeatureAccess(tier, feature)
  return access === "full" || access === "simulated"
}

/**
 * Check if feature should use simulated/demo behavior
 */
export function isFeatureSimulated(tier: SubscriptionTier, feature: GatedFeature): boolean {
  return getFeatureAccess(tier, feature) === "simulated"
}

/**
 * Check if user has paid tier
 */
export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier === "pro" || tier === "max" || tier === "enterprise"
}

// ============================================================================
// Tier Display Helpers
// ============================================================================

export const TIER_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  pro: "Pro",
  max: "Max",
  enterprise: "Enterprise",
}

export const TIER_COLORS: Record<SubscriptionTier, string> = {
  pro: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  max: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  enterprise: "bg-amber-500/10 text-amber-600 border-amber-500/20",
}

/**
 * Get upgrade prompt message for a feature
 */
export function getUpgradePrompt(feature: GatedFeature): string {
  const prompts: Record<GatedFeature, string> = {
    ai_chat: "Uppgradera till Pro för att få tillgång till riktiga AI-svar",
    ai_extraction: "Uppgradera till Pro för automatisk datautvinning från dokument",
    ai_suggestions: "Uppgradera till Pro för personliga AI-förslag",
    bank_connection: "Uppgradera till Pro för att koppla ditt bankkonto",
    gov_submission: "Uppgradera till Max för att skicka in deklarationer direkt",
    team_members: "Uppgradera till Max för att bjuda in teammedlemmar",
    priority_support: "Uppgradera till Max för prioriterad support",
    custom_integrations: "Uppgradera till Enterprise för anpassade integrationer",
    exports: "", // Always allowed
  }
  return prompts[feature]
}
