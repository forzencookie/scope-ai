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
import { Textarea } from "@/components/ui/textarea"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Plus, Send, Loader2, History, RefreshCw, AlertCircle, MessageSquare, Trash2, Paperclip, Mic, ArrowRight, Inbox, LayoutGrid, AtSign } from "lucide-react"
import { useRef, useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"
import {
    ConfirmationCard,
    ReceiptCard,
    TransactionCard,
    TaskChecklist
} from "@/components/ai"
import { MentionPopover, MentionBadge, type MentionItem } from "@/components/ai/mention-popover"
import type { AIDisplayInstruction, AIConfirmationRequest } from "@/lib/ai-tools"

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    error?: boolean
    // Structured data for AI cards
    display?: {
        type: 'ReceiptCard' | 'TransactionCard' | 'TaskChecklist' | 'ReceiptsTable'
        data: any
    }
    confirmationRequired?: {
        id: string
        type: string
        data: any
        action: string
    }
    toolResults?: Array<{
        toolName: string
        result: any
    }>
}

interface Conversation {
    id: string
    title: string
    messages: Message[]
    createdAt: number
    updatedAt: number
}

const STORAGE_KEY = 'ai-robot-conversations'

// Generate title from first user message
function generateTitle(messages: Message[]): string {
    const firstUserMessage = messages.find(m => m.role === 'user')
    if (!firstUserMessage) return 'Ny konversation'
    const title = firstUserMessage.content.slice(0, 40)
    return title.length < firstUserMessage.content.length ? `${title}...` : title
}

// Get greeting based on time of day
function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 5) return 'God natt'
    if (hour < 10) return 'Godmorgon'
    if (hour < 13) return 'God förmiddag'
    if (hour < 18) return 'God eftermiddag'
    return 'God kväll'
}

