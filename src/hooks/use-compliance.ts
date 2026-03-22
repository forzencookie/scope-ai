"use client"

import { useAsync, useAsyncMutation } from "./use-async"
import { useAuth } from "./use-auth"
import { shareholderService, type Shareholder } from "@/services/corporate/shareholder-service"
import { boardService, type CompanyMeeting } from "@/services/corporate/board-service"
import { type GeneralMeeting } from "@/types/ownership"

export type { Shareholder, CompanyMeeting, GeneralMeeting }

export function useCompliance() {
    const { user } = useAuth()
    const userId = user?.id

    // Fetch Documents (Meetings)
    const {
        data: documents,
        isLoading: isLoadingDocs,
        error: docsError,
        refetch: refetchDocs
    } = useAsync(
        async () => {
            const { meetings } = await boardService.getCompanyMeetings()
            return meetings
        },
        [] as CompanyMeeting[],
        [userId]
    )

    // Fetch Shareholders
    const {
        data: shareholders,
        isLoading: isLoadingShareholders,
        error: shareholdersError,
        refetch: refetchShareholders
    } = useAsync(
        async () => {
            const { shareholders } = await shareholderService.getShareholders()
            return shareholders
        },
        [] as Shareholder[],
        [userId]
    )

    // Add Document Mutation
    const addDocumentMutation = useAsyncMutation(
        async (doc: { 
            title: string; 
            type: 'board' | 'annual' | 'extraordinary' | 'general_meeting_minutes'; 
            meetingCategory?: 'bolagsstamma' | 'styrelsemote';
            date: string; 
            location?: string;
            content?: string;
            status?: string;
            source?: string;
        }) => {
            const result = await boardService.createMeeting({
                title: doc.title,
                type: (doc.type === 'board' ? 'board_meeting_minutes' : 'general_meeting_minutes'),
                meetingCategory: doc.meetingCategory,
                date: doc.date,
                location: doc.location,
                status: doc.status,
            })
            refetchDocs()
            return result
        }
    )

    // Update Document Mutation
    const updateDocumentMutation = useAsyncMutation(
        async ({ id, ...updates }: Partial<GeneralMeeting> & { id: string }) => {
            await boardService.updateMeeting(id, updates)
            refetchDocs()
            return { id, ...updates }
        }
    )

    // Update Shareholder Mutation
    const updateShareholderMutation = useAsyncMutation(
        async ({ id, ...updates }: Partial<Shareholder> & { id: string }) => {
            // Note: Service missing updateShareholder, would add here or use direct pattern if needed
            // For now, keeping it mapped to the service layer standard
            const { createBrowserClient } = await import('@/lib/database/client')
            const supabase = createBrowserClient()
            const { data, error } = await supabase.from('shareholders').update(updates).eq('id', id).select().single()
            if (error) throw error
            refetchShareholders()
            return data
        }
    )

    // Add Shareholder Mutation
    const addShareholderMutation = useAsyncMutation(
        async (params: { name: string; personalOrOrgNumber: string; sharesCount: number; shareClass?: 'A' | 'B' }) => {
            const result = await shareholderService.addShareholder(params)
            refetchShareholders()
            return result
        }
    )

    return {
        documents,
        isLoadingDocuments: isLoadingDocs,
        docsError,
        refetchDocs,
        shareholders,
        isLoadingShareholders,
        shareholdersError,
        refetchShareholders,
        addDocument: addDocumentMutation.execute,
        isAddingDoc: addDocumentMutation.isLoading,
        updateDocument: updateDocumentMutation.execute,
        isUpdatingDoc: updateDocumentMutation.isLoading,
        updateShareholder: updateShareholderMutation.execute,
        isUpdatingShareholder: updateShareholderMutation.isLoading,
        addShareholder: addShareholderMutation.execute,
        isAddingShareholder: addShareholderMutation.isLoading,
    }
}
