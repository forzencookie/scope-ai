"use client"

import { useEffect } from 'react'
import { CheckCircle2, RefreshCw, Sparkles, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VerifikationCard } from './VerifikationCard'
import type { UseAutoVerifikationReturn } from './use-auto-verifikation'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AutoTabProps {
  hook: UseAutoVerifikationReturn
  onDone: (result: { booked: number; errors: number }) => void
}

// ---------------------------------------------------------------------------
// Loading skeletons
// ---------------------------------------------------------------------------

function ProposalSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-4 rounded" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="ml-8 space-y-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AutoTab({ hook, onDone }: AutoTabProps) {
  const {
    proposals,
    isLoading,
    error,
    acceptedIds,
    toggleAccept,
    acceptAll,
    rejectAll,
    updateProposal,
    confirmSelected,
    reanalyse,
    isConfirming,
  } = hook

  // Trigger analysis on mount
  useEffect(() => {
    if (proposals.length === 0 && !isLoading && !error) {
      reanalyse()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedCount = acceptedIds.size

  async function handleConfirm() {
    const result = await confirmSelected()
    onDone(result)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-pulse" />
          Skapar förslag med AI...
        </div>
        <ProposalSkeleton />
        <ProposalSkeleton />
        <ProposalSkeleton />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={reanalyse}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Försök igen
        </Button>
      </div>
    )
  }

  // Empty state
  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Inbox className="h-10 w-10 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium">Inga poster att bokföra</p>
          <p className="text-xs text-muted-foreground mt-1">
            Det finns inga väntande transaktioner, fakturor eller löner just nu.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={acceptAll}>
            Välj alla
          </Button>
          <Button variant="ghost" size="sm" onClick={rejectAll}>
            Avmarkera alla
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={reanalyse}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Analysera om
        </Button>
      </div>

      {/* Proposal cards */}
      <ScrollArea className="max-h-[55vh]">
        <div className="space-y-3 pr-3">
          {proposals.map((proposal) => (
            <VerifikationCard
              key={proposal.tempId}
              proposal={proposal}
              accepted={acceptedIds.has(proposal.tempId)}
              onToggleAccept={() => toggleAccept(proposal.tempId)}
              onUpdate={(updated) => updateProposal(proposal.tempId, updated)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t">
        <p className="text-sm text-muted-foreground">
          {selectedCount} av {proposals.length} valda
        </p>
        <Button
          onClick={handleConfirm}
          disabled={selectedCount === 0 || isConfirming}
        >
          {isConfirming ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Bokför...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Bokför {selectedCount} valda
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
