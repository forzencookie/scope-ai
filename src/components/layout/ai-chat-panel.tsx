"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { useChat } from "@/hooks/use-chat"
import { useAIUsage } from "@/hooks/use-ai-usage"
import { useSubscription } from "@/hooks/use-subscription"
import { useModel } from "@/providers/model-provider"
import { ChatInput } from "@/components/ai/chat-input"
import { ChatMessageList } from "@/components/ai/chat-message-list"
import { BuyCreditsDialog } from "@/components/billing"
import { type MentionItem } from "@/components/ai/mention-popover"
import { getGreeting } from "@/lib/chat-utils"
import { Plus, MessageSquare, BookOpen, Users, PieChart, Building2, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AI_CHAT_EVENT, type PageContext, consumePendingAIContext } from "@/lib/ai/context"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const categoryBadges = [
    { label: "Hem", icon: Home, href: "/dashboard", color: "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" },
    { label: "Bokforing", icon: BookOpen, href: "/dashboard/bokforing", color: "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25" },
    { label: "Loner", icon: Users, href: "/dashboard/loner", color: "bg-violet-500/15 text-violet-400 hover:bg-violet-500/25" },
    { label: "Rapporter", icon: PieChart, href: "/dashboard/rapporter", color: "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25" },
    { label: "Agare", icon: Building2, href: "/dashboard/agare", color: "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25" },
]

