"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface AiProcessingStateProps {
    messages?: string[]
    subtext?: string
    className?: string
}

const DEFAULT_MESSAGES = [
    "Analyserar...",
    "Bearbetar data...",
    "Hämtar information...",
    "Snart klar..."
]

// Bouncing dots component
function BouncingDots() {
    return (
        <span className="inline-flex items-end gap-0.5 ml-0.5 h-[1em] pb-[0.15em]">
            <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 bg-current rounded-full animate-bounce" />
        </span>
    )
}

export function AiProcessingState({
    messages = DEFAULT_MESSAGES,
    subtext,
    className
}: AiProcessingStateProps) {
    const [messageIndex, setMessageIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % messages.length)
        }, 2000)
        return () => clearInterval(interval)
    }, [messages])

    // Remove trailing "..." from message since we'll show bouncing dots
    const displayMessage = messages[messageIndex].replace(/\.{3}$/, '')

    return (
        <div className={cn("flex items-center py-3", className)}>
            <p className="text-sm text-muted-foreground animate-in fade-in duration-300">
                {displayMessage}
                <BouncingDots />
            </p>
            {subtext && (
                <p className="text-xs text-muted-foreground/70 ml-2">
                    {subtext}
                </p>
            )}
        </div>
    )
}
