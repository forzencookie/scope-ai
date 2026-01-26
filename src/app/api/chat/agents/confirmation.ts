/**
 * Confirmation Handler for Agent Chat
 */

import type { AgentContext } from '@/lib/agents/types'
import type { UserScopedDb } from '@/lib/database/user-scoped-db'
import { streamText, streamData, streamError } from './streaming'

interface PendingConfirmation {
    id: string
    toolName: string
    toolParams: Record<string, unknown>
    actionDescription: string
}

/**
 * Handle a confirmation response for a pending action.
 */
export async function handleConfirmation(
    confirmationId: string,
    action: 'confirm' | 'cancel',
    context: AgentContext,
    controller: ReadableStreamDefaultController,
    userDb: UserScopedDb | null,
    userId: string
): Promise<string> {
    try {
        // Look up the pending confirmation from shared memory or database
        const pendingConfirmation = context.sharedMemory.pendingConfirmation as PendingConfirmation | undefined

        if (!pendingConfirmation || pendingConfirmation.id !== confirmationId) {
            streamText(controller, 'Bekräftelsen kunde inte hittas eller har redan behandlats.')
            return 'Bekräftelsen kunde inte hittas eller har redan behandlats.'
        }

        if (action === 'cancel') {
            streamText(controller, 'Åtgärden avbröts. ✋')
            return 'Åtgärden avbröts.'
        }

        // Execute the confirmed action
        streamText(controller, `Utför: ${pendingConfirmation.actionDescription}...\n`)
        
        const tool = (await import('@/lib/ai-tools')).aiToolRegistry.get(pendingConfirmation.toolName)
        if (!tool) {
            streamError(controller, `Verktyget "${pendingConfirmation.toolName}" kunde inte hittas.`)
            return `Fel: Verktyget kunde inte hittas.`
        }

        const result = await tool.execute(pendingConfirmation.toolParams, {
            userId,
            companyId: userDb?.companyId || '',
            userDb
        })

        if (result.success) {
            streamText(controller, '\nKlart! ✅')
            streamData(controller, { 
                toolResults: [{ 
                    tool: pendingConfirmation.toolName, 
                    result: result.data, 
                    success: true 
                }],
                display: result.display,
                navigation: result.navigation,
            })
            return 'Åtgärden genomfördes framgångsrikt.'
        } else {
            streamError(controller, result.error || 'Ett fel uppstod.')
            return `Fel: ${result.error}`
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Okänt fel'
        streamError(controller, errorMsg)
        return `Fel: ${errorMsg}`
    }
}
