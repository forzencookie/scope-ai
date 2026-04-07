"use client"

/**
 * Chat Provider — Dual-context architecture.
 *
 * Outer context (ChatContext): Folder-level state that survives conversation switches.
 *   - Conversation list, current ID, UI state (textarea, files, mentions)
 *   - Event listeners, orchestration (new conversation, load, delete)
 *
 * Inner context (ChatSessionContext): Per-conversation state, fresh each switch.
 *   - Vercel AI SDK instance, messages, loading state, send/regenerate
 *   - Mounted inside ChatSessionGate with key={conversationId}
 *
 * The key boundary ensures React unmounts/remounts the session on every
 * conversation switch — no stale state, no message leaks, no sync effects.
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import { useConversations } from "@/hooks/chat/use-conversations"
import { useChatSession, type SendMessageOptions, type ChatSession } from "@/hooks/use-chat-session"
import { useAIUsage } from "@/hooks/use-ai-usage"
import { useSubscription } from "@/hooks/use-subscription"
import { useModel } from "@/providers/model-provider"
import type { MentionItem } from "@/components/ai/mention-popover"
import type { Conversation } from "@/lib/chat-types"
import { AI_CHAT_EVENT, type PageContext, consumePendingAIContext } from "@/lib/ai/context"
import type { ActionTriggerDisplay } from "@/components/ai/confirmations/action-trigger-chip"
import { nullToUndefined } from "@/lib/utils"

// =============================================================================
// Outer Context — Folder Level
// =============================================================================

interface ChatContextValue {
    // Conversation management
    conversations: Conversation[]
    currentConversationId: string | null
    currentConversation: Conversation | undefined
    handleNewConversation: () => void
    loadConversation: (id: string) => void
    deleteConversation: (id: string) => void
    deleteMessage: (id: string) => void
    // Input state (shared between components)
    textareaValue: string
    setTextareaValue: (v: string) => void
    mentionItems: MentionItem[]
    setMentionItems: (v: MentionItem[]) => void
    attachedFiles: File[]
    setAttachedFiles: (v: File[]) => void
    actionTrigger: ActionTriggerDisplay | null
    setActionTrigger: (v: ActionTriggerDisplay | null) => void
    isInputFocused: boolean
    setIsInputFocused: (v: boolean) => void
    // Navigation state
    returnTo: string | null
    setReturnTo: (v: string | null) => void
    // Credits
    showBuyCredits: boolean
    setShowBuyCredits: (v: boolean) => void
    handleSend: () => void
    handleCancelConfirmation: (messageId: string) => void
    // Incognito mode
    isIncognito: boolean
    toggleIncognito: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function useChatContext() {
    const ctx = useContext(ChatContext)
    if (!ctx) throw new Error("useChatContext must be used within ChatProvider")
    return ctx
}

// =============================================================================
// Inner Context — Conversation Level
// =============================================================================

const ChatSessionContext = createContext<ChatSession | null>(null)

export function useChatSessionContext(): ChatSession {
    const ctx = useContext(ChatSessionContext)
    if (!ctx) throw new Error("useChatSessionContext must be used within ChatSessionGate")
    return ctx
}

// =============================================================================
// ChatSessionGate — Keyed wrapper that remounts per conversation
// =============================================================================

interface ChatSessionGateProps {
    children: React.ReactNode
}

/**
 * Reads the current conversation from the outer context and renders
 * a ChatSessionProvider with key={conversationId}. When the ID changes,
 * React unmounts the old provider and mounts a fresh one.
 */
export function ChatSessionGate({ children }: ChatSessionGateProps) {
    const { currentConversationId, currentConversation, isIncognito } = useChatContext()
    const { modelId } = useModel()

    const initialMessages = currentConversation?.messages ?? []

    return (
        <ChatSessionInner
            key={currentConversationId ?? 'empty'}
            conversationId={currentConversationId}
            initialMessages={initialMessages}
            modelId={modelId}
            isIncognito={isIncognito}
        >
            {children}
        </ChatSessionInner>
    )
}

interface ChatSessionInnerProps {
    conversationId: string | null
    initialMessages: Conversation['messages']
    modelId: string
    isIncognito: boolean
    children: React.ReactNode
}

/**
 * Inner provider that owns the Vercel AI SDK instance.
 * Registers its sendMessage/regenerate with the outer provider's ref bridge
 * so the outer "Send" button can reach across the boundary.
 */
