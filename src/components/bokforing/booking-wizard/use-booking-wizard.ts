"use client"

import { useState, useMemo, useCallback } from 'react'
import type { VerificationEntry } from '@/services/verification-service'
import type { PendingBookingSourceType } from '@/hooks/use-pending-bookings'

// =============================================================================
// Types
// =============================================================================

export type WizardStep =
  | 'confirm-account'
  | 'match-transaction'
  | 'upload-underlag'
  | 'review-entries'
  | 'confirm-equity'
  | 'reference-meeting'

export type WizardMode = 'info' | 'wizard' | 'complete'

export interface WizardStepConfig {
  id: WizardStep
  label: string
  description: string
}

export interface BookingWizardState {
  mode: WizardMode
  currentStepIndex: number
  steps: WizardStepConfig[]
  entries: VerificationEntry[]
  selectedAccount: string | null
  matchedTransactionId: string | null
  uploadedUnderlagId: string | null
  equityConfirmed: boolean
  meetingReference: string | null
  verificationResult: { id: string; number: string } | null
}

// =============================================================================
// Step resolution — determine which steps the wizard needs
// =============================================================================

function resolveSteps(
  sourceType: PendingBookingSourceType,
  sourceData: Record<string, unknown>
): WizardStepConfig[] {
  const steps: WizardStepConfig[] = []

  switch (sourceType) {
    case 'transaction':
      // Bank transactions: just need account confirmation (bank statement = underlag)
      steps.push({
        id: 'confirm-account',
        label: 'Bekräfta konto',
        description: 'Bekräfta eller ändra BAS-konto för transaktionen',
      })
      break

    case 'payslip':
      // Payslips: all 5 entry lines pre-built, just review
      steps.push({
        id: 'review-entries',
        label: 'Granska kontering',
        description: 'Granska de automatiskt skapade kontolinjerna',
      })
      break

    case 'customer_invoice':
      // Customer invoices: accounts pre-filled (1510/3001/2610), review
      steps.push({
        id: 'review-entries',
        label: 'Granska kontering',
        description: 'Granska fakturans kontolinjer',
      })
      break

    case 'supplier_invoice':
      // Supplier invoices: need expense account selection
      steps.push({
        id: 'confirm-account',
        label: 'Välj kostnadskonto',
        description: 'Välj BAS-konto för kostnaden',
      })
      break

    case 'invoice_payment':
      // Invoice payment: just confirm bank account (usually 1930)
      steps.push({
        id: 'review-entries',
        label: 'Bekräfta betalning',
        description: 'Bekräfta betalningskontering',
      })
      break

    case 'dividend_decision':
      // Dividend: check equity + meeting reference + review
      steps.push({
        id: 'confirm-equity',
        label: 'Kontrollera eget kapital',
        description: 'Verifiera att utdelningsbart belopp räcker (ABL)',
      })
      steps.push({
        id: 'reference-meeting',
        label: 'Stämmoprotokoll',
        description: 'Ange referens till stämmoprotokoll',
      })
      steps.push({
        id: 'review-entries',
        label: 'Granska kontering',
        description: 'Granska utdelningskontering',
      })
      break

    case 'dividend_payment':
      // Dividend payment: just confirm
      steps.push({
        id: 'review-entries',
        label: 'Bekräfta utbetalning',
        description: 'Bekräfta utdelningsbetalning',
      })
      break

    case 'owner_withdrawal':
      // Owner withdrawal: confirm account
      steps.push({
        id: 'confirm-account',
        label: 'Bekräfta konto',
        description: 'Bekräfta konto för ägaruttag',
      })
      break

    case 'ai_entry':
      // AI-generated: review entries
      steps.push({
        id: 'review-entries',
        label: 'Granska kontering',
        description: 'Granska AI-genererad kontering',
      })
      break

    default:
      steps.push({
        id: 'review-entries',
        label: 'Granska kontering',
        description: 'Granska kontolinjer',
      })
  }

  // If source has no attachment/receipt and needs underlag, add upload step
  // (For receipts that lack a matching transaction, add match step)
  if (sourceType === 'transaction' && !sourceData.hasReceipt) {
    // Optional: upload underlag step for transactions without receipts
    // Skip for now — bank statement (kontoutdrag) counts as underlag
  }

  return steps
}

