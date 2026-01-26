export type AIProvider = 'google' | 'anthropic' | 'openai'
export type ModelTier = 'free' | 'pro' | 'enterprise'

export interface AIModel {
  id: string
  name: string
  provider: AIProvider
  tier: ModelTier
  description?: string
}

// =============================================================================
// User-Facing AI Tiers (Simple UX)
// =============================================================================

/**
 * User-facing AI assistant levels
 * Users see these friendly names, not technical model names
 */
export type AssistantLevel = 'snabb' | 'smart' | 'expert'

export interface AssistantTier {
  level: AssistantLevel
  name: string
  description: string
  icon: string
  /** Which model to use for this tier */
  modelId: string
  /** Token multiplier (1 real token = X budget tokens) */
  multiplier: number
  /** Color theme for UI */
  color: string
}

/**
 * The 3 assistant tiers users choose from
 * Simple hierarchy: Fast → Smart → Expert
 */
export const ASSISTANT_TIERS: AssistantTier[] = [
  {
    level: 'snabb',
    name: 'Snabb',
    description: 'Vardagliga frågor, snabba svar',
    icon: '⚡',
    modelId: 'gemini-2.0-flash', // Cheapest, fastest
    multiplier: 1,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    level: 'smart',
    name: 'Smart',
    description: 'Bokföring, analys, rapporter',
    icon: '🧠',
    modelId: 'gpt-4o', // Good balance
    multiplier: 3,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    level: 'expert',
    name: 'Expert',
    description: 'Komplex planering, strategiska beslut',
    icon: '🎯',
    modelId: 'claude-opus-4-20250514', // Best reasoning
    multiplier: 15,
    color: 'text-purple-600 dark:text-purple-400',
  },
]

export const DEFAULT_ASSISTANT_LEVEL: AssistantLevel = 'snabb'

export function getAssistantTier(level: AssistantLevel): AssistantTier {
  return ASSISTANT_TIERS.find(t => t.level === level) || ASSISTANT_TIERS[0]
}

export function getAssistantTierByModelId(modelId: string): AssistantTier | undefined {
  return ASSISTANT_TIERS.find(t => t.modelId === modelId)
}

// =============================================================================
// Technical Models (Backend use only)
// =============================================================================

export const AI_MODELS: AIModel[] = [
  // OpenAI GPT
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', tier: 'pro', description: 'Kraftfull och snabb' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', tier: 'free', description: 'Snabb och kostnadseffektiv' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', tier: 'enterprise', description: 'Maximal kapacitet' },
  // Google Gemini
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', tier: 'free', description: 'Snabb och effektiv' },
  { id: 'gemini-2.0-pro-low', name: 'Gemini 2.0 Pro (Low)', provider: 'google', tier: 'pro', description: 'Balanserad prestanda' },
  { id: 'gemini-2.0-pro-high', name: 'Gemini 2.0 Pro (High)', provider: 'google', tier: 'enterprise', description: 'Maximal kvalitet' },
  // Anthropic Claude
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', tier: 'pro', description: 'Snabb och kapabel' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic', tier: 'enterprise', description: 'Mest kraftfulla modellen' },
]

export const DEFAULT_MODEL_ID = 'gemini-2.0-flash'

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find(m => m.id === id)
}

export function getModelsByProvider(provider: AIProvider): AIModel[] {
  return AI_MODELS.filter(m => m.provider === provider)
}

/**
 * Get the token multiplier for a model
 * Used to calculate how many "budget tokens" a real API call costs
 */
export function getTokenMultiplier(modelId: string): number {
  const tier = getAssistantTierByModelId(modelId)
  return tier?.multiplier ?? 1
}
