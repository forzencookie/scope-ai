"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Plus, Calendar, CheckCircle2, TrendingUp, FileText, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

// Event type definition - for upcoming events shown on cards
interface CalendarEvent {
    id: string
    title: string
    date: Date
    type: "deadline" | "reminder" | "tax" | "submission" | "meeting"
    description?: string
}

// Sample events - replace with real data from your backend
const sampleEvents: CalendarEvent[] = [
    { id: "1", title: "Momsdeklaration", date: new Date(2025, 11, 12), type: "tax", description: "Lämna in momsdeklaration för Q4" },
    { id: "2", title: "Årsbokslut", date: new Date(2025, 11, 15), type: "deadline", description: "Deadline för årsbokslut" },
    { id: "3", title: "Löneutbetalning", date: new Date(2025, 11, 25), type: "reminder", description: "Månatlig löneutbetalning" },
    { id: "4", title: "Skatteverket", date: new Date(2025, 11, 27), type: "submission", description: "Inlämning av dokument till Skatteverket" },
    { id: "5", title: "Kvartalsrapport", date: new Date(2026, 0, 15), type: "deadline", description: "Q4 kvartalsrapport förfaller" },
    { id: "6", title: "Arbetsgivaravgift", date: new Date(2026, 0, 12), type: "tax", description: "Betalning av arbetsgivaravgift" },
]

// Event type colors
const eventTypeColors: Record<CalendarEvent["type"], string> = {
    deadline: "bg-red-500/20 text-red-600 dark:bg-red-900/30 dark:text-red-400/80",
    reminder: "bg-violet-500/20 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400/80",
    tax: "bg-amber-500/20 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400/80",
    submission: "bg-purple-500/20 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400/80",
    meeting: "bg-green-500/20 text-green-600 dark:bg-green-900/30 dark:text-green-400/80",
}

// Daily summary data - what happened on a specific day (shown in popup only)
interface DailySummary {
    date: Date
    bookkeepingDone: boolean
    transactionsCount: number
    invoicesCount: number
    receiptsCount: number
    profitOrLoss: number // positive = profit, negative = loss
    notes?: string
}

// Sample daily summary data - replace with real data from your backend
const sampleDailySummaries: DailySummary[] = [
    { date: new Date(2025, 11, 1), bookkeepingDone: true, transactionsCount: 5, invoicesCount: 2, receiptsCount: 3, profitOrLoss: 4500 },
    { date: new Date(2025, 11, 2), bookkeepingDone: true, transactionsCount: 8, invoicesCount: 3, receiptsCount: 5, profitOrLoss: 12300 },
    { date: new Date(2025, 11, 3), bookkeepingDone: false, transactionsCount: 2, invoicesCount: 0, receiptsCount: 1, profitOrLoss: -2100 },
    { date: new Date(2025, 11, 4), bookkeepingDone: true, transactionsCount: 6, invoicesCount: 4, receiptsCount: 2, profitOrLoss: 8750 },
    { date: new Date(2025, 11, 5), bookkeepingDone: true, transactionsCount: 12, invoicesCount: 5, receiptsCount: 7, profitOrLoss: 15200, notes: "Stort inköp från leverantör" },
    { date: new Date(2025, 11, 6), bookkeepingDone: true, transactionsCount: 3, invoicesCount: 1, receiptsCount: 2, profitOrLoss: 3400 },
    { date: new Date(2025, 11, 7), bookkeepingDone: false, transactionsCount: 0, invoicesCount: 0, receiptsCount: 0, profitOrLoss: 0 },
    { date: new Date(2025, 11, 8), bookkeepingDone: true, transactionsCount: 4, invoicesCount: 2, receiptsCount: 2, profitOrLoss: 6800 },
    { date: new Date(2025, 11, 9), bookkeepingDone: true, transactionsCount: 15, invoicesCount: 8, receiptsCount: 7, profitOrLoss: 22500, notes: "Bästa dagen denna månad!" },
    { date: new Date(2025, 11, 10), bookkeepingDone: true, transactionsCount: 7, invoicesCount: 3, receiptsCount: 4, profitOrLoss: 9100 },
    { date: new Date(2025, 11, 11), bookkeepingDone: false, transactionsCount: 1, invoicesCount: 0, receiptsCount: 1, profitOrLoss: -1500 },
    { date: new Date(2025, 11, 12), bookkeepingDone: true, transactionsCount: 10, invoicesCount: 6, receiptsCount: 4, profitOrLoss: 18700 },
    { date: new Date(2025, 11, 13), bookkeepingDone: true, transactionsCount: 4, invoicesCount: 2, receiptsCount: 2, profitOrLoss: 5600 },
    { date: new Date(2025, 11, 14), bookkeepingDone: false, transactionsCount: 0, invoicesCount: 0, receiptsCount: 0, profitOrLoss: 0 },
    { date: new Date(2025, 11, 15), bookkeepingDone: true, transactionsCount: 18, invoicesCount: 10, receiptsCount: 8, profitOrLoss: 31200, notes: "Kvartalsfakturering" },
    { date: new Date(2025, 11, 16), bookkeepingDone: true, transactionsCount: 5, invoicesCount: 2, receiptsCount: 3, profitOrLoss: 7400 },
    { date: new Date(2025, 11, 17), bookkeepingDone: true, transactionsCount: 3, invoicesCount: 1, receiptsCount: 2, profitOrLoss: 4200 },
    { date: new Date(2025, 11, 18), bookkeepingDone: true, transactionsCount: 9, invoicesCount: 4, receiptsCount: 5, profitOrLoss: 11800 },
    { date: new Date(2025, 11, 19), bookkeepingDone: false, transactionsCount: 2, invoicesCount: 1, receiptsCount: 1, profitOrLoss: -3200, notes: "Reklamationsåterbetalning" },
    { date: new Date(2025, 11, 20), bookkeepingDone: true, transactionsCount: 6, invoicesCount: 3, receiptsCount: 3, profitOrLoss: 8900 },
]

