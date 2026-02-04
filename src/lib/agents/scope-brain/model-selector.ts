/**
 * Model Selector for Scope Brain
 *
 * Simplified approach: Always use Sonnet with extended thinking enabled.
 * 
 * Why this design:
 * - Scope AI is a B2B accounting platform - quality matters more than cost savings
 * - Extended thinking is smart - it only uses tokens when reasoning helps
 * - No classification logic means fewer bugs and edge cases
 * - Wrong accounting advice costs more than the extra $0.002/query
 */

// =============================================================================
// Types
// =============================================================================

export type ModelConfig = {
    model: 'sonnet'
    thinking: boolean
    thinkingBudget: number
}

export const MODEL_ID = 'claude-sonnet-4-20250514' as const

// =============================================================================
// Selection Logic
// =============================================================================

/**
 * Returns the model configuration.
 * 
 * Always uses Sonnet with extended thinking enabled.
 * The model is smart enough to only use thinking tokens when it helps.
 */
export function selectModel(_query?: string, _detectedTools?: string[]): ModelConfig {
    return {
        model: 'sonnet',
        thinking: true,
        thinkingBudget: 10000,  // Model uses up to 10k tokens for thinking when needed
    }
}

/**
 * Get the actual model ID string for API calls.
 */
export function getModelId(_config?: ModelConfig): string {
    return MODEL_ID
}

/**
 * Estimate the relative cost multiplier for a model config.
 * Useful for analytics and cost tracking.
 */
export function getRelativeCost(_config?: ModelConfig): number {
    return 5  // Sonnet with thinking enabled
}
