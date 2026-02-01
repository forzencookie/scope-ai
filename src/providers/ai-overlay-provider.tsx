"use client"

import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react"
import type { SceneType } from "@/components/ai/pixel-mascots"
import type { WalkthroughContent } from "@/components/ai/walkthrough-overlay"

// Types for AI Dialog state
export type AIDialogStatus = "hidden" | "thinking" | "complete" | "error" | "walkthrough"

// Navigation info for accept flow
export interface AIDialogNavigation {
    /** Route to navigate to */
    route: string
    /** Label for the destination */
    label?: string
    /** Open in new tab */
    newTab?: boolean
}

// Display info for structured output
export interface AIDialogDisplay {
    /** Display type/card component */
    type: string
    /** Data for the card */
    data?: unknown
    /** Title for the card */
    title?: string
}

export interface AIDialogOutput {
    /** The type of content being generated */
    contentType: string
    /** Display title for the output */
    title: string
    /** The generated content to preview */
    content: React.ReactNode
    /** Raw data that will be applied on accept */
    data?: unknown
    /** ID to highlight after accepting */
    highlightId?: string
    /** Navigation info if AI wants to navigate somewhere */
    navigation?: AIDialogNavigation
    /** Structured display for card rendering */
    display?: AIDialogDisplay
    /** Confirmation request for write actions */
    confirmationRequired?: {
        id: string
        title: string
        description?: string
        summary: Array<{ label: string; value: string }>
        warnings?: string[]
        action?: unknown
        requireCheckbox?: boolean
    }
}

// Map content types to scene types
const CONTENT_TO_SCENE: Record<string, SceneType> = {
    receipt: 'reading',
    receipts: 'reading',
    transaction: 'reading',
    transactions: 'reading',
    document: 'reading',
    invoice: 'reading',
    invoices: 'reading',
    report: 'cooking',
    reports: 'cooking',
    analysis: 'cooking',
    search: 'searching',
    query: 'searching',
    find: 'searching',
    default: 'playing',
}

interface AIDialogContextType {
    /** Current status of the AI dialog */
    status: AIDialogStatus
    /** Output data when status is "complete" */
    output: AIDialogOutput | null
    /** Whether we're on mobile (no overlay) */
    isMobile: boolean
    /** Current scene type for thinking animation */
    sceneType: SceneType
    /** Show the AI dialog in thinking state */
    showThinking: (contentType?: string) => void
    /** Show the AI dialog with completed output */
    showComplete: (output: AIDialogOutput) => void
    /** Hide the AI dialog */
    hide: () => void
    /** Accept the output and trigger highlight */
    accept: () => void
    /** Request edit (focuses sidebar input) */
    requestEdit: () => void
    /** ID currently being highlighted */
    highlightedId: string | null
    /** Clear the highlight */
    clearHighlight: () => void
    /** Walkthrough content when status is "walkthrough" */
    walkthroughContent: WalkthroughContent | null
    /** Close the walkthrough overlay */
    closeWalkthrough: () => void
}

const AIDialogContext = createContext<AIDialogContextType | null>(null)

export function useAIDialog() {
    const context = useContext(AIDialogContext)
    if (!context) {
        throw new Error("useAIDialog must be used within an AIDialogProvider")
    }
    return context
}

// Optional hook that doesn't throw if not in provider
export function useAIDialogOptional() {
    return useContext(AIDialogContext)
}

interface AIDialogProviderProps {
    children: ReactNode
}

