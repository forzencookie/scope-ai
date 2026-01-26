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

/** Feature access by tier */
const FEATURE_ACCESS: Record<SubscriptionTier, Record<GatedFeature, "full" | "simulated" | "disabled">> = {
  demo: {
    ai_chat: "simulated",
    ai_extraction: "disabled",
    ai_suggestions: "simulated",
    bank_connection: "disabled",
    gov_submission: "simulated",
    team_members: "disabled",
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
    team_members: "disabled",
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
