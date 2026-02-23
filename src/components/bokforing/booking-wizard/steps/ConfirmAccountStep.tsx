"use client"

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'
import type { VerificationEntry } from '@/services/verification-service'
import { basAccounts } from '@/data/accounts'

interface ConfirmAccountStepProps {
  entries: VerificationEntry[]
  onUpdateEntry: (index: number, account: string) => void
}

/**
 * Wizard step: Confirm or change BAS accounts for proposed entries.
 * Shows each entry line with editable account selection.
 */
export function ConfirmAccountStep({ entries, onUpdateEntry }: ConfirmAccountStepProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Find the first entry that likely needs account confirmation
  // (the one that's not a standard bank/tax/liability account)
  const editableEntries = entries.filter((e) => {
    const num = parseInt(e.account, 10)
    // Skip standard contra accounts (bank, tax, liability)
    return !(num === 1930 || num === 2610 || num === 2620 || num === 2630 || num === 2640)
  })

  const filteredAccounts = useMemo(() => {
    if (!searchQuery) return basAccounts.slice(0, 20)
    const q = searchQuery.toLowerCase()
    return basAccounts.filter(
      (acc) =>
        acc.number.includes(q) ||
        acc.name.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [searchQuery])

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Bekräfta eller ändra konto för konteringen. AI har föreslagit konton baserat på transaktionens beskrivning.
      </div>

      {/* Current entries preview */}
      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Konteringsförslag
        </div>
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="font-mono text-xs">{entry.account}</span>
            <span className="text-muted-foreground flex-1 mx-2 truncate">
              {entry.description || ''}
            </span>
            <div className="flex gap-4 text-right">
              {entry.debit > 0 && (
                <span className="text-green-700 dark:text-green-400">
                  {entry.debit.toLocaleString('sv-SE')} kr D
                </span>
              )}
              {entry.credit > 0 && (
                <span className="text-red-700 dark:text-red-400">
                  {entry.credit.toLocaleString('sv-SE')} kr K
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Account search/edit for editable entries */}
      {editableEntries.length > 0 && (
        <div className="space-y-3">
          <Label className="gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            Ändra konto
          </Label>
          <Input
            placeholder="Sök kontonummer eller namn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <div className="max-h-48 overflow-y-auto rounded-md border bg-popover">
              {filteredAccounts.map((acc) => (
                <button
                  key={acc.number}
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                  onClick={() => {
                    // Update the first editable entry
                    const idx = entries.findIndex((e) => editableEntries.includes(e))
                    if (idx >= 0) {
                      onUpdateEntry(idx, acc.number)
                      setSearchQuery('')
                    }
                  }}
                >
                  <span className="font-mono text-xs w-12">{acc.number}</span>
                  <span>{acc.name}</span>
                </button>
              ))}
              {filteredAccounts.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Inga konton hittades
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
