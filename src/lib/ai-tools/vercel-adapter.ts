import { tool, jsonSchema, stepCountIs, type ToolSet } from 'ai'
import { ZodTypeAny } from 'zod'
import { aiToolRegistry } from './registry'
import type { AITool, InteractionContext } from './types'

interface ToolExecuteResult {
    success: boolean
    data?: unknown
    message?: string
    error?: string
    display?: unknown
    navigation?: unknown
    confirmationRequired?: unknown
    walkthrough?: unknown
}

/**
 * Build the execute function for a tool.
 */
function makeExecute(t: AITool, context: InteractionContext) {
    return async (args: Record<string, unknown>): Promise<ToolExecuteResult> => {
        const result = await aiToolRegistry.execute(t.name, args, {
            userId: context.userId,
            companyId: context.companyId || undefined,
            confirmationId: context.confirmationId,
        })

        return {
            success: result.success,
            data: result.data,
            message: result.message,
            error: result.error,
            display: result.display,
            navigation: result.navigation,
            confirmationRequired: result.confirmationRequired,
            walkthrough: (result && typeof result === 'object' && 'walkthrough' in result)
                ? (result as Record<string, unknown>).walkthrough
                : undefined,
        }
    }
}

/**
 * Convert an array of AITools into Vercel AI SDK tool format.
 *
 * Note: Vercel AI SDK's tool() has strict generic overloads that cannot
 * resolve dynamically-typed schemas (Zod | JSON Schema) at compile time.
 * We use @ts-expect-error on each call since the runtime behavior is correct.
 */
function convertToVercelTools(tools: AITool[], context: InteractionContext): ToolSet {
    const vercelTools: ToolSet = {}

    for (const t of tools) {
        const execute = makeExecute(t, context)

        if (t.parameters && '_def' in t.parameters) {
            vercelTools[t.name] =
                // @ts-expect-error — tool() overloads can't infer types from dynamic ZodTypeAny
                tool({ description: t.description, parameters: t.parameters as ZodTypeAny, execute })
        } else {
            vercelTools[t.name] =
                // @ts-expect-error — tool() overloads can't infer types from dynamic jsonSchema()
                tool({ description: t.description, parameters: jsonSchema(t.parameters as Parameters<typeof jsonSchema>[0]), execute })
        }
    }

    return vercelTools
}

/**
 * Get all tools in Vercel AI SDK format.
 */
export function getVercelAITools(context: InteractionContext): ToolSet {
    return convertToVercelTools(aiToolRegistry.getAll(), context)
}

/**
 * Create a deferred tool loading config for streamText().
 *
 * Registers ALL tools in the `tools` ToolSet (schemas available for validation)
 * but only exposes core tools via `activeTools` initially (~5 tools, ~2K tokens).
 * When `search_tools` executes in step N, `prepareStep` for step N+1 reads
 * discovered tool names and expands `activeTools` to include them.
 *
 * Token savings: ~85-90% reduction (from ~40-50K to ~4-6K in tool schemas).
 */
export function createDeferredToolConfig(context: InteractionContext) {
    const allTools = getVercelAITools(context)
    const coreNames = aiToolRegistry.getCoreTools().map(t => t.name) as Array<keyof typeof allTools>
    const discoveredTools = new Set<string>()

    return {
        tools: allTools,
        activeTools: coreNames,
        stopWhen: stepCountIs(10),
        prepareStep({ steps }: { steps: Array<{ toolResults: Array<{ toolName: string; output: unknown }> }> }) {
            const lastStep = steps[steps.length - 1]
            if (lastStep?.toolResults) {
                for (const tr of lastStep.toolResults) {
                    if (tr.toolName === 'search_tools') {
                        const output = tr.output as { success?: boolean; data?: Array<{ name: string }> }
                        if (output?.success && Array.isArray(output?.data)) {
                            for (const item of output.data) {
                                if (item?.name && aiToolRegistry.has(item.name)) {
                                    discoveredTools.add(item.name)
                                }
                            }
                        }
                    }
                }
            }
            return {
                activeTools: [...coreNames, ...discoveredTools] as Array<keyof typeof allTools>,
            }
        },
    }
}
