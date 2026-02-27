"use client"

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { VerifikationProposal } from '@/app/api/verifikationer/auto/route'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VerifikationCardProps {
  proposal: VerifikationProposal
  accepted: boolean
  onToggleAccept: () => void
  onUpdate: (updated: Partial<VerifikationProposal>) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SERIES_LABELS: Record<string, string> = {
  A: 'Försäljning',
  B: 'Inköp',
  L: 'Lön',
}

function confidenceColor(confidence: number): string {
  if (confidence >= 90) return 'text-green-600'
  if (confidence >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

function confidenceDot(confidence: number): string {
  if (confidence >= 90) return 'bg-green-500'
  if (confidence >= 70) return 'bg-yellow-500'
  return 'bg-red-500'
}

function formatSEK(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VerifikationCard({
  proposal,
  accepted,
  onToggleAccept,
  onUpdate,
}: VerifikationCardProps) {
  const [showReasoning, setShowReasoning] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editEntries, setEditEntries] = useState(proposal.entries)

  const totalDebit = proposal.entries.reduce((sum, e) => sum + e.debit, 0)
  const totalCredit = proposal.entries.reduce((sum, e) => sum + e.credit, 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  function handleSaveEdit() {
    onUpdate({ entries: editEntries })
    setIsEditing(false)
  }

  function handleCancelEdit() {
    setEditEntries(proposal.entries)
    setIsEditing(false)
  }

  function updateEntry(index: number, field: 'account' | 'debit' | 'credit' | 'description', value: string | number) {
    setEditEntries((prev) =>
      prev.map((e, i) =>
        i === index ? { ...e, [field]: field === 'debit' || field === 'credit' ? Number(value) || 0 : value } : e
      )
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        accepted ? 'border-primary/40 bg-primary/5' : 'border-border bg-card',
        proposal.needsReview && 'border-yellow-500/40'
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={accepted}
          onCheckedChange={onToggleAccept}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">{proposal.date}</span>
            <Badge variant="outline" className="text-xs">
              {proposal.series} — {SERIES_LABELS[proposal.series] || proposal.series}
            </Badge>
            <div className="flex items-center gap-1">
              <div className={cn('h-2 w-2 rounded-full', confidenceDot(proposal.confidence))} />
              <span className={cn('text-xs', confidenceColor(proposal.confidence))}>
                {proposal.confidence}%
              </span>
            </div>
            {proposal.needsReview && (
              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                Behöver granskas
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium mt-1">{proposal.description}</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="shrink-0"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Entries table */}
      <div className="mt-3 ml-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs">
              <th className="text-left py-1 font-normal">Konto</th>
              <th className="text-left py-1 font-normal">Beskrivning</th>
              <th className="text-right py-1 font-normal">Debet</th>
              <th className="text-right py-1 font-normal">Kredit</th>
            </tr>
          </thead>
          <tbody>
            {(isEditing ? editEntries : proposal.entries).map((entry, i) => (
              <tr key={i} className="border-t border-border/50">
                {isEditing ? (
                  <>
                    <td className="py-1 pr-2">
                      <Input
                        value={entry.account}
                        onChange={(e) => updateEntry(i, 'account', e.target.value)}
                        className="h-7 text-sm w-20"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <Input
                        value={entry.description || ''}
                        onChange={(e) => updateEntry(i, 'description', e.target.value)}
                        className="h-7 text-sm"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <Input
                        type="number"
                        value={entry.debit || ''}
                        onChange={(e) => updateEntry(i, 'debit', e.target.value)}
                        className="h-7 text-sm w-24 text-right"
                      />
                    </td>
                    <td className="py-1">
                      <Input
                        type="number"
                        value={entry.credit || ''}
                        onChange={(e) => updateEntry(i, 'credit', e.target.value)}
                        className="h-7 text-sm w-24 text-right"
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-1 pr-2 font-mono text-xs">{entry.account}</td>
                    <td className="py-1 pr-2 text-muted-foreground">{entry.description || '—'}</td>
                    <td className="py-1 text-right tabular-nums">
                      {entry.debit > 0 ? formatSEK(entry.debit) : ''}
                    </td>
                    <td className="py-1 text-right tabular-nums">
                      {entry.credit > 0 ? formatSEK(entry.credit) : ''}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-medium">
              <td colSpan={2} className="py-1 text-xs text-muted-foreground">
                Summa
                {!isBalanced && (
                  <span className="text-red-600 ml-2">Obalanserad!</span>
                )}
              </td>
              <td className="py-1 text-right tabular-nums text-xs">{formatSEK(totalDebit)}</td>
              <td className="py-1 text-right tabular-nums text-xs">{formatSEK(totalCredit)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Edit actions */}
        {isEditing && (
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
              <X className="h-3.5 w-3.5 mr-1" /> Avbryt
            </Button>
            <Button size="sm" onClick={handleSaveEdit}>
              <Check className="h-3.5 w-3.5 mr-1" /> Spara
            </Button>
          </div>
        )}

        {/* AI reasoning (collapsible) */}
        {proposal.reasoning && (
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-foreground transition-colors"
          >
            {showReasoning ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            AI-motivering
          </button>
        )}
        {showReasoning && (
          <p className="text-xs text-muted-foreground mt-1 pl-4 border-l-2 border-muted">
            {proposal.reasoning}
          </p>
        )}
      </div>
    </div>
  )
}
