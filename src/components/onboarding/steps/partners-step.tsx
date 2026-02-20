"use client"

import { useState, useEffect } from "react"
import { Check, Users, Trash2, Plus } from "lucide-react"
import type { OnboardingPartner } from "../onboarding-page"

// ============================================================================
// PartnersStep - Add partners for HB/KB
// ============================================================================

interface PartnersStepProps {
  initialData?: OnboardingPartner[]
  onDataChange?: (data: OnboardingPartner[]) => void
}

export function PartnersStep({ initialData = [], onDataChange }: PartnersStepProps) {
  const [partners, setPartners] = useState<OnboardingPartner[]>(initialData)
  const [isAdding, setIsAdding] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [ssn, setSsn] = useState("")
  const [type, setType] = useState<"komplementär" | "kommanditdelägare">("komplementär")
  const [capital, setCapital] = useState("")

  const totalCapital = partners.reduce((sum, p) => sum + p.capitalContribution, 0)

  // Notify parent of changes
  useEffect(() => {
    onDataChange?.(partners)
  }, [partners, onDataChange])

  const handleAdd = () => {
    if (!name.trim()) return

    setPartners(prev => [...prev, {
      name: name.trim(),
      ssn: ssn.trim(),
      type,
      capitalContribution: Number(capital) || 0,
    }])

    setName("")
    setSsn("")
    setType("komplementär")
    setCapital("")
    setIsAdding(false)
  }

  const handleRemove = (index: number) => {
    setPartners(prev => prev.filter((_, i) => i !== index))
  }

  const inputClass = "w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all"

  return (
    <div className="max-w-md mx-auto">
      {/* Existing partners */}
      {partners.length > 0 && (
        <div className="space-y-3 mb-4">
          {partners.map((p, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/[0.04]">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-medium text-white">{p.name}</p>
                  <p className="text-sm text-white/40">
                    {p.type === "komplementär" ? "Komplementär" : "Kommanditdelägare"}
                    {p.capitalContribution > 0 && ` — ${p.capitalContribution.toLocaleString("sv-SE")} kr`}
                    {totalCapital > 0 && ` (${Math.round((p.capitalContribution / totalCapital) * 100)}%)`}
                  </p>
                  {p.ssn && (
                    <p className="text-xs text-white/30">{p.ssn}</p>
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
              placeholder="Anna Johansson"
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
              <label className="text-sm font-medium mb-1 block text-left text-white/70">Typ</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "komplementär" | "kommanditdelägare")}
                className={inputClass}
              >
                <option value="komplementär">Komplementär</option>
                <option value="kommanditdelägare">Kommanditdelägare</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-left text-white/70">Kapitalinsats (kr)</label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                placeholder="50000"
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={!name.trim()}
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
          Lägg till delägare
        </button>
      )}

      {partners.length === 0 && !isAdding && (
        <p className="text-xs text-white/30 mt-3">
          Du kan hoppa över detta steg och lägga till delägare senare.
        </p>
      )}
    </div>
  )
}
