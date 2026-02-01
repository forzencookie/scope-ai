"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Bot, Scale } from "lucide-react"

export interface AIActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Button text - defaults to "Generera" */
    children?: React.ReactNode
    /** Hide the robot icon */
    hideIcon?: boolean
    /** Size variant */
    size?: "sm" | "default"
    /** Color variant */
    variant?: "default" | "success"
}

/**
 * AI Action Button - Styled button for AI-related actions
 * Used in SectionCard variant="ai"/"success" and other AI feature triggers
 */
export function AIActionButton({
    children = "Generera",
    hideIcon = false,
    size = "default",
    variant = "default",
    className,
    ...props
}: AIActionButtonProps) {
    return (
        <button
            className={cn(
                "rounded-lg font-medium transition-colors inline-flex items-center gap-2",
                variant === "default" && "bg-white dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-700/60 dark:hover:text-purple-200",
                variant === "success" && "bg-white dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-700/60 dark:hover:text-emerald-200",
                size === "default" && "px-4 py-2 text-sm",
                size === "sm" && "px-3 py-1.5 text-xs",
                className
            )}
            {...props}
        >
            {children}
            {!hideIcon && (
                variant === "success"
                    ? <Scale className={cn("shrink-0", size === "default" ? "h-4 w-4" : "h-3.5 w-3.5")} />
                    : <Bot className={cn("shrink-0", size === "default" ? "h-4 w-4" : "h-3.5 w-3.5")} />
            )}
        </button>
    )
}
