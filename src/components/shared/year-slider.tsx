"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface YearSliderProps {
    year: number
    onYearChange: (year: number) => void
    minYear?: number
    maxYear?: number
    /** Optional label to show next to year (e.g., fiscal year range) */
    label?: string
}

export function YearSlider({
    year,
    onYearChange,
    minYear = new Date().getFullYear() - 5,
    maxYear = new Date().getFullYear(),
    label,
}: YearSliderProps) {
    return (
        <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={year <= minYear}
                onClick={() => onYearChange(year - 1)}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[4ch] text-center tabular-nums">
                {label || year}
            </span>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={year >= maxYear}
                onClick={() => onYearChange(year + 1)}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
