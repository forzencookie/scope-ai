"use client"

import { CreditCard } from "lucide-react"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"

// ============================================================================
// BankStep - Bank integration (coming soon placeholder)
// ============================================================================

export function BankStep() {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="p-6 rounded-lg border-2 border-dashed border-border bg-muted/30">
        <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium mb-2">Bankintegration kommer snart</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Vi arbetar på att erbjuda säker bankintegration.
          Under tiden kan du importera transaktioner och SIE-filer manuellt.
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
          <ScopeAILogo className="h-3 w-3 text-stone-900" />
          Kommer snart
        </span>
      </div>
    </div>
  )
}
