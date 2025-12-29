"use client"

import { Card } from "@/components/ui/card"
import { FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"

// Quarter definitions
const quarters = [
    { id: "Q1", label: "Q1", months: "Jan - Mar", monthRange: [0, 1, 2] },
    { id: "Q2", label: "Q2", months: "Apr - Jun", monthRange: [3, 4, 5] },
    { id: "Q3", label: "Q3", months: "Jul - Sep", monthRange: [6, 7, 8] },
    { id: "Q4", label: "Q4", months: "Okt - Dec", monthRange: [9, 10, 11] },
] as const

export type Quarter = typeof quarters[number]["id"]

interface EventsFolderViewProps {
    year: number
    eventCounts: Record<Quarter, number>
    onSelectQuarter: (quarter: Quarter) => void
}

export function EventsFolderView({
    year,
    eventCounts,
    onSelectQuarter,
}: EventsFolderViewProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quarters.map((quarter) => {
                const count = eventCounts[quarter.id] || 0
                const hasEvents = count > 0

                return (
                    <Card
                        key={quarter.id}
                        className={cn(
                            "relative p-6 cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group",
                            "flex flex-col items-center justify-center text-center min-h-[140px]"
                        )}
                        onClick={() => onSelectQuarter(quarter.id)}
                    >
                        {/* Folder icon */}
                        <div className="relative mb-3">
                            <FolderOpen className="h-12 w-12 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
                        </div>

                        {/* Quarter label */}
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {quarter.label} {year}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {quarter.months}
                        </p>

                        {/* Event count badge */}
                        {hasEvents && (
                            <span className="mt-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {count} händelser
                            </span>
                        )}
                    </Card>
                )
            })}
        </div>
    )
}

// Helper to get quarter from a date
export function getQuarterFromDate(date: Date): Quarter {
    const month = date.getMonth()
    if (month <= 2) return "Q1"
    if (month <= 5) return "Q2"
    if (month <= 8) return "Q3"
    return "Q4"
}

// Helper to filter events by year and quarter
export function filterEventsByQuarter<T extends { timestamp: Date }>(
    events: T[],
    year: number,
    quarter?: Quarter
): T[] {
    return events.filter((event) => {
        const eventYear = event.timestamp.getFullYear()
        if (eventYear !== year) return false
        if (!quarter) return true
        return getQuarterFromDate(event.timestamp) === quarter
    })
}

// Count events by quarter for a given year
export function countEventsByQuarter<T extends { timestamp: Date }>(
    events: T[],
    year: number
): Record<Quarter, number> {
    const counts: Record<Quarter, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }

    events.forEach((event) => {
        if (event.timestamp.getFullYear() === year) {
            const quarter = getQuarterFromDate(event.timestamp)
            counts[quarter]++
        }
    })

    return counts
}
