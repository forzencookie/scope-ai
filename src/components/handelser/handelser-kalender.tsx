"use client"

import { useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { HändelseEvent } from "@/types/events"
import { eventSourceMeta } from "@/types/events"
import { cn } from "@/lib/utils"

interface EventsCalendarProps {
    events: HändelseEvent[]
    year: number
    month: number
    onMonthChange: (year: number, month: number) => void
    onEventClick?: (event: HändelseEvent) => void
}

const weekDays = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"]
const monthNames = [
    "Januari", "Februari", "Mars", "April", "Maj", "Juni",
    "Juli", "Augusti", "September", "Oktober", "November", "December"
]

export function EventsCalendar({
    events,
    year,
    month,
    onMonthChange,
    onEventClick,
}: EventsCalendarProps) {
    // Build calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        // Adjust for Monday start (getDay(): 0=Sun, 1=Mon, etc.)
        let startOffset = firstDay.getDay() - 1
        if (startOffset < 0) startOffset = 6

        const days: { date: Date | null; events: HändelseEvent[] }[] = []

        // Empty cells before first day
        for (let i = 0; i < startOffset; i++) {
            days.push({ date: null, events: [] })
        }

        // Days of the month
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(year, month, d)
            const dayEvents = events.filter((e) => {
                const eDate = e.timestamp
                return (
                    eDate.getFullYear() === year &&
                    eDate.getMonth() === month &&
                    eDate.getDate() === d
                )
            })
            days.push({ date, events: dayEvents })
        }

        return days
    }, [events, year, month])

    const handlePrevMonth = () => {
        if (month === 0) {
            onMonthChange(year - 1, 11)
        } else {
            onMonthChange(year, month - 1)
        }
    }

    const handleNextMonth = () => {
        if (month === 11) {
            onMonthChange(year + 1, 0)
        } else {
            onMonthChange(year, month + 1)
        }
    }

    const today = new Date()
    const isToday = (date: Date | null) =>
        date &&
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()

    return (
        <div className="space-y-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                    {monthNames[month]} {year}
                </h3>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar grid */}
            <Card className="p-4">
                {/* Week day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="text-center text-xs font-medium text-muted-foreground py-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((cell, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "min-h-[80px] p-1 rounded-lg border border-transparent",
                                cell.date && "hover:border-border/60 hover:bg-muted/30 transition-colors",
                                isToday(cell.date) && "bg-primary/5 border-primary/30"
                            )}
                        >
                            {cell.date && (
                                <>
                                    <div className={cn(
                                        "text-sm font-medium mb-1",
                                        isToday(cell.date) && "text-primary"
                                    )}>
                                        {cell.date.getDate()}
                                    </div>
                                    <div className="space-y-0.5">
                                        {cell.events.slice(0, 2).map((event) => {
                                            const meta = eventSourceMeta[event.source]
                                            return (
                                                <button
                                                    key={event.id}
                                                    onClick={() => onEventClick?.(event)}
                                                    className={cn(
                                                        "block w-full text-left text-[10px] px-1 py-0.5 rounded truncate",
                                                        meta.bgClass,
                                                        meta.colorClass
                                                    )}
                                                >
                                                    {event.title}
                                                </button>
                                            )
                                        })}
                                        {cell.events.length > 2 && (
                                            <div className="text-[10px] text-muted-foreground px-1">
                                                +{cell.events.length - 2} mer
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}
