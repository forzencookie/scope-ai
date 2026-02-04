/**
 * Scope Brain - Unified AI Agent
 *
 * This module exports the single agent architecture that replaces
 * the multi-agent orchestration system.
 *
 * Usage:
 * ```typescript
 * import { ScopeBrain, createScopeBrain } from '@/lib/agents/scope-brain'
 *
 * const brain = createScopeBrain()
 * const response = await brain.handle(message, context)
 *
 * // Or with streaming:
 * for await (const chunk of brain.handleStream(message, context)) {
 *   if (chunk.type === 'text') {
 *     process.stdout.write(chunk.content)
 *   }
 * }
 * ```
 */

// Main agent
export {
    ScopeBrain,
    createScopeBrain,
    handleWithScopeBrain,
    type ScopeBrainOptions,
    type StreamChunk,
} from './agent'

// Model selection
export {
    selectModel,
    getModelId,
    getRelativeCost,
    MODEL_ID,
    type ModelConfig,
} from './model-selector'

// System prompt
export {
    buildSystemPrompt,
    SYSTEM_PROMPT,
    BLOCK_GUIDANCE,
} from './system-prompt'
