"use client"

import { Check, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

// ============================================================================
// ShareholdersStep - Add shareholders for AB
// ============================================================================

export function ShareholdersStep() {
  return (
    <div className="max-w-md mx-auto">
      <div className="space-y-3 mb-4">
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Johan Svensson</p>
              <p className="text-sm text-muted-foreground">500 aktier (100%)</p>
            </div>
            <Check className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>
      <Button variant="outline" className="w-full">
        <Users className="h-4 w-4 mr-2" />
        Lägg till aktieägare
      </Button>
    </div>
  )
}
