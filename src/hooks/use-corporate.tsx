"use client"

import { useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { boardService, CompanyMeeting } from "@/services/corporate/board-service"

export function useCorporate() {
    const queryClient = useQueryClient()

    // Fetch all meetings from the database
    const {
        data: meetings = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['corporate-meetings'],
        queryFn: async () => {
            const result = await boardService.getCompanyMeetings()
            return result.meetings
        },
        staleTime: 5 * 60 * 1000,
    })

    // Mutation to add a meeting
    const addMeetingMutation = useMutation({
        mutationFn: async (meeting: { 
            title: string; 
            type: 'board' | 'annual' | 'extraordinary'; 
            date: string;
            location?: string;
        }) => {
            return await boardService.createMeeting({
                title: meeting.title,
                type: meeting.type === 'board' ? 'board_meeting_minutes' : 'general_meeting_minutes',
                date: meeting.date,
                location: meeting.location,
                status: 'draft'
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['corporate-meetings'] })
        }
    })

    // Mutation to update meeting status
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: CompanyMeeting["status"] }) => {
            return await boardService.updateMeeting(id, { status })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['corporate-meetings'] })
        }
    })

    const addMeeting = useCallback(async (meeting: { 
        title: string; 
        type: 'board' | 'annual' | 'extraordinary'; 
        date: string;
        location?: string;
    }) => {
        return await addMeetingMutation.mutateAsync(meeting)
    }, [addMeetingMutation])

    const updateMeetingStatus = useCallback(async (id: string, status: CompanyMeeting["status"]) => {
        return await updateStatusMutation.mutateAsync({ id, status })
    }, [updateStatusMutation])

    return {
        meetings,
        isLoading,
        error,
        addMeeting,
        updateMeetingStatus,
        refresh: refetch,
    }
}
