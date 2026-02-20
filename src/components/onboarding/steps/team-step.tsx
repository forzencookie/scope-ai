"use client"

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
          className="flex-1 h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all"
        />
        <button className="h-11 px-5 rounded-xl text-sm font-medium bg-white text-black hover:bg-white/90 transition-colors">
          Bjud in
        </button>
      </div>
      <div className="space-y-2">
        {step.roles.map((role) => (
          <div key={role.role} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/10">
            <div>
              <p className="font-medium text-sm text-white">{role.role}</p>
              <p className="text-xs text-white/40">{role.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
