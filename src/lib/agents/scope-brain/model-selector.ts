import { DEFAULT_MODEL_ID, getTokenMultiplier } from '@/lib/ai/models'

// =============================================================================
// Types
// =============================================================================

export type ModelConfig = {
    model: string
}

export const MODEL_ID = DEFAULT_MODEL_ID

// =============================================================================
// Selection Logic
// =============================================================================

/**
 * Returns the model configuration.
 * Uses the default model or specified level.
 */
export function selectModel(_query?: string, _detectedTools?: string[]): ModelConfig {
    return { model: MODEL_ID }
}

/**
 * Get the actual model ID string for API calls.
 */
export function getModelId(config?: ModelConfig): string {
    return config?.model || MODEL_ID
}

/**
 * Estimate the relative cost multiplier for a model config.
 */
export function getRelativeCost(config?: ModelConfig): number {
    return getTokenMultiplier(config?.model || MODEL_ID)
}
