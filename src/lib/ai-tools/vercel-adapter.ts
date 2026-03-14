import { tool, jsonSchema, type ToolSet } from 'ai'
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
            companyId: context.companyId ?? undefined,
        })

        return {
            success: result.success,
            data: result.data,
            message: result.message,
            error: result.error,
            display: result.display,
            navigation: result.navigation,
            confirmationRequired: result.confirmationRequired,
            walkthrough: (result as unknown as Record<string, unknown>).walkthrough,
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
 * Get only core tools (coreTool: true) in Vercel AI SDK format.
 * Use for token-efficient requests where deferred loading handles the rest.
 */
export function getVercelAICoreTools(context: InteractionContext): ToolSet {
    return convertToVercelTools(aiToolRegistry.getCoreTools(), context)
}
