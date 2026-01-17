"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { useChat } from "@/hooks/use-chat"
import { ChatInput } from "@/components/ai/chat-input"
import { ChatMessageList } from "@/components/ai/chat-message-list"
import { type MentionItem } from "@/components/ai/mention-popover"
import { getGreeting } from "@/lib/chat-utils"
import { Plus, MessageSquare, Loader2 } from "lucide-react"
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
import { SidebarModeDropdown } from "./sidebar-mode-dropdown"
import { type SidebarMode } from "./app-sidebar"
import { AI_CHAT_EVENT, type PageContext } from "@/lib/ai-context"

interface AIChatSidebarProps {
    mode?: SidebarMode
    onModeChange?: (mode: SidebarMode) => void
}

export function AIChatSidebar({ mode, onModeChange }: AIChatSidebarProps) {
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
                // If we're already in a conversation with messages, start a new one first?
                // Or just append. For "Ask AI" buttons, usually starting fresh or just sending is best.
                // The requirements say "deactivate page", so we want the sidebar to act as the page.

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

        window.addEventListener(AI_CHAT_EVENT, handleOpenAIChat)
        window.addEventListener("load-conversation", handleLoadConversation)

        return () => {
            window.removeEventListener(AI_CHAT_EVENT, handleOpenAIChat)
            window.removeEventListener("load-conversation", handleLoadConversation)
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
        <SidebarGroup className="flex-1 flex flex-col overflow-hidden gap-2">
            {/* Header */}
            <div className="flex items-center justify-between px-2 shrink-0 h-8">
                {mode && onModeChange ? (
                    <div className="-ml-2 w-[180px]">
                        <SidebarModeDropdown mode={mode} onModeChange={onModeChange} />
                    </div>
                ) : (
                    <span className="text-sm font-medium">Scope AI</span>
                )}
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setShowHistory(true)}
                        title="Visa historik"
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleNewConversation}
                        title="Ny chatt"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Main Chat Container */}
            <div className="flex-1 flex flex-col min-h-0 bg-sidebar-accent rounded-lg overflow-hidden">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-3">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
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
