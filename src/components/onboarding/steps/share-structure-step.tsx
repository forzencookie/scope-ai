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
        <label className="text-sm font-medium mb-1.5 block text-white/70 text-left">Aktiekapital</label>
        <input
          type="number"
          value={shareCapital}
          onChange={(e) => updateCompany({ shareCapital: Number(e.target.value) || 0 })}
          className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all"
        />
        <p className="text-xs text-white/30 mt-1 text-left">Minst 25 000 kr för privat AB</p>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block text-white/70 text-left">Antal aktier totalt</label>
        <input
          type="number"
          value={totalShares}
          onChange={(e) => updateCompany({ totalShares: Number(e.target.value) || 0 })}
          className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block text-white/70 text-left">A-aktier</label>
          <input
            type="number"
            value={aShares}
            onChange={(e) => updateCompany({ shareClasses: { A: Number(e.target.value) || 0, B: bShares } })}
            className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block text-white/70 text-left">B-aktier</label>
          <input
            type="number"
            value={bShares}
            onChange={(e) => updateCompany({ shareClasses: { A: aShares, B: Number(e.target.value) || 0 } })}
            className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all"
          />
        </div>
      </div>
    </div>
  )
}
