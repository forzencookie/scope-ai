"use client"

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import { useChat } from "@/hooks/use-chat"
import { useAIUsage } from "@/hooks/use-ai-usage"
import { useSubscription } from "@/hooks/use-subscription"
import { useModel } from "@/providers/model-provider"
import type { MentionItem } from "@/components/ai/mention-popover"
import type { Conversation } from "@/lib/chat-types"
import { AI_CHAT_EVENT, type PageContext, consumePendingAIContext } from "@/lib/ai/context"
import type { ActionTriggerDisplay } from "@/components/ai/action-trigger-chip"

interface ChatContextValue {
    conversations: Conversation[]
    currentConversationId: string | null
    messages: ReturnType<typeof useChat>["messages"]
    isLoading: boolean
    sendMessage: ReturnType<typeof useChat>["sendMessage"]
    regenerateResponse: ReturnType<typeof useChat>["regenerateResponse"]
    startNewConversation: () => void
    loadConversation: (id: string) => void
    deleteConversation: (id: string) => void
    deleteMessage: (id: string) => void
    // Input state (shared between sidebar new-chat and main area)
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
    handleNewConversation: () => void
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

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { modelId } = useModel()
    const { canAfford, refresh: refreshUsage } = useAIUsage()
    const { isPaid } = useSubscription()
    const [isIncognito, setIsIncognito] = useState(false)

    const {
        conversations,
        currentConversationId,
        messages,
        isLoading,
        sendMessage,
        regenerateResponse,
        startNewConversation,
        loadConversation,
        deleteConversation,
        deleteMessage,
    } = useChat({ isIncognito })

    const [textareaValue, setTextareaValue] = useState("")
    const [mentionItems, setMentionItems] = useState<MentionItem[]>([])
    const [attachedFiles, setAttachedFiles] = useState<File[]>([])
    const [actionTrigger, setActionTrigger] = useState<ActionTriggerDisplay | null>(null)
    const [isInputFocused, setIsInputFocused] = useState(false)
    const [showBuyCredits, setShowBuyCredits] = useState(false)
    const [returnTo, setReturnTo] = useState<string | null>(null)

    const toggleIncognito = useCallback(() => {
        setIsIncognito(prev => !prev)
        // Start a fresh conversation when toggling
        startNewConversation()
        setTextareaValue("")
        setMentionItems([])
        setAttachedFiles([])
        setActionTrigger(null)
    }, [startNewConversation])

    const handleSend = useCallback(() => {
        if (isPaid && !canAfford(modelId)) {
            setShowBuyCredits(true)
            return
        }

        const files = [...attachedFiles]
        const mentions = [...mentionItems]
        const trigger = actionTrigger

        let finalContent = textareaValue
        if (trigger && trigger.meta && typeof trigger.meta === 'string') {
             // If the trigger has a hidden prompt in meta, prepend it
             finalContent = `${trigger.meta} ${textareaValue}`.trim()
        }

        setTextareaValue("")
        setAttachedFiles([])
        setMentionItems([])
        setActionTrigger(null)

        sendMessage({ content: finalContent, files, mentions, actionTrigger: trigger || undefined })
        setTimeout(() => refreshUsage(), 2000)
    }, [textareaValue, attachedFiles, mentionItems, actionTrigger, sendMessage, isPaid, canAfford, modelId, refreshUsage])

    const handleCancelConfirmation = useCallback((messageId: string) => {
        deleteMessage(messageId)
    }, [deleteMessage])

    const handleNewConversation = useCallback(() => {
        startNewConversation()
        setTextareaValue("")
        setMentionItems([])
        setAttachedFiles([])
        setActionTrigger(null)
        setReturnTo(null)
    }, [startNewConversation])

    // Handle incoming AI context
    const handleAIContextRef = useRef((context: PageContext) => { })
    useEffect(() => {
        handleAIContextRef.current = (context: PageContext) => {
            startNewConversation()
            if (context.returnTo) {
                setReturnTo(context.returnTo)
            }
            if (context.actionTrigger) {
                // Determine icon mapping if it's just a string, though PageContext ActionTrigger is typed differently
                setActionTrigger({
                    type: 'action-trigger',
                    icon: context.actionTrigger.icon,
                    title: context.actionTrigger.title,
                    subtitle: context.actionTrigger.subtitle,
                    meta: context.actionTrigger.meta
                })
            }
            if (context.autoSend) {
                sendMessage({
                    content: context.initialPrompt,
                    actionTrigger: context.actionTrigger ? { ...context.actionTrigger } : undefined
                })
                setActionTrigger(null) // clear it since it was sent
            } else {
                setTextareaValue(context.initialPrompt)
            }
        }
    })

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

        const handleLoadConversation = (e: Event) => {
            const conversationId = (e as CustomEvent).detail as string
            if (conversationId) {
                loadConversation(conversationId)
            }
        }

        const onNewConversationEvent = () => {
            startNewConversation()
            setTextareaValue("")
            setMentionItems([])
            setAttachedFiles([])
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
        window.addEventListener("load-conversation", handleLoadConversation)
        window.addEventListener("ai-chat-new-conversation", onNewConversationEvent)
        window.addEventListener("ai-chat-focus-input", handleFocusInput)

        return () => {
            window.removeEventListener(AI_CHAT_EVENT, handleOpenAIChat)
            window.removeEventListener("load-conversation", handleLoadConversation)
            window.removeEventListener("ai-chat-new-conversation", onNewConversationEvent)
            window.removeEventListener("ai-chat-focus-input", handleFocusInput)
        }
    }, [loadConversation, startNewConversation])

    return (
        <ChatContext.Provider value={{
            conversations,
            currentConversationId,
            messages,
            isLoading,
            sendMessage,
            regenerateResponse,
            startNewConversation,
            loadConversation,
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
            handleNewConversation,
            isIncognito,
            toggleIncognito,
        }}>
            {children}
        </ChatContext.Provider>
    )
}
