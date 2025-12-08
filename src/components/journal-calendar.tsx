"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function JournalCalendar() {
    // State for current date (default to March 2025 as requested, or today)
    const [currentDate, setCurrentDate] = React.useState(new Date(2025, 2, 1)) // Month is 0-indexed (2 = March)

    // Navigation handlers
    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    // Calendar logic
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Get starting day of the week (0=Sun, 1=Mon, etc.)
    // We want Monday to be 0, so we adjust: (day + 6) % 7
    // JS getDay(): Sun=0, Mon=1, Tue=2...
    // Target: Mon=0, Tue=1... Sun=6
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const startOffset = (firstDayOfMonth + 6) % 7

    // Generate calendar grid cells
    // We need: startOffset empty cells + daysInMonth cells + remaining cells to fill row
    const totalSlots = Math.ceil((startOffset + daysInMonth) / 7) * 7
    // Ensure at least 5 rows (35 slots) for consistency, or let it be dynamic
    const minSlots = 35
    const finalSlots = Math.max(totalSlots, minSlots)

    const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"]

    return (
        <div className="w-full h-full flex flex-col">
            {/* Month Display and Navigation */}
            <div className="flex items-center justify-between px-6 py-4">
                <h2 className="text-xl font-semibold">
                    {monthNames[month]} {year}
                </h2>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={prevMonth}
                        className="h-8"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(new Date())}
                        className="h-8 px-3"
                    >
                        Idag
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={nextMonth}
                        className="h-8"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 gap-2 px-6 pt-4 pb-2">
                {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day) => (
                    <div key={day} className="text-sm text-muted-foreground font-medium">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-fr gap-2 flex-1 px-6 pb-6">
                {Array.from({ length: finalSlots }).map((_, index) => {
                    // Calculate actual day number
                    const dayNumber = index - startOffset + 1

                    // Check if valid day
                    const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth

                    // Check if this is today
                    const today = new Date()
                    const isToday = isValidDay &&
                        dayNumber === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear()

                    // Calculate day name for valid days
                    const dayNames = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"]
                    const dayName = dayNames[index % 7]

                    // Color classes must be complete strings for Tailwind JIT to detect them
                    // Pattern repeats every 3 rows with different colors for each column
                    const colorClasses: { bg: string; hover: string }[][] = [
                        // Row 1: Mon, Tue, Wed, Thu, Fri, Sat, Sun
                        [
                            { bg: "bg-teal-500/10", hover: "hover:bg-teal-500/20" },
                            { bg: "bg-red-500/10", hover: "hover:bg-red-500/20" },
                            { bg: "bg-pink-500/10", hover: "hover:bg-pink-500/20" },
                            { bg: "bg-sky-500/10", hover: "hover:bg-sky-500/20" },
                            { bg: "bg-emerald-500/10", hover: "hover:bg-emerald-500/20" },
                            { bg: "bg-violet-500/10", hover: "hover:bg-violet-500/20" },
                            { bg: "bg-lime-500/10", hover: "hover:bg-lime-500/20" },
                        ],
                        // Row 2
                        [
                            { bg: "bg-blue-500/10", hover: "hover:bg-blue-500/20" },
                            { bg: "bg-orange-500/10", hover: "hover:bg-orange-500/20" },
                            { bg: "bg-indigo-500/10", hover: "hover:bg-indigo-500/20" },
                            { bg: "bg-cyan-500/10", hover: "hover:bg-cyan-500/20" },
                            { bg: "bg-amber-500/10", hover: "hover:bg-amber-500/20" },
                            { bg: "bg-rose-500/10", hover: "hover:bg-rose-500/20" },
                            { bg: "bg-green-500/10", hover: "hover:bg-green-500/20" },
                        ],
                        // Row 3
                        [
                            { bg: "bg-purple-500/10", hover: "hover:bg-purple-500/20" },
                            { bg: "bg-yellow-500/10", hover: "hover:bg-yellow-500/20" },
                            { bg: "bg-fuchsia-500/10", hover: "hover:bg-fuchsia-500/20" },
                            { bg: "bg-emerald-500/10", hover: "hover:bg-emerald-500/20" },
                            { bg: "bg-red-500/10", hover: "hover:bg-red-500/20" },
                            { bg: "bg-blue-500/10", hover: "hover:bg-blue-500/20" },
                            { bg: "bg-pink-500/10", hover: "hover:bg-pink-500/20" },
                        ],
                    ]

                    // Calculate row and column for this cell
                    const columnIndex = index % 7
                    const rowIndex = Math.floor(index / 7) % 3 // Repeat pattern every 3 rows

                    // Get color classes from pattern
                    const colors = colorClasses[rowIndex][columnIndex]
                    const hoverColor = isValidDay ? colors.hover : ""
                    const bgColor = isValidDay ? colors.bg : ""

                    if (isValidDay) {
                        return (
                            <Card
                                key={index}
                                className={cn(
                                    "relative h-full border-0 rounded-xl p-3 flex flex-col justify-between transition-colors cursor-pointer",
                                    isToday ? bgColor : "bg-muted/50",
                                    hoverColor
                                )}
                            >
                                <span className="text-sm font-medium text-foreground/70">{dayNumber}</span>
                                <span className="absolute top-3 right-3 text-xs text-muted-foreground/50">{dayName}</span>
                            </Card>
                        )
                    } else {
                        // Empty placeholder
                        return (
                            <Card
                                key={index}
                                className="h-full bg-transparent border-0 shadow-none"
                            />
                        )
                    }
                })}
            </div>
        </div>
    )
}
