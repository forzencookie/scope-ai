"use client"

/**
 * useChat - Custom hook for chat state and logic
 * Powered by Vercel AI SDK
 */

import { useMemo, useEffect, useCallback } from 'react'
import { useChat as useVercelChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage, type UIDataTypes, type UITools, type UIMessagePart } from 'ai'
import { useConversations } from './chat/use-conversations'
import { useModel } from '@/providers/model-provider'
import type { MentionItem } from '@/components/ai/mention-popover'
import type { Message as AppMessage, Conversation } from '@/lib/chat-types'
import { fileToBase64, fileToDataUrl } from '@/lib/chat-utils'
import { nullToUndefined } from '@/lib/utils'
import { type InlineCardType } from '@/components/ai/cards/inline'

/** Extract tool invocations from message parts */
interface ToolInvocationData {
    toolName: string
    state: string
    result?: unknown
}

function extractToolInvocations(parts: UIMessagePart<UIDataTypes, UITools>[] | undefined): ToolInvocationData[] {
    if (!parts) return []
    return parts
        .filter(p => p.type === 'tool-invocation')
        .map(p => {
            const part = p as Record<string, unknown>
            return 'toolInvocation' in part ? part.toolInvocation as ToolInvocationData : undefined
        })
        .filter((t): t is ToolInvocationData => t != null)
}

/** Derive card type from tool name for proper inline card rendering */
function deriveCardType(toolName: string): InlineCardType {
    const name = toolName.toLowerCase()
    if (name.includes('invoice') || name.includes('faktura')) return 'invoice'
    if (name.includes('transaction') || name.includes('transaktion')) return 'transaction'
    if (name.includes('verification') || name.includes('verifikation') || name.includes('bokför')) return 'verification'
    if (name.includes('payroll') || name.includes('lön') || name.includes('payslip')) return 'payroll'
    if (name.includes('vat') || name.includes('moms')) return 'vat'
    if (name.includes('dividend') || name.includes('utdelning')) return 'dividend'
    if (name.includes('receipt') || name.includes('kvitto')) return 'receipt'
    if (name.includes('task') || name.includes('uppgift')) return 'task_completed'
    return 'report'
}

interface UseChatOptions {
    initialConversationId?: string
    isIncognito?: boolean
}

export interface SendMessageOptions {
    content: string
    files?: File[]
    mentions?: MentionItem[]
    retryMessageId?: string
    confirmationId?: string
    actionTrigger?: unknown
}

