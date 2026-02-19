/**
 * Model Selector for Scope Brain
 *
 * Uses GPT-4o for all requests.
 * Quality matters for a B2B accounting platform.
 */

// =============================================================================
// Types
// =============================================================================

export type ModelConfig = {
    model: string
}

export const MODEL_ID = 'gpt-4o' as const

// =============================================================================
// Selection Logic
// =============================================================================

/**
 * Returns the model configuration.
 * Always uses GPT-4o.
 */
export function selectModel(_query?: string, _detectedTools?: string[]): ModelConfig {
    return { model: MODEL_ID }
}

/**
 * Get the actual model ID string for API calls.
 */
export function getModelId(_config?: ModelConfig): string {
    return MODEL_ID
}

/**
 * Estimate the relative cost multiplier for a model config.
 */
export function getRelativeCost(_config?: ModelConfig): number {
    return 3  // GPT-4o is smart tier (3x)
}