// Format revenue amount compactly
const formatRevenue = (amount: number): string => {
    if (amount === 0) return "0 kr"
    const absAmount = Math.abs(amount)
    const sign = amount < 0 ? "-" : ""
    
    // Use full numbers for up to 5 figures (99 999), use tn for 6+ figures (100 000+)
    if (absAmount >= 100000) {
        const formatted = (absAmount / 1000).toFixed(0)
        return `${sign}${formatted}tn kr`
    }
    // Format with space as thousands separator for Swedish style
    const formatted = absAmount.toLocaleString("sv-SE")
    return `${sign}${formatted} kr`
}

export function JournalCalendar() {
    // State for current date
    const [currentDate, setCurrentDate] = React.useState(new Date())
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

    const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"]
    const dayNames = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"]

    // Get ISO week number for a date
    const getWeekNumber = (date: Date): number => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
        const dayNum = d.getUTCDay() || 7
        d.setUTCDate(d.getUTCDate() + 4 - dayNum)
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    }

    // Calculate total monthly revenue
    const monthlyRevenue = sampleDailySummaries
        .filter(summary => summary.date.getMonth() === month && summary.date.getFullYear() === year)
        .reduce((sum, summary) => sum + summary.profitOrLoss, 0)

    // Get daily summary for selected day
    const selectedDaySummary = selectedDay
        ? sampleDailySummaries.find(summary =>
            summary.date.getDate() === selectedDay.day &&
            summary.date.getMonth() === selectedDay.month &&
            summary.date.getFullYear() === selectedDay.year
        )
        : null

    // Format selected date for display - Notion style with day name and date
    const formatSelectedDate = () => {
        if (!selectedDay) return ""
        const date = new Date(selectedDay.year, selectedDay.month, selectedDay.day)
        const dayName = date.toLocaleDateString("sv-SE", { weekday: "long" })
        const dayNum = selectedDay.day.toString().padStart(2, '0')
        const monthNum = (selectedDay.month + 1).toString().padStart(2, '0')
        const yearShort = selectedDay.year.toString().slice(-2)
        // Capitalize first letter
        return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum}/${monthNum}/${yearShort}`
    }

    // Format full date for display
    const formatFullDate = () => {
        if (!selectedDay) return ""
        const date = new Date(selectedDay.year, selectedDay.month, selectedDay.day)
        return date.toLocaleDateString("sv-SE", { month: "long", day: "numeric", year: "numeric" })
    }

    // Property row component for Notion-like display
    const PropertyRow = ({ icon: Icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) => (
        <div className="flex items-center gap-4 py-2">
            <div className="flex items-center gap-2 w-32 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    )

    return (
        <div className="h-full flex flex-col bg-background max-w-6xl mx-auto">
            {/* Day Detail Dialog - Notion Style */}
            <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
                <DialogContent className="sm:max-w-xl p-0 gap-0">
                    {/* Header with large date */}
                    <div className="p-6 pb-4">
                        <h1 className="text-2xl font-bold text-foreground">
                            {formatSelectedDate()}
                        </h1>
                    </div>

                    {/* Property rows - two columns */}
                    <div className="px-6 pb-4 border-b">
                        <div className="grid grid-cols-2 gap-x-6">
                            {/* Left column */}
                            <div>
                                <PropertyRow icon={Calendar} label="Datum">
                                    <span className="text-sm text-foreground">{formatFullDate()}</span>
                                </PropertyRow>

                                <PropertyRow icon={CheckCircle2} label="Bokfört">
                                    {selectedDaySummary ? (
                                        <Badge 
                                            variant="secondary" 
                                            className={cn(
                                                "text-xs font-medium",
                                                selectedDaySummary.bookkeepingDone 
                                                    ? "bg-emerald-500/20 text-emerald-600" 
                                                    : "bg-amber-500/20 text-amber-600"
                                            )}
                                        >
                                            {selectedDaySummary.bookkeepingDone ? "Klart" : "Ej klart"}
                                        </Badge>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Ingen data</span>
                                    )}
                                </PropertyRow>

                                <PropertyRow icon={TrendingUp} label="Belopp">
                                    {selectedDaySummary && selectedDaySummary.profitOrLoss !== 0 ? (
                                        <Badge 
                                            variant="secondary" 
                                            className={cn(
                                                "text-xs font-medium",
                                                selectedDaySummary.profitOrLoss > 0 
                                                    ? "bg-emerald-500/20 text-emerald-600" 
                                                    : "bg-rose-500/20 text-rose-600"
                                            )}
                                        >
                                            {selectedDaySummary.profitOrLoss > 0 ? "+" : ""}{formatRevenue(selectedDaySummary.profitOrLoss)}
                                        </Badge>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">0 kr</span>
                                    )}
                                </PropertyRow>
                            </div>

                            {/* Right column */}
                            <div>
                                <PropertyRow icon={FileText} label="Transaktioner">
                                    <span className="text-sm text-foreground">
                                        {selectedDaySummary?.transactionsCount ?? 0} st
                                    </span>
                                </PropertyRow>

                                <PropertyRow icon={Receipt} label="Fakturor">
                                    <span className="text-sm text-foreground">
                                        {selectedDaySummary?.invoicesCount ?? 0} st
                                    </span>
                                </PropertyRow>

                                <PropertyRow icon={Receipt} label="Kvitton">
                                    <span className="text-sm text-foreground">
                                        {selectedDaySummary?.receiptsCount ?? 0} st
                                    </span>
                                </PropertyRow>
                            </div>
                        </div>

                        <button className="flex items-center gap-2 py-2 text-muted-foreground hover:text-foreground transition-colors">
                            <Plus className="h-4 w-4" />
                            <span className="text-sm">Lägg till egenskap</span>
                        </button>
                    </div>

                    {/* Comments section */}
                    <div className="p-6 pt-4">
                        <h3 className="text-sm font-medium text-foreground mb-3">Anteckningar</h3>
                        {selectedDaySummary?.notes ? (
                            <p className="text-sm text-foreground bg-muted/50 rounded-md p-3 mb-3">
                                {selectedDaySummary.notes}
                            </p>
                        ) : null}
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-xs font-medium text-muted-foreground">R</span>
                            </div>
                            <Input 
                                placeholder="Lägg till en anteckning..." 
                                className="flex-1 h-8 text-sm border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Header with Month, Navigation */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-medium text-foreground">
                        {monthNames[month]} {year}
                    </h2>
                    <div className={cn(
                        "text-sm font-semibold px-2 py-0.5 rounded-md",
                        monthlyRevenue >= 0 
                            ? "text-emerald-600 bg-emerald-500/10" 
                            : "text-rose-600 bg-rose-500/10"
                    )}>
                        {monthlyRevenue >= 0 ? "+" : ""}{formatRevenue(monthlyRevenue)}
                    </div>
                </div>
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
                            Idag
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
            <div className="grid grid-cols-[auto_repeat(7,1fr)] px-1">
                <div className="w-10 py-2 text-center text-sm text-muted-foreground font-medium">
                    V
                </div>
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
            <div className="flex-1 flex flex-col gap-1 p-1">
                {/* Render calendar row by row */}
                {Array.from({ length: Math.ceil(finalSlots / 7) }).map((_, rowIndex) => {
                    const rowStart = rowIndex * 7
                    const isFirstRow = rowIndex === 0
                    const isLastRow = rowIndex === Math.ceil(finalSlots / 7) - 1
                    
                    // Calculate empty cells at start (first row only)
                    const leadingEmptyCells = isFirstRow ? firstDayOfMonth : 0
                    
                    // Calculate empty cells at end (last row only)
                    const lastDayIndex = firstDayOfMonth + daysInMonth - 1
                    const lastRowStart = Math.floor(lastDayIndex / 7) * 7
                    const trailingEmptyCells = isLastRow ? 6 - (lastDayIndex % 7) : 0

                    // Get week number for this row (use first valid day in the row)
                    const firstDayInRow = Math.max(1, rowStart - firstDayOfMonth + 1)
                    const weekDate = new Date(year, month, Math.min(firstDayInRow, daysInMonth))
                    const weekNumber = getWeekNumber(weekDate)
                    
                    return (
                        <div key={rowIndex} className="grid grid-cols-[auto_repeat(7,1fr)] gap-1 flex-1">
                            {/* Week number */}
                            <div className="w-10 flex items-center justify-center text-xs text-muted-foreground font-medium">
                                {weekNumber}
                            </div>
                            
                            {/* Leading empty cells (first row) - merged into one zebra rectangle */}
                            {isFirstRow && leadingEmptyCells > 0 && (
                                <div 
                                    className="rounded-xl overflow-hidden"
                                    style={{ 
                                        gridColumn: `span ${leadingEmptyCells}`,
                                        background: `repeating-linear-gradient(
                                            -45deg,
                                            rgba(0,0,0,0.04),
                                            rgba(0,0,0,0.04) 8px,
                                            rgba(0,0,0,0.08) 8px,
                                            rgba(0,0,0,0.08) 16px
                                        )`
                                    }}
                                />
                            )}
                            
                            {/* Valid day cells for this row */}
                            {Array.from({ length: 7 }).map((_, colIndex) => {
                                const index = rowStart + colIndex
                                const dayNumber = index - firstDayOfMonth + 1
                                const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth
                                
                                // Skip if this is part of leading or trailing empty section
                                if (isFirstRow && colIndex < leadingEmptyCells) return null
                                if (isLastRow && colIndex > 6 - trailingEmptyCells) return null
                                if (!isValidDay) return null
                                
                                // Check if this is today
                                const today = new Date()
                                const isToday = isValidDay &&
                                    dayNumber === today.getDate() &&
                                    month === today.getMonth() &&
                                    year === today.getFullYear()

                                // Check if first day of month
                                const isFirstOfMonth = dayNumber === 1

                                // Get events for this day (shown on cards)
                                const dayEvents = sampleEvents.filter(event => 
                                    event.date.getDate() === dayNumber &&
                                    event.date.getMonth() === month &&
                                    event.date.getFullYear() === year
                                )

                                // Get daily summary for revenue display
                                const daySummary = sampleDailySummaries.find(summary => 
                                    summary.date.getDate() === dayNumber &&
                                    summary.date.getMonth() === month &&
                                    summary.date.getFullYear() === year
                                )

                                return (
                                    <div
                                        key={index}
                                        className={cn(
                                            "relative min-h-[100px] rounded-xl transition-all overflow-hidden flex flex-col",
                                            "bg-card border-2 cursor-pointer hover:border-foreground/20",
                                            isToday 
                                                ? "border-foreground/40" 
                                                : "border-border/30"
                                        )}
                                        onClick={() => setSelectedDay({ day: dayNumber, month, year })}
                                    >
                                        {/* Day number and revenue */}
                                        <div className="p-2.5 flex items-start justify-between">
                                            {/* Revenue display */}
                                            {daySummary && daySummary.profitOrLoss !== 0 ? (
                                                <span className={cn(
                                                    "text-xs font-semibold",
                                                    daySummary.profitOrLoss > 0 ? "text-emerald-600" : "text-rose-600"
                                                )}>
                                                    {formatRevenue(daySummary.profitOrLoss)}
                                                </span>
                                            ) : (
                                                <span></span>
                                            )}
                                            {/* Day number */}
                                            <span className="text-sm font-medium text-foreground">
                                                {isFirstOfMonth ? `${monthNames[month].slice(0, 3)} ${dayNumber}` : dayNumber}
                                            </span>
                                        </div>

                                        {/* Spacer to push badges to bottom */}
                                        <div className="flex-1" />

                                        {/* Event badges - showing upcoming events */}
                                        {dayEvents.length > 0 && (
                                            <div className="px-2 pb-2.5 space-y-1">
                                                {dayEvents.slice(0, 2).map((event) => (
                                                    <Badge
                                                        key={event.id}
                                                        variant="secondary"
                                                        className={cn(
                                                            "w-full justify-start text-xs font-medium truncate rounded-md",
                                                            eventTypeColors[event.type]
                                                        )}
                                                    >
                                                        {event.title}
                                                    </Badge>
                                                ))}
                                                {dayEvents.length > 2 && (
                                                    <span className="text-xs text-muted-foreground px-1">
                                                        +{dayEvents.length - 2} mer
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            
                            {/* Trailing empty cells (last row) - merged into one zebra rectangle */}
                            {isLastRow && trailingEmptyCells > 0 && (
                                <div 
                                    className="rounded-xl overflow-hidden"
                                    style={{ 
                                        gridColumn: `span ${trailingEmptyCells}`,
                                        background: `repeating-linear-gradient(
                                            -45deg,
                                            rgba(0,0,0,0.04),
                                            rgba(0,0,0,0.04) 8px,
                                            rgba(0,0,0,0.08) 8px,
                                            rgba(0,0,0,0.08) 16px
                                        )`
                                    }}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
