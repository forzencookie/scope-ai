/**
 * Subscription Types and Feature Gates
 *
 * Central place for subscription tier logic and feature access control.
 * Tiers:
 *   - demo: Full UI access, simulated AI, fake data, no real integrations
 *   - free: DEPRECATED - use demo instead
 *   - pro: Full features, real AI, real integrations
 *   - enterprise: Pro + priority support, custom integrations
 */

// ============================================================================
// Subscription Tiers
// ============================================================================

export type SubscriptionTier = "demo" | "free" | "pro" | "enterprise"

/** Features that can be gated by subscription tier */
export type GatedFeature =
  | "ai_chat"              // AI conversation assistant
  | "ai_extraction"        // AI document data extraction
  | "ai_suggestions"       // AI-powered suggestions
  | "bank_connection"      // Real bank account connections
  | "gov_submission"       // Real submission to Skatteverket/Bolagsverket
  | "team_members"         // Multiple team members
  | "priority_support"     // Priority customer support
  | "custom_integrations"  // Custom API integrations
  | "exports"              // Export/download data (always allowed)

// ============================================================================
// Token Budget System (monthly)
// ============================================================================
// 
// Users get a "base token" budget. Different models consume tokens at different rates.
// This naturally steers users to cheaper models while giving access to premium ones.
//
// ECONOMICS (Jan 2026):
// - Weighted avg cost: ~20 kr/1M tokens (70% cheap, 30% mid-tier usage)
// - Pro at 449 kr with 10M tokens = 64-91% margin depending on usage
// - All scenarios above 30% target margin ✅
// ============================================================================

/** Base token budget per tier (monthly) */
export const TIER_TOKEN_LIMITS: Record<SubscriptionTier, number> = {
  demo: 0,               // No real AI tokens - simulated only
  free: 0,               // Deprecated, same as demo
  pro: 10_000_000,       // 10M base tokens/month
  enterprise: 50_000_000 // 50M base tokens/month (negotiable)
}

/** 
 * Model cost multipliers - expensive models consume more of the budget
 * 1x = base rate (cheapest models)
 * 
 * Note: These should match ASSISTANT_TIERS in lib/ai/models.ts
 * The multiplier means: 1 real API token costs X tokens from user's budget
 */
export const MODEL_COST_MULTIPLIERS: Record<string, number> = {
  // Snabb tier (1x) - cheapest, for daily use
  'gpt-4o-mini': 1,
  'gemini-2.0-flash': 1,
  
  // Smart tier (3x) - balanced cost/performance
  'gpt-4o': 3,
  'gemini-2.0-pro-low': 3,
  'claude-sonnet-4-20250514': 3,
  
  // Expert tier (15x) - premium, for complex tasks
  'claude-opus-4-20250514': 15,
  'gemini-2.0-pro-high': 10,
  'gpt-4-turbo': 10,
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
  demo: {
    ai_chat: "simulated",
    ai_extraction: "disabled",
    ai_suggestions: "simulated",
    bank_connection: "disabled",
    gov_submission: "simulated",
    team_members: "full",        // No cost - just sharing demo data
    priority_support: "disabled",
    custom_integrations: "disabled",
    exports: "full",
  },
  free: {
    // Free tier is deprecated, treat same as demo
    ai_chat: "simulated",
    ai_extraction: "disabled",
    ai_suggestions: "simulated",
    bank_connection: "disabled",
    gov_submission: "simulated",
    team_members: "full",        // No cost - just sharing demo data
    priority_support: "disabled",
    custom_integrations: "disabled",
    exports: "full",
  },
  pro: {
    ai_chat: "full",
    ai_extraction: "full",
    ai_suggestions: "full",
    bank_connection: "full",
    gov_submission: "full",
    team_members: "full",
    priority_support: "disabled",
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
  },
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
 * Check if user is in demo mode
 */
export function isDemoTier(tier: SubscriptionTier): boolean {
  return tier === "demo" || tier === "free"
}

/**
 * Check if user has paid tier
 */
export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier === "pro" || tier === "enterprise"
}

// ============================================================================
// Tier Display Helpers
// ============================================================================

export const TIER_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  demo: "Demo",
  free: "Demo", // Show free as demo
  pro: "Pro",
  enterprise: "Enterprise",
}

export const TIER_COLORS: Record<SubscriptionTier, string> = {
  demo: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  free: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  pro: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  enterprise: "bg-purple-500/10 text-purple-600 border-purple-500/20",
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
    gov_submission: "Uppgradera till Pro för att skicka in deklarationer direkt",
    team_members: "Uppgradera till Pro för att bjuda in teammedlemmar",
    priority_support: "Uppgradera till Enterprise för prioriterad support",
    custom_integrations: "Uppgradera till Enterprise för anpassade integrationer",
    exports: "", // Always allowed
  }
  return prompts[feature]
}
