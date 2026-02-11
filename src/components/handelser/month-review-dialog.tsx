"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AppStatusBadge } from "@/components/ui/status-badge"
import type { AppStatus } from "@/lib/status-types"
import { Loader2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, FileCheck, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMonthClosing } from "@/hooks/use-month-closing"
import { PixelDogStatic } from "@/components/ai/mascots/dog"

const MONTH_NAMES_SV = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
]

interface StatusBreakdown {
    status: string
    count: number
    variant: string
}

interface Section {
    type: string
    label: string
    totalCount: number
    statusBreakdown: StatusBreakdown[]
}

interface MonthlyReviewData {
    financial: {
        revenue: number
        expenses: number
        result: number
    }
    sections: Section[]
}

interface MonthReviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    year: number
    month: number // 1-12
    onMonthChange: (month: number) => void
}

function formatSEK(amount: number): string {
    return amount.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + ' kr'
}

export function MonthReviewDialog({
    open,
    onOpenChange,
    year,
    month,
    onMonthChange,
}: MonthReviewDialogProps) {
    const [data, setData] = useState<MonthlyReviewData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [notesValue, setNotesValue] = useState("")
    const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const userEditingRef = useRef(false)

    const { getPeriod, toggleCheck, saveNotes, getResolvedChecks, getCheckProgress } = useMonthClosing()
    const period = getPeriod(year, month)

    // Is this month in the future?
    const now = new Date()
    const isFutureMonth = year > now.getFullYear() ||
        (year === now.getFullYear() && month > now.getMonth() + 1)

    // Load notes from period when month changes or when period data arrives
    const savedNotes = period.notes
    useEffect(() => {
        if (!userEditingRef.current) {
            setNotesValue(savedNotes || "")
        }
    }, [year, month, savedNotes])

    // Always reset editing flag and sync notes when switching months
    useEffect(() => {
        userEditingRef.current = false
        setNotesValue(savedNotes || "")
    }, [year, month]) // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch data when dialog opens or month changes
    const fetchData = useCallback(async () => {
        if (isFutureMonth) {
            setData(null)
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch(`/api/monthly-review?year=${year}&month=${month}`)
            if (!res.ok) throw new Error('Fetch failed')
            const json = await res.json()
            setData(json)
        } catch (err) {
            console.error('Failed to fetch monthly review:', err)
            setData(null)
        } finally {
            setIsLoading(false)
        }
    }, [year, month, isFutureMonth])

    useEffect(() => {
        if (open) {
            fetchData()
        }
    }, [open, fetchData])

    // Debounced notes save
    const handleNotesChange = (value: string) => {
        userEditingRef.current = true
        setNotesValue(value)
        if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
        notesTimerRef.current = setTimeout(() => {
            saveNotes(year, month, value)
            userEditingRef.current = false
        }, 500)
    }

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
        }
    }, [])

    const canGoPrev = month > 1
    const canGoNext = month < 12

    // Dynamic checks
    const resolvedChecks = getResolvedChecks(year, month)
    const progress = getCheckProgress(resolvedChecks)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={!canGoPrev}
                            onClick={() => onMonthChange(month - 1)}
                            className="h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <DialogTitle className="text-center min-w-[10rem]">
                            {MONTH_NAMES_SV[month - 1]} {year}
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={!canGoNext}
                            onClick={() => onMonthChange(month + 1)}
                            className="h-8 w-8"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogDescription className="sr-only">
                        Månadsöversikt för {MONTH_NAMES_SV[month - 1]} {year}
                    </DialogDescription>
                </DialogHeader>

                {/* Future month empty state */}
                {isFutureMonth && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <PixelDogStatic size={80} />
                        <p className="text-muted-foreground text-sm text-center">
                            Den här månaden har inte börjat ännu — kom tillbaka i {MONTH_NAMES_SV[month - 1]}!
                        </p>
                    </div>
                )}

                {/* Loading */}
                {!isFutureMonth && isLoading && (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Laddar...
                    </div>
                )}

                {/* Loaded content */}
                {!isFutureMonth && !isLoading && data && (
                    <div className="space-y-5">
                        {/* Financial summary */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
                                <div className="flex items-center justify-center gap-1 text-xs text-green-700 dark:text-green-400 mb-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Intäkter
                                </div>
                                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                                    {formatSEK(data.financial.revenue)}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-center">
                                <div className="flex items-center justify-center gap-1 text-xs text-red-600 dark:text-red-400 mb-1">
                                    <TrendingDown className="h-3 w-3" />
                                    Kostnader
                                </div>
                                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                    {formatSEK(data.financial.expenses)}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50 text-center">
                                <div className="text-xs text-muted-foreground mb-1">Resultat</div>
                                <p className={cn(
                                    "text-sm font-semibold",
                                    data.financial.result >= 0 ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                )}>
                                    {formatSEK(data.financial.result)}
                                </p>
                            </div>
                        </div>

                        {/* Data sections */}
                        {data.sections.length > 0 && (
                            <div className="space-y-3">
                                {data.sections.map((section) => (
                                    <div key={section.type} className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium min-w-[140px]">
                                            {section.label}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">
                                            {section.totalCount}
                                        </Badge>
                                        {section.statusBreakdown.map((sb) => (
                                            <span key={sb.status} className="flex items-center gap-1">
                                                <AppStatusBadge status={sb.status as AppStatus} size="sm" />
                                                <span className="text-xs text-muted-foreground">{sb.count}</span>
                                            </span>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {data.sections.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Ingen aktivitet registrerad för denna månad.
                            </p>
                        )}

                        {/* Notes */}
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                Anteckningar
                            </Label>
                            <Textarea
                                placeholder="Skriv anteckningar om denna månad..."
                                value={notesValue}
                                onChange={(e) => handleNotesChange(e.target.value)}
                                rows={3}
                                className="resize-none text-sm"
                            />
                        </div>

                        {/* Dynamic Checklist */}
                        <div>
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                                <FileCheck className="h-4 w-4" />
                                Avstämningskoll
                                <span className="text-xs text-muted-foreground font-normal">
                                    {progress.completed}/{progress.total}
                                </span>
                            </h4>
                            <div className="grid gap-2 grid-cols-2">
                                {resolvedChecks.map((check) => (
                                    <div key={check.id} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                        {check.type === 'manual' ? (
                                            <Checkbox
                                                id={`dlg-${check.id}-${month}`}
                                                checked={check.value}
                                                onCheckedChange={() => toggleCheck(year, month, check.id)}
                                            />
                                        ) : (
                                            <div className={cn(
                                                "h-4 w-4 rounded-[3px] border flex items-center justify-center shrink-0",
                                                check.value
                                                    ? "border-green-500 bg-green-50 dark:bg-green-950/40"
                                                    : "border-red-400 bg-red-50 dark:bg-red-950/40"
                                            )}>
                                                {check.value
                                                    ? <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                    : <X className="h-3 w-3 text-red-500 dark:text-red-400" />
                                                }
                                            </div>
                                        )}
                                        <Label
                                            htmlFor={check.type === 'manual' ? `dlg-${check.id}-${month}` : undefined}
                                            className={cn(
                                                "text-sm",
                                                check.type === 'manual' && "cursor-pointer"
                                            )}
                                        >
                                            {check.label}
                                            {check.type === 'auto' && (
                                                <Badge variant="outline" className="ml-1.5 text-[9px] py-0 px-1 font-normal">AUTO</Badge>
                                            )}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Stäng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
