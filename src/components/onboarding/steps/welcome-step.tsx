"use client"

import { PixelDog } from "@/components/ai/mascots"

// ============================================================================
// WelcomeStep - Dog mascot greeting
// ============================================================================

export function WelcomeStep() {
  return (
    <div className="flex flex-col items-center gap-2">
      <PixelDog size={96} />
    </div>
  )
}