export function useChat(options: UseChatOptions = {}) {
    const { modelId } = useModel()
    const {
        conversations,
        setConversations,
        currentConversationId,
        setCurrentConversationId,
        currentConversation,
        startNewConversation,
        loadConversation,
        deleteConversation,
        deleteMessage: deleteConversationMessage,
    } = useConversations()

    // Initialize Vercel's useChat
    const {
        messages: vercelMessages,
        sendMessage: append,
        regenerate: reload,
        status,
        setMessages: setVercelMessages,
    } = useVercelChat({
        id: nullToUndefined(currentConversationId),
        transport: new DefaultChatTransport({
            api: '/api/chat',
            body: {
                conversationId: currentConversationId,
                model: modelId,
                incognito: options.isIncognito,
            },
        }),
        onError: (error) => {
            console.error('[useChat] Stream error:', error)
            window.dispatchEvent(new CustomEvent('ai-dialog-error', {
                detail: {
                    message: 'Något gick fel med AI-assistenten. Försök igen.',
                    error: error instanceof Error ? error.message : String(error),
                }
            }))
        },
        onFinish: ({ message }) => {
            window.dispatchEvent(new Event('ai-stream-complete'))

            // Trigger completions if necessary based on tool calls
            const toolInvocations = extractToolInvocations(message.parts)

            if (toolInvocations && toolInvocations.length > 0) {
                const firstTool = toolInvocations[0]
                const result = firstTool?.result as Record<string, unknown> | undefined

                if (result) {
                    const walkthrough = result.walkthrough || (result.data as Record<string, unknown>)?.walkthrough
                    
                    if (walkthrough) {
                        // Open the side panel with the walkthrough
                        window.dispatchEvent(new CustomEvent('ai-dialog-walkthrough-blocks', {
                            detail: walkthrough
                        }))
                    } else if (result.confirmationRequired) {
                        const confirmationRequired = result.confirmationRequired as Record<string, unknown>
                        // Open the side panel for confirmation
                        window.dispatchEvent(new CustomEvent('ai-dialog-complete', {
                            detail: {
                                contentType: 'action',
                                title: confirmationRequired.title || 'Bekräftelse krävs',
                                content: (result.message as string) || message.parts?.find(p => p.type === 'text')?.text || '',
                                confirmationRequired: result.confirmationRequired,
                                data: result.data
                            }
                        }))
                    } else if (result.display && typeof result.display === 'object' && 'fullViewRoute' in result.display) {
                        const display = result.display as Record<string, unknown>
                        // Fallback for tools that still return legacy display instructions 
                        // that warrant opening the side panel (e.g. they specify a fullViewRoute or similar)
                        window.dispatchEvent(new CustomEvent('ai-dialog-complete', {
                            detail: {
                                contentType: 'document',
                                title: display.title || 'Resultat',
                                content: (result.message as string) || message.parts?.find(p => p.type === 'text')?.text || '',
                                display: result.display,
                                data: result.data
                            }
                        }))
                    }
                    // If none of the above, it's an inline card or text, no side panel is opened.
                }
            }
        }
    })

    const isLoading = status === 'submitted' || status === 'streaming'

    // Sync Vercel messages when conversation changes
    useEffect(() => {
        if (currentConversation && currentConversation.messages) {
            // Convert AppMessages to Vercel UIMessages, reconstructing tool-invocation parts
            const mapped = currentConversation.messages.map(m => {
                const parts: UIMessagePart<UIDataTypes, UITools>[] = []

                // Add text part if there's content
                if (m.content) {
                    parts.push({ type: 'text' as const, text: m.content })
                }

                // Reconstruct tool-invocation parts from stored tool data
                if (m.toolResults && m.toolResults.length > 0) {
                    for (const tr of m.toolResults) {
                        // Find matching toolCall for args
                        const matchingCall = m.toolCalls?.find(tc => tc.toolName === tr.toolName)
                        parts.push({
                            type: 'tool-invocation' as const,
                            toolInvocation: {
                                toolCallId: matchingCall?.toolCallId || crypto.randomUUID(),
                                toolName: tr.toolName,
                                args: matchingCall?.args || {},
                                state: 'result' as const,
                                result: tr.result,
                            },
                        } as unknown as UIMessagePart<UIDataTypes, UITools>)
                    }
                }

                // If no parts at all, add empty text
                if (parts.length === 0) {
                    parts.push({ type: 'text' as const, text: '' })
                }

                return {
                    id: m.id,
                    role: m.role,
                    parts,
                }
            })

            // Only set if we haven't already synced this conversation
            if (vercelMessages.length === 0 && mapped.length > 0) {
                setVercelMessages(mapped)
            }
        } else if (!currentConversationId) {
            setVercelMessages([])
        }
    }, [currentConversationId, currentConversation, setVercelMessages]) // removed vercelMessages.length from deps

    // Map Vercel messages to App messages for UI
    const mappedMessages: AppMessage[] = useMemo(() => {
        return vercelMessages.map(vm => {
            const textPart = vm.parts?.find(p => p.type === 'text')
            const content = textPart && 'text' in textPart ? (textPart as { text: string }).text : ''
            
            const toolInvocations = extractToolInvocations(vm.parts)

            const appMsg: AppMessage = {
                id: vm.id,
                role: vm.role as 'user' | 'assistant',
                content: content,
            }

            // Map Vercel tool invocations to App message displays
            if (toolInvocations && toolInvocations.length > 0) {
                appMsg.toolResults = toolInvocations.map(t => ({
                    toolName: t.toolName,
                    result: t.state === 'result' ? t.result : undefined
                }))

                // Determine if we should show inline cards based on the tool result
                const completed = toolInvocations.filter(t => t.state === 'result')
                if (completed.length > 0) {
                    appMsg.display = {
                        type: 'InlineCards',
                        data: {
                            cards: completed.map(t => ({
                                cardType: deriveCardType(t.toolName),
                                data: t.result as Record<string, unknown>
                            }))
                        }
                    }
                }

                // Track pending tool calls for loading states
                const pending = toolInvocations.filter(t => t.state !== 'result')
                if (pending.length > 0) {
                    appMsg.pendingTools = pending.map(t => t.toolName)
                }
            }

            return appMsg
        })
    }, [vercelMessages])

    const sendMessage = useCallback(async (opts: SendMessageOptions) => {
        const attachments = opts.files ? await Promise.all(opts.files.map(fileToBase64)) : undefined

        await append({
            role: 'user',
            parts: [{ type: 'text', text: opts.content }],
        }, {
            body: {
                conversationId: currentConversationId,
                attachments,
                mentions: opts.mentions,
            }
        })
    }, [append, currentConversationId])

    const regenerateResponse = useCallback(() => {
        reload()
    }, [reload])

    return {
        conversations,
        currentConversationId,
        currentConversation,
        messages: mappedMessages,
        isLoading,
        sendMessage,
        regenerateResponse,
        startNewConversation,
        loadConversation,
        deleteConversation,
        deleteMessage: deleteConversationMessage,
        setCurrentConversationId,
    }
}
