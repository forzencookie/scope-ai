import { jsonSchema, stepCountIs, type ToolSet } from 'ai'
import { aiToolRegistry } from './registry'
import type { AITool, InteractionContext } from './types'
import { nullToUndefined } from '@/lib/utils'

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

function makeExecute(t: AITool, context: InteractionContext) {
    return async (args: Record<string, unknown>): Promise<ToolExecuteResult> => {
        const result = await aiToolRegistry.execute(t.name, args, {
            userId: context.userId,
            companyId: nullToUndefined(context.companyId),
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

function convertToVercelTools(tools: AITool[], context: InteractionContext): ToolSet {
    const vercelTools: ToolSet = {}

    for (const t of tools) {
        const execute = makeExecute(t, context)
        const schema = ('_def' in t.parameters)
            ? t.parameters
            : jsonSchema(t.parameters as Parameters<typeof jsonSchema>[0])

        vercelTools[t.name] = { description: t.description, inputSchema: schema, execute } as ToolSet[string]
    }

    return vercelTools
}

export function getVercelAITools(context: InteractionContext): ToolSet {
    return convertToVercelTools(aiToolRegistry.getAll(), context)
}

/**
 * Build the active tool set for a session.
 *
 * Activates tools relevant to the company type upfront — no search_tools discovery needed.
 * - Common tools (domain: 'common' OR allowedCompanyTypes: []) are always active.
 * - Domain tools are activated when allowedCompanyTypes includes the company type, or is empty.
 *
 * The company type string from AgentContext ('AB', 'EF', 'HB', 'KB', 'FORENING') is lowercased
 * to match the allowedCompanyTypes values ('ab', 'ef', 'hb', 'kb', 'forening').
 */
export function createDeferredToolConfig(context: InteractionContext & { companyType?: string }) {
    const allTools = getVercelAITools(context)

    const companyTypeLower = context.companyType?.toLowerCase() ?? null

    // Activate all tools that are relevant to this company type.
    // A tool is relevant if:
    //   - It has no allowedCompanyTypes restriction (empty array = universal)
    //   - Or allowedCompanyTypes includes the current company type
    const activeToolNames = aiToolRegistry.getAll()
        .filter(t => {
            const allowed = t.allowedCompanyTypes
            if (!allowed || allowed.length === 0) return true
            if (!companyTypeLower) return false
            return allowed.includes(companyTypeLower as 'ab' | 'ef' | 'hb' | 'kb' | 'forening')
        })
        .map(t => t.name) as Array<keyof typeof allTools>

    return {
        tools: allTools,
        activeTools: activeToolNames,
        stopWhen: stepCountIs(10),
        // prepareStep is kept for chained tool flows (tool B depends on tool A result).
        // It no longer needs to handle search_tools discovery — all tools are active upfront.
        prepareStep({ steps }: { steps: Array<{ toolResults: Array<{ toolName: string; output: unknown }> }> }) {
            // No expansion needed — return same active set each step.
            return { activeTools: activeToolNames }
        },
    }
}
