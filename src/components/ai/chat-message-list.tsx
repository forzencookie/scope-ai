"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, FileText, Image as ImageIcon } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ConfirmationCard } from "@/components/ai"
import { ReceiptCard } from "@/components/ai/cards/ReceiptCard"
import { TransactionCard } from "@/components/ai/cards/TransactionCard"
import { TaskChecklist } from "@/components/ai/cards/TaskChecklist"
import { ActivityCard } from "@/components/ai/activity-card"
import { ComparisonTable } from "@/components/ai/comparison-table"
import { AiProcessingState } from "@/components/shared/ai-processing-state"
import { MentionBadge } from "@/components/ai/mention-popover"
import type { Message } from "@/lib/chat-types"
import { useState } from "react"

// Attachment preview with image error fallback
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AttachmentPreview({ attachment }: { attachment: any }) {
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
                <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageSrc}
                        alt={attachment.name || 'Bild'}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
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
}


interface ChatMessageListProps {
    messages: Message[]
    isLoading: boolean
    onRetry: (messageId: string) => void
    onConfirm: (confirmationId: string) => void
    onCancelConfirmation: (messageId: string) => void
    onRegenerate?: () => void
}

export function ChatMessageList({
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
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-table:border-collapse prose-td:border prose-td:border-border/40 prose-td:p-2 prose-th:border prose-th:border-border/40 prose-th:p-2 prose-th:bg-muted/30">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                )}

                {/* Confirmation Card - Only show on mobile, desktop uses dialog overlay */}
                {message.confirmationRequired && (
                    <div className="md:hidden">
                        <ConfirmationCard
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            confirmation={message.confirmationRequired as any}
                            isLoading={isLoading && isLast}
                            onConfirm={() => onConfirm(message.confirmationRequired!.id)}
                            onCancel={() => onCancelConfirmation(message.id)}
                        />
                    </div>
                )}

                {/* Display Cards - Only show on mobile, desktop uses dialog overlay */}
                {message.display && (
                    <div className="my-2 md:hidden">
                        {message.display.type === 'ReceiptCard' && (
                            <ReceiptCard receipt={(message.display.data.receipt || message.display.data) as Parameters<typeof ReceiptCard>[0]['receipt']} />
                        )}
                        {message.display.type === 'TransactionCard' && (
                            <TransactionCard transaction={(message.display.data.transaction || message.display.data) as Parameters<typeof TransactionCard>[0]['transaction']} />
                        )}
                        {message.display.type === 'TaskChecklist' && (
                            <TaskChecklist
                                title={message.display.data.title || "Uppgifter"}
                                tasks={message.display.data.tasks || []}
                            />
                        )}
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {message.display.type === ('BenefitsTable' as any) && (
                            <div className="rounded-lg border border-border p-4 bg-muted/30">
                                <h4 className="text-sm font-medium mb-2">Tillgängliga Förmåner</h4>
                                <ul className="space-y-2">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {((message.display.data as { benefits?: Array<{ id?: string; name?: string; category?: string }> }).benefits || []).map((b) => (
                                        <li key={b.id || Math.random()} className="text-xs flex justify-between items-center">
                                            <span>{b.name}</span>
                                            <span className="text-muted-foreground">{b.category}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {message.display.type === 'ActivityCard' && (
                            <ActivityCard
                                action={message.display.data.action || 'created'}
                                entityType={message.display.data.entityType || 'transaction'}
                                title={message.display.data.title || 'Åtgärd utförd'}
                                subtitle={message.display.data.subtitle}
                                changes={message.display.data.changes || []}
                                link={message.display.data.link}
                                linkLabel={message.display.data.linkLabel}
                            />
                        )}
                        {message.display.type === 'ComparisonTable' && (
                            <ComparisonTable
                                title={message.display.data.title}
                                rows={message.display.data.rows || []}
                            />
                        )}
                    </div>
                )}

                {/* Typing Indicator / Processing State */}
                {isLoading && isLast && !message.content && !message.display && !message.confirmationRequired && (
                    <div className="w-full">
                        <AiProcessingState
                            className="py-2 items-start"
                            messages={[
                                "Snurrar",
                                "Kokar på en idé",
                                "Brygger ett svar",
                                "Funderar djupt",
                                "Knådar tankar"
                            ]}
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
                            {/* Text message */}
                            {message.content && (
                                <div className="rounded-lg px-3 py-1.5 bg-primary text-primary-foreground">
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                            )}
                            {/* Mentions */}
                            {message.mentions && message.mentions.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-end">
                                    {message.mentions.map((mention, i) => (
                                        <MentionBadge
                                            key={i}
                                            item={mention}
                                        />
                                    ))}
                                </div>
                            )}
                            {/* Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-end">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {message.attachments.map((att: any, i: number) => (
                                        <AttachmentPreview key={i} attachment={att} />
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
        </div>
    )
}
