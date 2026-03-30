"use client"

/**
 * useChatSession — Per-conversation chat instance.
 *
 * Created fresh each time the user starts or switches conversations
 * (via React's `key` prop on the parent component). This means:
 * - Transport is created once per mount, never goes stale
 * - No useEffect sync needed — initial messages passed as prop
 * - No stale closures — conversationId is baked in at creation
 */

import { useRef, useMemo, useCallback } from 'react'
import { useChat as useVercelChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage, type UIDataTypes, type UITools, type UIMessagePart } from 'ai'
import type { Message as AppMessage } from '@/lib/chat-types'
import type { MentionItem } from '@/components/ai/mention-popover'
import { fileToBase64 } from '@/lib/chat-utils'
import { type InlineCardType } from '@/components/ai/cards/inline'

// =============================================================================
// Helpers (moved from use-chat.ts)
// =============================================================================

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

/** Convert stored AppMessages to Vercel UIMessage format for initialMessages */
function appMessagesToUIMessages(messages: AppMessage[]) {
    return messages.map(m => {
        const parts: UIMessagePart<UIDataTypes, UITools>[] = []

        if (m.content) {
            parts.push({ type: 'text' as const, text: m.content })
        }

        if (m.toolResults && m.toolResults.length > 0) {
            for (const tr of m.toolResults) {
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

        if (parts.length === 0) {
            parts.push({ type: 'text' as const, text: '' })
        }

        return { id: m.id, role: m.role, parts }
    })
}

// =============================================================================
// Public types
// =============================================================================

export interface SendMessageOptions {
    content: string
    files?: File[]
    mentions?: MentionItem[]
    retryMessageId?: string
    confirmationId?: string
    actionTrigger?: unknown
}

export interface ChatSession {
    messages: AppMessage[]
    isLoading: boolean
    sendMessage: (opts: SendMessageOptions) => Promise<void>
    regenerateResponse: () => void
}

// =============================================================================
// Hook
// =============================================================================

interface UseChatSessionOptions {
    conversationId: string | null
    initialMessages: AppMessage[]
    modelId: string
    isIncognito: boolean
}

export function useChatSession({
    conversationId,
    initialMessages,
    modelId,
    isIncognito,
}: UseChatSessionOptions): ChatSession {
    // Transport created once per mount via lazy ref.
    // Since this component remounts per conversation (key prop),
    // the ref is always fresh and the conversationId never goes stale.
    const transportRef = useRef<DefaultChatTransport<UIMessage> | null>(null)
    if (transportRef.current === null) {
        transportRef.current = new DefaultChatTransport<UIMessage>({
            api: '/api/chat',
            body: {
                conversationId,
                model: modelId,
                incognito: isIncognito,
            },
        })
    }

    // Convert initial app messages to Vercel format (once, on mount)
    const initialUIMessages = useRef(appMessagesToUIMessages(initialMessages)).current

    // -------------------------------------------------------------------------
    // Stable callback refs — ROOT CAUSE FIX
    //
    // The Vercel AI SDK v6 uses the onError/onFinish options as dependencies
    // when constructing its internal Chat class instance. Inline arrow functions
    // are new objects on every render, so the SDK was destroying and recreating
    // its Chat instance on every single render — wiping messages each time.
    //
    // Pattern: mutable ref holds latest logic; stable useCallback ([] deps)
    // is passed to the SDK so its reference never changes.
    // -------------------------------------------------------------------------
    const onErrorLogicRef = useRef<(error: Error) => void>(() => {})
    onErrorLogicRef.current = (error: Error) => {
        console.error('[useChatSession] Stream error:', error)
        window.dispatchEvent(new CustomEvent('ai-dialog-error', {
            detail: {
                message: 'Något gick fel med AI-assistenten. Försök igen.',
                error: error instanceof Error ? error.message : String(error),
            }
        }))
    }

    const onFinishLogicRef = useRef<(opts: { message: UIMessage }) => void>(() => {})
    onFinishLogicRef.current = ({ message }: { message: UIMessage }) => {
        window.dispatchEvent(new Event('ai-stream-complete'))

        const toolInvocations = extractToolInvocations(message.parts)

        if (toolInvocations.length > 0) {
            const firstTool = toolInvocations[0]
            const result = firstTool?.result as Record<string, unknown> | undefined

            if (result) {
                const walkthrough = result.walkthrough || (result.data as Record<string, unknown>)?.walkthrough

                if (walkthrough) {
                    window.dispatchEvent(new CustomEvent('ai-dialog-walkthrough-blocks', {
                        detail: walkthrough
                    }))
                } else if (result.confirmationRequired) {
                    const confirmationRequired = result.confirmationRequired as Record<string, unknown>
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
            }
        }
    }

    // Stable wrappers: created once ([] deps), always call the latest ref logic.
    const stableOnError = useCallback((error: Error) => onErrorLogicRef.current(error), [])
    const stableOnFinish = useCallback((opts: { message: UIMessage }) => onFinishLogicRef.current(opts), [])

    const {
        messages: vercelMessages,
        sendMessage: append,
        regenerate: reload,
        status,
    } = useVercelChat({
        ...(conversationId != null ? { id: conversationId } : {}),
        transport: transportRef.current,
        messages: initialUIMessages.length > 0 ? initialUIMessages : undefined,
        experimental_throttle: 50,
        onError: stableOnError,
        onFinish: stableOnFinish,
    })

    const isLoading = status === 'submitted' || status === 'streaming'

    // Map Vercel messages to App messages for UI
    const messages: AppMessage[] = useMemo(() => {
        return vercelMessages.map(vm => {
            const textPart = vm.parts?.find(p => p.type === 'text')
            const textPartContent = textPart && 'text' in textPart ? (textPart as { text: string }).text : ''
            const content = textPartContent || ('content' in vm && typeof vm.content === 'string' ? vm.content : '')

            const toolInvocations = extractToolInvocations(vm.parts)

            const appMsg: AppMessage = {
                id: vm.id,
                role: vm.role as 'user' | 'assistant',
                content,
            }

            if (toolInvocations.length > 0) {
                appMsg.toolResults = toolInvocations.map(t => ({
                    toolName: t.toolName,
                    result: t.state === 'result' ? t.result : undefined
                }))

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
            text: opts.content,
        }, {
            body: {
                conversationId,
                attachments,
                mentions: opts.mentions,
            }
        })
    }, [append, conversationId])

    const regenerateResponse = useCallback(() => {
        reload()
    }, [reload])

    return { messages, isLoading, sendMessage, regenerateResponse }
}
