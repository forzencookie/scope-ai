"use client"

/**
 * AI Side Panel — Persistent panel alongside chat for walkthrough/document display.
 * Replaces the old floating AIOverlay. Renders in a split-view layout next to chat.
 */

import { motion, AnimatePresence } from "framer-motion"
import { useAIDialogOptional } from "@/providers/ai-overlay-provider"
import { useChatContext } from "@/providers/chat-provider"
import { useRouter } from "next/navigation"
import type { SceneType } from "./pixel-mascots"
import { CardRenderer } from "./card-renderer"
import { ConfirmationCard } from "./confirmation-card"
import { WalkthroughRenderer } from "./blocks"
import { WalkthroughOverlay } from "./walkthrough-overlay"
import { Button } from "@/components/ui/button"
import { Check, Pencil, X, ArrowRight, AlertTriangle, Loader2, Pin, PinOff, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BlockProps } from "./blocks/types"
import { useCallback } from "react"

function extractBlockLabel(block: BlockProps): string {
    const props = block.props as Record<string, unknown>
    if (typeof props?.title === 'string') return props.title
    if (typeof props?.label === 'string') return props.label
    if (typeof props?.text === 'string') return (props.text as string).slice(0, 40)
    return block.type
}

// ============================================================================
// Scene Labels — maps content type to card title + subtitle
// ============================================================================

const SCENE_LABELS: Record<SceneType, { title: string; subtitle: string }> = {
    cooking: { title: "Förbereder", subtitle: "Sammanställer och bearbetar data..." },
    playing: { title: "Bearbetar", subtitle: "Analyserar och sammanställer..." },
    reading: { title: "Läser dokument", subtitle: "Granskar och analyserar innehållet..." },
    searching: { title: "Söker", subtitle: "Letar igenom och matchar data..." },
    error: { title: "Bearbetar", subtitle: "Försöker lösa problemet..." },
}

interface AISidePanelProps {
    className?: string
}

export function AISidePanel({ className }: AISidePanelProps) {
    const context = useAIDialogOptional()
    const chatContext = useChatContext()
    const router = useRouter()

    if (!context || context.status === "hidden" || context.isMobile) {
        return null
    }

    const {
        status,
        output,
        accept,
        requestEdit,
        hide,
        sceneType,
        walkthroughContent,
        walkthroughBlocks,
        closeWalkthrough,
        isThinkingInBackground,
        isPinned,
        togglePin,
    } = context
    
    const handleCancel = useCallback(() => {
        hide()
        if (chatContext?.returnTo) {
            router.push(chatContext.returnTo)
            chatContext.setReturnTo(null)
        }
    }, [hide, chatContext, router])

    const handleAccept = useCallback(() => {
        accept()
        if (chatContext?.returnTo) {
            router.push(chatContext.returnTo)
            chatContext.setReturnTo(null)
        }
    }, [accept, chatContext, router])

    const handleBlockEdit = useCallback((blockIndex: number, blockType: string) => {
        const block = walkthroughBlocks?.blocks[blockIndex]
        const label = block ? extractBlockLabel(block) : blockType
        window.dispatchEvent(new CustomEvent("ai-chat-focus-input", {
            detail: { prefill: `Ändra ${blockType} "${label}": ` }
        }))
    }, [walkthroughBlocks])

    return (
        <AnimatePresence>
            <motion.aside
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                    "flex flex-col min-h-0 h-full",
                    "bg-background border-l border-border",
                    "overflow-hidden",
                    className
                )}
            >
                {/* Panel header with controls */}
                <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-medium text-foreground truncate">
                        {status === "thinking" && "Bearbetar..."}
                        {status === "walkthrough-blocks" && (walkthroughBlocks?.title || "Resultat")}
                        {status === "walkthrough" && "Resultat"}
                        {status === "complete" && (output?.title || "Resultat")}
                        {status === "error" && "Fel"}
                    </span>
                    <div className="flex items-center gap-1">
                        {/* Pin button — only for walkthrough content */}
                        {(status === "walkthrough" || status === "walkthrough-blocks") && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={togglePin}
                                title={isPinned ? "Lossa panel" : "Fäst panel"}
                            >
                                {isPinned ? (
                                    <PinOff className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                    <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                            </Button>
                        )}
                        {/* Close button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={status === "walkthrough" || status === "walkthrough-blocks" ? closeWalkthrough : handleCancel}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Panel content */}
                <div className="flex-1 overflow-y-auto">
                    {status === "thinking" && <ThinkingState sceneType={sceneType} />}

                    {status === "error" && (
                        <ErrorState
                            errorMessage={output?.content as string || "Ett fel uppstod"}
                            onRetry={requestEdit}
                            onExit={handleCancel}
                        />
                    )}

                    {status === "complete" && output && (
                        <CompleteState
                            output={output}
                            onAccept={handleAccept}
                            onEdit={requestEdit}
                            onCancel={handleCancel}
                            returnTo={chatContext?.returnTo}
                        />
                    )}

                    {status === "walkthrough-blocks" && walkthroughBlocks && (
                        <div className="p-0">
                            <WalkthroughRenderer
                                response={walkthroughBlocks}
                                onClose={closeWalkthrough}
                                isThinking={isThinkingInBackground}
                                onBlockEdit={handleBlockEdit}
                                embedded
                            />
                        </div>
                    )}

                    {status === "walkthrough" && walkthroughContent && (
                        <div className="p-0">
                            <WalkthroughOverlay 
                                content={walkthroughContent} 
                                onClose={closeWalkthrough} 
                                embedded 
                            />
                        </div>
                    )}
                </div>
            </motion.aside>
        </AnimatePresence>
    )
}

