"use client"

import { useCallback, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { VerificationEntry } from '@/types'

// =============================================================================
// Types
// =============================================================================

export type PendingBookingSourceType =
  | 'payslip'
  | 'customer_invoice'
  | 'supplier_invoice'
  | 'invoice_payment'
  | 'transaction'
  | 'dividend_decision'
  | 'dividend_payment'
  | 'owner_withdrawal'
  | 'ai_entry'
  | 'egenavgifter'

export interface PendingBooking {
  id: string
  sourceType: PendingBookingSourceType
  sourceId: string
  description: string
  proposedEntries: VerificationEntry[]
  proposedSeries: string
  proposedDate: string
  status: 'Väntande' | 'Bokförd' | 'Avfärdad'
  createdAt: string
  bookedAt: string | null
  verificationId: string | null
  metadata: Record<string, unknown> | null
}

interface WizardState {
  open: boolean
  pendingBookingId: string | null
  sourceType: PendingBookingSourceType | null
  sourceId: string | null
  sourceData: Record<string, unknown>
}

// =============================================================================
// Query Keys
// =============================================================================

export const pendingBookingQueryKeys = {
  all: ['pending-bookings'] as const,
  list: (sourceType?: PendingBookingSourceType) =>
    [...pendingBookingQueryKeys.all, 'list', sourceType] as const,
}

// =============================================================================
// API helpers
// =============================================================================

async function fetchPendingBookings(sourceType?: PendingBookingSourceType): Promise<{
  bookings: PendingBooking[]
  pendingCount: number
}> {
  const params = new URLSearchParams()
  if (sourceType) params.set('source_type', sourceType)

  const res = await fetch(`/api/pending-bookings?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch pending bookings')
  return res.json()
}

export async function postPendingBookingAction(body: Record<string, unknown>) {
  const res = await fetch('/api/pending-bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(data.error || 'Action failed')
  }
  return res.json()
}

// =============================================================================
// Hook
// =============================================================================

export function usePendingBookings(sourceType?: PendingBookingSourceType) {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: pendingBookingQueryKeys.list(sourceType),
    queryFn: () => fetchPendingBookings(sourceType),
    staleTime: 2 * 60 * 1000,
  })

  const [wizardState, setWizardState] = useState<WizardState>({
    open: false,
    pendingBookingId: null,
    sourceType: null,
    sourceId: null,
    sourceData: {},
  })

  const pendingBookings = data?.bookings || []
  const pendingCount = data?.pendingCount || 0

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: pendingBookingQueryKeys.all })
    queryClient.invalidateQueries({ queryKey: ['verifications'] })
  }, [queryClient])

  // Book a single item (optionally with wizard-adjusted entries)
  const bookItemMutation = useMutation({
    mutationFn: async ({ id, finalEntries }: { id: string; finalEntries?: VerificationEntry[] }) => {
      return postPendingBookingAction({ action: 'book', id, finalEntries }) as Promise<{
        verificationId: string
        verificationNumber: string
      }>
    },
    onSuccess: () => invalidateAll(),
  })

  const bookItem = useCallback(
    async (id: string, finalEntries?: VerificationEntry[]) => {
      return bookItemMutation.mutateAsync({ id, finalEntries })
    },
    [bookItemMutation]
  )

  // Batch book multiple items
  const bookItemsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return postPendingBookingAction({ action: 'book-batch', ids }) as Promise<{
        booked: number
        errors: Array<{ id: string; error: string }>
      }>
    },
    onSuccess: () => invalidateAll(),
  })

  const bookItems = useCallback(
    async (ids: string[]) => {
      return bookItemsMutation.mutateAsync(ids)
    },
    [bookItemsMutation]
  )

  // Dismiss items
  const dismissMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await postPendingBookingAction({ action: 'dismiss', ids })
    },
    onSuccess: () => invalidateAll(),
  })

  const dismissItems = useCallback(
    async (ids: string[]) => {
      await dismissMutation.mutateAsync(ids)
    },
    [dismissMutation]
  )

  // Open the booking wizard for a pending item
  const openWizard = useCallback(
    (pendingBookingId: string, sourceData?: Record<string, unknown>) => {
      const booking = pendingBookings.find((b) => b.id === pendingBookingId)
      setWizardState({
        open: true,
        pendingBookingId,
        sourceType: booking?.sourceType || null,
        sourceId: booking?.sourceId || null,
        sourceData: sourceData || {},
      })
    },
    [pendingBookings]
  )

  // Open wizard for a fresh action (from post-action popup)
  const openWizardForSource = useCallback(
    (params: {
      pendingBookingId: string
      sourceType: PendingBookingSourceType
      sourceId: string
      sourceData?: Record<string, unknown>
    }) => {
      setWizardState({
        open: true,
        pendingBookingId: params.pendingBookingId,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        sourceData: params.sourceData || {},
      })
    },
    []
  )

  const closeWizard = useCallback(() => {
    setWizardState({
      open: false,
      pendingBookingId: null,
      sourceType: null,
      sourceId: null,
      sourceData: {},
    })
  }, [])

  return {
    // Data
    pendingBookings,
    pendingCount,
    isLoading,
    error,

    // Actions
    bookItem,
    bookItems,
    dismissItems,
    invalidate: refetch,

    // Wizard state
    wizardState,
    openWizard,
    openWizardForSource,
    closeWizard,
  }
}
