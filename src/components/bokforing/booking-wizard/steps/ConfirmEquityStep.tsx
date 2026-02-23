"use client"

import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConfirmEquityStepProps {
  equityConfirmed: boolean
  onConfirm: () => void
  dividendAmount?: number
  metadata?: Record<string, unknown> | null
}

/**
 * Wizard step: Verify distributable equity before booking a dividend (ABL compliance).
 * Shows equity breakdown and requires explicit confirmation.
 */
export function ConfirmEquityStep({
  equityConfirmed,
  onConfirm,
  dividendAmount = 0,
  metadata,
}: ConfirmEquityStepProps) {
  const freeEquity = Number(metadata?.freeEquity ?? 0)
  const hasEnoughEquity = freeEquity >= dividendAmount

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-700 dark:text-blue-400">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          Enligt aktiebolagslagen (ABL 17 kap 3 §) måste bolaget ha tillräckligt med fritt eget
          kapital (balanserat resultat + årets resultat) för att kunna besluta om utdelning.
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Föreslagen utdelning</span>
          <span className="font-medium">{dividendAmount.toLocaleString('sv-SE')} kr</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fritt eget kapital</span>
          <span className="font-medium">{freeEquity.toLocaleString('sv-SE')} kr</span>
        </div>
        <hr />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          {hasEnoughEquity ? (
            <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tillräckligt
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Otillräckligt
            </span>
          )}
        </div>
      </div>

      {!equityConfirmed && hasEnoughEquity && (
        <Button onClick={onConfirm} className="w-full">
          Bekräfta att fritt eget kapital räcker
        </Button>
      )}

      {equityConfirmed && (
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 rounded-lg px-3 py-2">
          <CheckCircle2 className="h-4 w-4" />
          Eget kapital bekräftat — gå vidare
        </div>
      )}

      {!hasEnoughEquity && (
        <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4" />
          Utdelningen överstiger fritt eget kapital. Kan inte bokföras.
        </div>
      )}
    </div>
  )
}
