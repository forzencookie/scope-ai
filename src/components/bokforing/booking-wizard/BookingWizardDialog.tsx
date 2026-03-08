"use client"

import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Receipt,
  FileText,
  Banknote,
  Users,
  ArrowRightLeft,
  Bot,
} from 'lucide-react'
import type { VerificationEntry } from '@/services/verification-service'
import type { PendingBookingSourceType } from '@/hooks/use-pending-bookings'
import { useBookingWizard } from './use-booking-wizard'
import { ConfirmAccountStep } from './steps/ConfirmAccountStep'
import { ReviewEntriesStep } from './steps/ReviewEntriesStep'
import { ConfirmEquityStep } from './steps/ConfirmEquityStep'
import { ReferenceMeetingStep } from './steps/ReferenceMeetingStep'
import { fetchAiBookingSuggestion } from '@/lib/ai-suggestion'
import { useCompany } from '@/providers/company-provider'

// =============================================================================
// Props
// =============================================================================

export interface BookingWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceType: PendingBookingSourceType | null
  sourceId: string
  sourceData: Record<string, unknown>
  pendingBookingId?: string
  proposedEntries?: VerificationEntry[]
  proposedDate?: string
  proposedSeries?: string
  proposedDescription?: string
  initialMode?: 'info' | 'wizard'
  onBooked?: (verificationId: string, verificationNumber: string) => void
  onDismiss?: () => void
}

// =============================================================================
// Source type display helpers
// =============================================================================

const SOURCE_TYPE_LABELS: Record<PendingBookingSourceType, string> = {
  payslip: 'Lönespecifikation',
  customer_invoice: 'Kundfaktura',
  supplier_invoice: 'Leverantörsfaktura',
  invoice_payment: 'Fakturabetalning',
  transaction: 'Transaktion',
  dividend_decision: 'Utdelningsbeslut',
  dividend_payment: 'Utdelningsbetalning',
  owner_withdrawal: 'Ägaruttag',
  ai_entry: 'AI-genererad',
  egenavgifter: 'Egenavgifter',
}

const SOURCE_TYPE_ICONS: Record<PendingBookingSourceType, typeof BookOpen> = {
  payslip: Users,
  customer_invoice: FileText,
  supplier_invoice: Receipt,
  invoice_payment: Banknote,
  transaction: ArrowRightLeft,
  dividend_decision: Banknote,
  dividend_payment: Banknote,
  owner_withdrawal: ArrowRightLeft,
  ai_entry: Bot,
  egenavgifter: Banknote,
}

// =============================================================================
// Component
// =============================================================================

