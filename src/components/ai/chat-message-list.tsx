"use client"

import React from "react"
import Image from "next/image"
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
import { ActionTriggerChip } from "@/components/ai/action-trigger-chip"
import { AiProcessingState } from "@/components/shared/ai-processing-state"
import { BalanceAuditCard, type BalanceAuditCardProps } from "@/components/ai/previews/bokforing/balance-audit-card"
import { InlineCardRenderer } from "@/components/ai/cards/inline"
import { MentionBadge } from "@/components/ai/mention-popover"
import { normalizeAIDisplay } from "@/lib/ai-schema"
import type { 
    Receipt, 
    Transaction, 
    TaskChecklist as TaskChecklistData, 
    BenefitsTable as BenefitsTableData,
    ActivityCard as ActivityCardData,
    ComparisonTable as ComparisonTableData
} from "@/lib/ai-schema"
import type { Message, MessageDisplay } from "@/lib/chat-types"
import type { InlineCardData } from "@/components/ai/cards/inline"
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
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-table:border-collapse prose-td:border prose-td:border-border/40 prose-td:p-2 prose-th:border prose-th:border-border/40 prose-th:p-2 prose-th:bg-muted/30">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                )}

                {/* Confirmation Card - Only show on mobile, desktop uses dialog overlay */}
                {message.confirmationRequired && (
                    <div className="md:hidden">
                        <ConfirmationCard
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

                {/* Display Cards - Only show on mobile, desktop uses dialog overlay */}
                {message.display && (
                    <div className="my-2 md:hidden">
                        {(() => {
                            const normalized = normalizeAIDisplay(message.display.type, message.display.data)
                            if (!normalized) return null

                            switch (message.display.type) {
                                case 'ReceiptCard':
                                    const r = normalized as Receipt
                                    return <ReceiptCard receipt={r} />
                                case 'TransactionCard':
                                    const txd = normalized as Transaction
                                    return <TransactionCard transaction={txd} />
                                case 'TaskChecklist':
                                    const t = normalized as TaskChecklistData
                                    return <TaskChecklist title={t.title} tasks={t.tasks} />
                                case 'BenefitsTable':
                                    const b = normalized as BenefitsTableData
                                    return (
                                        <div className="rounded-lg border border-border p-4 bg-muted/30">
                                            <h4 className="text-sm font-medium mb-2">Tillgängliga Förmåner</h4>
                                            <ul className="space-y-2">
                                                {b.benefits.map((bi) => (
                                                    <li key={bi.id || Math.random()} className="text-xs flex justify-between items-center">
                                                        <span>{bi.name}</span>
                                                        <span className="text-muted-foreground">{bi.category}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )
                                case 'ActivityCard':
                                    const a = normalized as ActivityCardData
                                    return (
                                        <ActivityCard
                                            action={a.action}
                                            entityType={a.entityType}
                                            title={a.title}
                                            subtitle={a.subtitle}
                                            changes={a.changes}
                                            link={a.link}
                                            linkLabel={a.linkLabel}
                                        />
                                    )
                                case 'ComparisonTable':
                                    const c = normalized as ComparisonTableData
                                    return (
                                        <ComparisonTable
                                            title={c.title}
                                            rows={c.rows}
                                        />
                                    )
                                default:
                                    return null
                            }
                        })()}
                    </div>
                )}

                {/* Inline-only cards (always visible, no overlay) */}
                {message.display?.type === 'BalanceAuditCard' && (
                    <div className="my-2">
                        <BalanceAuditCard
                            audit={message.display.type === 'BalanceAuditCard' ? message.display.data.audit : undefined}
                        />
                    </div>
                )}

                {/* Inline result cards — compact cards for AI action results */}
                {message.display?.type === 'InlineCard' && (
                    <div className="my-2">
                        <InlineCardRenderer card={message.display.data} />
                    </div>
                )}
                {message.display?.type === 'InlineCards' && (
                    <div className="my-2 space-y-1.5">
                        {(message.display.data.cards || []).map((card, i) => (
                            <InlineCardRenderer key={i} card={card} />
                        ))}
                    </div>
                )}

                {/* Pending tool calls — show loading while tools execute */}
                {message.pendingTools && message.pendingTools.length > 0 && (
                    <div className="w-full">
                        <AiProcessingState
                            className="py-2 items-start"
                            messages={[
                                "Kör verktyg...",
                                "Hämtar data...",
                                "Bearbetar...",
                            ]}
                        />
                    </div>
                )}

                {/* Typing Indicator / Processing State */}
                {isLoading && isLast && !message.content && !message.display && !message.confirmationRequired && !message.pendingTools?.length && (
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
                            {/* Action Trigger Chip - shown instead of text for action triggers */}
                            {message.actionTrigger ? (
                                <ActionTriggerChip
                                    display={{
                                        type: 'action-trigger',
                                        icon: message.actionTrigger.icon,
                                        title: message.actionTrigger.title,
                                        subtitle: message.actionTrigger.subtitle,
                                        meta: message.actionTrigger.meta
                                    }}
                                />
                            ) : (
                                <>
                                    {/* Text message */}
                                    {message.content && (
                                        <div className="rounded-lg px-3 py-1.5 bg-primary text-primary-foreground">
                                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        </div>
                                    )}
                                </>
                            )}
                            {/* Mentions */}
                            {message.mentions && message.mentions.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-end">
                                    {message.mentions.map((mention) => (
                                        <MentionBadge
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
        </div>
    )
})
