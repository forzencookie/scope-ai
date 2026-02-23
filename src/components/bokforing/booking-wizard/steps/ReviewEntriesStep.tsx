"use client"

import { CheckCircle2, AlertTriangle } from 'lucide-react'
import type { VerificationEntry } from '@/services/verification-service'

interface ReviewEntriesStepProps {
  entries: VerificationEntry[]
  description: string
  date: string
  series: string
}

/**
 * Wizard step: Review all proposed journal entry lines before booking.
 * Shows a table of entries with debit/credit columns and balance check.
 */
export function ReviewEntriesStep({ entries, description, date, series }: ReviewEntriesStepProps) {
  const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0)
  const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Serie</span>
          <span className="font-mono">{series}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Datum</span>
          <span>{date}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Beskrivning</span>
          <span className="truncate ml-4">{description}</span>
        </div>
      </div>

      {/* Entry lines table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Konto</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Beskrivning</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Debet</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Kredit</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{entry.account}</td>
                <td className="px-3 py-2 text-muted-foreground">{entry.description || ''}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {entry.debit > 0 ? entry.debit.toLocaleString('sv-SE', { minimumFractionDigits: 2 }) : ''}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {entry.credit > 0 ? entry.credit.toLocaleString('sv-SE', { minimumFractionDigits: 2 }) : ''}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 font-medium">
              <td className="px-3 py-2" colSpan={2}>
                Summa
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {totalDebit.toLocaleString('sv-SE', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {totalCredit.toLocaleString('sv-SE', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Balance status */}
      <div
        className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
          isBalanced
            ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
            : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
        }`}
      >
        {isBalanced ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Verifikationen balanserar
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4" />
            Verifikationen balanserar inte (diff: {Math.abs(totalDebit - totalCredit).toFixed(2)} kr)
          </>
        )}
      </div>
    </div>
  )
}
