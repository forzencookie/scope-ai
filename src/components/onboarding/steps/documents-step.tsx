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
            "w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5",
            index === 0 ? "border-primary bg-primary/5" : "border-border"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            index === 0 ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {index === 0 ? <FileText className="h-5 w-5" /> :
              index === 1 ? <span>@</span> : <ArrowRight className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-medium">{option.label}</p>
            <p className="text-sm text-muted-foreground">{option.description}</p>
          </div>
          {index === 0 && <Check className="h-5 w-5 text-primary ml-auto" />}
        </button>
      ))}
    </div>
  )
}
