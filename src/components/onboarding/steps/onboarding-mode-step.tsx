"use client"

import { UploadCloud } from "lucide-react"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"

// ============================================================================
// OnboardingModeStep - Choose between new or existing company
// ============================================================================

interface OnboardingModeStepProps {
  onSelectMode: (mode: "fresh" | "existing") => void
}

export function OnboardingModeStep({ onSelectMode }: OnboardingModeStepProps) {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
      <button
        className="p-6 rounded-lg border-2 border-primary bg-primary/5 text-left hover:bg-primary/10 transition-colors"
        onClick={() => onSelectMode("fresh")}
      >
        <ScopeAILogo className="h-8 w-8 text-stone-900 mb-3" />
        <h3 className="font-semibold mb-1">Nystartat företag</h3>
        <p className="text-sm text-muted-foreground">Börja från noll med en ren bokföring</p>
      </button>
      <button
        className="p-6 rounded-lg border-2 border-border text-left hover:border-primary hover:bg-primary/5 transition-colors"
        onClick={() => onSelectMode("existing")}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground mb-3" />
        <h3 className="font-semibold mb-1">Befintligt företag</h3>
        <p className="text-sm text-muted-foreground">Importera från annat bokföringssystem</p>
      </button>
    </div>
  )
}
