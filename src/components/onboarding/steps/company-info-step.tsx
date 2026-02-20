"use client"

import { ExternalLink } from "lucide-react"
import { useCompany } from "@/providers/company-provider"

// ============================================================================
// CompanyInfoStep - Company details with Bolagsverket lookup
// ============================================================================

export function CompanyInfoStep() {
  const { company, updateCompany } = useCompany()

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <div>
        <label className="text-sm font-medium mb-1.5 block text-white/70 text-left">Organisationsnummer</label>
        <input
          type="text"
          value={company?.orgNumber ?? ""}
          onChange={(e) => updateCompany({ orgNumber: e.target.value })}
          placeholder="XXXXXX-XXXX"
          className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block text-white/70 text-left">Företagsnamn</label>
        <input
          type="text"
          value={company?.name ?? ""}
          onChange={(e) => updateCompany({ name: e.target.value })}
          placeholder="AB Exempel"
          className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all"
        />
      </div>
      <a
        href="https://www.bolagsverket.se/foretag/hitta"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full mt-2 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 transition-colors"
      >
        Hämta från Bolagsverket
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  )
}
