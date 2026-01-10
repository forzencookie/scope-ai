"use client"

import { AlertCircle, RefreshCw, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DataErrorStateProps {
    /** Error message to display */
    message?: string
    /** Called when user clicks retry button */
    onRetry?: () => void
    /** Show as inline (smaller) or full section */
    variant?: "inline" | "section"
    /** Additional classNames */
    className?: string
}

/**
 * User-facing error state for data fetch failures.
 * Displays a clear message and retry option instead of silent failures.
 * 
 * @example
 * ```tsx
 * {error ? (
 *   <DataErrorState 
 *     message="Kunde inte hämta transaktioner" 
 *     onRetry={refetch} 
 *   />
 * ) : (
 *   <TransactionsTable data={data} />
 * )}
 * ```
 */
export function DataErrorState({
    message = "Något gick fel vid hämtning av data",
    onRetry,
    variant = "section",
    className,
}: DataErrorStateProps) {
    if (variant === "inline") {
        return (
            <div
                role="alert"
                aria-live="polite"
                className={cn(
                    "flex items-center gap-2 text-sm text-destructive py-2",
                    className
                )}
            >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{message}</span>
                {onRetry && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRetry}
                        className="h-6 px-2 text-xs"
                        aria-label="Försök ladda data igen"
                    >
                        <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
                        Försök igen
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div
            role="alert"
            aria-live="polite"
            className={cn(
                "flex flex-col items-center justify-center py-12 px-4 text-center",
                "border-2 border-dashed border-border/60 rounded-lg bg-muted/10",
                className
            )}
        >
            <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-destructive/10">
                <WifiOff className="w-6 h-6 text-destructive" aria-hidden="true" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">
                Kunde inte ladda data
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {message}
            </p>
            {onRetry && (
                <Button
                    onClick={onRetry}
                    variant="outline"
                    size="sm"
                    aria-label="Försök ladda data igen"
                >
                    <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                    Försök igen
                </Button>
            )}
        </div>
    )
}

/**
 * Skeleton placeholder for StatCard during loading
 */
export function StatCardSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "h-24 rounded-lg border-2 border-border/60 bg-muted/30 animate-pulse",
                className
            )}
            role="status"
            aria-label="Laddar..."
        >
            <span className="sr-only">Laddar data...</span>
        </div>
    )
}

/**
 * Skeleton placeholder for table rows during loading
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
    return (
        <div className="flex gap-4 py-3 px-4 border-b border-border/40 animate-pulse">
            {Array.from({ length: columns }).map((_, i) => (
                <div
                    key={i}
                    className="h-4 bg-muted rounded flex-1"
                    style={{ maxWidth: i === 0 ? '40%' : '20%' }}
                />
            ))}
        </div>
    )
}
