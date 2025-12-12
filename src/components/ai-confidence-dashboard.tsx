"use client"

import * as React from "react"
import { useState } from "react"
import { 
    Brain, 
    TrendingUp, 
    CheckCircle2, 
    XCircle, 
    Clock,
    ChevronDown,
    ChevronUp,
    Bot,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

// =============================================================================
// Types
// =============================================================================

interface AIConfidenceMetrics {
    overallAccuracy: number
    weeklyChange: number
    categoriesProcessed: number
    approvalRate: number
    avgConfidence: number
    pendingReview: number
}

interface CategoryAccuracy {
    category: string
    accuracy: number
    totalSuggestions: number
    trend: "up" | "down" | "stable"
}

// =============================================================================
// Mock Data - In production, this would come from an AI metrics service
// =============================================================================

const mockMetrics: AIConfidenceMetrics = {
    overallAccuracy: 94.2,
    weeklyChange: 2.3,
    categoriesProcessed: 847,
    approvalRate: 89.5,
    avgConfidence: 87.3,
    pendingReview: 12,
}

const mockCategoryAccuracy: CategoryAccuracy[] = [
    { category: "Kontorsmaterial", accuracy: 98.5, totalSuggestions: 156, trend: "up" },
    { category: "Programvara", accuracy: 96.2, totalSuggestions: 234, trend: "stable" },
    { category: "Resa och transport", accuracy: 94.8, totalSuggestions: 89, trend: "up" },
    { category: "Telefon och internet", accuracy: 92.1, totalSuggestions: 67, trend: "stable" },
    { category: "Reklam och marknadsföring", accuracy: 88.4, totalSuggestions: 45, trend: "down" },
    { category: "Representation", accuracy: 82.7, totalSuggestions: 34, trend: "down" },
]

// =============================================================================
// Sub-components
// =============================================================================

function MetricCard({ 
    label, 
    value, 
    suffix = "", 
    change,
    icon: Icon,
    tooltip,
}: { 
    label: string
    value: number | string
    suffix?: string
    change?: { value: number; positive: boolean }
    icon: React.ElementType
    tooltip?: string
}) {
    const content = (
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border-2 border-border/60">
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-semibold tabular-nums">
                    {typeof value === "number" ? value.toFixed(1) : value}
                    {suffix}
                </span>
                {change && (
                    <span className={cn(
                        "text-xs font-medium flex items-center gap-0.5",
                        change.positive ? "text-green-600 dark:text-green-500/70" : "text-red-600 dark:text-red-500/70"
                    )}>
                        {change.positive ? (
                            <ArrowUpRight className="h-3 w-3" />
                        ) : (
                            <ArrowDownRight className="h-3 w-3" />
                        )}
                        {change.value > 0 ? "+" : ""}{change.value.toFixed(1)}%
                    </span>
                )}
            </div>
        </div>
    )

    if (tooltip) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    {content}
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-xs">{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        )
    }

    return content
}

function AccuracyBar({ 
    category, 
    accuracy, 
    totalSuggestions,
    trend,
}: CategoryAccuracy) {
    const getAccuracyColor = (acc: number) => {
        if (acc >= 95) return "bg-green-500"
        if (acc >= 85) return "bg-emerald-500"
        if (acc >= 75) return "bg-amber-500"
        return "bg-red-500"
    }

    const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : null

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="font-medium truncate max-w-[140px]" title={category}>
                    {category}
                </span>
                <div className="flex items-center gap-2">
                    {TrendIcon && (
                        <TrendIcon className={cn(
                            "h-3 w-3",
                            trend === "up" ? "text-green-600 dark:text-green-500/70" : "text-red-600 dark:text-red-500/70"
                        )} />
                    )}
                    <span className="text-muted-foreground tabular-nums">
                        {accuracy.toFixed(1)}%
                    </span>
                </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                    className={cn("h-full rounded-full transition-all duration-500", getAccuracyColor(accuracy))}
                    style={{ width: `${accuracy}%` }}
                />
            </div>
            <p className="text-[10px] text-muted-foreground">
                {totalSuggestions} förslag
            </p>
        </div>
    )
}

// =============================================================================
// Main Component
// =============================================================================

interface AIConfidenceDashboardProps {
    /** Whether the dashboard starts expanded */
    defaultExpanded?: boolean
    /** Compact mode for sidebar */
    compact?: boolean
    /** Custom className */
    className?: string
}

