"use client"

import { Percent, Receipt } from "lucide-react"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"
import { cn } from "@/lib/utils"

// ============================================================================
// WelcomeStep - Initial welcome with feature highlights
// ============================================================================

const features = [
  { icon: Percent, label: "Automatiserad moms" },
  { icon: ScopeAILogo, label: "AI-bokföring", color: "text-stone-900" },
  { icon: Receipt, label: "Kvittohantering" },
]

export function WelcomeStep() {
  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="grid grid-cols-3 gap-4">
        {features.map((feature) => (
          <div 
            key={feature.label} 
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <feature.icon className={cn("h-6 w-6", feature.color || "text-primary")} />
            <span className="text-sm text-center">{feature.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
