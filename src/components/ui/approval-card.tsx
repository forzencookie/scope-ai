'use client'

import { cn } from '@/lib/utils'
import { Check, MessageSquare, Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export interface ApprovalItem {
    label: string
    value: string
}

export interface ApprovalCardProps {
    title: string
    description?: string
    items: ApprovalItem[]
    onApprove: () => void
    onComment?: (comment: string) => void
    onSuggestChange?: () => void
    isLoading?: boolean
    className?: string
}

export function ApprovalCard({
    title,
    description,
    items,
    onApprove,
    onComment,
    onSuggestChange,
    isLoading = false,
    className,
}: ApprovalCardProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [showComment, setShowComment] = useState(false)
    const [comment, setComment] = useState('')

    const handleSubmitComment = () => {
        if (comment.trim() && onComment) {
            onComment(comment.trim())
            setComment('')
            setShowComment(false)
        }
    }

    return (
        <div
            className={cn(
                'rounded-xl border-2 border-dashed border-primary/40 bg-primary/5',
                'transition-all duration-200',
                className
            )}
        >
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between p-4 text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Pencil className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">{title}</h3>
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="border-t border-border/50 p-4">
                    {/* Items */}
                    <div className="space-y-2 mb-4">
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between text-sm"
                            >
                                <span className="text-muted-foreground">{item.label}</span>
                                <span className="font-medium text-foreground">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Comment input */}
                    {showComment && (
                        <div className="mb-4">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Skriv din kommentar eller justering..."
                                className="w-full rounded-lg border border-border bg-background p-3 text-sm
                                    focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                rows={3}
                            />
                            <div className="mt-2 flex gap-2">
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={!comment.trim()}
                                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground
                                        hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Skicka
                                </button>
                                <button
                                    onClick={() => setShowComment(false)}
                                    className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                                >
                                    Avbryt
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={onApprove}
                            disabled={isLoading}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-lg px-4 py-2',
                                'bg-primary text-primary-foreground font-medium text-sm',
                                'hover:bg-primary/90 transition-colors',
                                'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                        >
                            <Check className="h-4 w-4" />
                            <span>Godkänn</span>
                        </button>

                        {onComment && !showComment && (
                            <button
                                onClick={() => setShowComment(true)}
                                disabled={isLoading}
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-lg px-4 py-2',
                                    'border border-border bg-background text-foreground text-sm',
                                    'hover:bg-accent transition-colors',
                                    'disabled:opacity-50'
                                )}
                            >
                                <MessageSquare className="h-4 w-4" />
                                <span>Kommentera</span>
                            </button>
                        )}

                        {onSuggestChange && (
                            <button
                                onClick={onSuggestChange}
                                disabled={isLoading}
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-lg px-4 py-2',
                                    'border border-border bg-background text-foreground text-sm',
                                    'hover:bg-accent transition-colors',
                                    'disabled:opacity-50'
                                )}
                            >
                                <Pencil className="h-4 w-4" />
                                <span>Ändra förslag</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
