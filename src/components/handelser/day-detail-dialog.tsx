"use client"

import { useState, useEffect, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { HändelseEvent } from "@/types/events"
import { EventListItem } from "./event-list-item"
import { PixelDogStatic } from "@/components/ai/mascots/dog"
import { useMonthClosing } from "@/hooks/use-month-closing"

const DAY_NAMES_SV = [
    "Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"
]

const MONTH_NAMES_SV = [
    "januari", "februari", "mars", "april", "maj", "juni",
    "juli", "augusti", "september", "oktober", "november", "december"
]

function formatSwedishDate(date: Date): string {
    const dayName = DAY_NAMES_SV[date.getDay()]
    const day = date.getDate()
    const month = MONTH_NAMES_SV[date.getMonth()]
    const year = date.getFullYear()
    return `${dayName} ${day} ${month} ${year}`
}

interface DayDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    date: Date
    events: HändelseEvent[]
    onDateChange: (date: Date) => void
}

export function DayDetailDialog({
    open,
    onOpenChange,
    date,
    events,
    onDateChange,
}: DayDetailDialogProps) {
    const [notesValue, setNotesValue] = useState("")
    const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const userEditingRef = useRef(false)

    const { getDayNote, saveDayNote } = useMonthClosing()

    const year = date.getFullYear()
    const month = date.getMonth() + 1 // 1-12 for the hook
    const day = date.getDate()

    // Filter events for selected date
    const dayEvents = events.filter((e) => {
        const t = e.timestamp
        return (
            t.getFullYear() === date.getFullYear() &&
            t.getMonth() === date.getMonth() &&
            t.getDate() === date.getDate()
        )
    })

    // Load note when date changes
    const savedNote = getDayNote(year, month, day)
    useEffect(() => {
        if (!userEditingRef.current) {
            setNotesValue(savedNote)
        }
    }, [savedNote])

    // Reset editing flag and sync notes when date changes
    useEffect(() => {
        userEditingRef.current = false
        setNotesValue(getDayNote(year, month, day))
    }, [year, month, day]) // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced save
    const handleNotesChange = (value: string) => {
        userEditingRef.current = true
        setNotesValue(value)
        if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
        notesTimerRef.current = setTimeout(() => {
            saveDayNote(year, month, day, value)
            userEditingRef.current = false
        }, 500)
    }

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
        }
    }, [])

    // Navigation: prev/next day within the same month
    const canGoPrev = day > 1
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const canGoNext = day < lastDayOfMonth

    const handlePrev = () => {
        if (canGoPrev) {
            onDateChange(new Date(date.getFullYear(), date.getMonth(), day - 1))
        }
    }

    const handleNext = () => {
        if (canGoNext) {
            onDateChange(new Date(date.getFullYear(), date.getMonth(), day + 1))
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={!canGoPrev}
                            onClick={handlePrev}
                            className="h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <DialogTitle className="text-center min-w-[14rem]">
                            {formatSwedishDate(date)}
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={!canGoNext}
                            onClick={handleNext}
                            className="h-8 w-8"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogDescription className="sr-only">
                        Händelser och anteckningar för {formatSwedishDate(date)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Events list */}
                    {dayEvents.length > 0 ? (
                        <Card className="divide-y">
                            {dayEvents.map((event) => (
                                <EventListItem key={event.id} event={event} />
                            ))}
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <PixelDogStatic size={64} />
                            <p className="text-muted-foreground text-sm text-center">
                                Inga händelser denna dag.
                            </p>
                        </div>
                    )}

                    {/* Day notes */}
                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">
                            Anteckningar
                        </Label>
                        <Textarea
                            placeholder="Skriv anteckningar om denna dag..."
                            value={notesValue}
                            onChange={(e) => handleNotesChange(e.target.value)}
                            rows={3}
                            className="resize-none text-sm"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Stäng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
