"use client"

import { useAsync, useAsyncMutation } from "./use-async"
import { useAuth } from "./use-auth"

export interface CorporateDocument {
    id: string
    created_at: string
    type: 'board_meeting_minutes' | 'general_meeting_minutes' | 'shareholder_register'
    title: string
    date: string
    content: string
    status: 'draft' | 'signed' | 'archived'
    source: 'manual' | 'ai'
}

export interface Shareholder {
    id: string
    name: string
    ssn_org_nr: string
    shares_count: number
    shares_percentage: number
    share_class?: 'A' | 'B'
}

export function useCompliance() {
    const { user } = useAuth()
    const userId = user?.id

    // Fetch Documents
    const {
        data: documents,
        isLoading: isLoadingDocs,
        error: docsError,
        refetch: refetchDocs
    } = useAsync(
        async () => {
            const res = await fetch('/api/compliance?type=documents')
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to fetch documents')
            return json.data as CorporateDocument[]
        },
        [] as CorporateDocument[],
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
            const res = await fetch('/api/compliance?type=shareholders')
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to fetch shareholders')
            if (!json.data || json.data.length === 0) {
                return [] as Shareholder[]
            }
            return json.data as Shareholder[]
        },
        [] as Shareholder[],
        [userId]
    )

    // Add Document Mutation
    const addDocumentMutation = useAsyncMutation(
        async (doc: Partial<CorporateDocument>) => {
            const res = await fetch('/api/compliance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'document', ...doc, created_by: userId })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to add document')
            refetchDocs()
            return json.data as CorporateDocument
        }
    )

    // Update Shareholder Mutation
    const updateShareholderMutation = useAsyncMutation(
        async ({ id, ...updates }: Partial<Shareholder> & { id: string }) => {
            const res = await fetch('/api/compliance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'shareholder_update', id, ...updates })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to update shareholder')
            refetchShareholders()
            return json.data as Shareholder
        }
    )

    // Add Shareholder Mutation
    const addShareholderMutation = useAsyncMutation(
        async (shareholder: Partial<Shareholder>) => {
            const res = await fetch('/api/compliance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'shareholder_create', ...shareholder })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to add shareholder')
            refetchShareholders()
            return json.data as Shareholder
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
        updateShareholder: updateShareholderMutation.execute,
        isUpdatingShareholder: updateShareholderMutation.isLoading,
        addShareholder: addShareholderMutation.execute,
        isAddingShareholder: addShareholderMutation.isLoading,
    }
}
