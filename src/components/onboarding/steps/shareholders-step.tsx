"use client"

import { useState, useEffect } from "react"
import { Check, Users, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  return (
    <div className="max-w-md mx-auto">
      {/* Existing shareholders */}
      {shareholders.length > 0 && (
        <div className="space-y-3 mb-4">
          {shareholders.map((s, i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.shares} {s.shareClass}-aktier ({totalShares > 0 ? Math.round((s.shares / totalShares) * 100) : 0}%)
                  </p>
                  {s.ssn && (
                    <p className="text-xs text-muted-foreground">{s.ssn}</p>
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

          {/* Allocation summary */}
          <p className="text-xs text-muted-foreground text-center">
            {allocatedShares} av {totalShares} aktier fördelade
            {allocatedShares < totalShares && ` — ${totalShares - allocatedShares} kvar`}
          </p>
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
              placeholder="Johan Svensson"
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
              <label className="text-sm font-medium mb-1 block text-left">Antal aktier</label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder={String(totalShares - allocatedShares)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-left">Aktieslag</label>
              <select
                value={shareClass}
                onChange={(e) => setShareClass(e.target.value as "A" | "B")}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="B">B-aktier</option>
                <option value="A">A-aktier</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleAdd} disabled={!name.trim() || !shares} className="flex-1">
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
          Lägg till aktieägare
        </Button>
      )}

      {shareholders.length === 0 && !isAdding && (
        <p className="text-xs text-muted-foreground mt-3">
          Du kan hoppa över detta steg och lägga till aktieägare senare i aktieboken.
        </p>
      )}
    </div>
  )
}
