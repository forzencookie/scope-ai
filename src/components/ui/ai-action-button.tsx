"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Bot } from "lucide-react"

export interface AIActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Button text - defaults to "Generera" */
    children?: React.ReactNode
    /** Hide the robot icon */
    hideIcon?: boolean
    /** Size variant */
    size?: "sm" | "default"
}

/**
 * AI Action Button - Purple styled button for AI-related actions
 * Used in SectionCard variant="ai" and other AI feature triggers
 */
export function AIActionButton({
    children = "Generera",
    hideIcon = false,
    size = "default",
    className,
    ...props
}: AIActionButtonProps) {
    return (
        <button
            className={cn(
                "rounded-lg font-medium transition-colors inline-flex items-center gap-2",
                "bg-white dark:bg-purple-900/60",
                "text-purple-600 dark:text-purple-400",
                "hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-700/60 dark:hover:text-purple-200",
                size === "default" && "px-4 py-2 text-sm",
                size === "sm" && "px-3 py-1.5 text-xs",
                className
            )}
            {...props}
        >
            {children}
            {!hideIcon && <Bot className={cn("shrink-0", size === "default" ? "h-4 w-4" : "h-3.5 w-3.5")} />}
        </button>
    )
}
