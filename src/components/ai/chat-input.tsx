"use client"

import { useRef, useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { MentionPopover, MentionBadge, type MentionItem } from "@/components/ai/mention-popover"
import { ModelSelector } from "@/components/ai/model-selector"
import {
    Paperclip,
    Mic,
    ArrowRight,
    AtSign,
    X,
    FileText,
    ZoomIn,
    Loader2,
    Inbox,
    LayoutGrid
} from "lucide-react"
import Link from "next/link"

interface ChatInputProps {
    /** Current textarea value */
    value: string
    /** Called when textarea value changes */
    onChange: (value: string) => void
    /** Called when send button is clicked or Enter pressed */
    onSend: () => void
    /** Whether AI is currently processing */
    isLoading: boolean
    /** Attached files */
    files: File[]
    /** Called when files are added/removed */
    onFilesChange: (files: File[]) => void
    /** Current mentions */
    mentions: MentionItem[]
    /** Called when mentions change */
    onMentionsChange: (mentions: MentionItem[]) => void
    /** Called when a file preview should be shown */
    onPreviewFile?: (file: { url: string; name: string }) => void
    /** Whether to show navigation links below input */
    showNavLinks?: boolean
    /** Called when textarea receives focus */
    onFocus?: () => void
    /** Called when textarea loses focus */
    onBlur?: () => void
}

export function ChatInput({
    value,
    onChange,
    onSend,
    isLoading,
    files,
    onFilesChange,
    mentions,
    onMentionsChange,
    onPreviewFile,
    showNavLinks = true,
    onFocus,
    onBlur
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const mentionAnchorRef = useRef<HTMLSpanElement>(null)

    const [isExpanded, setIsExpanded] = useState(false)
    const [isMentionOpen, setIsMentionOpen] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    // Create stable preview URLs for attached files
    const filePreviewUrls = useMemo(() => {
        return files.map(file => ({
            file,
            url: URL.createObjectURL(file)
        }))
    }, [files])

    // Cleanup object URLs when files change
    useEffect(() => {
        return () => {
            filePreviewUrls.forEach(({ url }) => URL.revokeObjectURL(url))
        }
    }, [filePreviewUrls])

    // Auto-resize textarea
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        onChange(newValue)

        const textarea = textareaRef.current
        if (!textarea) return

        const wouldOverflow = textarea.scrollHeight > textarea.clientHeight

        if (!isExpanded && wouldOverflow) {
            setIsExpanded(true)
        } else if (isExpanded && newValue.length === 0) {
            setIsExpanded(false)
            textarea.style.height = ''
        }

        if (isExpanded && newValue.length > 0) {
            textarea.style.height = 'auto'
            textarea.style.height = textarea.scrollHeight + 'px'
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
        }
    }

    // File upload handlers
    const handleFileSelect = useCallback((fileList: FileList | null) => {
        if (!fileList) return
        const newFiles = Array.from(fileList).filter(file => {
            const allowedTypes = ['image/', 'application/pdf', 'text/', 'application/json']
            return allowedTypes.some(type => file.type.startsWith(type))
        })
        onFilesChange([...files, ...newFiles].slice(0, 5)) // Max 5 files
    }, [files, onFilesChange])

    const removeFile = useCallback((index: number) => {
        onFilesChange(files.filter((_, i) => i !== index))
    }, [files, onFilesChange])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        handleFileSelect(e.dataTransfer.files)
    }, [handleFileSelect])

    const isImageFile = (file: File) => file.type.startsWith('image/')

    const canSend = !isLoading && (value.trim() || files.length > 0)

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.json,.csv"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
            />

            {/* Input container */}
            <div
                className={cn(
                    "bg-muted/40 dark:bg-muted/30 border-2 rounded-xl overflow-hidden transition-all",
                    "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                    isDragging ? "border-primary bg-primary/5" : "border-border/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Attached files preview */}
                {filePreviewUrls.length > 0 && (
                    <div className="px-3 pt-3 flex flex-wrap gap-2">
                        {filePreviewUrls.map(({ file, url }, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="relative group flex items-center gap-2 bg-muted/60 rounded-lg p-2 pr-3 text-xs"
                            >
                                {isImageFile(file) ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onPreviewFile?.({ url, name: file.name })
                                        }}
                                        className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0 cursor-pointer z-10"
                                    >
                                        <img
                                            src={url}
                                            alt={file.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ZoomIn className="h-4 w-4 text-white" />
                                        </div>
                                    </button>
                                ) : (
                                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                    <span className="font-medium truncate max-w-[100px]">{file.name}</span>
                                    <span className="text-muted-foreground">
                                        {(file.size / 1024).toFixed(0)} KB
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeFile(index)
                                    }}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-muted-foreground/80 hover:bg-muted-foreground text-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Mention badges */}
                {mentions.length > 0 && (
                    <div className="px-3 pt-3 flex flex-wrap gap-2">
                        {mentions.map((item, index) => (
                            <MentionBadge
                                key={item.id}
                                item={item}
                                onRemove={() => onMentionsChange(mentions.filter((_, i) => i !== index))}
                            />
                        ))}
                    </div>
                )}

                {isDragging && (
                    <div className="px-4 py-3 text-center text-sm text-primary font-medium">
                        Släpp filer här för att bifoga
                    </div>
                )}

                {/* Textarea */}
                <div className="w-full">
                    <Textarea
                        ref={textareaRef}
                        data-ai-chat-input
                        value={value}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        placeholder={files.length > 0 ? "Lägg till ett meddelande..." : "Skriv ett meddelande..."}
                        className="resize-none border-0 bg-transparent px-4 py-3 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground w-full min-h-[40px] max-h-[200px] text-sm leading-relaxed"
                        rows={1}
                    />
                </div>

                {/* Bottom row - Buttons */}
                <div className="flex items-center justify-between px-2 pb-2">
                    {/* Left - attachment, mention, separator, model selector */}
                    <div className="flex items-center gap-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-7 w-7 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground",
                                files.length > 0 && "text-primary"
                            )}
                            aria-label="Lägg till bilaga"
                            onClick={() => fileInputRef.current?.click()}
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
                        <div className="w-px h-4 bg-border/60 mx-1" />
                        <ModelSelector />
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
                            onClick={onSend}
                            disabled={!canSend}
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
                        onChange(value + `@${item.label} `)
                        onMentionsChange([...mentions, item])
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

            {/* Navigation links - Desktop (Below) */}
            {showNavLinks && (
                <div className="hidden md:flex items-center gap-4 mt-2 px-1">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        <span>Öppna Dashboard</span>
                    </Link>
                    <Link
                        href="/dashboard/konversationer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Inbox className="h-3.5 w-3.5" />
                        <span>Visa konversationer</span>
                    </Link>
                </div>
            )}
        </div>
    )
}
