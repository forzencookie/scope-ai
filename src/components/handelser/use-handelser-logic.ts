"use client"

import { useState, useMemo, useCallback } from "react"
import { useEvents } from "@/hooks/use-events"
import type { CorporateActionType } from "@/types/events"

// View types — Phase 6 restructure: 4 tabs → 3 tabs
export type ViewType = "oversikt" | "canvas" | "arkiv"

// Available years
const currentYear = new Date().getFullYear()
export const availableYears = [currentYear, currentYear - 1, currentYear - 2]

export interface UseHandelserLogicReturn {
    // Data
    yearEvents: ReturnType<typeof useEvents>["events"]

    // State
    activeView: ViewType
    selectedYear: number
    calendarMonth: number
    wizardOpen: boolean
    selectedDay: Date | null

    // Loading
    isGlobalLoading: boolean

    // Actions
    setActiveView: (view: ViewType) => void
    setSelectedYear: (year: number) => void
    setCalendarMonth: (month: number) => void
    setWizardOpen: (open: boolean) => void
    setSelectedDay: (day: Date | null) => void
    handleActionComplete: (actionType: CorporateActionType) => void
    emitUser: ReturnType<typeof useEvents>["emitUser"]
}

export function useHandelserLogic(): UseHandelserLogicReturn {
    const { events: allEvents, emitUser, isLoading: isGlobalLoading } = useEvents()

    // View state
    const [activeView, setActiveView] = useState<ViewType>("oversikt")
    const [selectedYear, setSelectedYear] = useState(currentYear)
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
    const [wizardOpen, setWizardOpen] = useState(false)
    const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())

    const handleActionComplete = useCallback((actionType: CorporateActionType) => {
        emitUser('created', `Ny bolagsåtgärd: ${actionType}`, 'bolagsåtgärd', {
            metadata: { actionType, status: 'draft' }
        })
    }, [emitUser])

    // Filter events by year for Calendar
    const yearEvents = useMemo(() => {
        return allEvents.filter(e => e.timestamp.getFullYear() === selectedYear)
    }, [allEvents, selectedYear])

    return {
        yearEvents,
        activeView,
        selectedYear,
        calendarMonth,
        wizardOpen,
        selectedDay,
        isGlobalLoading,
        setActiveView,
        setSelectedYear,
        setCalendarMonth,
        setWizardOpen,
        setSelectedDay,
        handleActionComplete,
        emitUser,
    }
}
