"use client"

import { useState, useEffect } from "react"
import { Check, Users, Trash2, Plus } from "lucide-react"
import { useCompany } from "@/providers/company-provider"
import type { OnboardingShareholder } from "../onboarding-page"

// ============================================================================
// ShareholdersStep - Add shareholders for AB
// ============================================================================

interface ShareholdersStepProps {
  initialData?: OnboardingShareholder[]
  onDataChange?: (data: OnboardingShareholder[]) => void
}

export function ShareholdersStep({ initialData = [], onDataChange }: ShareholdersStepProps) {
  const { company } = useCompany()
  const totalShares = company?.totalShares ?? 500

  const [shareholders, setShareholders] = useState<OnboardingShareholder[]>(initialData)
  const [isAdding, setIsAdding] = useState(false)

  // Form state for new shareholder
  const [name, setName] = useState("")
  const [ssn, setSsn] = useState("")
  const [shares, setShares] = useState("")
  const [shareClass, setShareClass] = useState<"A" | "B">("B")

  const allocatedShares = shareholders.reduce((sum, s) => sum + s.shares, 0)

  // Notify parent of changes
  useEffect(() => {
    onDataChange?.(shareholders)
  }, [shareholders, onDataChange])

  const handleAdd = () => {
    if (!name.trim() || !shares) return

    setShareholders(prev => [...prev, {
      name: name.trim(),
      ssn: ssn.trim(),
      shares: Number(shares) || 0,
      shareClass,
    }])

    // Reset form
    setName("")
    setSsn("")
    setShares("")
    setShareClass("B")
    setIsAdding(false)
  }

  const handleRemove = (index: number) => {
    setShareholders(prev => prev.filter((_, i) => i !== index))
  }

  const inputClass = "w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all"

  return (
    <div className="max-w-md mx-auto">
      {/* Existing shareholders */}
      {shareholders.length > 0 && (
        <div className="space-y-3 mb-4">
          {shareholders.map((s, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/[0.04]">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-medium text-white">{s.name}</p>
                  <p className="text-sm text-white/40">
                    {s.shares} {s.shareClass}-aktier ({totalShares > 0 ? Math.round((s.shares / totalShares) * 100) : 0}%)
                  </p>
                  {s.ssn && (
                    <p className="text-xs text-white/30">{s.ssn}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-white/40" />
                  <button
                    onClick={() => handleRemove(i)}
                    className="p-1 text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Allocation summary */}
          <p className="text-xs text-white/30 text-center">
            {allocatedShares} av {totalShares} aktier fördelade
            {allocatedShares < totalShares && ` — ${totalShares - allocatedShares} kvar`}
          </p>
        </div>
      )}

      {/* Add form */}
      {isAdding ? (
        <div className="space-y-3 p-4 rounded-xl border border-white/10 bg-white/[0.03] mb-4">
          <div>
            <label className="text-sm font-medium mb-1 block text-left text-white/70">Namn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Johan Svensson"
              className={inputClass}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block text-left text-white/70">Personnummer / Org-nr</label>
            <input
              type="text"
              value={ssn}
              onChange={(e) => setSsn(e.target.value)}
              placeholder="YYYYMMDD-XXXX"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block text-left text-white/70">Antal aktier</label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder={String(totalShares - allocatedShares)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-left text-white/70">Aktieslag</label>
              <select
                value={shareClass}
                onChange={(e) => setShareClass(e.target.value as "A" | "B")}
                className={inputClass}
              >
                <option value="B">B-aktier</option>
                <option value="A">A-aktier</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={!name.trim() || !shares}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-medium bg-white text-black hover:bg-white/90 transition-colors disabled:opacity-30"
            >
              <Plus className="h-4 w-4" />
              Lägg till
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-5 h-11 rounded-xl text-sm text-white/50 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <button
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          onClick={() => setIsAdding(true)}
        >
          <Users className="h-4 w-4" />
          Lägg till aktieägare
        </button>
      )}

      {shareholders.length === 0 && !isAdding && (
        <p className="text-xs text-white/30 mt-3">
          Du kan hoppa över detta steg och lägga till aktieägare senare i aktieboken.
        </p>
      )}
    </div>
  )
}
