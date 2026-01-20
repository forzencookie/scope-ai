"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface AiProcessingStateProps {
    messages?: string[]
    subtext?: string
    className?: string
}

const DEFAULT_MESSAGES = [
    "Snurrar",
    "Kokar på en idé",
    "Brygger ett svar",
    "Funderar"
]

// Pixel sparkle icon that rotates
function PixelSparkle() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 8 8"
            shapeRendering="crispEdges"
            className="inline-block mr-1.5 animate-spin [animation-duration:3s]"
        >
            {/* 4-pointed pixel star */}
            <rect x="3" y="0" width="2" height="2" className="fill-amber-500" />
            <rect x="3" y="6" width="2" height="2" className="fill-amber-500" />
            <rect x="0" y="3" width="2" height="2" className="fill-amber-500" />
            <rect x="6" y="3" width="2" height="2" className="fill-amber-500" />
            <rect x="3" y="3" width="2" height="2" className="fill-amber-400" />
        </svg>
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
        }, 2500)
        return () => clearInterval(interval)
    }, [messages])

    // Remove trailing "..." from message since we add it
    const displayMessage = messages[messageIndex].replace(/\.{3}$/, '')

    return (
        <div className={cn("flex items-center py-3", className)}>
            <p className="text-sm text-muted-foreground animate-in fade-in duration-300 flex items-center">
                <PixelSparkle />
                <span>{displayMessage}...</span>
            </p>
            {subtext && (
                <p className="text-xs text-muted-foreground/70 ml-2">
                    {subtext}
                </p>
            )}
        </div>
    )
}
