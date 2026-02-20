"use client"

import { CreditCard } from "lucide-react"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"

// ============================================================================
// BankStep - Bank integration (coming soon placeholder)
// ============================================================================

export function BankStep() {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="p-8 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.03]">
        <CreditCard className="h-10 w-10 text-white/30 mx-auto mb-4" />
        <h3 className="font-medium mb-2 text-white">Bankintegration kommer snart</h3>
        <p className="text-sm text-white/40 mb-4">
          Vi arbetar på att erbjuda säker bankintegration.
          Under tiden kan du importera transaktioner och SIE-filer manuellt.
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 text-white/40 border border-white/10">
          <ScopeAILogo className="h-3 w-3 text-white/40" />
          Kommer snart
        </span>
      </div>
    </div>
  )
}
