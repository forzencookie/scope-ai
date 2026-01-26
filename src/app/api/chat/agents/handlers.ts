/**
 * Agent Handlers
 * 
 * Handles single and multi-agent request processing with streaming.
 */

import type { AgentContext, AgentDomain } from '@/lib/agents/types'
import { agentRegistry } from '@/lib/agents'
import { streamText, streamData, streamAgent, chunkText } from './streaming'

/**
 * Handle single agent request with streaming.
 */
export async function handleSingleAgentStream(
    message: string,
    agentDomain: AgentDomain,
    context: AgentContext,
    controller: ReadableStreamDefaultController
): Promise<string> {
    const agent = agentRegistry.get(agentDomain)
    if (!agent) {
        streamText(controller, 'Kunde inte hitta rätt agent för din förfrågan.')
        return 'Kunde inte hitta rätt agent för din förfrågan.'
    }

    // Get the agent response
    const response = await agent.handle(message, context)
    const responseText = response.text || response.message

    // Stream the response text
    if (responseText) {
        // Simulate streaming by chunking the text
        const chunks = chunkText(responseText, 10)
        for (const chunk of chunks) {
            streamText(controller, chunk)
            await new Promise(r => setTimeout(r, 20)) // Small delay for smooth streaming
        }
    }

    // Stream any tool results
    if (response.toolResults && response.toolResults.length > 0) {
        streamData(controller, {
            toolResults: response.toolResults.map(tr => ({
                tool: tr.toolName,
                result: tr.result,
                success: tr.success,
            }))
        })
    }

    // Stream display instructions
    const displays = response.displayInstructions || (response.display ? [response.display] : [])
    if (displays.length > 0) {
        for (const display of displays) {
            streamData(controller, { display })
        }
    }

    // Stream confirmation requests
    if (response.confirmationRequired) {
        streamData(controller, { 
            confirmationRequired: response.confirmationRequired 
        })
    }

    // Stream navigation instructions
    if (response.navigationInstructions && response.navigationInstructions.length > 0) {
        for (const nav of response.navigationInstructions) {
            streamData(controller, { navigation: nav })
        }
    }

    return responseText || ''
}

/**
 * Handle multi-agent workflow with streaming.
 */
export async function handleMultiAgentStream(
    message: string,
    agents: AgentDomain[],
    context: AgentContext,
    controller: ReadableStreamDefaultController
): Promise<string> {
    let combinedResponse = ''

    streamText(controller, 'Jag hämtar information från flera områden...\n\n')
    combinedResponse += 'Jag hämtar information från flera områden...\n\n'

    for (const agentDomain of agents) {
        const agent = agentRegistry.get(agentDomain)
        if (!agent) continue

        // Notify which agent is processing
        streamAgent(controller, {
            activeAgent: agentDomain,
            agentName: agent.name,
        })

        // Consult the agent
        const response = await agent.consult(message, context)
        const responseText = response.text || response.message

        if (responseText) {
            const header = `**${agent.name}:**\n`
            streamText(controller, header)
            combinedResponse += header

            const chunks = chunkText(responseText, 10)
            for (const chunk of chunks) {
                streamText(controller, chunk)
                await new Promise(r => setTimeout(r, 15))
            }
            combinedResponse += responseText + '\n\n'
        }

        // Stream any data
        if (response.toolResults && response.toolResults.length > 0) {
            streamData(controller, {
                toolResults: response.toolResults,
                agent: agentDomain,
            })
        }
    }

    return combinedResponse
}
