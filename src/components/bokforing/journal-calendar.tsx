"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, CheckCircle2, TrendingUp, FileText, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge"
import { BorderedSection, PropertyRow } from "@/components/ui/settings-items"

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

// Map event types to StatusBadge variants
const eventTypeToVariant: Record<CalendarEvent["type"], StatusVariant> = {
    deadline: "error",
    reminder: "violet",
    tax: "warning",
    submission: "purple",
    meeting: "success",
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

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Day Detail Dialog - Clean style matching app */}
            <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {formatSelectedDate()}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">{formatFullDate()}</p>
                    </DialogHeader>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <BorderedSection>
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-medium">Bokföringsstatus</span>
                            </div>
                            {selectedDaySummary ? (
                                <StatusBadge
                                    status={selectedDaySummary.bookkeepingDone ? "Klart" : "Ej klart"}
                                    variant={selectedDaySummary.bookkeepingDone ? "success" : "warning"}
                                />
                            ) : (
                                <span className="text-sm text-muted-foreground">Ingen data</span>
                            )}
                        </BorderedSection>
                        <BorderedSection>
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-xs font-medium">Resultat</span>
                            </div>
                            {selectedDaySummary && selectedDaySummary.profitOrLoss !== 0 ? (
                                <span className={cn(
                                    "text-lg font-semibold",
                                    selectedDaySummary.profitOrLoss > 0
                                        ? "text-green-600 dark:text-green-500"
                                        : "text-red-600 dark:text-red-500"
                                )}>
                                    {selectedDaySummary.profitOrLoss > 0 ? "+" : ""}{formatRevenue(selectedDaySummary.profitOrLoss)}
                                </span>
                            ) : (
                                <span className="text-sm text-muted-foreground">0 kr</span>
                            )}
                        </BorderedSection>
                    </div>

                    {/* Property rows */}
                    <BorderedSection className="mt-1">
                        <PropertyRow icon={FileText} label="Transaktioner">
                            <span className="text-sm font-medium">
                                {selectedDaySummary?.transactionsCount ?? 0} st
                            </span>
                        </PropertyRow>
                        <PropertyRow icon={Receipt} label="Fakturor">
                            <span className="text-sm font-medium">
                                {selectedDaySummary?.invoicesCount ?? 0} st
                            </span>
                        </PropertyRow>
                        <PropertyRow icon={Receipt} label="Kvitton">
                            <span className="text-sm font-medium">
                                {selectedDaySummary?.receiptsCount ?? 0} st
                            </span>
                        </PropertyRow>
                    </BorderedSection>

                    {/* Notes section */}
                    <BorderedSection className="mt-1">
                        <h3 className="text-sm font-medium mb-2">Anteckningar</h3>
                        {selectedDaySummary?.notes ? (
                            <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2 mb-2">
                                {selectedDaySummary.notes}
                            </p>
                        ) : null}
                        <Input
                            placeholder="Lägg till en anteckning..."
                            className="h-9 text-sm"
                        />
                    </BorderedSection>
                </DialogContent>
            </Dialog>

            {/* Header with Month, Navigation */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border/60">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-foreground">
                        {monthNames[month]} {year}
                    </h2>
                    <span className={cn(
                        "text-sm font-semibold px-2.5 py-1 rounded-md",
                        monthlyRevenue >= 0
                            ? "text-green-700 bg-green-100 dark:text-green-500/70 dark:bg-green-900/20"
                            : "text-red-700 bg-red-100 dark:text-red-500/70 dark:bg-red-900/20"
                    )}>
                        {monthlyRevenue >= 0 ? "+" : ""}{formatRevenue(monthlyRevenue)}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={prevMonth}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToToday}
                        className="h-8 px-3"
                    >
                        Idag
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={nextMonth}
                        className="h-8 w-8"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-[auto_repeat(7,1fr)] pt-3">
                <div className="w-8 py-2 text-center text-xs text-muted-foreground font-medium">
                    V
                </div>
                {dayNames.map((day) => (
                    <div
                        key={day}
                        className="py-2 text-center text-xs text-muted-foreground font-medium"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid - matching app card style */}
            <div className="flex-1 flex flex-col">
                <Card className="flex-1 flex flex-col bg-card">
                    {/* Render calendar row by row */}
                    {Array.from({ length: Math.ceil(finalSlots / 7) }).map((_, rowIndex) => {
                        const rowStart = rowIndex * 7
                        const isFirstRow = rowIndex === 0
                        const isLastRow = rowIndex === Math.ceil(finalSlots / 7) - 1

                        // Get week number for this row (use first valid day in the row)
                        const firstDayInRow = Math.max(1, rowStart - firstDayOfMonth + 1)
                        const weekDate = new Date(year, month, Math.min(firstDayInRow, daysInMonth))
                        const weekNumber = getWeekNumber(weekDate)

                        return (
                            <div key={rowIndex} className={cn(
                                "grid grid-cols-[auto_repeat(7,1fr)] flex-1",
                                !isLastRow && "border-b border-border/60"
                            )}>
                                {/* Week number */}
                                <div className="w-10 flex items-center justify-center text-xs text-muted-foreground font-medium border-r border-border/60">
                                    {weekNumber}
                                </div>

                                {/* Day cells */}
                                {Array.from({ length: 7 }).map((_, colIndex) => {
                                    const index = rowStart + colIndex
                                    const dayNumber = index - firstDayOfMonth + 1
                                    const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth
                                    const isLastCol = colIndex === 6

                                    // Empty placeholder for invalid days
                                    if (!isValidDay) {
                                        return (
                                            <div
                                                key={index}
                                                className={cn(
                                                    "bg-muted/30",
                                                    !isLastCol && "border-r border-border/60"
                                                )}
                                            />
                                        )
                                    }

                                    // Check if this is today
                                    const today = new Date()
                                    const isToday = dayNumber === today.getDate() &&
                                        month === today.getMonth() &&
                                        year === today.getFullYear()

                                    // Check if first day of month
                                    const isFirstOfMonth = dayNumber === 1

                                    // Get events for this day
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
                                                "min-h-[90px] flex flex-col cursor-pointer transition-colors",
                                                !isLastCol && "border-r border-border/60",
                                                "hover:bg-muted/30",
                                                isToday && "bg-primary/5"
                                            )}
                                            onClick={() => setSelectedDay({ day: dayNumber, month, year })}
                                        >
                                            {/* Day header */}
                                            <div className="p-2 flex items-start justify-between">
                                                <span className={cn(
                                                    "text-sm font-medium leading-none",
                                                    isToday
                                                        ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
                                                        : "text-foreground"
                                                )}>
                                                    {isFirstOfMonth ? `${dayNumber} ${monthNames[month].slice(0, 3)}` : dayNumber}
                                                </span>
                                                {daySummary && daySummary.profitOrLoss !== 0 && (
                                                    <span className={cn(
                                                        "text-[11px] font-medium",
                                                        daySummary.profitOrLoss > 0
                                                            ? "text-green-600 dark:text-green-500"
                                                            : "text-red-600 dark:text-red-500"
                                                    )}>
                                                        {formatRevenue(daySummary.profitOrLoss)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Spacer */}
                                            <div className="flex-1" />

                                            {/* Event badges */}
                                            {dayEvents.length > 0 && (
                                                <div className="px-1 pb-1 space-y-0.5">
                                                    {dayEvents.slice(0, 2).map((event) => (
                                                        <StatusBadge
                                                            key={event.id}
                                                            status={event.title}
                                                            variant={eventTypeToVariant[event.type]}
                                                            className="w-full justify-start text-[10px] truncate px-1.5 py-0"
                                                        />
                                                    ))}
                                                    {dayEvents.length > 2 && (
                                                        <span className="text-[10px] text-muted-foreground px-0.5">
                                                            +{dayEvents.length - 2} mer
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </Card>
            </div>
        </div>
    )
}