// =============================================================================
// Hook
// =============================================================================

export function useBookingWizard(
  sourceType: PendingBookingSourceType | null,
  sourceData: Record<string, unknown>,
  proposedEntries: VerificationEntry[]
) {
  const [state, setState] = useState<BookingWizardState>(() => ({
    mode: 'info',
    currentStepIndex: 0,
    steps: [],
    entries: proposedEntries,
    selectedAccount: null,
    matchedTransactionId: null,
    uploadedUnderlagId: null,
    equityConfirmed: false,
    meetingReference: null,
    verificationResult: null,
  }))

  // Resolve steps based on source type
  const steps = useMemo(() => {
    if (!sourceType) return []
    return resolveSteps(sourceType, sourceData)
  }, [sourceType, sourceData])

  const currentStep = steps[state.currentStepIndex] || null
  const isLastStep = state.currentStepIndex >= steps.length - 1
  const totalSteps = steps.length

  // Start the wizard flow (transition from info → wizard)
  const startWizard = useCallback(() => {
    setState((prev) => ({
      ...prev,
      mode: 'wizard',
      currentStepIndex: 0,
      steps,
      entries: proposedEntries,
    }))
  }, [steps, proposedEntries])

  // Go to next step
  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStepIndex: Math.min(prev.currentStepIndex + 1, steps.length - 1),
    }))
  }, [steps.length])

  // Go to previous step
  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStepIndex: Math.max(prev.currentStepIndex - 1, 0),
    }))
  }, [])

  // Update entries (e.g., after account selection changes)
  const updateEntries = useCallback((entries: VerificationEntry[]) => {
    setState((prev) => ({ ...prev, entries }))
  }, [])

  // Update a specific entry's account
  const updateEntryAccount = useCallback(
    (index: number, account: string) => {
      setState((prev) => {
        const newEntries = [...prev.entries]
        if (newEntries[index]) {
          newEntries[index] = { ...newEntries[index], account }
        }
        return { ...prev, entries: newEntries }
      })
    },
    []
  )

  // Set selected account (for confirm-account step)
  const setSelectedAccount = useCallback((account: string | null) => {
    setState((prev) => ({ ...prev, selectedAccount: account }))
  }, [])

  // Set matched transaction (for match-transaction step)
  const setMatchedTransactionId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, matchedTransactionId: id }))
  }, [])

  // Set uploaded underlag (for upload-underlag step)
  const setUploadedUnderlagId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, uploadedUnderlagId: id }))
  }, [])

  // Confirm equity check (for dividend)
  const confirmEquity = useCallback(() => {
    setState((prev) => ({ ...prev, equityConfirmed: true }))
  }, [])

  // Set meeting reference (for dividend)
  const setMeetingReference = useCallback((ref: string | null) => {
    setState((prev) => ({ ...prev, meetingReference: ref }))
  }, [])

  // Mark as complete (after successful booking)
  const setComplete = useCallback(
    (result: { id: string; number: string }) => {
      setState((prev) => ({
        ...prev,
        mode: 'complete',
        verificationResult: result,
      }))
    },
    []
  )

  // Reset wizard state
  const reset = useCallback(() => {
    setState({
      mode: 'info',
      currentStepIndex: 0,
      steps: [],
      entries: proposedEntries,
      selectedAccount: null,
      matchedTransactionId: null,
      uploadedUnderlagId: null,
      equityConfirmed: false,
      meetingReference: null,
      verificationResult: null,
    })
  }, [proposedEntries])

  return {
    // State
    mode: state.mode,
    currentStep,
    currentStepIndex: state.currentStepIndex,
    totalSteps,
    isLastStep,
    entries: state.entries,
    selectedAccount: state.selectedAccount,
    matchedTransactionId: state.matchedTransactionId,
    uploadedUnderlagId: state.uploadedUnderlagId,
    equityConfirmed: state.equityConfirmed,
    meetingReference: state.meetingReference,
    verificationResult: state.verificationResult,
    steps,

    // Actions
    startWizard,
    nextStep,
    prevStep,
    updateEntries,
    updateEntryAccount,
    setSelectedAccount,
    setMatchedTransactionId,
    setUploadedUnderlagId,
    confirmEquity,
    setMeetingReference,
    setComplete,
    reset,
  }
}
