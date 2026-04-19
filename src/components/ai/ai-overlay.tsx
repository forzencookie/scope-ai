"use client"

/**
 * AI Overlay — Immersive "Layer 2" interface for walkthroughs and document previews.
 * Replaces the AISidePanel. Renders over the main content area.
 */

import { motion, AnimatePresence } from "framer-motion"
import { useAIDialogOptional } from "@/providers/ai-overlay-provider"
import { useChatContext } from "@/providers/chat-provider"
import { useRouter } from "next/navigation"
import type { SceneType } from "./pixel-mascots"
import { CardRenderer } from "./card-renderer"
import { ActionCard } from "./confirmations/action-card"
import { WalkthroughRenderer } from "./blocks"
import { WalkthroughOverlay } from "./walkthrough-overlay"
import { Button } from "@/components/ui/button"
import { Check, Pencil, X, ArrowRight, AlertTriangle, Loader2, ArrowLeft } from "lucide-react"
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

const SCENE_LABELS: Record<SceneType, { title: string; subtitle: string }> = {
    cooking: { title: "Förbereder", subtitle: "Sammanställer och bearbetar data..." },
    playing: { title: "Bearbetar", subtitle: "Analyserar och sammanställer..." },
    reading: { title: "Granskar", subtitle: "Läser igenom och analyserar innehållet..." },
    searching: { title: "Söker", subtitle: "Letar igenom och matchar data..." },
    error: { title: "Bearbetar", subtitle: "Försöker lösa problemet..." },
}

export function AIOverlay() {
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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 flex flex-col bg-background/95 backdrop-blur-sm"
            >
                {/* Overlay Header — hidden during error state (ErrorState has its own UI) */}
                {status !== "error" && (
                    <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/60">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-semibold text-foreground">
                                {status === "thinking" && "Scooby tänker..."}
                                {status === "walkthrough-blocks" && (walkthroughBlocks?.title || "Walkthrough")}
                                {status === "walkthrough" && (walkthroughContent?.title || "Walkthrough")}
                                {status === "complete" && (output?.title || "Resultat")}
                            </span>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-muted"
                            onClick={status === "walkthrough" || status === "walkthrough-blocks" ? closeWalkthrough : handleCancel}
                        >
                            <X className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                )}

                {/* Overlay Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto w-full min-h-full flex flex-col">
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
                            <WalkthroughRenderer
                                response={walkthroughBlocks}
                                onClose={closeWalkthrough}
                                isThinking={isThinkingInBackground}
                                onBlockEdit={handleBlockEdit}
                            />
                        )}

                        {status === "walkthrough" && walkthroughContent && (
                            <WalkthroughOverlay 
                                content={walkthroughContent} 
                                onClose={closeWalkthrough} 
                            />
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}

function ThinkingState({ sceneType }: { sceneType: SceneType }) {
    const labels = SCENE_LABELS[sceneType] || SCENE_LABELS.playing

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center gap-6"
            >
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                    <div className="relative h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-bold">{labels.title}</h2>
                    <p className="text-muted-foreground">{labels.subtitle}</p>
                </div>
            </motion.div>
        </div>
    )
}

import type { AIDialogOutput } from "@/providers/ai-overlay-provider"

function CompleteState({ output, onAccept, onEdit, onCancel, returnTo }: { 
    output: AIDialogOutput, 
    onAccept: () => void, 
    onEdit: () => void, 
    onCancel: () => void, 
    returnTo?: string | null 
}) {
    const hasConfirmation = !!output.confirmationRequired
    const hasDisplay = !!output.display

    let returnLabel = "Tillbaka"
    if (returnTo) {
        const parts = returnTo.split("/").filter(Boolean)
        if (parts.length > 0) {
            const lastPart = parts[parts.length - 1]
            returnLabel = `Tillbaka till ${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)}`
        }
    }

    return (
        <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 md:p-12"
        >
            <header className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-bold uppercase tracking-widest text-primary">
                        {output.contentType}
                    </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{output.title}</h1>
            </header>

            <div className="prose dark:prose-invert max-w-none mb-12">
                {hasDisplay ? (
                    <CardRenderer display={output.display!} />
                ) : (
                    <div className="text-lg text-muted-foreground leading-relaxed">
                        {output.content}
                    </div>
                )}
            </div>

            {output.navigation && (
                <div className="mb-12 p-4 rounded-xl border border-dashed flex items-center gap-3 text-muted-foreground">
                    <ArrowRight className="h-5 w-5 text-primary" />
                    <span>Se detta i <strong className="text-foreground">{output.navigation.label || output.navigation.route}</strong> efter att du accepterat.</span>
                </div>
            )}

            {hasConfirmation ? (
                <div className="pt-8 border-t">
                    <div className="max-w-2xl">
                        <ActionCard
                            confirmation={{
                                title: output.confirmationRequired!.title,
                                description: output.confirmationRequired!.description || '',
                                summary: output.confirmationRequired!.summary,
                                action: (output.confirmationRequired!.action ?? { toolName: '', params: {} }) as { toolName: string; params: unknown },
                            }}
                            isLoading={false}
                            onConfirm={onAccept}
                            onCancel={onCancel}
                        />
                    </div>
                </div>
            ) : (
                <footer className="flex flex-wrap items-center gap-4 pt-8 border-t">
                    <Button
                        size="lg"
                        onClick={onAccept}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
                    >
                        <Check className="h-4 w-4" />
                        Acceptera
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onEdit}
                        className="gap-2 min-w-[140px]"
                    >
                        <Pencil className="h-4 w-4" />
                        Redigera
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        onClick={onCancel}
                        className="ml-auto gap-2"
                    >
                        {returnTo && <ArrowLeft className="h-4 w-4" />}
                        {returnTo ? returnLabel : "Stäng"}
                    </Button>
                </footer>
            )}
        </motion.article>
    )
}


function ErrorState({ errorMessage, onRetry, onExit }: { 
    errorMessage: string, 
    onRetry: () => void, 
    onExit: () => void 
}) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="max-w-sm w-full flex flex-col items-center text-center gap-6">
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Något gick fel</h2>
                    <p className="text-muted-foreground">{errorMessage}</p>
                </div>
                <div className="flex items-center gap-3 w-full">
                    <Button variant="outline" size="lg" className="flex-1" onClick={onExit}>Avbryt</Button>
                    <Button size="lg" className="flex-1" onClick={onRetry}>Försök igen</Button>
                </div>
            </div>
        </div>
    )
}

function Sparkles(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M3 5h4" />
            <path d="M21 17v4" />
            <path d="M19 19h4" />
        </svg>
    )
}