function ChatSessionInner({
    conversationId,
    initialMessages,
    modelId,
    isIncognito,
    children,
}: ChatSessionInnerProps) {
    const session = useChatSession({ conversationId, initialMessages, modelId, isIncognito })

    // Register with outer provider's ref bridge
    const outerCtx = useContext(ChatContext)
    const registered = useRef(false)
    if (!registered.current && outerCtx) {
        // Synchronous registration on first render — no useEffect delay
        registerSessionRef.current?.({
            sendMessage: session.sendMessage,
            regenerateResponse: session.regenerateResponse,
        })
        registered.current = true
    }

    // Keep refs updated if callbacks change (e.g., after Vercel SDK stabilizes)
    useEffect(() => {
        registerSessionRef.current?.({
            sendMessage: session.sendMessage,
            regenerateResponse: session.regenerateResponse,
        })
        return () => {
            registerSessionRef.current?.(null)
        }
    }, [session.sendMessage, session.regenerateResponse])

    return (
        <ChatSessionContext.Provider value={session}>
            {children}
        </ChatSessionContext.Provider>
    )
}

// Module-level ref for the registration bridge.
// This avoids threading a callback through context (which would cause the
// inner provider to depend on outer context changes).
const registerSessionRef: React.MutableRefObject<((session: {
    sendMessage: ChatSession['sendMessage']
    regenerateResponse: ChatSession['regenerateResponse']
} | null) => void) | null> = { current: null }

