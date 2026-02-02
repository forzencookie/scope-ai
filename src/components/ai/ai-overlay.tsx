"use client"

/**
 * AI Overlay - Full-screen overlay for AI processing
 * Shows animated mascots while thinking, output preview when complete
 */

import { motion, AnimatePresence } from "framer-motion"
import { useAIDialogOptional } from "@/providers/ai-overlay-provider"
import {
    MascotCookingScene,
    MascotCelebrationSceneStatic,
    MascotPlayingScene,
    MascotReadingScene,
    MascotSearchingScene,
    MascotErrorScene,
    type SceneType,
} from "./pixel-mascots"
import { CardRenderer } from "./card-renderer"
import { ConfirmationCard } from "./confirmation-card"
import { WalkthroughOverlay } from "./walkthrough-overlay"
import { WalkthroughRenderer } from "./blocks"
import { Button } from "@/components/ui/button"
import { Check, Pencil, X, Sparkles, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BlockProps } from "./blocks/types"

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
// Scene Component Map
// ============================================================================

const SCENE_COMPONENTS: Record<SceneType, React.ComponentType<{ className?: string }>> = {
    cooking: MascotCookingScene,
    playing: MascotPlayingScene,
    reading: MascotReadingScene,
    searching: MascotSearchingScene,
    error: MascotErrorScene,
}

const SCENE_MESSAGES: Record<SceneType, string[]> = {
    cooking: [
        "Kokar ihop något gott...",
        "Mixar ingredienserna...",
        "Brygger ett svar...",
        "Nästan klart...",
    ],
    playing: [
        "Leker med idéer...",
        "Jonglerar tankar...",
        "Studsar runt...",
        "Nästan klart...",
    ],
    reading: [
        "Läser dokumenten...",
        "Granskar detaljerna...",
        "Analyserar innehållet...",
        "Nästan klart...",
    ],
    searching: [
        "Söker igenom...",
        "Letar efter svar...",
        "Utforskar möjligheter...",
        "Nästan klart...",
    ],
    error: [
        "Något gick fel...",
    ],
}

// ============================================================================
// Thinking State - Dynamic scene based on content type
// ============================================================================

interface ThinkingStateProps {
    sceneType: SceneType
}

function ThinkingState({ sceneType }: ThinkingStateProps) {
    const SceneComponent = SCENE_COMPONENTS[sceneType] || MascotPlayingScene
    const messages = SCENE_MESSAGES[sceneType] || SCENE_MESSAGES.playing

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-8"
        >
            {/* Dynamic mascot scene - no CSS scale to preserve pixel clarity */}
            <SceneComponent />

            {/* Animated message */}
            <div className="flex flex-col items-center gap-2 mt-8">
                <motion.div
                    className="flex items-center gap-2 text-lg font-medium text-foreground"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <ThinkingMessage messages={messages} />
                    <Sparkles className="h-5 w-5 text-amber-500" />
                </motion.div>
                <p className="text-sm text-muted-foreground">
                    AI:n arbetar på din förfrågan
                </p>
            </div>

            {/* Progress indicator */}
            <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.2,
                        }}
                    />
                ))}
            </div>
        </motion.div>
    )
}

interface ThinkingMessageProps {
    messages: string[]
}

function ThinkingMessage({ messages }: ThinkingMessageProps) {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % messages.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [messages.length])

    return (
        <motion.span
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
        >
            {messages[index]}
        </motion.span>
    )
}

// Need to import useState, useEffect, useCallback
import { useState, useEffect, useCallback } from "react"

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
    const hasRichPreview = output.display?.component?.includes('Preview')

    // If there's a confirmation AND NO rich preview, show the simple card directly
    if (hasConfirmation && !hasRichPreview) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 max-w-md w-full px-4"
            >
                {/* Static mascots */}
                <MascotCelebrationSceneStatic className="scale-75" />

                {/* Just the confirmation card */}
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

    // For other structured output (non-confirmation OR rich preview confirmation)
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 max-w-2xl w-full px-4"
        >
            {/* Mini celebration - using static mascots (no animation) */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-2 mb-2"
            >
                <MascotCelebrationSceneStatic className="scale-100" />
            </motion.div>

            {/* Output card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full rounded-xl border bg-card shadow-lg overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">{output.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        {output.contentType}
                    </span>
                </div>

                {/* Content preview */}
                <div className="p-4 max-h-[400px] overflow-y-auto">
                    {output.display ? (
                        <CardRenderer display={output.display!} />
                    ) : (
                        output.content
                    )}
                </div>

                {/* Navigation hint */}
                {output.navigation && (
                    <div className="px-4 py-3 border-t bg-muted/30 flex items-center gap-2 text-sm text-muted-foreground">
                        <ArrowRight className="h-4 w-4" />
                        <span>Kommer visas i: <strong className="text-foreground">{output.navigation!.label || output.navigation!.route}</strong></span>
                    </div>
                )}
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
                    onClick={onCancel}
                    className="gap-2"
                >
                    <X className="h-4 w-4" />
                    Avbryt
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    onClick={onEdit}
                    className="gap-2"
                >
                    <Pencil className="h-4 w-4" />
                    Redigera
                </Button>
                <Button
                    size="lg"
                    onClick={onAccept}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    <Check className="h-4 w-4" />
                    {hasConfirmation ? "Godkänn" : "Acceptera"}
                </Button>
            </motion.div>

            {/* Hint text */}
            <p className="text-xs text-muted-foreground text-center">
                Klicka på &quot;Redigera&quot; för att be AI:n göra ändringar
            </p>
        </motion.div>
    )
}

// ============================================================================
// Error State - Confused mascots with retry/exit options
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
            {/* Confused mascots */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
            >
                <MascotErrorScene />
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

            {/* Action buttons - simple retry/exit */}
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