export function AIDialogProvider({ children }: AIDialogProviderProps) {
    const [status, setStatus] = useState<AIDialogStatus>("hidden")
    const [output, setOutput] = useState<AIDialogOutput | null>(null)
    const [highlightedId, setHighlightedId] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [sceneType, setSceneType] = useState<SceneType>("playing")
    const [walkthroughContent, setWalkthroughContent] = useState<WalkthroughContent | null>(null)

    // Helper to determine scene type from content type
    const getSceneType = useCallback((contentType?: string): SceneType => {
        if (!contentType) return 'playing'
        const normalizedType = contentType.toLowerCase()
        return CONTENT_TO_SCENE[normalizedType] || CONTENT_TO_SCENE.default
    }, [])

    // Check for mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // Listen for AI events from use-chat hook
    useEffect(() => {
        const handleAIStart = (e: CustomEvent<{ contentType?: string }>) => {
            if (!isMobile) {
                setStatus("thinking")
                setOutput(null)
                setSceneType(getSceneType(e.detail?.contentType))
            }
        }

        const handleAIComplete = (e: CustomEvent<AIDialogOutput>) => {
            if (!isMobile) {
                setStatus("complete")
                setOutput(e.detail)
            }
        }

        const handleAIError = (e: CustomEvent<AIDialogOutput>) => {
            if (!isMobile) {
                setStatus("error")
                setOutput(e.detail)
                setSceneType("error")
            }
        }

        const handleAIHide = () => {
            setStatus("hidden")
            setOutput(null)
            setWalkthroughContent(null)
        }

        const handleAIWalkthrough = (e: CustomEvent<WalkthroughContent>) => {
            if (!isMobile) {
                setStatus("walkthrough")
                setWalkthroughContent(e.detail)
                setOutput(null)
            }
        }

        window.addEventListener("ai-dialog-start", handleAIStart as EventListener)
        window.addEventListener("ai-dialog-complete", handleAIComplete as EventListener)
        window.addEventListener("ai-dialog-error", handleAIError as EventListener)
        window.addEventListener("ai-dialog-hide", handleAIHide)
        window.addEventListener("ai-dialog-walkthrough", handleAIWalkthrough as EventListener)

        return () => {
            window.removeEventListener("ai-dialog-start", handleAIStart as EventListener)
            window.removeEventListener("ai-dialog-complete", handleAIComplete as EventListener)
            window.removeEventListener("ai-dialog-error", handleAIError as EventListener)
            window.removeEventListener("ai-dialog-hide", handleAIHide)
            window.removeEventListener("ai-dialog-walkthrough", handleAIWalkthrough as EventListener)
        }
    }, [isMobile, getSceneType])

    const showThinking = useCallback((contentType?: string) => {
        if (!isMobile) {
            setStatus("thinking")
            setOutput(null)
            setSceneType(getSceneType(contentType))
        }
    }, [isMobile, getSceneType])

    const showComplete = useCallback((newOutput: AIDialogOutput) => {
        if (!isMobile) {
            setStatus("complete")
            setOutput(newOutput)
        }
    }, [isMobile])

    const hide = useCallback(() => {
        setStatus("hidden")
        setOutput(null)
        setWalkthroughContent(null)
    }, [])

    const closeWalkthrough = useCallback(() => {
        setStatus("hidden")
        setWalkthroughContent(null)
    }, [])

    const accept = useCallback(() => {
        // Set highlight if provided
        if (output?.highlightId) {
            setHighlightedId(output.highlightId)
            // Auto-clear highlight after 5 seconds
            setTimeout(() => setHighlightedId(null), 5000)
        }

        // Dispatch navigation event if navigation info exists
        if (output?.navigation) {
            window.dispatchEvent(new CustomEvent("ai-navigate", {
                detail: output.navigation
            }))
        }

        hide()
        // Dispatch event for any listeners that need to know about acceptance
        window.dispatchEvent(new CustomEvent("ai-dialog-accepted", {
            detail: {
                data: output?.data,
                display: output?.display,
                navigation: output?.navigation,
            }
        }))
    }, [output, hide])

    const requestEdit = useCallback(() => {
        // Focus the sidebar chat input with prefill hint
        window.dispatchEvent(new CustomEvent("ai-chat-focus-input", {
            detail: { prefill: "Ändra så att " }
        }))
    }, [])

    const clearHighlight = useCallback(() => {
        setHighlightedId(null)
    }, [])

    const value = useMemo(() => ({
        status,
        output,
        isMobile,
        sceneType,
        showThinking,
        showComplete,
        hide,
        accept,
        requestEdit,
        highlightedId,
        clearHighlight,
        walkthroughContent,
        closeWalkthrough,
    }), [status, output, isMobile, sceneType, showThinking, showComplete, hide, accept, requestEdit, highlightedId, clearHighlight, walkthroughContent, closeWalkthrough])

    return (
        <AIDialogContext.Provider value={value}>
            {children}
        </AIDialogContext.Provider>
    )
}
