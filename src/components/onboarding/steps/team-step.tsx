"use client"

import { Button } from "@/components/ui/button"
import type { OnboardingStep } from "../types"

// ============================================================================
// TeamStep - Invite team members
// ============================================================================

interface TeamStepProps {
  step: OnboardingStep
}

export function TeamStep({ step }: TeamStepProps) {
  if (!step.roles) return null

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="email"
          placeholder="email@example.com"
          className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <Button>Bjud in</Button>
      </div>
      <div className="space-y-2">
        {step.roles.map((role) => (
          <div key={role.role} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-sm">{role.role}</p>
              <p className="text-xs text-muted-foreground">{role.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
