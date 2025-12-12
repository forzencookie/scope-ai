"use client"

import * as React from "react"
import { useState } from "react"
import { 
    ChevronDown, 
    Settings2, 
    Wrench,
    Sliders,
    type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

// =============================================================================
// Types
// =============================================================================

type ProgressiveDisclosureVariant = "settings" | "advanced" | "expert" | "custom"

interface ProgressiveDisclosureProps {
    /** Title for the expandable section */
    title?: string
    /** Description shown in collapsed state */
    description?: string
    /** Visual variant */
    variant?: ProgressiveDisclosureVariant
    /** Custom icon override */
    icon?: LucideIcon
    /** Whether section starts expanded */
    defaultOpen?: boolean
    /** Custom trigger label */
    triggerLabel?: string
    /** Children to show when expanded */
    children: React.ReactNode
    /** Additional className */
    className?: string
}

// =============================================================================
// Variant Configuration
// =============================================================================

const variantConfig: Record<ProgressiveDisclosureVariant, { 
    defaultTitle: string
    defaultDescription: string
    defaultIcon: LucideIcon
    triggerLabel: string
    className: string
}> = {
    settings: {
        defaultTitle: "Avancerade inställningar",
        defaultDescription: "Ytterligare konfigurationsalternativ för erfarna användare",
        defaultIcon: Settings2,
        triggerLabel: "Visa avancerade inställningar",
        className: "border-2 border-border/60 bg-muted/20",
    },
    advanced: {
        defaultTitle: "Avancerat",
        defaultDescription: "Funktioner för mer detaljerad kontroll",
        defaultIcon: Sliders,
        triggerLabel: "Visa avancerade alternativ",
        className: "border-amber-200/50 bg-amber-50/30 dark:border-amber-800/50 dark:bg-amber-900/10",
    },
    expert: {
        defaultTitle: "Expertläge",
        defaultDescription: "Använd dessa inställningar försiktigt",
        defaultIcon: Wrench,
        triggerLabel: "Visa expertfunktioner",
        className: "border-purple-200/50 bg-purple-50/30 dark:border-purple-800/50 dark:bg-purple-900/10",
    },
    custom: {
        defaultTitle: "Fler alternativ",
        defaultDescription: "",
        defaultIcon: ChevronDown,
        triggerLabel: "Visa mer",
        className: "border-2 border-border/60",
    },
}

// =============================================================================
// Component
// =============================================================================

/**
 * Progressive Disclosure Component
 * 
 * Hides advanced or complex features behind an expandable section.
 * Addresses Issue #6 (Important): "No Progressive Disclosure for Advanced Features"
 * 
 * Implements Hick's Law by reducing initial cognitive load.
 * Shows simple options first, reveals complexity only when needed.
 * 
 * @example
 * // In a settings form
 * <form>
 *   <BasicSettings />
 *   <ProgressiveDisclosure variant="settings">
 *     <AdvancedSettings />
 *   </ProgressiveDisclosure>
 * </form>
 * 
 * // In transaction filtering
 * <ProgressiveDisclosure 
 *   title="Avancerad filtrering" 
 *   variant="advanced"
 * >
 *   <DateRangePicker />
 *   <CategoryMultiSelect />
 * </ProgressiveDisclosure>
 */
export function ProgressiveDisclosure({
    title,
    description,
    variant = "settings",
    icon,
    defaultOpen = false,
    triggerLabel,
    children,
    className,
}: ProgressiveDisclosureProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const config = variantConfig[variant]
    
    const displayTitle = title || config.defaultTitle
    const displayDescription = description || config.defaultDescription
    const displayTriggerLabel = triggerLabel || config.triggerLabel
    const Icon = icon || config.defaultIcon

    return (
        <Collapsible 
            open={isOpen} 
            onOpenChange={setIsOpen}
            className={cn(
                "rounded-lg border transition-colors",
                config.className,
                className
            )}
        >
            <CollapsibleTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between p-4 h-auto hover:bg-transparent"
                >
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                            isOpen ? "bg-primary/10" : "bg-muted"
                        )}>
                            <Icon className={cn(
                                "h-4 w-4 transition-colors",
                                isOpen ? "text-primary" : "text-muted-foreground"
                            )} />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-sm">{displayTitle}</p>
                            {!isOpen && displayDescription && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {displayDescription}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            {isOpen ? "Dölj" : displayTriggerLabel}
                        </span>
                        <ChevronDown className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-180"
                        )} />
                    </div>
                </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="px-4 pb-4 pt-0">
                    <div className="h-px bg-border/50 mb-4" />
                    {children}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}

// =============================================================================
// Convenience Components
// =============================================================================

/**
 * Shorthand for advanced settings sections
 */
export function AdvancedSettingsSection({ 
    children, 
    ...props 
}: Omit<ProgressiveDisclosureProps, "variant">) {
    return (
        <ProgressiveDisclosure variant="settings" {...props}>
            {children}
        </ProgressiveDisclosure>
    )
}

/**
 * Shorthand for expert/power-user features
 */
export function ExpertModeSection({ 
    children, 
    ...props 
}: Omit<ProgressiveDisclosureProps, "variant">) {
    return (
        <ProgressiveDisclosure variant="expert" {...props}>
            {children}
        </ProgressiveDisclosure>
    )
}

export default ProgressiveDisclosure
