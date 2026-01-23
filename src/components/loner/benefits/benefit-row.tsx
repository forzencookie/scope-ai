"use client"

import { cn } from "@/lib/utils"

interface BenefitRowProps {
    name: string
    description?: string
    maxAmount?: number
    usageCount: number
    totalEmployees: number
    onClick?: () => void
}

export function BenefitRow({
    name,
    description,
    maxAmount,
    usageCount,
    totalEmployees,
    onClick
}: BenefitRowProps) {
    const usagePercent = totalEmployees > 0 ? Math.round((usageCount / totalEmployees) * 100) : 0

    return (
        <div
            className="flex items-center justify-between py-3 px-2 -mx-2 rounded-md hover:bg-muted/30 transition-colors cursor-pointer group"
            onClick={onClick}
        >
            <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-3.5" /> {/* Spacer for alignment */}
                <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{name}</span>
                    {description && (
                        <p className="text-xs text-muted-foreground truncate">{description}</p>
                    )}
                </div>
            </div>

            {/* Usage indicator */}
            <div className="flex items-center gap-4 shrink-0">
                {/* Progress bar */}
                <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all",
                                usagePercent === 100 ? "bg-green-500" :
                                    usagePercent > 50 ? "bg-amber-500" : "bg-muted-foreground/40"
                            )}
                            style={{ width: `${usagePercent}%` }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-10">
                        {usageCount}/{totalEmployees}
                    </span>
                </div>

                {/* Max amount */}
                {maxAmount && maxAmount > 0 && (
                    <span className="text-sm tabular-nums text-muted-foreground w-24 text-right">
                        {maxAmount.toLocaleString('sv-SE')} kr/år
                    </span>
                )}
            </div>
        </div>
    )
}