// =============================================================================
// ChatProvider — Outer Provider
// =============================================================================

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { modelId } = useModel()
    const { canAfford, refresh: refreshUsage } = useAIUsage()
    const { isPaid } = useSubscription()
    const [isIncognito, setIsIncognito] = useState(false)

    const {
        conversations,
        currentConversationId,
        setCurrentConversationId,
        currentConversation,
        loadConversation,
        deleteConversation,
        deleteMessage,
        extractMemories,
        cleanupIncognitoConversation,
        refreshConversations,
    } = useConversations()

    const [textareaValue, setTextareaValue] = useState("")
    const [mentionItems, setMentionItems] = useState<MentionItem[]>([])
    const [attachedFiles, setAttachedFiles] = useState<File[]>([])
    const [actionTrigger, setActionTrigger] = useState<ActionTriggerDisplay | null>(null)
    const [isInputFocused, setIsInputFocused] = useState(false)
    const [showBuyCredits, setShowBuyCredits] = useState(false)
    const [returnTo, setReturnTo] = useState<string | null>(null)

    // Ref bridge — inner session registers its functions here
    const sendMessageRef = useRef<ChatSession['sendMessage'] | null>(null)
    const regenerateRef = useRef<ChatSession['regenerateResponse'] | null>(null)
    const pendingMessageRef = useRef<SendMessageOptions | null>(null)

    // Wire up the module-level registration ref SYNCHRONOUSLY during render.
    // This must happen before children render so ChatSessionInner can register
    // during its own render phase. useEffect runs children-first, which causes
    // a race condition where the inner component's registration call finds null.
    if (!registerSessionRef.current) {
        registerSessionRef.current = (session) => {
            if (session) {
                sendMessageRef.current = session.sendMessage
                regenerateRef.current = session.regenerateResponse
                // Flush pending message if queued (auto-send from page context)
                if (pendingMessageRef.current) {
                    const pending = pendingMessageRef.current
                    pendingMessageRef.current = null
                    session.sendMessage(pending)
                }
            } else {
                sendMessageRef.current = null
                regenerateRef.current = null
            }
        }
    }

    // Cleanup registration on unmount
    useEffect(() => {
        return () => {
            registerSessionRef.current = null
        }
    }, [])

    // Clear input state helper
    const clearInputState = useCallback(() => {
        setTextareaValue("")
        setMentionItems([])
        setAttachedFiles([])
        setActionTrigger(null)
    }, [])

    // Orchestrate leaving the current conversation (memory extraction + incognito cleanup)
    const leaveCurrentConversation = useCallback(() => {
        if (currentConversationId === null) return

        // Check if this is an incognito conversation
        const conv = conversations.find(c => c.id === currentConversationId)
        if (conv?.isIncognito) {
            cleanupIncognitoConversation(currentConversationId)
        } else {
            extractMemories(currentConversationId)
        }
    }, [currentConversationId, conversations, extractMemories, cleanupIncognitoConversation])

    const handleNewConversation = useCallback(() => {
        leaveCurrentConversation()
        setCurrentConversationId(crypto.randomUUID())
        clearInputState()
        setReturnTo(null)
        window.dispatchEvent(new CustomEvent('ai-dialog-hide'))
    }, [leaveCurrentConversation, setCurrentConversationId, clearInputState])

    const handleLoadConversation = useCallback((id: string) => {
        leaveCurrentConversation()
        loadConversation(id)
        clearInputState()
        window.dispatchEvent(new CustomEvent('ai-dialog-hide'))
    }, [leaveCurrentConversation, loadConversation, clearInputState])

    const toggleIncognito = useCallback(() => {
        setIsIncognito(prev => !prev)
        handleNewConversation()
    }, [handleNewConversation])

    const handleSend = useCallback(() => {
        if (isPaid && !canAfford(modelId)) {
            setShowBuyCredits(true)
            return
        }

        const files = [...attachedFiles]
        const mentions = [...mentionItems]
        const trigger = actionTrigger

        let finalContent = textareaValue
        if (trigger?.meta && typeof trigger.meta === 'string') {
            finalContent = `${trigger.meta} ${textareaValue}`.trim()
        }

        clearInputState()

        sendMessageRef.current?.({
            content: finalContent,
            files,
            mentions,
            actionTrigger: nullToUndefined(trigger),
        })
    }, [textareaValue, attachedFiles, mentionItems, actionTrigger, isPaid, canAfford, modelId, clearInputState])

    const handleCancelConfirmation = useCallback((messageId: string) => {
        deleteMessage(messageId)
    }, [deleteMessage])

    // Refresh usage + conversation list when AI stream completes
    useEffect(() => {
        const handler = () => {
            refreshUsage()
            refreshConversations()
        }
        window.addEventListener('ai-stream-complete', handler)
        return () => window.removeEventListener('ai-stream-complete', handler)
    }, [refreshUsage, refreshConversations])

    // Handle incoming AI context (auto-send from page actions)
    const handleAIContext = useCallback((context: PageContext) => {
        // Start fresh conversation
        leaveCurrentConversation()
        setCurrentConversationId(crypto.randomUUID())
        clearInputState()

        if (context.returnTo) {
            setReturnTo(context.returnTo)
        }
        if (context.actionTrigger) {
            setActionTrigger({
                type: 'action-trigger',
                icon: context.actionTrigger.icon,
                title: context.actionTrigger.title,
                subtitle: context.actionTrigger.subtitle,
                meta: context.actionTrigger.meta,
            })
        }

        if (context.autoSend) {
            // Queue the message — inner session will flush it on mount
            pendingMessageRef.current = {
                content: context.initialPrompt,
                actionTrigger: context.actionTrigger ? { ...context.actionTrigger } : undefined,
            }
            setActionTrigger(null)
        } else {
            setTextareaValue(context.initialPrompt)
        }
    }, [leaveCurrentConversation, setCurrentConversationId, clearInputState])

    // Keep handleAIContext in a ref so event listeners always see the latest
    const handleAIContextRef = useRef(handleAIContext)
    handleAIContextRef.current = handleAIContext

    // On mount, check for pending context
    const mountedRef = useRef(false)
    useEffect(() => {
        if (mountedRef.current) return
        mountedRef.current = true
        const pending = consumePendingAIContext()
        if (pending) {
            handleAIContextRef.current(pending)
        }
    }, [])

    // Listen for global events
    useEffect(() => {
        const handleOpenAIChat = (e: Event) => {
            const pending = consumePendingAIContext()
            if (pending) {
                handleAIContextRef.current(pending)
                return
            }
            const context = (e as CustomEvent).detail as PageContext
            if (context) {
                handleAIContextRef.current(context)
            }
        }

        const onLoadConversation = (e: Event) => {
            const conversationId = (e as CustomEvent).detail as string
            if (conversationId) {
                handleLoadConversation(conversationId)
            }
        }

        const onNewConversation = () => {
            handleNewConversation()
        }

        const handleFocusInput = (e: Event) => {
            const detail = (e as CustomEvent<{ prefill?: string }>).detail
            if (detail?.prefill) {
                setTextareaValue(detail.prefill)
            }
            setTimeout(() => {
                const textarea = document.querySelector('[data-ai-chat-input]') as HTMLTextAreaElement
                if (textarea) {
                    textarea.focus()
                    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
                }
            }, 100)
        }

        window.addEventListener(AI_CHAT_EVENT, handleOpenAIChat)
        window.addEventListener("load-conversation", onLoadConversation)
        window.addEventListener("ai-chat-new-conversation", onNewConversation)
        window.addEventListener("ai-chat-focus-input", handleFocusInput)

        return () => {
            window.removeEventListener(AI_CHAT_EVENT, handleOpenAIChat)
            window.removeEventListener("load-conversation", onLoadConversation)
            window.removeEventListener("ai-chat-new-conversation", onNewConversation)
            window.removeEventListener("ai-chat-focus-input", handleFocusInput)
        }
    }, [handleLoadConversation, handleNewConversation])

    return (
        <ChatContext.Provider value={{
            conversations,
            currentConversationId,
            currentConversation,
            handleNewConversation,
            loadConversation: handleLoadConversation,
            deleteConversation,
            deleteMessage,
            textareaValue,
            setTextareaValue,
            mentionItems,
            setMentionItems,
            attachedFiles,
            setAttachedFiles,
            actionTrigger,
            setActionTrigger,
            isInputFocused,
            setIsInputFocused,
            returnTo,
            setReturnTo,
            showBuyCredits,
            setShowBuyCredits,
            handleSend,
            handleCancelConfirmation,
            isIncognito,
            toggleIncognito,
        }}>
            {children}
        </ChatContext.Provider>
    )
}
