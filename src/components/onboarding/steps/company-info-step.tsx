"use client"

import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { OnboardingStep } from "../types"

// ============================================================================
// CompanyInfoStep - Company details with Bolagsverket lookup
// ============================================================================

interface CompanyInfoStepProps {
  step: OnboardingStep
}

export function CompanyInfoStep({ step }: CompanyInfoStepProps) {
  if (!step.fields) return null

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      {step.fields.map((field) => (
        <div key={field.label}>
          <label className="text-sm font-medium mb-1.5 block">{field.label}</label>
          <input
            type="text"
            defaultValue={field.value}
            placeholder={field.placeholder}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      ))}
      {step.action && (
        <Button variant="outline" className="w-full mt-2" asChild>
          <a href={step.action.href} target="_blank" rel="noopener noreferrer">
            {step.action.label}
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </Button>
      )}
    </div>
  )
}
