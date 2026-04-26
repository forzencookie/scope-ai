"use client"

import React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui"
import { AlertCircle, RefreshCw, FileText, Image as ImageIcon } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Link from "next/link"
import { ActionCard } from "@/components/ai"
import { AiProcessingState } from "@/components/shared/ai-processing-state"
import { AuditCard } from "@/components/ai/cards/information-cards/audit-card"
import { Block } from "@/components/ai/cards/rows/block"
import { BuyCreditsPrompt, type BuyCreditsPromptProps } from "@/components/ai/cards/BuyCreditsCard"
import { SkillBadge } from "@/components/ai/skill-picker"
import type { Message } from "@/lib/chat/chat-types"
import { useState } from "react"

// Attachment preview with image error fallback
interface AttachmentData {
    name?: string
    type?: string
    url?: string
    data?: string
    content?: string
}

const AttachmentPreview = React.memo(function AttachmentPreview({ attachment }: { attachment: AttachmentData }) {
    const [imageError, setImageError] = useState(false)
    const isImage = attachment.type?.startsWith('image/')

    // Determine the image source
    const getImageSrc = () => {
        if (attachment.url) return attachment.url
        if (attachment.data && attachment.type) {
            return `data:${attachment.type};base64,${attachment.data}`
        }
        if (attachment.content) return attachment.content
        return null
    }

    const imageSrc = isImage ? getImageSrc() : null
    const showImage = isImage && imageSrc && !imageError

    return (
        <div className="flex items-center gap-2 bg-muted/60 rounded-lg p-2 pr-3 text-xs max-w-[200px]">
            {showImage ? (
                <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0 relative">
                    <Image
                        src={imageSrc}
                        alt={attachment.name || 'Bild'}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                        unoptimized
                    />
                </div>
            ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    {isImage ? (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                </div>
            )}
            <div className="flex flex-col min-w-0">
                <span className="font-medium truncate max-w-[100px]">{attachment.name || 'Fil'}</span>
                <span className="text-muted-foreground">Bifogad fil</span>
            </div>
        </div>
    )
})


interface ChatMessageListProps {
    messages: Message[]
    isLoading: boolean
    onRetry: (messageId: string) => void
    onConfirm: (confirmationId: string) => void
    onCancelConfirmation: (messageId: string) => void
    onRegenerate?: () => void
}

export const ChatMessageList = React.memo(function ChatMessageList({
    messages,
    isLoading,
    onRetry,
    onConfirm,
    onCancelConfirmation,
}: ChatMessageListProps) {
    // Only used to check if a message is last
    const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null

    // Helper component for AI messages
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
                        onClick={() => onRetry(message.id)}
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
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-3 prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-hr:my-4 prose-table:border-collapse prose-td:border prose-td:border-border/40 prose-td:px-3 prose-td:py-1.5 prose-th:border prose-th:border-border/40 prose-th:px-3 prose-th:py-1.5 prose-th:bg-muted/30 prose-th:text-left prose-strong:text-foreground prose-code:text-[0.85em] prose-code:bg-muted/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                a: ({ href, children }) => {
                                    if (href?.startsWith('/')) {
                                        return (
                                            <Link
                                                href={href}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium no-underline hover:bg-primary/20 transition-colors"
                                            >
                                                {children}
                                            </Link>
                                        )
                                    }
                                    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                                },
                                h3: ({ children }) => (
                                    <h3 className="text-sm font-semibold text-foreground">{children}</h3>
                                ),
                                h2: ({ children }) => (
                                    <h2 className="text-base font-semibold text-foreground">{children}</h2>
                                ),
                                p: ({ children }) => (
                                    <p className="text-sm leading-relaxed text-foreground/90">{children}</p>
                                ),
                                ul: ({ children }) => (
                                    <ul className="text-sm space-y-1 text-foreground/90">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                    <ol className="text-sm space-y-1 text-foreground/90">{children}</ol>
                                ),
                                li: ({ children }) => (
                                    <li className="text-sm leading-relaxed">{children}</li>
                                ),
                                hr: () => (
                                    <hr className="border-border/40" />
                                ),
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>
                )}

                {/* Confirmation Card - Only show on mobile, desktop uses dialog overlay */}
                {message.confirmationRequired && (
                    <div className="md:hidden">
                        <ActionCard
                            confirmation={{
                                title: message.confirmationRequired.type,
                                description: message.confirmationRequired.action,
                                summary: Object.entries(message.confirmationRequired.data).map(([label, value]) => ({
                                    label,
                                    value: String(value),
                                })),
                                action: {
                                    toolName: message.confirmationRequired.type,
                                    params: message.confirmationRequired.data,
                                },
                            }}
                            isLoading={isLoading && isLast}
                            onConfirm={() => onConfirm(message.confirmationRequired!.id)}
                            onCancel={() => onCancelConfirmation(message.id)}
                        />
                    </div>
                )}

                {/* Block — universal inline data rows, always visible */}
                {message.display?.type === 'Block' && (
                    <div className="my-2">
                        <Block block={message.display.data} />
                    </div>
                )}

                {/* Audit card — always visible, no overlay */}
                {message.display?.type === 'BalanceAuditCard' && (
                    <div className="my-2">
                        <AuditCard audit={message.display.data.audit} />
                    </div>
                )}

                {/* Credits prompt — shown when user hits budget limit */}
                {message.display?.type === 'BuyCreditsPrompt' && (
                    <div className="my-2">
                        <BuyCreditsPrompt packages={(message.display.data.packages as BuyCreditsPromptProps['packages']) ?? []} />
                    </div>
                )}

                {/* Pending tool calls — show each tool individually */}
                {message.pendingTools && message.pendingTools.length > 0 && (
                    <div className="w-full space-y-0.5">
                        {message.pendingTools.map((toolName, i) => (
                            <AiProcessingState
                                key={`${toolName}-${i}`}
                                toolName={toolName}
                                className="items-start"
                            />
                        ))}
                    </div>
                )}

                {/* Completed tool results — show checkmark */}
                {message.toolResults && message.toolResults.length > 0 && !message.display && (
                    <div className="w-full space-y-0.5">
                        {message.toolResults.map((tr, i) => (
                            <AiProcessingState
                                key={`${tr.toolName}-done-${i}`}
                                toolName={tr.toolName}
                                completed
                                className="items-start"
                            />
                        ))}
                    </div>
                )}

                {/* Thinking state — clean shimmer, no spinning star */}
                {isLoading && isLast && !message.content && !message.display && !message.confirmationRequired && !message.pendingTools?.length && (
                    <div className="w-full">
                        <AiProcessingState
                            className="items-start"
                        />
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 py-4">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={cn(
                        "flex flex-col gap-2",
                        message.role === 'user' ? 'items-end' : 'items-start'
                    )}
                >
                    {message.role === 'user' ? (
                        <div className="max-w-[85%] flex flex-col gap-2 items-end">
                            {message.content && (
                                <div className="rounded-lg px-3 py-1.5 bg-primary text-primary-foreground">
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                            )}
                            {/* Mentions */}
                            {message.mentions && message.mentions.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-end">
                                    {message.mentions.map((mention) => (
                                        <SkillBadge
                                            key={mention.id || mention.label}
                                            item={mention}
                                        />
                                    ))}
                                </div>
                            )}
                            {/* Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-end">
                                    {message.attachments.map((att, i) => (
                                        <AttachmentPreview key={att.name || `att-${i}`} attachment={att} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full max-w-[85%]">
                            <AIMessageContent
                                message={message}
                                isLast={message.id === lastMessageId}
                            />
                        </div>
                    )}

                </div>
            ))}

            {/* Thinking state — shown when loading and the last message is from the user
                (SDK hasn't created the assistant message yet) */}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <div className="flex flex-col gap-2 items-start">
                    <div className="w-full max-w-[85%]">
                        <AiProcessingState className="items-start" />
                    </div>
                </div>
            )}
        </div>
    )
})
