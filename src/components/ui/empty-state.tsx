"use client"

import { LucideIcon, Package, Search, FileX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
    /** Icon to display */
    icon?: LucideIcon
    /** Main title text */
    title: string
    /** Description/subtitle text */
    description?: string
    /** Primary action button */
    action?: {
        label: string
        onClick: () => void
        icon?: LucideIcon
    }
    /** Whether filters are active (shows different messaging) */
    hasFilters?: boolean
    /** Visual variant */
    variant?: "default" | "compact" | "card"
    /** Additional classNames */
    className?: string
}

/**
 * Standardized empty state component for consistent UX.
 * Use this for tables, lists, and data sections when no data is available.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={FileText}
 *   title="Inga fakturor ännu"
 *   description="Skapa din första faktura för att komma igång"
 *   action={{
 *     label: "Skapa faktura",
 *     onClick: () => setDialogOpen(true),
 *     icon: Plus
 *   }}
 * />
 * ```
 */
export function EmptyState({
    icon: Icon = Package,
    title,
    description,
    action,
    hasFilters = false,
    variant = "default",
    className,
}: EmptyStateProps) {
    // Override messaging for filter scenarios
    const displayTitle = hasFilters ? "Inga resultat matchar din sökning" : title
    const displayDescription = hasFilters
        ? "Försök med andra söktermer eller avaktivera något filter"
        : description
    const DisplayIcon = hasFilters ? Search : Icon

    if (variant === "compact") {
        return (
            <div
                role="status"
                className={cn(
                    "flex flex-col items-center justify-center py-8 text-center",
                    className
                )}
            >
                <DisplayIcon className="h-8 w-8 text-muted-foreground/50 mb-3" aria-hidden="true" />
                <p className="text-sm font-medium text-muted-foreground">{displayTitle}</p>
                {displayDescription && (
                    <p className="text-xs text-muted-foreground/70 mt-1">{displayDescription}</p>
                )}
            </div>
        )
    }

    if (variant === "card") {
        return (
            <div
                role="status"
                className={cn(
                    "flex flex-col items-center justify-center py-12 px-4 text-center",
                    "border-2 border-dashed border-border/60 rounded-lg bg-muted/5",
                    className
                )}
            >
                <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-muted/50">
                    <DisplayIcon className="w-7 h-7 text-muted-foreground/60" aria-hidden="true" />
                </div>
                <h3 className="text-base font-medium text-foreground mb-1">{displayTitle}</h3>
                {displayDescription && (
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm">{displayDescription}</p>
                )}
                {action && !hasFilters && (
                    <Button onClick={action.onClick} size="sm">
                        {action.icon && <action.icon className="h-4 w-4 mr-2" aria-hidden="true" />}
                        {action.label}
                    </Button>
                )}
            </div>
        )
    }

    // Default variant
    return (
        <div
            role="status"
            className={cn(
                "flex flex-col items-center justify-center py-12 text-center",
                className
            )}
        >
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <DisplayIcon className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
            </div>
            <p className="font-medium text-foreground mb-1">{displayTitle}</p>
            {displayDescription && (
                <p className="text-sm text-muted-foreground mb-4">{displayDescription}</p>
            )}
            {action && !hasFilters && (
                <Button size="sm" onClick={action.onClick}>
                    {action.icon && <action.icon className="h-3.5 w-3.5 mr-1" aria-hidden="true" />}
                    {action.label}
                </Button>
            )}
        </div>
    )
}

/**
 * Pre-configured empty state for "no data" scenarios
 */
export function NoDataEmptyState({
    entityName,
    onAdd,
    addLabel,
}: {
    entityName: string
    onAdd?: () => void
    addLabel?: string
}) {
    return (
        <EmptyState
            icon={FileX}
            title={`Inga ${entityName.toLowerCase()} ännu`}
            description={`Här är det tomt — ännu! ${onAdd ? 'Lägg till din första för att komma igång.' : ''}`}
            action={onAdd ? {
                label: addLabel || `Lägg till ${entityName.toLowerCase()}`,
                onClick: onAdd,
            } : undefined}
            variant="card"
        />
    )
}

/**
 * Pre-configured empty state for filtered/search scenarios
 */
export function NoResultsEmptyState({ onClearFilters }: { onClearFilters?: () => void }) {
    return (
        <EmptyState
            hasFilters={true}
            title="Inga resultat"
            action={onClearFilters ? {
                label: "Rensa filter",
                onClick: onClearFilters,
            } : undefined}
            variant="default"
        />
    )
}
