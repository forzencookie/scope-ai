"use client"

import { UploadCloud } from "lucide-react"
import { ScopeAILogo } from "@/components/ui"

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
        className="p-6 rounded-xl bg-white/[0.06] border-2 border-white/20 text-left hover:bg-white/[0.1] hover:border-white/30 transition-all"
        onClick={() => onSelectMode("fresh")}
      >
        <ScopeAILogo className="h-8 w-8 text-white/60 mb-3" />
        <h3 className="font-medium text-white mb-1">Nystartat företag</h3>
        <p className="text-sm text-white/40">Börja från noll med en ren bokföring</p>
      </button>
      <button
        className="p-6 rounded-xl bg-white/[0.04] border-2 border-white/10 text-left hover:bg-white/[0.08] hover:border-white/20 transition-all"
        onClick={() => onSelectMode("existing")}
      >
        <UploadCloud className="h-8 w-8 text-white/40 mb-3" />
        <h3 className="font-medium text-white mb-1">Befintligt företag</h3>
        <p className="text-sm text-white/40">Importera från annat bokföringssystem</p>
      </button>
    </div>
  )
}
