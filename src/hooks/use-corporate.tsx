"use client"

import * as React from "react"
import { GeneralMeeting, GeneralMeetingDecision } from "@/types/ownership"

interface CorporateContextType {
    meetings: GeneralMeeting[]
    addMeeting: (meeting: Omit<GeneralMeeting, "id">) => void
    updateMeetingStatus: (id: string, status: GeneralMeeting["status"]) => void
    addDecision: (meetingId: string, decision: Omit<GeneralMeetingDecision, "id">) => void
    updateDecision: (meetingId: string, decisionId: string, updates: Partial<GeneralMeetingDecision>) => void
}

const CorporateContext = React.createContext<CorporateContextType | undefined>(undefined)

export function CorporateProvider({ children }: { children: React.ReactNode }) {
    const [meetings, setMeetings] = React.useState<GeneralMeeting[]>([])

    const addMeeting = React.useCallback((meeting: Omit<GeneralMeeting, "id">) => {
        const newMeeting: GeneralMeeting = {
            ...meeting,
            id: `gm-${Math.random().toString(36).substr(2, 9)}`,
            status: 'kallad', // Always start as planned/called
            decisions: [],
            attendeesCount: 0,
        }
        setMeetings(prev => [newMeeting, ...prev])
    }, [])

    const updateMeetingStatus = React.useCallback((id: string, status: GeneralMeeting["status"]) => {
        setMeetings(prev => prev.map(m =>
            m.id === id ? { ...m, status } : m
        ))
    }, [])

    const addDecision = React.useCallback((meetingId: string, decision: Omit<GeneralMeetingDecision, "id">) => {
        const newDecision: GeneralMeetingDecision = {
            ...decision,
            id: `gmd-${Math.random().toString(36).substr(2, 9)}`
        }

        setMeetings(prev => prev.map(m => {
            if (m.id === meetingId) {
                return {
                    ...m,
                    decisions: [...m.decisions, newDecision]
                }
            }
            return m
        }))
    }, [])

    const updateDecision = React.useCallback((meetingId: string, decisionId: string, updates: Partial<GeneralMeetingDecision>) => {
        setMeetings(prev => prev.map(m => {
            if (m.id === meetingId) {
                return {
                    ...m,
                    decisions: m.decisions.map(d =>
                        d.id === decisionId ? { ...d, ...updates } : d
                    )
                }
            }
            return m
        }))
    }, [])

    const value = React.useMemo(() => ({
        meetings,
        addMeeting,
        updateMeetingStatus,
        addDecision,
        updateDecision,
    }), [meetings, addMeeting, updateMeetingStatus, addDecision, updateDecision])

    return (
        <CorporateContext.Provider value={value}>
            {children}
        </CorporateContext.Provider>
    )

}

export function useCorporate() {
    const context = React.useContext(CorporateContext)
    if (context === undefined) {
        throw new Error("useCorporate must be used within a CorporateProvider")
    }
    return context
}
