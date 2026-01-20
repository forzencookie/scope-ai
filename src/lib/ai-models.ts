export type AIProvider = 'google' | 'anthropic'
export type ModelTier = 'free' | 'pro' | 'enterprise'

export interface AIModel {
  id: string
  name: string
  provider: AIProvider
  tier: ModelTier
  description?: string
}

export const AI_MODELS: AIModel[] = [
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
