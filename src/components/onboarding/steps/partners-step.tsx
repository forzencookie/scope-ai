"use client"

import { Check, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

// ============================================================================
// PartnersStep - Add partners for HB/KB
// ============================================================================

export function PartnersStep() {
  return (
    <div className="max-w-md mx-auto">
      <div className="space-y-3 mb-4">
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delägare 1</p>
              <p className="text-sm text-muted-foreground">Kapitalinsats: 50 000 kr (50%)</p>
            </div>
            <Check className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>
      <Button variant="outline" className="w-full">
        <Users className="h-4 w-4 mr-2" />
        Lägg till delägare
      </Button>
    </div>
  )
}