/**
 * AI Confidence Dashboard
 * 
 * Displays AI performance metrics and accuracy by category.
 * Addresses Issue #5 (Important): "No AI Confidence Learning Dashboard"
 * 
 * Supports mental model calibration by showing:
 * - Overall AI accuracy percentage
 * - Approval/rejection rates
 * - Category-specific accuracy with trends
 * - Pending review count
 * 
 * @example
 * // On dashboard page
 * <AIConfidenceDashboard defaultExpanded />
 * 
 * // In sidebar (compact mode)
 * <AIConfidenceDashboard compact />
 */
export function AIConfidenceDashboard({ 
    defaultExpanded = false,
    compact = false,
    className,
}: AIConfidenceDashboardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)
    const metrics = mockMetrics
    const categoryAccuracy = mockCategoryAccuracy

    if (compact) {
        // Compact version for sidebar
        return (
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors",
                            className
                        )}>
                            <Brain className="h-4 w-4 text-primary" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">AI-precision</span>
                                    <span className="text-xs font-semibold text-green-600 dark:text-green-500/70 tabular-nums">
                                        {metrics.overallAccuracy.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-1 mt-1 bg-muted rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-green-500 dark:bg-green-500/70 rounded-full"
                                        style={{ width: `${metrics.overallAccuracy}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs p-3">
                        <div className="space-y-2">
                            <p className="font-medium text-sm">AI-modellens prestanda</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-muted-foreground">Godkännandegrad:</span>
                                    <span className="ml-1 font-medium">{metrics.approvalRate}%</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Förslag:</span>
                                    <span className="ml-1 font-medium">{metrics.categoriesProcessed}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Väntar granskning:</span>
                                    <span className="ml-1 font-medium">{metrics.pendingReview}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Trend denna vecka:</span>
                                    <span className={cn(
                                        "ml-1 font-medium",
                                        metrics.weeklyChange >= 0 ? "text-green-600 dark:text-green-500/70" : "text-red-600 dark:text-red-500/70"
                                    )}>
                                        {metrics.weeklyChange >= 0 ? "+" : ""}{metrics.weeklyChange}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    // Full dashboard version
    return (
        <TooltipProvider delayDuration={0}>
            <Collapsible 
                open={isExpanded} 
                onOpenChange={setIsExpanded}
                className={cn("border-2 border-border/60 rounded-lg overflow-hidden", className)}
            >
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        className="w-full flex items-center justify-between p-4 h-auto hover:bg-muted/30"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Brain className="h-5 w-5 text-primary" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-medium text-sm">AI-modellens prestanda</h3>
                                <p className="text-xs text-muted-foreground">
                                    {metrics.overallAccuracy.toFixed(1)}% precision • {metrics.pendingReview} väntar
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                metrics.weeklyChange >= 0 
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/15 dark:text-green-500/70"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/15 dark:text-red-500/70"
                            )}>
                                {metrics.weeklyChange >= 0 ? "+" : ""}{metrics.weeklyChange}% denna vecka
                            </span>
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                        </div>
                    </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <MetricCard
                                label="Total precision"
                                value={metrics.overallAccuracy}
                                suffix="%"
                                change={{ value: metrics.weeklyChange, positive: metrics.weeklyChange >= 0 }}
                                icon={TrendingUp}
                                tooltip="Andel AI-förslag som godkänts av användare"
                            />
                            <MetricCard
                                label="Godkännandegrad"
                                value={metrics.approvalRate}
                                suffix="%"
                                icon={CheckCircle2}
                                tooltip="Andel förslag som godkänts direkt utan ändringar"
                            />
                            <MetricCard
                                label="Genomsnittlig konfidens"
                                value={metrics.avgConfidence}
                                suffix="%"
                                icon={Bot}
                                tooltip="AI-modellens genomsnittliga säkerhet på sina förslag"
                            />
                            <MetricCard
                                label="Väntar granskning"
                                value={metrics.pendingReview}
                                icon={Clock}
                                tooltip="Antal transaktioner som väntar på din granskning"
                            />
                        </div>

                        {/* Category Accuracy */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Precision per kategori
                                </h4>
                                <span className="text-[10px] text-muted-foreground">
                                    Baserat på senaste 30 dagarna
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {categoryAccuracy.map((cat) => (
                                    <AccuracyBar key={cat.category} {...cat} />
                                ))}
                            </div>
                        </div>

                        {/* Low Accuracy Alert */}
                        {categoryAccuracy.some(c => c.accuracy < 85) && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50">
                                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500/70 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-amber-800 dark:text-amber-400/80">
                                        Några kategorier har lägre precision
                                    </p>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-500/70">
                                        Granska och korrigera fler förslag i dessa kategorier för att förbättra AI-modellen.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </TooltipProvider>
    )
}

export default AIConfidenceDashboard
