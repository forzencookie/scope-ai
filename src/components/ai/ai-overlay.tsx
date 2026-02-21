"use client"

/**
 * AI Overlay - Full-screen overlay for AI processing
 * Shows loading state while thinking, output preview when complete
 */

import { motion, AnimatePresence } from "framer-motion"
import { useAIDialogOptional } from "@/providers/ai-overlay-provider"
import type { SceneType } from "./pixel-mascots"
import { CardRenderer } from "./card-renderer"
import { ConfirmationCard } from "./confirmation-card"
import { WalkthroughOverlay } from "./walkthrough-overlay"
import { WalkthroughRenderer } from "./blocks"
import { Button } from "@/components/ui/button"
import { Check, Pencil, X, ArrowRight, AlertTriangle, Loader2 } from "lucide-react"
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

interface AIOverlayProps {
    className?: string
}

export function AIOverlay({ className }: AIOverlayProps) {
    const context = useAIDialogOptional()

    // Don't render if no context or hidden/mobile
    if (!context || context.status === "hidden" || context.isMobile) {
        return null
    }

    const { status, output, accept, requestEdit, hide, sceneType, walkthroughContent, walkthroughBlocks, closeWalkthrough, isThinkingInBackground } = context

    const handleBlockEdit = useCallback((blockIndex: number, blockType: string) => {
        const block = walkthroughBlocks?.blocks[blockIndex]
        const label = block ? extractBlockLabel(block) : blockType
        window.dispatchEvent(new CustomEvent("ai-chat-focus-input", {
            detail: { prefill: `Ändra ${blockType} "${label}": ` }
        }))
    }, [walkthroughBlocks])

    // Block-based walkthrough (new system)
    if (status === "walkthrough-blocks" && walkthroughBlocks) {
        return (
            <AnimatePresence>
                <WalkthroughRenderer
                    response={walkthroughBlocks}
                    onClose={closeWalkthrough}
                    isThinking={isThinkingInBackground}
                    onBlockEdit={handleBlockEdit}
                />
            </AnimatePresence>
        )
    }

    // Legacy walkthrough (audit-style)
    if (status === "walkthrough" && walkthroughContent) {
        return (
            <AnimatePresence>
                <WalkthroughOverlay content={walkthroughContent} onClose={closeWalkthrough} />
            </AnimatePresence>
        )
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                    "absolute inset-0 z-50 flex flex-col items-center justify-center",
                    "bg-background/95 backdrop-blur-sm",
                    className
                )}
            >
                {status === "thinking" && <ThinkingState sceneType={sceneType} />}
                {status === "error" && (
                    <ErrorState
                        errorMessage={output?.content as string || "Ett fel uppstod"}
                        onRetry={requestEdit}
                        onExit={hide}
                    />
                )}
                {status === "complete" && output && (
                    <CompleteState
                        output={output}
                        onAccept={accept}
                        onEdit={requestEdit}
                        onCancel={hide}
                    />
                )}
            </motion.div>
        </AnimatePresence>
    )
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

// ============================================================================
// Thinking State - Card-style spinner (matches demo overlay pattern)
// ============================================================================

interface ThinkingStateProps {
    sceneType: SceneType
}

function ThinkingState({ sceneType }: ThinkingStateProps) {
    const labels = SCENE_LABELS[sceneType] || SCENE_LABELS.playing

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border bg-card shadow-2xl p-5 flex items-center gap-4"
        >
            <Loader2 className="w-6 h-6 text-primary animate-spin shrink-0" />
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{labels.title}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{labels.subtitle}</span>
            </div>
        </motion.div>
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
}

function CompleteState({ output, onAccept, onEdit, onCancel }: CompleteStateProps) {
    const hasConfirmation = !!output.confirmationRequired

    // Confirmation card for write operations (approval flow)
    if (hasConfirmation) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 max-w-md w-full px-4"
            >
                <ConfirmationCard
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    confirmation={output.confirmationRequired as any}
                    isLoading={false}
                    onConfirm={onAccept}
                    onCancel={onCancel}
                />
            </motion.div>
        )
    }

    // Document-style output — clean report layout
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 overflow-y-auto"
        >
            <motion.article
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mx-auto max-w-3xl px-6 py-12 font-sans"
            >
                {/* Title */}
                <header className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight">{output.title}</h1>
                    <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wide">{output.contentType}</p>
                </header>

                <hr className="border-border mb-6" />

                {/* Content */}
                <div className="max-h-[400px] overflow-y-auto mb-6">
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
                        <hr className="border-border mb-6" />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                            <ArrowRight className="h-4 w-4" />
                            <span>Kommer visas i: <strong className="text-foreground">{output.navigation.label || output.navigation.route}</strong></span>
                        </div>
                    </>
                )}

                <hr className="border-border mb-6" />

                {/* Action buttons */}
                <footer className="flex items-center gap-3">
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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onCancel}
                        className="ml-auto"
                    >
                        Stäng
                    </Button>
                </footer>
            </motion.article>
        </motion.div>
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
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 max-w-md w-full px-4"
        >
            {/* Error icon */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center h-14 w-14 rounded-full bg-destructive/10"
            >
                <AlertTriangle className="h-7 w-7 text-destructive" />
            </motion.div>

            {/* Error message */}
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

            {/* Action buttons */}
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
    )
}
