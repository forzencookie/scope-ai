"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Plus, X, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

// Event type definition
interface CalendarEvent {
    id: string
    title: string
    date: Date
    type: "deadline" | "reminder" | "tax" | "submission" | "meeting"
    description?: string
}

// Sample events - replace with real data from your backend
const sampleEvents: CalendarEvent[] = [
    { id: "1", title: "Momsdeklaration", date: new Date(2025, 11, 12), type: "tax", description: "Submit VAT declaration for Q4" },
    { id: "2", title: "Årsbokslut", date: new Date(2025, 11, 15), type: "deadline", description: "Annual financial statement deadline" },
    { id: "3", title: "Löneutbetalning", date: new Date(2025, 11, 25), type: "reminder", description: "Monthly salary payment" },
    { id: "4", title: "Skatteverket", date: new Date(2025, 11, 27), type: "submission", description: "Tax authority document submission" },
    { id: "5", title: "Kvartalsrapport", date: new Date(2026, 0, 15), type: "deadline", description: "Q4 quarterly report due" },
    { id: "6", title: "Arbetsgivaravgift", date: new Date(2026, 0, 12), type: "tax", description: "Employer contribution payment" },
]

// Event type colors
const eventTypeColors: Record<CalendarEvent["type"], string> = {
    deadline: "bg-red-500/20 text-red-600 hover:bg-red-500/30",
    reminder: "bg-blue-500/20 text-blue-600 hover:bg-blue-500/30",
    tax: "bg-amber-500/20 text-amber-600 hover:bg-amber-500/30",
    submission: "bg-purple-500/20 text-purple-600 hover:bg-purple-500/30",
    meeting: "bg-green-500/20 text-green-600 hover:bg-green-500/30",
}

// Event type labels
const eventTypeLabels: Record<CalendarEvent["type"], string> = {
    deadline: "Deadline",
    reminder: "Reminder",
    tax: "Tax",
    submission: "Submission",
    meeting: "Meeting",
}

export function JournalCalendar() {
    // State for current date
    const [currentDate, setCurrentDate] = React.useState(new Date())
    const [hoveredCell, setHoveredCell] = React.useState<number | null>(null)
    const [selectedDay, setSelectedDay] = React.useState<{ day: number; month: number; year: number } | null>(null)

    // Navigation handlers
    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    // Calendar logic
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Get starting day of the week (0=Sun, 1=Mon, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay()

    // Generate calendar grid cells
    // We need: firstDayOfMonth empty cells + daysInMonth cells + remaining cells to fill row
    const totalSlots = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7
    // Ensure at least 5 rows (35 slots) for consistency
    const minSlots = 35
    const finalSlots = Math.max(totalSlots, minSlots)

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    // Get events for selected day
    const selectedDayEvents = selectedDay
        ? sampleEvents.filter(event =>
            event.date.getDate() === selectedDay.day &&
            event.date.getMonth() === selectedDay.month &&
            event.date.getFullYear() === selectedDay.year
        )
        : []

    // Format selected date for display
    const formatSelectedDate = () => {
        if (!selectedDay) return ""
        const date = new Date(selectedDay.year, selectedDay.month, selectedDay.day)
        return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    }

    return (
        <div className="h-full flex flex-col bg-background max-w-6xl mx-auto">
            {/* Day Detail Dialog */}
            <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            {formatSelectedDate()}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                        {selectedDayEvents.length > 0 ? (
                            selectedDayEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className={cn(
                                        "p-3 rounded-md",
                                        eventTypeColors[event.type]
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{event.title}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {eventTypeLabels[event.type]}
                                        </Badge>
                                    </div>
                                    {event.description && (
                                        <p className="text-sm mt-1 opacity-80">{event.description}</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No events scheduled for this day</p>
                                <Button variant="outline" size="sm" className="mt-3">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Event
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Header with Month, Navigation */}
            <div className="flex items-center justify-between px-4 py-3">
                <h2 className="text-lg font-medium text-foreground">
                    {monthNames[month]} {year}
                </h2>
                <div className="flex items-center gap-1">
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={prevMonth}
                            className="h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToToday}
                            className="h-8 px-3"
                        >
                            Today
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={nextMonth}
                            className="h-8 w-8"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7">
                {dayNames.map((day) => (
                    <div 
                        key={day} 
                        className="py-2 text-center text-sm text-muted-foreground font-medium"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr border border-border/20">
                {Array.from({ length: finalSlots }).map((_, index) => {
                    // Calculate actual day number (Sunday start)
                    const dayNumber = index - firstDayOfMonth + 1

                    // Check if valid day
                    const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth

                    // Check if this is today
                    const today = new Date()
                    const isToday = isValidDay &&
                        dayNumber === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear()

                    // Calculate row for border styling
                    const row = Math.floor(index / 7)
                    const col = index % 7
                    const isLastCol = col === 6
                    const isLastRow = row === Math.floor((finalSlots - 1) / 7)

                    // Check if first day of month
                    const isFirstOfMonth = dayNumber === 1

                    // Get events for this day
                    const dayEvents = isValidDay
                        ? sampleEvents.filter(event => 
                            event.date.getDate() === dayNumber &&
                            event.date.getMonth() === month &&
                            event.date.getFullYear() === year
                        )
                        : []

                    return (
                        <div
                            key={index}
                            className={cn(
                                "relative min-h-[100px] border-b border-r border-border/20 transition-colors overflow-hidden flex flex-col",
                                isLastCol && "border-r-0",
                                isLastRow && "border-b-0",
                                isValidDay && "hover:bg-muted/50 cursor-pointer",
                                !isValidDay && "bg-muted/20"
                            )}
                            onMouseEnter={() => isValidDay && setHoveredCell(index)}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => isValidDay && setSelectedDay({ day: dayNumber, month, year })}
                        >
                            {isValidDay && (
                                <>
                                    {/* Day number */}
                                    <div className="p-2 flex items-start justify-end">
                                        <span className={cn(
                                            "text-sm",
                                            isToday 
                                                ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center font-medium" 
                                                : "text-muted-foreground"
                                        )}>
                                            {isFirstOfMonth ? `${monthNames[month].slice(0, 3)} ${dayNumber}` : dayNumber}
                                        </span>
                                    </div>

                                    {/* Spacer to push badges to bottom */}
                                    <div className="flex-1" />

                                    {/* Event badges */}
                                    {dayEvents.length > 0 && (
                                        <div className="px-1 pb-3 space-y-1">
                                            {dayEvents.slice(0, 2).map((event) => (
                                                <Badge
                                                    key={event.id}
                                                    variant="secondary"
                                                    className={cn(
                                                        "w-full justify-start text-xs font-medium truncate cursor-pointer rounded-sm",
                                                        eventTypeColors[event.type]
                                                    )}
                                                >
                                                    {event.title}
                                                </Badge>
                                            ))}
                                            {dayEvents.length > 2 && (
                                                <span className="text-xs text-muted-foreground px-1">
                                                    +{dayEvents.length - 2} more
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Plus button on hover */}
                                    {hoveredCell === index && (
                                        <button 
                                            className="absolute left-2 top-2 w-6 h-6 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                // Handle add event
                                            }}
                                        >
                                            <Plus className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
