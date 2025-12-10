"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** The icon to display */
    icon: LucideIcon
    /** Optional label (shown next to icon or in tooltip) */
    label?: string
    /** Show label inline or only in tooltip */
    showLabel?: boolean
    /** Tooltip text (defaults to label) */
    tooltip?: string
    /** Size variant */
    size?: "sm" | "md" | "lg"
    /** Visual variant */
    variant?: "ghost" | "outline" | "default"
}

export function IconButton({
    icon: Icon,
    label,
    showLabel = false,
    tooltip,
    size = "md",
    variant = "ghost",
    className,
    ...props
}: IconButtonProps) {
    const sizeConfig = {
        sm: { button: "p-1", icon: "h-3.5 w-3.5", text: "text-xs" },
        md: { button: "p-1.5", icon: "h-4 w-4", text: "text-sm" },
        lg: { button: "p-2", icon: "h-5 w-5", text: "text-sm" },
    }

    const variantConfig = {
        ghost: "text-muted-foreground hover:text-foreground transition-colors",
        outline: "text-muted-foreground hover:text-foreground border border-border/50 hover:border-border rounded-md transition-colors",
        default: "text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors",
    }

    const tooltipText = tooltip || label

    const buttonElement = (
        <button
            className={cn(
                "inline-flex items-center justify-center gap-1.5",
                sizeConfig[size].button,
                variantConfig[variant],
                className
            )}
            {...props}
        >
            <Icon className={sizeConfig[size].icon} />
            {showLabel && label && (
                <span className={sizeConfig[size].text}>{label}</span>
            )}
        </button>
    )

    if (tooltipText && !showLabel) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
                <TooltipContent side="top">
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        )
    }

    return buttonElement
}

export interface IconButtonGroupProps {
    children: React.ReactNode
    className?: string
}

export function IconButtonGroup({ children, className }: IconButtonGroupProps) {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            {children}
        </div>
    )
}
