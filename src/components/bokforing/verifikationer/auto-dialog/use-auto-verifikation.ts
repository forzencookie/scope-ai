"use client"

import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePendingBookings, pendingBookingQueryKeys, postPendingBookingAction } from '@/hooks/use-pending-bookings'
import { useInvoices, useInvoicesPaginated } from '@/hooks/use-invoices'
import { useTransactionsByStatus } from '@/hooks/use-transactions-query'
import { TRANSACTION_STATUS_LABELS } from '@/lib/localization'
import { useCompany } from '@/providers/company-provider'
import type { VerificationEntry } from '@/services/verification-service'
import type { VerifikationProposal } from '@/app/api/verifikationer/auto/route'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PendingItemForAPI {
  type: 'pending_booking' | 'transaction' | 'customer_invoice' | 'supplier_invoice'
  id: string
  [key: string]: unknown
}

interface AutoVerifikationState {
  proposals: VerifikationProposal[]
  isLoading: boolean
  error: string | null
  acceptedIds: Set<string>
}

export interface UseAutoVerifikationReturn {
  proposals: VerifikationProposal[]
  isLoading: boolean
  error: string | null
  acceptedIds: Set<string>
  toggleAccept: (tempId: string) => void
  acceptAll: () => void
  rejectAll: () => void
  updateProposal: (tempId: string, updated: Partial<VerifikationProposal>) => void
  confirmSelected: () => Promise<{ booked: number; errors: number }>
  reanalyse: () => void
  isConfirming: boolean
  pendingCount: number
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAutoVerifikation(): UseAutoVerifikationReturn {
  const queryClient = useQueryClient()
  const { company } = useCompany()
  const accountingMethod = company?.accountingMethod || 'invoice'

  // Fetch pending bookings (pre-calculated entries: payslips, dividends, etc.)
  const { pendingBookings, pendingCount } = usePendingBookings()

  // Fetch unbooked transactions (status: "Att bokföra")
  const { transactions: unbookedTransactions } = useTransactionsByStatus(
    TRANSACTION_STATUS_LABELS.TO_RECORD as import('@/lib/status-types').TransactionStatus
  )

  // Fetch customer invoices
  const { invoices } = useInvoices()

  // Fetch supplier invoices
  const { supplierInvoices } = useInvoicesPaginated(100, 'leverantorsfakturor')

  const [state, setState] = useState<AutoVerifikationState>({
    proposals: [],
    isLoading: false,
    error: null,
    acceptedIds: new Set(),
  })
  const [isConfirming, setIsConfirming] = useState(false)

  // Build items array from all sources
  const buildItems = useCallback((): PendingItemForAPI[] => {
    const items: PendingItemForAPI[] = []

    // Track which source IDs already have pending bookings to avoid duplicates
    const pendingSourceIds = new Set(
      pendingBookings.map((pb) => `${pb.sourceType}:${pb.sourceId}`)
    )

    // 1. Pending bookings → pass through with pre-calculated entries
    for (const pb of pendingBookings) {
      items.push({
        type: 'pending_booking',
        id: pb.id,
        sourceType: pb.sourceType,
        description: pb.description,
        proposedEntries: pb.proposedEntries,
        proposedDate: pb.proposedDate,
        proposedSeries: pb.proposedSeries,
      })
    }

    // 2. Unbooked transactions (status: "Att bokföra")
    for (const tx of unbookedTransactions) {
      if (pendingSourceIds.has(`transaction:${tx.id}`)) continue
      items.push({
        type: 'transaction',
        id: tx.id,
        name: tx.name,
        amount: tx.amountValue,
        date: tx.date,
        description: tx.description,
      })
    }

    // 3. Unbooked customer invoices (status = 'Skickad')
    const customerInvoices = invoices.filter(
      (inv) => String(inv.status) === 'Skickad'
    )
    for (const inv of customerInvoices) {
      if (pendingSourceIds.has(`customer_invoice:${inv.id}`)) continue
      items.push({
        type: 'customer_invoice',
        id: inv.id,
        customerName: inv.customer || 'Okänd kund',
        totalAmount: typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount,
        vatRate: inv.vatAmount && inv.amount
          ? Math.round((inv.vatAmount / (inv.amount - inv.vatAmount)) * 100)
          : 25,
        date: inv.issueDate || new Date().toISOString().split('T')[0],
      })
    }

    // 4. Unbooked supplier invoices (status = 'mottagen' or 'attesterad')
    const unbookedSupplier = supplierInvoices.filter(
      (inv) => inv.status === 'Mottagen' || inv.status === 'Attesterad'
    )
    for (const inv of unbookedSupplier) {
      if (pendingSourceIds.has(`supplier_invoice:${inv.id}`)) continue
      items.push({
        type: 'supplier_invoice',
        id: inv.id,
        supplierName: inv.supplierName || 'Okänd leverantör',
        totalAmount: inv.totalAmount,
        vatRate: inv.vatAmount && inv.amount
          ? Math.round((inv.vatAmount / inv.amount) * 100)
          : 25,
        invoiceNumber: inv.invoiceNumber,
        date: inv.invoiceDate || new Date().toISOString().split('T')[0],
      })
    }

    return items
  }, [pendingBookings, unbookedTransactions, invoices, supplierInvoices])

  // Fetch AI proposals
  const analyse = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    const items = buildItems()

    if (items.length === 0) {
      setState({
        proposals: [],
        isLoading: false,
        error: null,
        acceptedIds: new Set(),
      })
      return
    }

    try {
      const res = await fetch('/api/verifikationer/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, accountingMethod }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const { proposals } = await res.json() as { proposals: VerifikationProposal[] }

      // Auto-accept high-confidence proposals
      const accepted = new Set<string>()
      for (const p of proposals) {
        if (p.confidence >= 80 && !p.needsReview) {
          accepted.add(p.tempId)
        }
      }

      setState({
        proposals,
        isLoading: false,
        error: null,
        acceptedIds: accepted,
      })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Något gick fel',
      }))
    }
  }, [buildItems, accountingMethod])

  // Toggle accept/reject a single proposal
  const toggleAccept = useCallback((tempId: string) => {
    setState((prev) => {
      const next = new Set(prev.acceptedIds)
      if (next.has(tempId)) {
        next.delete(tempId)
      } else {
        next.add(tempId)
      }
      return { ...prev, acceptedIds: next }
    })
  }, [])

  const acceptAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      acceptedIds: new Set(prev.proposals.map((p) => p.tempId)),
    }))
  }, [])

  const rejectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      acceptedIds: new Set(),
    }))
  }, [])

  // Edit a proposal inline
  const updateProposal = useCallback(
    (tempId: string, updated: Partial<VerifikationProposal>) => {
      setState((prev) => ({
        ...prev,
        proposals: prev.proposals.map((p) =>
          p.tempId === tempId ? { ...p, ...updated } : p
        ),
      }))
    },
    []
  )

  // Confirm and book selected proposals
  const confirmSelected = useCallback(async (): Promise<{ booked: number; errors: number }> => {
    setIsConfirming(true)
    let booked = 0
    let errors = 0

    const selected = state.proposals.filter((p) => state.acceptedIds.has(p.tempId))

    // Separate pending bookings (use existing batch endpoint) from others
    const pendingBookingIds: string[] = []
    const directBookings: VerifikationProposal[] = []

    for (const proposal of selected) {
      if (proposal.sourceType === 'pending_booking' || proposal.tempId.startsWith('pb-')) {
        // This is an existing pending booking — use the batch book endpoint
        pendingBookingIds.push(proposal.sourceId)
      } else {
        directBookings.push(proposal)
      }
    }

    // 1. Batch-book pending bookings
    if (pendingBookingIds.length > 0) {
      try {
        const result = await postPendingBookingAction({
          action: 'book-batch',
          ids: pendingBookingIds,
        }) as { booked: number; errors: Array<{ id: string; error: string }> }
        booked += result.booked
        errors += result.errors.length
      } catch {
        errors += pendingBookingIds.length
      }
    }

    // 2. For AI-categorized items (transactions, invoices), create pending booking first then book
    for (const proposal of directBookings) {
      try {
        // Create a pending booking from the AI proposal
        const entries: VerificationEntry[] = proposal.entries.map((e) => ({
          account: e.account,
          debit: e.debit,
          credit: e.credit,
          description: e.description,
        }))

        const createRes = await fetch('/api/pending-bookings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceType: proposal.sourceType,
            sourceId: proposal.sourceId,
            description: proposal.description,
            entries,
            series: proposal.series,
            date: proposal.date,
          }),
        })

        if (!createRes.ok) {
          errors++
          continue
        }

        const { id: pbId } = await createRes.json()

        // Now book it
        await postPendingBookingAction({
          action: 'book',
          id: pbId,
          finalEntries: entries,
        })
        booked++
      } catch {
        errors++
      }
    }

    // Invalidate all related queries
    queryClient.invalidateQueries({ queryKey: pendingBookingQueryKeys.all })
    queryClient.invalidateQueries({ queryKey: ['verifications'] })
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })

    // Remove booked proposals from state
    setState((prev) => ({
      ...prev,
      proposals: prev.proposals.filter((p) => !prev.acceptedIds.has(p.tempId)),
      acceptedIds: new Set(),
    }))

    setIsConfirming(false)
    return { booked, errors }
  }, [state.proposals, state.acceptedIds, queryClient])

  return {
    proposals: state.proposals,
    isLoading: state.isLoading,
    error: state.error,
    acceptedIds: state.acceptedIds,
    toggleAccept,
    acceptAll,
    rejectAll,
    updateProposal,
    confirmSelected,
    reanalyse: analyse,
    isConfirming,
    pendingCount,
  }
}
