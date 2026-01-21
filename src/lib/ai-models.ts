export type AIProvider = 'google' | 'anthropic' | 'openai'
export type ModelTier = 'free' | 'pro' | 'enterprise'

export interface AIModel {
  id: string
  name: string
  provider: AIProvider
  tier: ModelTier
  description?: string
}

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

export const DEFAULT_MODEL_ID = 'gpt-4o-mini'

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find(m => m.id === id)
}

export function getModelsByProvider(provider: AIProvider): AIModel[] {
  return AI_MODELS.filter(m => m.provider === provider)
}
