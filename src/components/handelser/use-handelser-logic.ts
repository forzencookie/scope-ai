"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useEvents, useEventsPaginated } from "@/hooks/use-events"
import { countEventsByQuarter, type Quarter } from "@/components/handelser"
import type { EventSource, CorporateActionType } from "@/types/events"

// View types
export type ViewType = "folders" | "timeline" | "calendar" | "roadmap"

// Available years for the dropdown
const currentYear = new Date().getFullYear()
export const availableYears = [currentYear, currentYear - 1, currentYear - 2]

export interface UseHandelserLogicReturn {
    // Data
    allEvents: ReturnType<typeof useEvents>["events"]
    yearEvents: ReturnType<typeof useEvents>["events"]
    paginatedEvents: ReturnType<typeof useEventsPaginated>["events"]
    paginatedTotalCount: number
    groupedPaginatedEvents: Record<string, ReturnType<typeof useEvents>["events"]>
    countsBySource: ReturnType<typeof useEvents>["countsBySource"]
    quarterCounts: ReturnType<typeof countEventsByQuarter>
    dateLabels: Record<string, string>
    
    // State
    activeView: ViewType
    selectedYear: number
    selectedQuarter: Quarter | null
    calendarMonth: number
    activeFilter: EventSource | null
    showFilters: boolean
    wizardOpen: boolean
    
    // Pagination
    page: number
    pageSize: number
    
    // Loading
    isGlobalLoading: boolean
    isPaginationLoading: boolean
    
    // Actions
    setActiveView: (view: ViewType) => void
    setSelectedYear: (year: number) => void
    setSelectedQuarter: (quarter: Quarter | null) => void
    setCalendarMonth: (month: number) => void
    setActiveFilter: (filter: EventSource | null) => void
    setShowFilters: (show: boolean) => void
    setWizardOpen: (open: boolean) => void
    setPage: (page: number) => void
    handleSelectQuarter: (quarter: Quarter) => void
    handleBackToFolders: () => void
    handleActionComplete: (actionType: CorporateActionType) => void
    emitUser: ReturnType<typeof useEvents>["emitUser"]
}

export function useHandelserLogic(): UseHandelserLogicReturn {
    // Keep useEvents for Folders (needs counts) and Calendar
    const { events: allEvents, countsBySource, emitUser, isLoading: isGlobalLoading } = useEvents()

    // View state
    const [activeView, setActiveView] = useState<ViewType>("folders")
    const [selectedYear, setSelectedYear] = useState(currentYear)
    const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null)
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())

    // Filter state
    const [activeFilter, setActiveFilter] = useState<EventSource | null>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [wizardOpen, setWizardOpen] = useState(false)

    // Handle completing a corporate action from the wizard
    const handleActionComplete = useCallback((actionType: CorporateActionType) => {
        emitUser('created', `Ny bolagsåtgärd: ${actionType}`, 'bolagsåtgärd', {
            metadata: { actionType, status: 'draft' }
        })
    }, [emitUser])

    // Calculate variables for pagination hook
    const paginationFilters = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filters: any = {}

        // Source filter
        if (activeFilter) {
            filters.source = activeFilter
        }

        // Date filters
        if (selectedQuarter) {
            // Quarter specific filtering
            const quarterMap: Record<Quarter, number> = {
                "Q1": 0, "Q2": 3, "Q3": 6, "Q4": 9
            }
            const startMonth = quarterMap[selectedQuarter]
            filters.dateFrom = new Date(selectedYear, startMonth, 1)
            filters.dateTo = new Date(selectedYear, startMonth + 3, 0, 23, 59, 59)
        } else {
            // Full year filtering
            filters.dateFrom = new Date(selectedYear, 0, 1)
            filters.dateTo = new Date(selectedYear, 11, 31, 23, 59, 59)
        }

        return filters
    }, [selectedYear, selectedQuarter, activeFilter])

    // Paginated events for Timeline view
    const {
        events: paginatedEvents,
        totalCount: paginatedTotalCount,
        page,
        setPage,
        pageSize,
        isLoading: isPaginationLoading
    } = useEventsPaginated(25, paginationFilters)

    // Filter events by year for Calendar/Folders
    const yearEvents = useMemo(() => {
        return allEvents.filter(e => e.timestamp.getFullYear() === selectedYear)
    }, [allEvents, selectedYear])

    // Count events by quarter for folder view
    const quarterCounts = useMemo(() => {
        return countEventsByQuarter(allEvents, selectedYear)
    }, [allEvents, selectedYear])

    // Group paginated events by date for timeline view
    const groupedPaginatedEvents = useMemo(() => {
        return paginatedEvents.reduce((groups, event) => {
            const date = event.timestamp.toLocaleDateString('sv-SE')
            if (!groups[date]) {
                groups[date] = []
            }
            groups[date].push(event)
            return groups
        }, {} as Record<string, typeof paginatedEvents>)
    }, [paginatedEvents])

    const dateLabels = useMemo(() => {
        const now = new Date()
        const oneDayMs = 86400000
        return {
            [now.toLocaleDateString('sv-SE')]: 'Idag',
            [new Date(now.getTime() - oneDayMs).toLocaleDateString('sv-SE')]: 'Igår',
        }
    }, [])

    // Handle quarter selection
    const handleSelectQuarter = useCallback((quarter: Quarter) => {
        setSelectedQuarter(quarter)
        setActiveView("timeline") // Switch to timeline when drilling into a quarter
    }, [])

    // Handle back to folders
    const handleBackToFolders = useCallback(() => {
        setSelectedQuarter(null)
        setActiveView("folders")
    }, [])

    return {
        // Data
        allEvents,
        yearEvents,
        paginatedEvents,
        paginatedTotalCount,
        groupedPaginatedEvents,
        countsBySource,
        quarterCounts,
        dateLabels,
        
        // State
        activeView,
        selectedYear,
        selectedQuarter,
        calendarMonth,
        activeFilter,
        showFilters,
        wizardOpen,
        
        // Pagination
        page,
        pageSize,
        
        // Loading
        isGlobalLoading,
        isPaginationLoading,
        
        // Actions
        setActiveView,
        setSelectedYear,
        setSelectedQuarter,
        setCalendarMonth,
        setActiveFilter,
        setShowFilters,
        setWizardOpen,
        setPage,
        handleSelectQuarter,
        handleBackToFolders,
        handleActionComplete,
        emitUser,
    }
}
