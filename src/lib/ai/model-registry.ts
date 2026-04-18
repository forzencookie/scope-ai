/**
 * Model Registry — single source of truth for every AI model we support.
 *
 * isActive = currently offered to users.
 * To add a provider: define models here, flip isActive when ready to ship.
 * Context windows are manually maintained — providers don't expose specs via API.
 */

export type Provider = 'openai' | 'anthropic' | 'google'

export interface ModelSpec {
    id: string
    name: string
    provider: Provider
    contextWindow: number
    isActive: boolean
    description?: string
}

export const MODEL_REGISTRY: ModelSpec[] = [
    // =========================================================================
    // OpenAI — active
    // =========================================================================
    {
        id: 'gpt-5-mini',
        name: 'GPT-5 Mini',
        provider: 'openai',
        contextWindow: 128_000,
        isActive: true,
        description: 'Snabb och kostnadseffektiv',
    },
    {
        id: 'gpt-5',
        name: 'GPT-5',
        provider: 'openai',
        contextWindow: 128_000,
        isActive: true,
        description: 'Kraftfull och snabb',
    },
    {
        id: 'gpt-5-turbo',
        name: 'GPT-5 Turbo',
        provider: 'openai',
        contextWindow: 128_000,
        isActive: true,
        description: 'Maximal kapacitet',
    },

    // =========================================================================
    // Anthropic — inactive (not yet offered)
    // =========================================================================
    {
        id: 'claude-haiku-4-5-20251001',
        name: 'Claude Haiku 4.5',
        provider: 'anthropic',
        contextWindow: 200_000,
        isActive: false,
        description: 'Snabb och effektiv',
    },
    {
        id: 'claude-sonnet-4-6',
        name: 'Claude Sonnet 4.6',
        provider: 'anthropic',
        contextWindow: 200_000,
        isActive: false,
        description: 'Balans mellan snabbhet och kapacitet',
    },
    {
        id: 'claude-opus-4-7',
        name: 'Claude Opus 4.7',
        provider: 'anthropic',
        contextWindow: 200_000,
        isActive: false,
        description: 'Maximal kapacitet',
    },

    // =========================================================================
    // Google — inactive (not yet offered)
    // =========================================================================
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'google',
        contextWindow: 1_000_000,
        isActive: false,
        description: 'Extremt lång kontextfönster',
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'google',
        contextWindow: 1_000_000,
        isActive: false,
        description: 'Kraftfull med extremt lång kontext',
    },
]

export function getModelSpec(modelId: string): ModelSpec | undefined {
    return MODEL_REGISTRY.find(m => m.id === modelId)
}

export function getContextWindow(modelId: string): number {
    return getModelSpec(modelId)?.contextWindow ?? 128_000
}

export function getActiveModels(): ModelSpec[] {
    return MODEL_REGISTRY.filter(m => m.isActive)
}

export function getActiveModelsByProvider(provider: Provider): ModelSpec[] {
    return MODEL_REGISTRY.filter(m => m.isActive && m.provider === provider)
}
