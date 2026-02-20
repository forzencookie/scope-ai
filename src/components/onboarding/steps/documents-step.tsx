"use client"

import { FileText, Check, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OnboardingStep } from "../types"

// ============================================================================
// DocumentsStep - Upload receipts and invoices
// ============================================================================

interface DocumentsStepProps {
  step: OnboardingStep
}

export function DocumentsStep({ step }: DocumentsStepProps) {
  if (!step.options) return null

  return (
    <div className="space-y-3 max-w-md mx-auto">
      {step.options.map((option, index) => (
        <button
          key={option.label}
          className={cn(
            "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
            index === 0
              ? "border-white/20 bg-white/[0.06] hover:bg-white/[0.1]"
              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            index === 0 ? "bg-white text-black" : "bg-white/10 text-white/50"
          )}>
            {index === 0 ? <FileText className="h-5 w-5" /> :
              index === 1 ? <span>@</span> : <ArrowRight className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-medium text-white">{option.label}</p>
            <p className="text-sm text-white/40">{option.description}</p>
          </div>
          {index === 0 && <Check className="h-5 w-5 text-white/60 ml-auto" />}
        </button>
      ))}
    </div>
  )
}
