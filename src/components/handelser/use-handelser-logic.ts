"use client"

import { useState, useCallback } from "react"
import { useEvents } from "@/hooks/use-events"
import type { CorporateActionType } from "@/types/events"

// Available years
const currentYear = new Date().getFullYear()
export const availableYears = [currentYear, currentYear - 1, currentYear - 2]

export interface UseHandelserLogicReturn {
    // State
    selectedYear: number
    wizardOpen: boolean

    // Loading
    isGlobalLoading: boolean

    // Actions
    setSelectedYear: (year: number) => void
    setWizardOpen: (open: boolean) => void
    handleActionComplete: (actionType: CorporateActionType) => void
    emitUser: ReturnType<typeof useEvents>["emitUser"]
}

export function useHandelserLogic(): UseHandelserLogicReturn {
    const { emitUser, isLoading: isGlobalLoading } = useEvents()

    const [selectedYear, setSelectedYear] = useState(currentYear)
    const [wizardOpen, setWizardOpen] = useState(false)

    const handleActionComplete = useCallback((actionType: CorporateActionType) => {
        emitUser('created', `Ny bolagsåtgärd: ${actionType}`, 'bolagsåtgärd', {
            metadata: { actionType, status: 'draft' }
        })
    }, [emitUser])

    return {
        selectedYear,
        wizardOpen,
        isGlobalLoading,
        setSelectedYear,
        setWizardOpen,
        handleActionComplete,
        emitUser,
    }
}
