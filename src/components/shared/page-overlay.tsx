"use client"

/**
 * PageOverlay — Immersive "Layer 2" for detail views.
 * Replaces standard dialogs/modals. Takes over the main content area.
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, X } from "lucide-react"
import { useChatNavigation } from "@/hooks/use-chat-navigation"
import { cn } from "@/lib/utils"

interface PageOverlayProps {
    isOpen: boolean
    onClose: () => void
    title: string
    subtitle?: string
    status?: React.ReactNode
    children: React.ReactNode
    /** Custom prompt for the "Ask Scooby" button */
    scoobyPrompt?: string
    /** Additional action buttons in the header */
    actions?: React.ReactNode
    className?: string
    /** Whether to remove the max-width and padding from the content area (for immersive layouts) */
    fullContent?: boolean
}

export function PageOverlay({
    isOpen,
    onClose,
    title,
    subtitle,
    status,
    children,
    scoobyPrompt,
    actions,
    className,
    fullContent = false
}: PageOverlayProps) {
    const { navigateToAI } = useChatNavigation()

    // Handle ESC key to close
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            window.addEventListener('keydown', handleEsc)
        }
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    const handleAskScooby = () => {
        if (scoobyPrompt) {
            navigateToAI({ prompt: scoobyPrompt })
            onClose()
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={cn(
                        "absolute inset-0 z-50 flex flex-col bg-background",
                        className
                    )}
                >
                    {/* Overlay Header */}
                    <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/60">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={onClose}
                                className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Tillbaka
                            </Button>
                            
                            <div className="h-4 w-px bg-border/60 mx-1" />

                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-semibold leading-none">{title}</h2>
                                    {status}
                                </div>
                                {subtitle && (
                                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {actions}
                            {scoobyPrompt && (
                                <Button variant="secondary" size="sm" onClick={handleAskScooby}>
                                    <Sparkles className="h-4 w-4 mr-2 text-indigo-500" />
                                    Fråga Scooby
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full ml-2"
                                onClick={onClose}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable Content area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className={cn(
                            "w-full",
                            !fullContent && "max-w-5xl mx-auto p-6 md:p-8"
                        )}>
                            {children}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
