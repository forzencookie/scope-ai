"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, FileText, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import {
    ConfirmationCard,
    ReceiptCard,
    TransactionCard,
    TaskChecklist
} from "@/components/ai"
import { AiProcessingState } from "@/components/shared/ai-processing-state"
import { MentionBadge } from "@/components/ai/mention-popover"
import type { Message } from "@/lib/chat-types"
import { useEffect, useRef } from "react"

interface ChatMessageListProps {
    messages: Message[]
    isLoading: boolean
    onRetry: (messageId: string) => void
    onConfirm: (confirmationId: string) => void
    onCancelConfirmation: (messageId: string) => void
    onRegenerate: () => void
}

export function ChatMessageList({
    messages,
    isLoading,
    onRetry,
    onConfirm,
    onCancelConfirmation,
    onRegenerate
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
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                )}

                {/* Confirmation Card */}
                {message.confirmationRequired && (
                    <ConfirmationCard
                        confirmation={message.confirmationRequired as any}
                        isLoading={isLoading && isLast}
                        onConfirm={() => onConfirm(message.confirmationRequired!.id)}
                        onCancel={() => onCancelConfirmation(message.id)}
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
                                        <li key={b.id || Math.random()} className="text-xs flex justify-between items-center">
                                            <span>{b.name}</span>
                                            <span className="text-muted-foreground">{b.category}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Typing Indicator / Processing State */}
                {isLoading && isLast && !message.content && !message.display && !message.confirmationRequired && (
                    <div className="w-full">
                        <AiProcessingState
                            className="py-2 items-start"
                            messages={[
                                "Tänker...",
                                "Analyserar din förfrågan...",
                                "Söker i dokument...",
                                "Formulerar svar..."
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
                                    {message.attachments.map((att: any, i: number) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 bg-muted/60 rounded-lg p-2 pr-3 text-xs max-w-[200px]"
                                        >
                                            {att.type?.startsWith('image/') ? (
                                                <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                                                    <img
                                                        src={att.url || att.content} // Handle both url and base64 content
                                                        alt={att.name || 'Bild'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-medium truncate max-w-[100px]">{att.name || 'Fil'}</span>
                                                <span className="text-muted-foreground">Bifogad fil</span>
                                            </div>
                                        </div>
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

                    {/* Regenerate button for last assistant message */}
                    {message.role === 'assistant' &&
                        message.id === lastMessageId &&
                        !isLoading &&
                        message.content &&
                        !message.error && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground self-start ml-1"
                                onClick={onRegenerate}
                            >
                                <RefreshCw className="h-3 w-3" />
                                Generera nytt svar
                            </Button>
                        )}
                </div>
            ))}
        </div>
    )
}