export function AIChatPanel() {
    const router = useRouter()
    const { modelId } = useModel()
    const { canAfford, refresh: refreshUsage } = useAIUsage()
    const { isPaid } = useSubscription()

    const {
        conversations,
        currentConversationId,
        messages,
        isLoading,
        sendMessage,
        regenerateResponse,
        startNewConversation,
        loadConversation,
        deleteMessage,
    } = useChat()

    const [textareaValue, setTextareaValue] = useState("")
    const [mentionItems, setMentionItems] = useState<MentionItem[]>([])
    const [attachedFiles, setAttachedFiles] = useState<File[]>([])
    const [showHistory, setShowHistory] = useState(false)
    const [isInputFocused, setIsInputFocused] = useState(false)
    const [showBuyCredits, setShowBuyCredits] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = useCallback(() => {
        if (isPaid && !canAfford(modelId)) {
            setShowBuyCredits(true)
            return
        }

        const content = textareaValue
        const files = [...attachedFiles]
        const mentions = [...mentionItems]

        setTextareaValue("")
        setAttachedFiles([])
        setMentionItems([])

        sendMessage({ content, files, mentions })
        setTimeout(() => refreshUsage(), 2000)
    }, [textareaValue, attachedFiles, mentionItems, sendMessage, isPaid, canAfford, modelId, refreshUsage])

    const handleCancelConfirmation = useCallback((messageId: string) => {
        deleteMessage(messageId)
    }, [deleteMessage])

    const handleNewConversation = useCallback(() => {
        startNewConversation()
        setTextareaValue("")
        setMentionItems([])
        setAttachedFiles([])
        setShowHistory(false)
    }, [startNewConversation])

    // Handle incoming AI context
    const handleAIContextRef = useRef((context: PageContext) => { })
    useEffect(() => {
        handleAIContextRef.current = (context: PageContext) => {
            startNewConversation()
            if (context.autoSend) {
                sendMessage({
                    content: context.initialPrompt,
                    actionTrigger: context.actionTrigger
                })
            } else {
                setTextareaValue(context.initialPrompt)
            }
            setShowHistory(false)
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
                setShowHistory(false)
            }
        }

        const handleShowHistory = () => setShowHistory(true)

        const onNewConversationEvent = () => {
            startNewConversation()
            setTextareaValue("")
            setMentionItems([])
            setAttachedFiles([])
            setShowHistory(false)
        }

        const handleFocusInput = (e: Event) => {
            const detail = (e as CustomEvent<{ prefill?: string }>).detail
            setShowHistory(false)
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
        window.addEventListener("ai-chat-show-history", handleShowHistory)
        window.addEventListener("ai-chat-new-conversation", onNewConversationEvent)
        window.addEventListener("ai-chat-focus-input", handleFocusInput)

        return () => {
            window.removeEventListener(AI_CHAT_EVENT, handleOpenAIChat)
            window.removeEventListener("load-conversation", handleLoadConversation)
            window.removeEventListener("ai-chat-show-history", handleShowHistory)
            window.removeEventListener("ai-chat-new-conversation", onNewConversationEvent)
            window.removeEventListener("ai-chat-focus-input", handleFocusInput)
        }
    }, [loadConversation, startNewConversation])

    // History view
    if (showHistory) {
        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium">Konversationer</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowHistory(false)}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto px-2">
                    {conversations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            Inga konversationer annu
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0.5">
                            {conversations.slice(0, 20).map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => {
                                        loadConversation(conv.id)
                                        setShowHistory(false)
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left transition-colors",
                                        conv.id === currentConversationId
                                            ? "bg-accent text-accent-foreground"
                                            : "hover:bg-accent/50"
                                    )}
                                >
                                    <MessageSquare className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{conv.title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Chat view
    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-3">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        {/* Pixel Dog */}
                        <div
                            className="mb-4 cursor-pointer"
                            onClick={(e) => {
                                const dog = e.currentTarget.querySelector('svg')
                                if (dog) {
                                    dog.classList.add('animate-bounce')
                                    setTimeout(() => dog.classList.remove('animate-bounce'), 500)
                                }
                            }}
                        >
                            <svg width="48" height="48" viewBox="0 0 16 16" shapeRendering="crispEdges">
                                <rect x="2" y="2" width="2" height="3" className="fill-amber-600 dark:fill-amber-500" />
                                <rect x="12" y="2" width="2" height="3" className="fill-amber-600 dark:fill-amber-500" />
                                <rect x="3" y="4" width="10" height="6" className="fill-amber-400 dark:fill-amber-300" />
                                <rect x="5" y="5" width="6" height="4" className="fill-amber-100 dark:fill-amber-50" />
                                {!isInputFocused && (
                                    <>
                                        <rect x="5" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
                                        <rect x="9" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
                                        <rect x="5" y="6" width="1" height="1" className="fill-white" />
                                        <rect x="9" y="6" width="1" height="1" className="fill-white" />
                                    </>
                                )}
                                {isInputFocused && (
                                    <>
                                        <rect x="5" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                        <rect x="6" y="6" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                        <rect x="7" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                        <rect x="9" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                        <rect x="10" y="6" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                        <rect x="11" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                    </>
                                )}
                                <rect x="7" y="8" width="2" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                <rect x="7" y="9" width="2" height="1" className="fill-pink-400" />
                                <rect x="4" y="10" width="8" height="4" className="fill-amber-400 dark:fill-amber-300" />
                                <rect x="6" y="10" width="4" height="3" className="fill-amber-100 dark:fill-amber-50" />
                                <rect x="12" y="11" width="2" height="2" className="fill-amber-600 dark:fill-amber-500" />
                                <rect x="4" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
                                <rect x="10" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium">{getGreeting()}!</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Hur kan jag hjalpa dig?
                        </p>

                        {/* Category Badges */}
                        <div className="flex flex-wrap justify-center gap-2 mt-6 px-2">
                            {categoryBadges.map((cat) => (
                                <button
                                    key={cat.href}
                                    onClick={() => router.push(cat.href)}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                                        cat.color
                                    )}
                                >
                                    <cat.icon className="h-3.5 w-3.5" />
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <ChatMessageList
                            messages={messages}
                            isLoading={isLoading}
                            onRetry={(id) => sendMessage({ retryMessageId: id, content: '' })}
                            onConfirm={(id) => sendMessage({ confirmationId: id, content: '' })}
                            onCancelConfirmation={handleCancelConfirmation}
                            onRegenerate={regenerateResponse}
                        />
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Chat Input */}
            <div className="shrink-0 p-3 pt-0">
                <ChatInput
                    value={textareaValue}
                    onChange={setTextareaValue}
                    onSend={handleSend}
                    isLoading={isLoading}
                    files={attachedFiles}
                    onFilesChange={setAttachedFiles}
                    mentions={mentionItems}
                    onMentionsChange={setMentionItems}
                    showNavLinks={false}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                />
                <div className="px-2 pt-2 text-center">
                    <p className="text-[10px] text-muted-foreground/60">
                        Scope AI kan gora misstag. Kontrollera viktig information.
                    </p>
                </div>
            </div>

            <BuyCreditsDialog
                open={showBuyCredits}
                onOpenChange={setShowBuyCredits}
                outOfTokens
            />
        </div>
    )
}
