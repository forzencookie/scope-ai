"use client"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbAIBadge,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, X } from "lucide-react"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"
import { useRef, useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { useChat } from "@/hooks/use-chat"
import { type MentionItem } from "@/components/ai/mention-popover"
import { ChatInput } from "@/components/ai/chat-input"
import { ChatMessageList } from "@/components/ai/chat-message-list"
import { getGreeting } from "@/lib/chat-utils"

function AIRobotPageContent() {
    const searchParams = useSearchParams()
    const initialPrompt = searchParams.get('prompt')
    const pageType = searchParams.get('pageType')
    const pageName = searchParams.get('pageName')
    const autoSend = searchParams.get('autoSend') === 'true'

    const {
        conversations,
        currentConversationId,
        messages,
        isLoading,
        sendMessage,
        regenerateResponse,
        startNewConversation: hookStartNewConversation,
        loadConversation: hookLoadConversation,
        deleteConversation: hookDeleteConversation,
        deleteMessage,
        setCurrentConversationId
    } = useChat()

    const [textareaValue, setTextareaValue] = useState("")
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [hasAppliedInitialPrompt, setHasAppliedInitialPrompt] = useState(false)
    const [mentionItems, setMentionItems] = useState<MentionItem[]>([])
    const [attachedFiles, setAttachedFiles] = useState<File[]>([])
    const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null)
    const [hasSentAutoMessage, setHasSentAutoMessage] = useState(false)

    // Apply initial prompt and page mention from URL params (only once)
    useEffect(() => {
        if (initialPrompt && !hasAppliedInitialPrompt) {
            setTextareaValue(decodeURIComponent(initialPrompt))
            setHasAppliedInitialPrompt(true)

            // Add page mention if provided
            if (pageType && pageName) {
                setMentionItems([{
                    id: `page-${pageType}`,
                    type: 'page',
                    label: pageName,
                    pageType: pageType
                }])
            }
        }
    }, [initialPrompt, pageType, pageName, hasAppliedInitialPrompt])



    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Create new conversation wrapper
    const startNewConversation = useCallback(() => {
        hookStartNewConversation()
        setTextareaValue("")
        setMentionItems([])
        setAttachedFiles([])
        setHasSentAutoMessage(false)
        setIsHistoryOpen(false)
    }, [hookStartNewConversation])

    // Load a conversation
    const loadConversation = useCallback((conversationId: string) => {
        hookLoadConversation(conversationId)
        setIsHistoryOpen(false)
    }, [hookLoadConversation])

    // Delete a conversation
    const deleteConversation = useCallback((conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        hookDeleteConversation(conversationId)
    }, [hookDeleteConversation])




    // Handler for sending message
    const handleSend = useCallback(() => {
        const content = textareaValue
        const files = [...attachedFiles]
        const mentions = [...mentionItems]

        // Clear input immediately
        setTextareaValue("")
        setAttachedFiles([])
        setMentionItems([])

        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }

        sendMessage({
            content,
            files,
            mentions
        })
    }, [textareaValue, attachedFiles, mentionItems, sendMessage])

    // Handler for canceling a confirmation request
    const handleCancelConfirmation = useCallback((messageId: string) => {
        deleteMessage(messageId)
    }, [deleteMessage])

    // Auto-send if initial prompt is set and not sent yet
    useEffect(() => {
        if (autoSend && hasAppliedInitialPrompt && !hasSentAutoMessage && !isLoading) {
            if (textareaValue || attachedFiles.length > 0) {
                setHasSentAutoMessage(true)
                handleSend()
            }
        }
    }, [autoSend, hasAppliedInitialPrompt, textareaValue, attachedFiles, hasSentAutoMessage, isLoading, handleSend])

    // Chat input using extracted component
    const chatInputJSX = (
        <ChatInput
            value={textareaValue}
            onChange={setTextareaValue}
            onSend={handleSend}
            isLoading={isLoading}
            files={attachedFiles}
            onFilesChange={setAttachedFiles}
            mentions={mentionItems}
            onMentionsChange={setMentionItems}
            onPreviewFile={setPreviewFile}
            showNavLinks={true}
        />
    )





    return (
        <div className="flex flex-col h-svh">
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4 flex-1">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage className="flex items-center gap-2 font-[family-name:var(--font-zen-dots)]">
                                    <ScopeAILogo className="h-4 w-4" />
                                    Scope ai
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <div className="flex items-center gap-2 px-4">
                    <BreadcrumbAIBadge />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full hover:bg-muted"
                        aria-label="Ny chatt"
                        onClick={startNewConversation}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {messages.length === 0 ? (
                /* Empty state - centered greeting with input */
                <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4 pb-24">
                    <div className="text-center">
                        <h1 className="text-2xl font-semibold">{getGreeting()}!</h1>
                        <p className="text-muted-foreground mt-2">Hur kan jag hjälpa dig idag?</p>
                    </div>
                    {chatInputJSX}
                </div>
            ) : (
                /* Chat state - messages scroll, chatbar fixed at bottom */
                <>
                    <div className="flex-1 overflow-y-auto px-4 pb-32">
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

                    {/* Fixed chatbar */}
                    <div className="fixed bottom-0 inset-x-0 md:left-[var(--sidebar-width)] bg-gradient-to-t from-background from-70% to-transparent pt-6 pb-4 px-4">
                        {chatInputJSX}
                    </div>
                </>
            )}

            {/* Image Preview Modal */}
            {previewFile && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setPreviewFile(null)}
                    onKeyDown={(e) => e.key === 'Escape' && setPreviewFile(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full">
                        <button
                            onClick={() => setPreviewFile(null)}
                            className="absolute -top-10 right-0 p-2 text-white hover:text-white/80 transition-colors"
                            aria-label="Stäng förhandsgranskning"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <img
                            src={previewFile.url}
                            alt={previewFile.name}
                            className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <p className="text-center text-white/70 text-sm mt-2">{previewFile.name}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

// Loading fallback for Suspense
function AIRobotLoading() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
}

export default function AIRobotPage() {
    return (
        <Suspense fallback={<AIRobotLoading />}>
            <AIRobotPageContent />
        </Suspense>
    )
}
