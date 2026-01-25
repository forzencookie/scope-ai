"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { useChat } from "@/hooks/use-chat"
import { ChatInput } from "@/components/ai/chat-input"
import { ChatMessageList } from "@/components/ai/chat-message-list"
import { type MentionItem } from "@/components/ai/mention-popover"
import { getGreeting } from "@/lib/chat-utils"
import { Plus, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    useSidebar,
} from "@/components/ui/sidebar"
import { type SidebarMode } from "./app-sidebar"
import { AI_CHAT_EVENT, type PageContext } from "@/lib/ai/context"

interface AIChatSidebarProps {
    mode?: SidebarMode
    onModeChange?: (mode: SidebarMode) => void
}

export function AIChatSidebar({ }: AIChatSidebarProps) {
    const { state } = useSidebar()
    const isCollapsed = state === "collapsed"

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
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = useCallback(() => {
        const content = textareaValue
        const files = [...attachedFiles]
        const mentions = [...mentionItems]

        setTextareaValue("")
        setAttachedFiles([])
        setMentionItems([])

        sendMessage({
            content,
            files,
            mentions
        })
    }, [textareaValue, attachedFiles, mentionItems, sendMessage])

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

    // Listen for global events to trigger chat actions
    useEffect(() => {
        const handleOpenAIChat = (e: Event) => {
            const context = (e as CustomEvent).detail as PageContext
            if (context) {
                startNewConversation()
                if (context.autoSend) {
                    sendMessage({ content: context.initialPrompt })
                } else {
                    setTextareaValue(context.initialPrompt)
                }
                setShowHistory(false)
            }
        }

        const handleLoadConversation = (e: Event) => {
            const conversationId = (e as CustomEvent).detail as string
            if (conversationId) {
                loadConversation(conversationId)
                setShowHistory(false)
            }
        }

        const handleShowHistory = () => {
            setShowHistory(true)
        }

        const handleNewConversation = () => {
            startNewConversation()
            setTextareaValue("")
            setMentionItems([])
            setAttachedFiles([])
            setShowHistory(false)
        }

        // Handle focus input event from AI dialog edit button
        const handleFocusInput = (e: Event) => {
            const detail = (e as CustomEvent<{ prefill?: string }>).detail
            setShowHistory(false)

            // Set prefill value if provided
            if (detail?.prefill) {
                setTextareaValue(detail.prefill)
            }

            // Focus the textarea after a short delay to ensure DOM is ready
            setTimeout(() => {
                const textarea = document.querySelector('[data-ai-chat-input]') as HTMLTextAreaElement
                if (textarea) {
                    textarea.focus()
                    // Move cursor to end
                    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
                }
            }, 100)
        }

        window.addEventListener(AI_CHAT_EVENT, handleOpenAIChat)
        window.addEventListener("load-conversation", handleLoadConversation)
        window.addEventListener("ai-chat-show-history", handleShowHistory)
        window.addEventListener("ai-chat-new-conversation", handleNewConversation)
        window.addEventListener("ai-chat-focus-input", handleFocusInput)

        return () => {
            window.removeEventListener(AI_CHAT_EVENT, handleOpenAIChat)
            window.removeEventListener("load-conversation", handleLoadConversation)
            window.removeEventListener("ai-chat-show-history", handleShowHistory)
            window.removeEventListener("ai-chat-new-conversation", handleNewConversation)
            window.removeEventListener("ai-chat-focus-input", handleFocusInput)
        }
    }, [sendMessage, startNewConversation, loadConversation])

    // When collapsed, show only icons
    if (isCollapsed) {
        return (
            <SidebarGroup className="flex-1 flex flex-col">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Ny chatt"
                            onClick={handleNewConversation}
                        >
                            <Plus className="h-5 w-5" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Visa historik"
                            onClick={() => setShowHistory(!showHistory)}
                        >
                            <MessageSquare className="h-5 w-5" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        )
    }

    // History view
    if (showHistory) {
        return (
            <SidebarGroup className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-2 py-2">
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
                <SidebarGroupContent className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            Inga konversationer ännu
                        </div>
                    ) : (
                        <SidebarMenu>
                            {conversations.slice(0, 10).map((conv) => (
                                <SidebarMenuItem key={conv.id}>
                                    <SidebarMenuButton
                                        isActive={conv.id === currentConversationId}
                                        onClick={() => {
                                            loadConversation(conv.id)
                                            setShowHistory(false)
                                        }}
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="truncate">{conv.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    )}
                </SidebarGroupContent>
            </SidebarGroup>
        )
    }

    // Chat view
    return (
        <SidebarGroup className="flex-1 flex flex-col overflow-hidden gap-2 -mt-0.5">
            {/* Main Chat Container */}
            <div className="flex-1 flex flex-col min-h-0 bg-sidebar-accent rounded-lg overflow-hidden">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-3">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            {/* Interactive Pixel Art Dog - click to hop, smiles when input focused */}
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
                                    {/* Ears */}
                                    <rect x="2" y="2" width="2" height="3" className={cn("fill-amber-600 dark:fill-amber-500", isInputFocused && "animate-pulse")} />
                                    <rect x="12" y="2" width="2" height="3" className={cn("fill-amber-600 dark:fill-amber-500", isInputFocused && "animate-pulse")} />
                                    {/* Head */}
                                    <rect x="3" y="4" width="10" height="6" className="fill-amber-400 dark:fill-amber-300" />
                                    {/* Face markings */}
                                    <rect x="5" y="5" width="6" height="4" className="fill-amber-100 dark:fill-amber-50" />
                                    {/* Eyes - open when not focused */}
                                    {!isInputFocused && (
                                        <>
                                            <rect x="5" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
                                            <rect x="9" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
                                            <rect x="5" y="6" width="1" height="1" className="fill-white" />
                                            <rect x="9" y="6" width="1" height="1" className="fill-white" />
                                        </>
                                    )}
                                    {/* Closed Eyes (^ ^) - when input focused */}
                                    {isInputFocused && (
                                        <>
                                            {/* Left Eye ^ */}
                                            <rect x="5" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                            <rect x="6" y="6" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                            <rect x="7" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                            {/* Right Eye ^ */}
                                            <rect x="9" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                            <rect x="10" y="6" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                            <rect x="11" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                        </>
                                    )}
                                    {/* Nose */}
                                    <rect x="7" y="8" width="2" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                    {/* Tongue */}
                                    <rect x="7" y="9" width="2" height="1" className="fill-pink-400" />
                                    {/* Body */}
                                    <rect x="4" y="10" width="8" height="4" className="fill-amber-400 dark:fill-amber-300" />
                                    {/* Chest */}
                                    <rect x="6" y="10" width="4" height="3" className="fill-amber-100 dark:fill-amber-50" />
                                    {/* Tail - wags when focused */}
                                    <rect x="12" y="11" width="2" height="2" className={cn("fill-amber-600 dark:fill-amber-500", isInputFocused && "animate-[pixel-wiggle_0.3s_ease-in-out_infinite]")} />
                                    {/* Feet */}
                                    <rect x="4" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
                                    <rect x="10" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium">{getGreeting()}!</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Hur kan jag hjälpa dig?
                            </p>
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

                {/* Chat Input Area */}
                <div className="shrink-0 p-3 pt-0 bg-transparent">
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

                    {/* Disclaimer */}
                    <div className="px-2 pt-2 text-center">
                        <p className="text-[10px] text-muted-foreground/60">
                            Scope AI kan göra misstag. Kontrollera viktig information.
                        </p>
                    </div>
                </div>
            </div>
        </SidebarGroup>
    )
}