// ============================================================================
// Thinking State
// ============================================================================

interface ThinkingStateProps {
    sceneType: SceneType
}

function ThinkingState({ sceneType }: ThinkingStateProps) {
    const labels = SCENE_LABELS[sceneType] || SCENE_LABELS.playing

    return (
        <div className="flex-1 flex items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border bg-card shadow-lg p-5 flex items-center gap-4"
            >
                <Loader2 className="w-6 h-6 text-primary animate-spin shrink-0" />
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{labels.title}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{labels.subtitle}</span>
                </div>
            </motion.div>
        </div>
    )
}

// ============================================================================
// Complete State - Output preview with actions
// ============================================================================

interface CompleteStateProps {
    output: {
        contentType: string
        title: string
        content: React.ReactNode
        display?: {
            type: string
            data?: unknown
            title?: string
            component?: string
            props?: Record<string, unknown>
        }
        navigation?: {
            route: string
            label?: string
        }
        confirmationRequired?: {
            id: string
            title: string
            description?: string
            summary: Array<{ label: string; value: string }>
            action?: unknown
            requireCheckbox?: boolean
        }
    }
    onAccept: () => void
    onEdit: () => void
    onCancel: () => void
    returnTo?: string | null
}

function CompleteState({ output, onAccept, onEdit, onCancel, returnTo }: CompleteStateProps) {
    const hasConfirmation = !!output.confirmationRequired

    // Confirmation card for write operations (approval flow)
    if (hasConfirmation) {
        return (
            <div className="p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col gap-4"
                >
                    <ConfirmationCard
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        confirmation={output.confirmationRequired as any}
                        isLoading={false}
                        onConfirm={onAccept}
                        onCancel={onCancel}
                    />
                </motion.div>
            </div>
        )
    }

    // Format returnTo page name if it's a dashboard route
    let returnLabel = "Tillbaka"
    if (returnTo) {
        const parts = returnTo.split("/").filter(Boolean)
        if (parts.length > 0) {
            const lastPart = parts[parts.length - 1]
            returnLabel = `Tillbaka till ${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)}`
        }
    }

    // Document-style output
    return (
        <motion.article
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 py-6"
        >
            {/* Title */}
            <header className="mb-4">
                <h2 className="text-xl font-semibold tracking-tight">{output.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wide">{output.contentType}</p>
            </header>

            <hr className="border-border mb-4" />

            {/* Content */}
            <div className="mb-4">
                {output.display ? (
                    <CardRenderer display={output.display!} />
                ) : (
                    <div className="text-sm text-muted-foreground leading-relaxed">
                        {output.content}
                    </div>
                )}
            </div>

            {/* Navigation hint */}
            {output.navigation && (
                <>
                    <hr className="border-border mb-4" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <ArrowRight className="h-4 w-4" />
                        <span>Kommer visas i: <strong className="text-foreground">{output.navigation.label || output.navigation.route}</strong></span>
                    </div>
                </>
            )}

            <hr className="border-border mb-4" />

            {/* Action buttons */}
            <footer className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        className="gap-2"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Redigera
                    </Button>
                    <Button
                        size="sm"
                        onClick={onAccept}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <Check className="h-3.5 w-3.5" />
                        Acceptera
                    </Button>
                </div>
                
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="ml-auto w-full sm:w-auto gap-2"
                >
                    {returnTo && <ArrowLeft className="h-3.5 w-3.5" />}
                    {returnTo ? returnLabel : "Stäng"}
                </Button>
            </footer>
        </motion.article>
    )
}

// ============================================================================
// Error State
// ============================================================================

interface ErrorStateProps {
    errorMessage: string
    onRetry: () => void
    onExit: () => void
}

function ErrorState({ errorMessage, onRetry, onExit }: ErrorStateProps) {
    return (
        <div className="flex-1 flex items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6 max-w-sm w-full"
            >
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center h-14 w-14 rounded-full bg-destructive/10"
                >
                    <AlertTriangle className="h-7 w-7 text-destructive" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center"
                >
                    <h3 className="text-lg font-medium text-foreground mb-2">
                        Något gick fel
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {errorMessage}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3"
                >
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onExit}
                        className="gap-2"
                    >
                        <X className="h-4 w-4" />
                        Avsluta
                    </Button>
                    <Button
                        size="lg"
                        onClick={onRetry}
                        className="gap-2"
                    >
                        Försök igen
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    )
}
