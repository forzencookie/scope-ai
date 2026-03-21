"use client"

/**
 * AI Chat Sidebar — compact chat view inside the collapsible sidebar.
 *
 * This is a thin UI shell. All chat state lives in ChatProvider (useChatContext).
 * No duplicate hooks, no duplicate event listeners, no duplicate state.
 */

import { useRef, useEffect, useState } from "react"
import { useChatContext } from "@/providers/chat-provider"
import { ChatInput } from "@/components/ai/chat-input"
import { ChatMessageList } from "@/components/ai/chat-message-list"
import { BuyCreditsDialog } from "@/components/billing"
import { getGreeting } from "@/lib/chat-utils"
import { Plus, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    useSidebar,
} from "@/components/ui/sidebar"
import { type SidebarMode } from "./app-sidebar"

interface AIChatSidebarProps {
    mode?: SidebarMode
    onModeChange?: (mode: SidebarMode) => void
}

export function AIChatSidebar({ }: AIChatSidebarProps) {
    const { state } = useSidebar()
    const isCollapsed = state === "collapsed"

    // All chat state from the shared provider — no duplicate useChat()
    const {
        conversations,
        currentConversationId,
        messages,
        isLoading,
        sendMessage,
        regenerateResponse,
        handleSend,
        handleCancelConfirmation,
        handleNewConversation,
        loadConversation,
        textareaValue,
        setTextareaValue,
        mentionItems,
        setMentionItems,
        attachedFiles,
        setAttachedFiles,
        isInputFocused,
        setIsInputFocused,
        showBuyCredits,
        setShowBuyCredits,
    } = useChatContext()

    const [showHistory, setShowHistory] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

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
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                    />

                    <div className="px-2 pt-2 text-center">
                        <p className="text-[10px] text-muted-foreground/60">
                            Scope AI kan göra misstag. Kontrollera viktig information.
                        </p>
                    </div>
                </div>
            </div>

            <BuyCreditsDialog
                open={showBuyCredits}
                onOpenChange={setShowBuyCredits}
                outOfTokens
            />
        </SidebarGroup>
    )
}
