"use client"

import { useCompany } from "@/providers/company-provider"

// ============================================================================
// ShareStructureStep - Share capital and share counts for AB
// ============================================================================

export function ShareStructureStep() {
  const { company, updateCompany } = useCompany()

  const shareCapital = company?.shareCapital ?? 25000
  const totalShares = company?.totalShares ?? 500
  const aShares = company?.shareClasses?.A ?? 0
  const bShares = company?.shareClasses?.B ?? 500

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Aktiekapital</label>
        <input
          type="number"
          value={shareCapital}
          onChange={(e) => updateCompany({ shareCapital: Number(e.target.value) || 0 })}
          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">Minst 25 000 kr för privat AB</p>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Antal aktier totalt</label>
        <input
          type="number"
          value={totalShares}
          onChange={(e) => updateCompany({ totalShares: Number(e.target.value) || 0 })}
          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">A-aktier</label>
          <input
            type="number"
            value={aShares}
            onChange={(e) => updateCompany({ shareClasses: { A: Number(e.target.value) || 0, B: bShares } })}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">B-aktier</label>
          <input
            type="number"
            value={bShares}
            onChange={(e) => updateCompany({ shareClasses: { A: aShares, B: Number(e.target.value) || 0 } })}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>
    </div>
  )
}
