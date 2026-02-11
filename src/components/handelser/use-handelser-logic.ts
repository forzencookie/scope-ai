"use client"

import { useState, useMemo, useCallback } from "react"
import { useEvents } from "@/hooks/use-events"
import type { CorporateActionType } from "@/types/events"

// View types
export type ViewType = "calendar" | "roadmap" | "activity" | "manadsavslut"

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

    // Loading
    isGlobalLoading: boolean

    // Actions
    setActiveView: (view: ViewType) => void
    setSelectedYear: (year: number) => void
    setCalendarMonth: (month: number) => void
    setWizardOpen: (open: boolean) => void
    handleActionComplete: (actionType: CorporateActionType) => void
    emitUser: ReturnType<typeof useEvents>["emitUser"]
}

export function useHandelserLogic(): UseHandelserLogicReturn {
    const { events: allEvents, emitUser, isLoading: isGlobalLoading } = useEvents()

    // View state
    const [activeView, setActiveView] = useState<ViewType>("manadsavslut")
    const [selectedYear, setSelectedYear] = useState(currentYear)
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
    const [wizardOpen, setWizardOpen] = useState(false)

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
        isGlobalLoading,
        setActiveView,
        setSelectedYear,
        setCalendarMonth,
        setWizardOpen,
        handleActionComplete,
        emitUser,
    }
}
