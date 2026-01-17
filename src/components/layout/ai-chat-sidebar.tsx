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

export function AIChatSidebar() {
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
                            <Plus className="h-4 w-4" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Visa historik"
                            onClick={() => setShowHistory(!showHistory)}
                        >
                            <MessageSquare className="h-4 w-4" />
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
        <SidebarGroup className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-2 shrink-0">
                <span className="text-sm font-medium">Scope AI</span>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowHistory(true)}
                        title="Visa historik"
                    >
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleNewConversation}
                        title="Ny chatt"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <SidebarGroupContent className="flex-1 overflow-y-auto px-2">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <p className="text-sm font-medium">{getGreeting()}!</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Hur kan jag hjälpa dig?
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 py-2">
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
            </SidebarGroupContent>

            {/* Chat Input */}
            <div className="shrink-0 p-2 border-t border-sidebar-border">
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
            </div>
        </SidebarGroup>
    )
}