function AIRobotPageContent() {
    const searchParams = useSearchParams()
    const initialPrompt = searchParams.get('prompt')
    const [textareaValue, setTextareaValue] = useState("")
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const mentionAnchorRef = useRef<HTMLSpanElement>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const [hasAppliedInitialPrompt, setHasAppliedInitialPrompt] = useState(false)
    const [mentionItems, setMentionItems] = useState<MentionItem[]>([])
    const [isMentionOpen, setIsMentionOpen] = useState(false)

    // Get current conversation
    const currentConversation = conversations.find(c => c.id === currentConversationId)
    const messages = currentConversation?.messages || []

    // Apply initial prompt from URL params (only once)
    useEffect(() => {
        if (initialPrompt && !hasAppliedInitialPrompt) {
            setTextareaValue(decodeURIComponent(initialPrompt))
            setHasAppliedInitialPrompt(true)
            // Focus the textarea
            setTimeout(() => {
                textareaRef.current?.focus()
            }, 100)
        }
    }, [initialPrompt, hasAppliedInitialPrompt])

    // Load conversations from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as Conversation[]
                setConversations(parsed)
            } catch {
                console.error('Failed to parse stored conversations')
            }
        }
    }, [])

    // Save conversations to localStorage
    useEffect(() => {
        if (conversations.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
        }
    }, [conversations])

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Auto-resize textarea
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setTextareaValue(newValue)

        const textarea = textareaRef.current
        if (!textarea) return

        const wouldOverflow = textarea.scrollHeight > textarea.clientHeight

        if (!isExpanded && wouldOverflow) {
            setIsExpanded(true)
        } else if (isExpanded && newValue.length === 0) {
            setIsExpanded(false)
            // Reset height immediately when collapsing to prevent bounce
            textarea.style.height = ''
        }

        if (isExpanded && newValue.length > 0) {
            textarea.style.height = 'auto'
            textarea.style.height = textarea.scrollHeight + 'px'
        }
    }

    // Create new conversation
    const startNewConversation = useCallback(() => {
        setCurrentConversationId(null)
        setTextareaValue("")
        setIsExpanded(false)
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }, [])

    // Load a conversation
    const loadConversation = useCallback((conversationId: string) => {
        setCurrentConversationId(conversationId)
        setIsHistoryOpen(false)
    }, [])

    // Delete a conversation
    const deleteConversation = useCallback((conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        if (currentConversationId === conversationId) {
            setCurrentConversationId(null)
        }
    }, [currentConversationId])

    // Send message
    const sendMessage = useCallback(async (retryMessageId?: string, confirmationId?: string) => {
        const messageContent = textareaValue.trim()
        if (!messageContent && !retryMessageId && !confirmationId) return
        if (isLoading) return

        let conversationId = currentConversationId
        let updatedMessages = [...messages]

        // If retrying, find the message to retry and remove it + subsequent messages
        if (retryMessageId) {
            const retryIndex = updatedMessages.findIndex(m => m.id === retryMessageId)
            if (retryIndex > 0) {
                updatedMessages = updatedMessages.slice(0, retryIndex)
            }
        } else {
            // Add user message
            const userMessage: Message = {
                id: crypto.randomUUID(),
                role: 'user',
                content: messageContent
            }
            updatedMessages = [...updatedMessages, userMessage]
        }

        // Create or update conversation
        const assistantMessageId = crypto.randomUUID()
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: ''
        }
        updatedMessages = [...updatedMessages, assistantMessage]

        if (!conversationId) {
            // New conversation
            conversationId = crypto.randomUUID()
            const newConversation: Conversation = {
                id: conversationId,
                title: generateTitle(updatedMessages),
                messages: updatedMessages,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
            setConversations(prev => [newConversation, ...prev])
            setCurrentConversationId(conversationId)
        } else {
            // Update existing conversation
            setConversations(prev => prev.map(c =>
                c.id === conversationId
                    ? { ...c, messages: updatedMessages, updatedAt: Date.now(), title: generateTitle(updatedMessages) }
                    : c
            ))
        }

        setTextareaValue("")
        setIsExpanded(false)
        setIsLoading(true)

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages
                        .filter(m => m.role === 'user' || (m.role === 'assistant' && (m.content || m.display || m.confirmationRequired)))
                        .map(m => ({ role: m.role, content: m.content })),
                    confirmationId
                })
            })

            if (!response.ok) {
                throw new Error('Failed to get response')
            }

            const contentType = response.headers.get('content-type')

            // Handle Structured JSON Response (Tool Results / Cards)
            if (contentType?.includes('application/json')) {
                const data = await response.json()

                setConversations(prev => prev.map(c =>
                    c.id === conversationId
                        ? {
                            ...c,
                            messages: c.messages.map(msg =>
                                msg.id === assistantMessageId
                                    ? {
                                        ...msg,
                                        content: data.content,
                                        display: data.display,
                                        confirmationRequired: data.confirmationRequired,
                                        toolResults: data.toolResults
                                    }
                                    : msg
                            )
                        }
                        : c
                ))
                return
            }

            // Handle Streaming Text Response
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (reader) {
                let fullContent = ''
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const text = decoder.decode(value, { stream: true })
                    fullContent += text

                    setConversations(prev => prev.map(c =>
                        c.id === conversationId
                            ? {
                                ...c,
                                messages: c.messages.map(msg =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, content: fullContent }
                                        : msg
                                )
                            }
                            : c
                    ))
                }
            }
        } catch (error) {
            console.error('SendMessage error:', error)
            setConversations(prev => prev.map(c =>
                c.id === conversationId
                    ? {
                        ...c,
                        messages: c.messages.map(msg =>
                            msg.id === assistantMessageId
                                ? { ...msg, content: 'Ett fel uppstod. Försök igen.', error: true }
                                : msg
                        )
                    }
                    : c
            ))
        } finally {
            setIsLoading(false)
        }
    }, [textareaValue, messages, currentConversationId, isLoading])

    // Regenerate last response
    const regenerateResponse = useCallback(() => {
        const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')
        if (lastAssistantMessage) {
            sendMessage(lastAssistantMessage.id)
        }
    }, [messages, sendMessage])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    // Chat input component - Compact Cursor-style layout
    const chatInputJSX = (
        <div className="w-full max-w-2xl mx-auto">
            {/* Input container - stacked layout: textarea top, buttons bottom */}
            <div className="bg-muted/40 dark:bg-muted/30 border border-border/50 rounded-xl">
                {/* Top row - Textarea */}
                <div className="px-3 pt-3 pb-2">
                    <Textarea
                        ref={textareaRef}
                        value={textareaValue}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Skriv ett meddelande..."
                        className="resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground w-full min-h-[24px] max-h-[120px] text-sm"
                        rows={1}
                    />
                </div>

                {/* Bottom row - Buttons */}
                <div className="flex items-center justify-between px-2 pb-2">
                    {/* Left - attachment and mention buttons */}
                    <div className="flex items-center gap-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                            aria-label="Lägg till bilaga"
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-7 w-7 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground",
                                isMentionOpen && "bg-muted/60 text-foreground"
                            )}
                            aria-label="Nämn data"
                            onClick={() => setIsMentionOpen(!isMentionOpen)}
                        >
                            <AtSign className="h-4 w-4" />
                        </Button>
                        <span ref={mentionAnchorRef} className="hidden" />
                    </div>

                    {/* Right - mic and send */}
                    <div className="flex items-center gap-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                            aria-label="Röstinmatning"
                        >
                            <Mic className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            className="h-7 w-7 rounded-md disabled:opacity-50"
                            aria-label="Skicka meddelande"
                            onClick={() => sendMessage()}
                            disabled={isLoading || !textareaValue.trim()}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowRight className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Mention popover */}
                <MentionPopover
                    open={isMentionOpen}
                    onOpenChange={setIsMentionOpen}
                    onSelect={(item) => {
                        setTextareaValue(prev => prev + `@${item.label} `)
                        setMentionItems(prev => [...prev, item])
                        setIsMentionOpen(false)
                        textareaRef.current?.focus()
                    }}
                    searchQuery=""
                    items={[
                        { id: "cat-faktura", type: "faktura", label: "Faktura", sublabel: "Nämn en faktura" },
                        { id: "cat-kvitto", type: "kvitto", label: "Kvitto", sublabel: "Nämn ett kvitto" },
                        { id: "cat-transaktion", type: "transaktion", label: "Transaktion", sublabel: "Nämn en transaktion" },
                    ]}
                    anchorRef={mentionAnchorRef}
                />
            </div>

            {/* Navigation links below chatbar */}
            <div className="flex items-center gap-4 mt-2 px-1">
                <Link
                    href="/dashboard/sok"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Öppna Appar</span>
                </Link>
                <Link
                    href="/dashboard/ai-robot/konversationer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Inbox className="h-3.5 w-3.5" />
                    <span>Visa konversationer</span>
                </Link>
            </div>
        </div>
    )



    // Typing indicator
    const typingIndicator = (
        <div className="flex items-center gap-1 px-1 py-2">
            <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    )

    // Assistant message content renderer
    const AIMessageContent = ({ message, isLast }: { message: Message; isLast: boolean }) => {
        if (message.error) {
            return (
                <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{message.content}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => sendMessage(message.id)}
                    >
                        <RefreshCw className="h-3 w-3" />
                        Försök igen
                    </Button>
                </div>
            )
        }

        return (
            <div className="space-y-4 w-full">
                {/* Markdown Text */}
                {message.content && (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                )}

                {/* Confirmation Card */}
                {message.confirmationRequired && (
                    <ConfirmationCard
                        confirmation={message.confirmationRequired as any}
                        isLoading={isLoading && isLast}
                        onConfirm={() => sendMessage(undefined, message.confirmationRequired?.id)}
                        onCancel={() => {
                            // Optionally send a "cancel" message to the AI
                            setConversations(prev => prev.map(c =>
                                c.id === currentConversationId
                                    ? { ...c, messages: c.messages.filter(m => m.id !== message.id) }
                                    : c
                            ))
                        }}
                    />
                )}

                {/* Display Cards */}
                {message.display && (
                    <div className="my-2">
                        {message.display.type === 'ReceiptCard' && (
                            <ReceiptCard receipt={message.display.data.receipt || message.display.data} />
                        )}
                        {message.display.type === 'TransactionCard' && (
                            <TransactionCard transaction={message.display.data.transaction || message.display.data} />
                        )}
                        {message.display.type === 'TaskChecklist' && (
                            <TaskChecklist
                                title={message.display.data.title || "Uppgifter"}
                                tasks={message.display.data.tasks || []}
                            />
                        )}
                        {message.display.type === ('BenefitsTable' as any) && (
                            <div className="rounded-lg border border-border p-4 bg-muted/30">
                                <h4 className="text-sm font-medium mb-2">Tillgängliga Förmåner</h4>
                                <ul className="space-y-2">
                                    {(message.display.data.benefits || []).map((b: any) => (
                                        <li key={b.id} className="text-xs flex justify-between items-center">
                                            <span>{b.name}</span>
                                            <span className="text-muted-foreground">{b.category}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Typing Indicator */}
                {isLoading && isLast && !message.content && !message.display && !message.confirmationRequired && (
                    typingIndicator
                )}
            </div>
        )
    }

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
                                <BreadcrumbPage>AI Robot</BreadcrumbPage>
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
                    <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full hover:bg-muted"
                                aria-label="Historik"
                            >
                                <History className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-80">
                            <SheetHeader>
                                <SheetTitle>Chatthistorik</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 flex flex-col gap-1">
                                {conversations.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Inga tidigare konversationer
                                    </p>
                                ) : (
                                    conversations.map((conv) => (
                                        <button
                                            key={conv.id}
                                            onClick={() => loadConversation(conv.id)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg text-left transition-colors group",
                                                conv.id === currentConversationId
                                                    ? "bg-muted"
                                                    : "hover:bg-muted/50"
                                            )}
                                        >
                                            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{conv.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(conv.updatedAt).toLocaleDateString('sv-SE')}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                                onClick={(e) => deleteConversation(conv.id, e)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </button>
                                    ))
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
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
                        <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 py-4">
                            {messages.map((message, index) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex flex-col gap-2",
                                        message.role === 'user' ? 'items-end' : 'items-start'
                                    )}
                                >
                                    {message.role === 'user' ? (
                                        <div className="rounded-2xl px-4 py-3 bg-primary text-primary-foreground max-w-[85%]">
                                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        </div>
                                    ) : (
                                        <div className="w-full max-w-[85%]">
                                            <AIMessageContent
                                                message={message}
                                                isLast={index === messages.length - 1}
                                            />
                                        </div>
                                    )}
                                    {/* Regenerate button for last assistant message */}
                                    {message.role === 'assistant' &&
                                        index === messages.length - 1 &&
                                        !isLoading &&
                                        message.content &&
                                        !message.error && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                                                onClick={regenerateResponse}
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                                Generera nytt svar
                                            </Button>
                                        )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Fixed chatbar */}
                    <div className="fixed bottom-0 inset-x-0 md:left-[var(--sidebar-width)] bg-gradient-to-t from-background from-70% to-transparent pt-6 pb-4 px-4">
                        {chatInputJSX}
                    </div>
                </>
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
