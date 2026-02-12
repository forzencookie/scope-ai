"use client"

import { useState, useEffect } from "react"
import { Check, Users, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  return (
    <div className="max-w-md mx-auto">
      {/* Existing partners */}
      {partners.length > 0 && (
        <div className="space-y-3 mb-4">
          {partners.map((p, i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.type === "komplementär" ? "Komplementär" : "Kommanditdelägare"}
                    {p.capitalContribution > 0 && ` — ${p.capitalContribution.toLocaleString("sv-SE")} kr`}
                    {totalCapital > 0 && ` (${Math.round((p.capitalContribution / totalCapital) * 100)}%)`}
                  </p>
                  {p.ssn && (
                    <p className="text-xs text-muted-foreground">{p.ssn}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <button
                    onClick={() => handleRemove(i)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
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
        <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/10 mb-4">
          <div>
            <label className="text-sm font-medium mb-1 block text-left">Namn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anna Johansson"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block text-left">Personnummer / Org-nr</label>
            <input
              type="text"
              value={ssn}
              onChange={(e) => setSsn(e.target.value)}
              placeholder="YYYYMMDD-XXXX"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block text-left">Typ</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "komplementär" | "kommanditdelägare")}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="komplementär">Komplementär</option>
                <option value="kommanditdelägare">Kommanditdelägare</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-left">Kapitalinsats (kr)</label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                placeholder="50000"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleAdd} disabled={!name.trim()} className="flex-1">
              <Plus className="h-4 w-4 mr-1" />
              Lägg till
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>
              Avbryt
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setIsAdding(true)}>
          <Users className="h-4 w-4 mr-2" />
          Lägg till delägare
        </Button>
      )}

      {partners.length === 0 && !isAdding && (
        <p className="text-xs text-muted-foreground mt-3">
          Du kan hoppa över detta steg och lägga till delägare senare.
        </p>
      )}
    </div>
  )
}
