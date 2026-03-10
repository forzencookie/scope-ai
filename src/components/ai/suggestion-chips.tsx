"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import {
    Zap,
    Receipt,
    FileText,
    TrendingUp,
    Calendar,
    AlertTriangle,
    Calculator,
    Percent,
    type LucideIcon,
} from "lucide-react"

// ============================================
// Types
// ============================================

export interface Suggestion {
    id: string
    icon: LucideIcon
    label: string
    prompt: string
    priority: "urgent" | "action" | "info" | "navigation"
}

interface SuggestionChipsProps {
    /** Call when a suggestion is clicked — sends prompt to chat */
    onSelect: (prompt: string) => void
}

// ============================================
// Priority Colors
// ============================================

const priorityStyles: Record<Suggestion["priority"], string> = {
    urgent: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 ring-red-500/20",
    action: "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 ring-amber-500/20",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 ring-blue-500/20",
    navigation: "bg-muted/60 text-muted-foreground hover:bg-muted ring-border/40",
}

// ============================================
// Smart Suggestions — time + context aware
// ============================================

function getTimeSuggestions(): Suggestion[] {
    const now = new Date()
    const month = now.getMonth() // 0-indexed
    const dayOfMonth = now.getDate()
    const suggestions: Suggestion[] = []

    // VAT deadline reminders (12th of the month following the quarter)
    // Q1: May 12, Q2: Aug 12, Q3: Nov 12, Q4: Feb 12
    const vatMonths = [1, 4, 7, 10] // Months where VAT is due (0-indexed)
    if (vatMonths.includes(month) && dayOfMonth <= 14) {
        suggestions.push({
            id: "moms-deadline",
            icon: Percent,
            label: "Momsdeklaration förfaller snart",
            prompt: "Gör momsdeklarationen",
            priority: dayOfMonth <= 5 ? "action" : "urgent",
        })
    }

    // Year-end (December/January)
    if (month === 11 || month === 0) {
        suggestions.push({
            id: "arsbokslut",
            icon: Calendar,
            label: month === 11 ? "Förbered årsbokslut" : "Stäng räkenskapsåret",
            prompt: "Hjälp mig med årsbokslut",
            priority: "action",
        })
    }

    // Tax declaration (March-May)
    if (month >= 2 && month <= 4) {
        suggestions.push({
            id: "inkomstdeklaration",
            icon: FileText,
            label: "Dags för inkomstdeklaration",
            prompt: "Gör inkomstdeklarationen",
            priority: month === 4 ? "urgent" : "action",
        })
    }

    // End of month — monthly close
    if (dayOfMonth >= 25) {
        suggestions.push({
            id: "manadsavslut",
            icon: Calendar,
            label: "Stäng månaden",
            prompt: "Hjälp mig med månadsavslut",
            priority: "action",
        })
    }

    return suggestions
}

function getDefaultSuggestions(): Suggestion[] {
    return [
        {
            id: "bokfor-kvitto",
            icon: Receipt,
            label: "Bokför kvitto",
            prompt: "Jag vill bokföra ett kvitto",
            priority: "navigation",
        },
        {
            id: "skapa-faktura",
            icon: FileText,
            label: "Skapa faktura",
            prompt: "Skapa en ny faktura till ",
            priority: "navigation",
        },
        {
            id: "visa-resultat",
            icon: TrendingUp,
            label: "Visa resultaträkning",
            prompt: "Visa resultaträkningen",
            priority: "navigation",
        },
        {
            id: "obokade",
            icon: AlertTriangle,
            label: "Bokför transaktioner",
            prompt: "Visa mina obokade transaktioner och hjälp mig bokföra dem",
            priority: "navigation",
        },
    ]
}

// ============================================
// Component
// ============================================

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
    const suggestions = useMemo(() => {
        const timeBased = getTimeSuggestions()
        const defaults = getDefaultSuggestions()

        // Combine: time-based first (higher priority), then fill with defaults
        const combined = [...timeBased]
        const usedIds = new Set(timeBased.map(s => s.id))

        for (const def of defaults) {
            if (!usedIds.has(def.id) && combined.length < 5) {
                combined.push(def)
            }
        }

        return combined.slice(0, 5)
    }, [])

    return (
        <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map(suggestion => {
                const Icon = suggestion.icon
                return (
                    <button
                        key={suggestion.id}
                        onClick={() => onSelect(suggestion.prompt)}
                        className={cn(
                            "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium",
                            "transition-all duration-200 ring-1 ring-inset",
                            "hover:shadow-sm active:scale-[0.97]",
                            priorityStyles[suggestion.priority]
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {suggestion.label}
                        {suggestion.priority === "urgent" && (
                            <Zap className="h-3 w-3 fill-current" />
                        )}
                    </button>
                )
            })}
        </div>
    )
}
