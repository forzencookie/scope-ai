"use client"

import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCompany } from "@/providers/company-provider"

// ============================================================================
// CompanyInfoStep - Company details with Bolagsverket lookup
// ============================================================================

export function CompanyInfoStep() {
  const { company, updateCompany } = useCompany()

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Organisationsnummer</label>
        <input
          type="text"
          value={company?.orgNumber ?? ""}
          onChange={(e) => updateCompany({ orgNumber: e.target.value })}
          placeholder="XXXXXX-XXXX"
          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Företagsnamn</label>
        <input
          type="text"
          value={company?.name ?? ""}
          onChange={(e) => updateCompany({ name: e.target.value })}
          placeholder="AB Exempel"
          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
      <Button variant="outline" className="w-full mt-2" asChild>
        <a href="https://www.bolagsverket.se/foretag/hitta" target="_blank" rel="noopener noreferrer">
          Hämta från Bolagsverket
          <ExternalLink className="h-4 w-4 ml-2" />
        </a>
      </Button>
    </div>
  )
}
