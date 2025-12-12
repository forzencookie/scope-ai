"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date())

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"]

    const daysInMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
    ).getDate()

    const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
    ).getDay()

    const today = new Date()
    const isCurrentMonth =
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    }

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    }

    // Generate calendar grid cells
    const cells = []

    // Empty cells for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
        cells.push(<div key={`empty-${i}`} className="border-r border-b border-gray-100 min-h-[80px]" />)
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = isCurrentMonth && day === today.getDate()
        cells.push(
            <Link
                key={day}
                href="/dashboard/daily-journal"
                className={`border-r border-b border-gray-100 min-h-[80px] p-2 transition-colors hover:bg-gray-50 group relative cursor-pointer ${isToday ? "bg-gray-50" : ""
                    }`}
            >
                <span className={`text-sm font-medium ${isToday
                    ? "bg-black text-white w-6 h-6 flex items-center justify-center rounded-full"
                    : "text-gray-700"
                    }`}>
                    {day}
                </span>
            </Link>
        )
    }

    // Fill remaining grid cells to complete the last row (optional, for cleaner look)
    const totalCells = firstDayOfMonth + daysInMonth
    const remainingCells = 7 - (totalCells % 7)
    if (remainingCells < 7) {
        for (let i = 0; i < remainingCells; i++) {
            cells.push(<div key={`remaining-${i}`} className="border-r border-b border-gray-100 min-h-[80px]" />)
        }
    }

    return (
        <div className="flex flex-col h-full w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={goToPreviousMonth}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={goToNextMonth}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-gray-100">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="py-3 text-center text-sm font-medium text-gray-500 border-r border-gray-100 last:border-r-0">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 flex-1 border-l border-t border-gray-100">
                {cells}
            </div>
        </div>
    )
}
