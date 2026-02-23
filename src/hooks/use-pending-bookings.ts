"use client"

import { useCallback, useState } from 'react'
import { useCachedQuery, invalidateCacheByPrefix } from './use-cached-query'
import type { VerificationEntry } from '@/services/verification-service'

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

export interface PendingBooking {
  id: string
  sourceType: PendingBookingSourceType
  sourceId: string
  description: string
  proposedEntries: VerificationEntry[]
  proposedSeries: string
  proposedDate: string
  status: 'pending' | 'booked' | 'dismissed'
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

async function postPendingBookingAction(body: Record<string, unknown>) {
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
  const cacheKey = sourceType ? `pending-bookings-${sourceType}` : 'pending-bookings'

  const { data, isLoading, error, invalidate } = useCachedQuery({
    cacheKey,
    queryFn: () => fetchPendingBookings(sourceType),
    ttlMs: 2 * 60 * 1000, // 2 minutes — pending bookings change frequently
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

  // Book a single item (optionally with wizard-adjusted entries)
  const bookItem = useCallback(
    async (id: string, finalEntries?: VerificationEntry[]) => {
      const result = await postPendingBookingAction({
        action: 'book',
        id,
        finalEntries,
      })
      invalidateCacheByPrefix('pending-bookings')
      invalidateCacheByPrefix('verifications')
      await invalidate()
      return result as { verificationId: string; verificationNumber: string }
    },
    [invalidate]
  )

  // Batch book multiple items
  const bookItems = useCallback(
    async (ids: string[]) => {
      const result = await postPendingBookingAction({
        action: 'book-batch',
        ids,
      })
      invalidateCacheByPrefix('pending-bookings')
      invalidateCacheByPrefix('verifications')
      await invalidate()
      return result as { booked: number; errors: Array<{ id: string; error: string }> }
    },
    [invalidate]
  )

  // Dismiss items
  const dismissItems = useCallback(
    async (ids: string[]) => {
      await postPendingBookingAction({
        action: 'dismiss',
        ids,
      })
      invalidateCacheByPrefix('pending-bookings')
      await invalidate()
    },
    [invalidate]
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
    invalidate,

    // Wizard state
    wizardState,
    openWizard,
    openWizardForSource,
    closeWizard,
  }
}