export function BookingWizardDialog({
  open,
  onOpenChange,
  sourceType,
  sourceId,
  sourceData,
  pendingBookingId,
  proposedEntries = [],
  proposedDate = '',
  proposedSeries = 'A',
  proposedDescription = '',
  initialMode = 'info',
  onBooked,
  onDismiss,
}: BookingWizardDialogProps) {
  const [isBooking, setIsBooking] = useState(false)
  const [aiSuggestedAccount, setAiSuggestedAccount] = useState<string | null>(null)
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false)
  const { company } = useCompany()
  const accountingMethod = company?.accountingMethod || 'invoice'

  const wizard = useBookingWizard(sourceType, sourceData, proposedEntries)

  // Fetch AI suggestion for transactions when dialog opens
  useEffect(() => {
    if (!open || sourceType !== 'transaction') {
      setAiSuggestedAccount(null)
      return
    }

    const name = sourceData.description as string || sourceData.name as string || ''
    const txAmount = sourceData.amount as string | number || 0
    const txDate = sourceData.date as string || ''
    const txId = sourceId

    if (!name && !txAmount) return

    let cancelled = false
    setAiSuggestionLoading(true)
    setAiSuggestedAccount(null)

    fetchAiBookingSuggestion({ id: txId, name, amount: txAmount, date: txDate })
      .then((suggestion) => {
        if (!cancelled && suggestion?.account) {
          setAiSuggestedAccount(suggestion.account)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAiSuggestionLoading(false)
      })

    return () => { cancelled = true }
  }, [open, sourceType, sourceId, sourceData])

  // Set initial mode when dialog opens
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen && initialMode === 'wizard') {
        wizard.startWizard()
      }
      if (!newOpen) {
        wizard.reset()
      }
      onOpenChange(newOpen)
    },
    [initialMode, onOpenChange, wizard]
  )

  // Book the pending item
  const handleBook = useCallback(async () => {
    if (!pendingBookingId) return
    setIsBooking(true)
    try {
      const { postPendingBookingAction } = await import('@/hooks/use-pending-bookings')
      const data = await postPendingBookingAction({
        action: 'book',
        id: pendingBookingId,
        finalEntries: wizard.entries,
        accountingMethod,
      })

      wizard.setComplete({
        id: data.verificationId,
        number: data.verificationNumber,
      })
      onBooked?.(data.verificationId, data.verificationNumber)
    } catch (err) {
      console.error('[BookingWizard] booking error:', err)
    } finally {
      setIsBooking(false)
    }
  }, [pendingBookingId, wizard, onBooked])

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    onDismiss?.()
    onOpenChange(false)
  }, [onDismiss, onOpenChange])

  if (!sourceType) return null

  const Icon = SOURCE_TYPE_ICONS[sourceType] || BookOpen
  const label = SOURCE_TYPE_LABELS[sourceType] || sourceType

  const description = (sourceData.description as string) || proposedDescription
  const amount = Number(sourceData.amount ?? 0)
  const date = (sourceData.date as string) || proposedDate

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {wizard.mode === 'complete' ? 'Bokförd' : label}
          </DialogTitle>
        </DialogHeader>

        {/* ---- INFO MODE ---- */}
        {wizard.mode === 'info' && (
          <div className="space-y-4">
            {/* Entity summary */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              {description && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Beskrivning</span>
                  <span className="font-medium truncate ml-4">{description}</span>
                </div>
              )}
              {amount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Belopp</span>
                  <span className="font-medium">
                    {amount.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                  </span>
                </div>
              )}
              {date && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Datum</span>
                  <span>{date}</span>
                </div>
              )}
              {!!sourceData.counterparty && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Motpart</span>
                  <span>{String(sourceData.counterparty)}</span>
                </div>
              )}
            </div>

            {/* Proposed entries preview */}
            {proposedEntries.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Föreslagen kontering
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  {proposedEntries.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs">{entry.account}</span>
                      <span className="text-muted-foreground flex-1 mx-2 truncate">
                        {entry.description || ''}
                      </span>
                      <span className="tabular-nums">
                        {entry.debit > 0
                          ? `${entry.debit.toLocaleString('sv-SE')} D`
                          : `${entry.credit.toLocaleString('sv-SE')} K`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- WIZARD MODE ---- */}
        {wizard.mode === 'wizard' && wizard.currentStep && (
          <div className="space-y-4">
            {/* Step indicator */}
            {wizard.totalSteps > 1 && (
              <div className="flex items-center gap-2">
                {wizard.steps.map((step, i) => (
                  <div key={step.id} className="flex items-center gap-1">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        i < wizard.currentStepIndex
                          ? 'bg-green-500'
                          : i === wizard.currentStepIndex
                            ? 'bg-primary'
                            : 'bg-muted-foreground/30'
                      }`}
                    />
                    {i < wizard.steps.length - 1 && (
                      <div className="h-px w-4 bg-muted-foreground/30" />
                    )}
                  </div>
                ))}
                <span className="ml-2 text-xs text-muted-foreground">
                  Steg {wizard.currentStepIndex + 1} av {wizard.totalSteps}
                </span>
              </div>
            )}

            {/* Step title */}
            <div>
              <div className="font-medium text-sm">{wizard.currentStep.label}</div>
              <div className="text-xs text-muted-foreground">{wizard.currentStep.description}</div>
            </div>

            {/* Step content */}
            {wizard.currentStep.id === 'confirm-account' && (
              <ConfirmAccountStep
                entries={wizard.entries}
                onUpdateEntry={wizard.updateEntryAccount}
                aiSuggestedAccount={aiSuggestedAccount ?? undefined}
                aiSuggestionLoading={aiSuggestionLoading}
              />
            )}

            {wizard.currentStep.id === 'review-entries' && (
              <ReviewEntriesStep
                entries={wizard.entries}
                description={description}
                date={date}
                series={proposedSeries}
              />
            )}

            {wizard.currentStep.id === 'confirm-equity' && (
              <ConfirmEquityStep
                equityConfirmed={wizard.equityConfirmed}
                onConfirm={wizard.confirmEquity}
                dividendAmount={amount}
                metadata={sourceData as Record<string, unknown>}
              />
            )}

            {wizard.currentStep.id === 'reference-meeting' && (
              <ReferenceMeetingStep
                meetingReference={wizard.meetingReference}
                onSetReference={wizard.setMeetingReference}
              />
            )}
          </div>
        )}

        {/* ---- COMPLETE MODE ---- */}
        {wizard.mode === 'complete' && wizard.verificationResult && (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div className="text-center space-y-1">
              <div className="font-medium">Verifikation skapad</div>
              <Badge variant="secondary" className="font-mono">
                {wizard.verificationResult.number}
              </Badge>
            </div>
          </div>
        )}

        {/* ---- FOOTER ---- */}
        <DialogFooter>
          {wizard.mode === 'info' && (
            <>
              <Button variant="outline" onClick={handleDismiss}>
                Senare
              </Button>
              {pendingBookingId && proposedEntries.length > 0 && (
                <Button onClick={() => wizard.startWizard()}>
                  <BookOpen className="h-4 w-4 mr-1" />
                  Bokför
                </Button>
              )}
            </>
          )}

          {wizard.mode === 'wizard' && (
            <>
              {wizard.currentStepIndex > 0 ? (
                <Button variant="outline" onClick={wizard.prevStep}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Tillbaka
                </Button>
              ) : (
                <Button variant="outline" onClick={handleDismiss}>
                  Avbryt
                </Button>
              )}

              {wizard.isLastStep ? (
                <Button onClick={handleBook} disabled={isBooking}>
                  {isBooking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Bokför...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Bekräfta & bokför
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={wizard.nextStep}>
                  Nästa
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </>
          )}

          {wizard.mode === 'complete' && (
            <Button onClick={() => onOpenChange(false)}>Stäng</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
