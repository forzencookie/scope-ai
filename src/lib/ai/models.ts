import { getActiveModels, getActiveModelsByProvider } from './model-registry'

export type AIProvider = 'openai'
export type ModelTier = 'pro' | 'max' | 'enterprise'

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

export type AssistantLevel = 'snabb' | 'smart' | 'expert'

export interface AssistantTier {
    level: AssistantLevel
    name: string
    description: string
    icon: string
    modelId: string
    multiplier: number
    color: string
}

export const ASSISTANT_TIERS: AssistantTier[] = [
    {
        level: 'snabb',
        name: 'Snabb',
        description: 'Vardagliga frågor, snabba svar',
        icon: '⚡',
        modelId: 'gpt-5-mini',
        multiplier: 1,
        color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        level: 'smart',
        name: 'Smart',
        description: 'Bokföring, analys, rapporter',
        icon: '🧠',
        modelId: 'gpt-5',
        multiplier: 3,
        color: 'text-blue-600 dark:text-blue-400',
    },
    {
        level: 'expert',
        name: 'Expert',
        description: 'Komplex planering, strategiska beslut',
        icon: '🎯',
        modelId: 'gpt-5-turbo',
        multiplier: 10,
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
// Technical Models (Backend — derived from registry)
// =============================================================================

const tierMap: Record<string, ModelTier> = {
    'gpt-5-mini': 'pro',
    'gpt-5': 'max',
    'gpt-5-turbo': 'enterprise',
}

export const AI_MODELS: AIModel[] = getActiveModelsByProvider('openai').map(spec => ({
    id: spec.id,
    name: spec.name,
    provider: 'openai' as AIProvider,
    tier: tierMap[spec.id] ?? 'pro',
    description: spec.description,
}))

export const DEFAULT_MODEL_ID = 'gpt-5-mini'

export function getModelById(id: string): AIModel | undefined {
    return AI_MODELS.find(m => m.id === id)
}

export function getModelsByProvider(provider: AIProvider): AIModel[] {
    return AI_MODELS.filter(m => m.provider === provider)
}

export function getTokenMultiplier(modelId: string): number {
    const tier = getAssistantTierByModelId(modelId)
    return tier?.multiplier ?? 1
}

export { getActiveModels }
