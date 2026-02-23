"use client"

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText } from 'lucide-react'

interface ReferenceMeetingStepProps {
  meetingReference: string | null
  onSetReference: (ref: string | null) => void
}

/**
 * Wizard step: Enter reference to stämmoprotokoll (shareholder meeting protocol).
 * Required for dividend decisions per ABL.
 */
export function ReferenceMeetingStep({
  meetingReference,
  onSetReference,
}: ReferenceMeetingStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Ange referens till det stämmoprotokoll där utdelningsbeslutet fattades. Detta krävs för
        BFL-efterlevnad.
      </div>

      <div className="space-y-2">
        <Label className="gap-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          Stämmoprotokolls-referens
        </Label>
        <Input
          placeholder="t.ex. Årsstämma 2026-03-15, § 7"
          value={meetingReference || ''}
          onChange={(e) => onSetReference(e.target.value || null)}
        />
      </div>
    </div>
  )
}
