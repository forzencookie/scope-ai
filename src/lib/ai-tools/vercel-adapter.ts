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

export function createDeferredToolConfig(context: InteractionContext & { companyType?: string }) {
    const allToolInstances = aiToolRegistry.getAll()

    // Full registry — stays constant, used by SDK for arg validation on execution
    const allTools = getVercelAITools(context)

    // Core tools: navigate_to + request_tools only — the 2 schemas the model sees by default
    const coreNames = allToolInstances
        .filter(t => t.coreTool)
        .map(t => t.name) as Array<keyof typeof allTools>

    // Group tool names by domain for on-demand activeTools expansion
    const namesByDomain = new Map<string, Array<keyof typeof allTools>>()
    for (const tool of allToolInstances) {
        const d = tool.domain ?? 'common'
        if (!namesByDomain.has(d)) namesByDomain.set(d, [])
        namesByDomain.get(d)!.push(tool.name as keyof typeof allTools)
    }

    function collectDomains(steps: Array<{ toolResults?: Array<{ toolName: string; output: unknown }> }>) {
        const domains = new Set<string>()
        for (const step of steps) {
            for (const result of step.toolResults ?? []) {
                if (result.toolName === 'request_tools') {
                    const out = result.output as { domains?: string[] }
                    out.domains?.forEach(d => domains.add(d))
                }
            }
        }
        return [...domains]
    }

    return {
        tools: allTools,
        activeTools: coreNames,
        stopWhen: stepCountIs(15),
        prepareStep({ steps }: { steps: Array<{ toolResults?: Array<{ toolName: string; output: unknown }> }> }) {
            const loadedDomains = collectDomains(steps)
            if (loadedDomains.length === 0) return { activeTools: coreNames }

            const domainNames = loadedDomains.flatMap(d => namesByDomain.get(d) ?? [])
            return { activeTools: [...coreNames, ...domainNames] }
        },
    }
}
