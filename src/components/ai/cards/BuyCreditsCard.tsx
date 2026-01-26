"use client"

import { useState } from "react"
import { Zap, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface BuyCreditsPromptProps {
  packages: Array<{
    tokens: number
    price: number
    label: string
    popular?: boolean
    savings?: string
  }>
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}k`
  return tokens.toString()
}

export function BuyCreditsPrompt({ packages }: BuyCreditsPromptProps) {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async () => {
    if (!selectedPackage) return

    setPurchasing(true)
    setError(null)
    
    try {
      const response = await fetch('/api/stripe/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: selectedPackage }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte starta köp')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Ingen checkout-URL mottagen')
      }
    } catch (err) {
      console.error('Credits purchase error:', err)
      setError(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <h4 className="font-semibold flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        Köp AI-credits
      </h4>

      <div className="space-y-2">
        {packages.map((pkg) => (
          <button
            key={pkg.tokens}
            onClick={() => setSelectedPackage(pkg.tokens)}
            className={cn(
              "w-full flex items-center justify-between rounded-lg border-2 p-3 text-left transition-all",
              "hover:border-primary/50 hover:bg-accent/30",
              selectedPackage === pkg.tokens 
                ? "border-primary bg-primary/5" 
                : "border-border",
              pkg.popular && !selectedPackage && "border-primary/50 bg-primary/5"
            )}
          >
            <div className="flex items-center gap-2">
              <Sparkles className={cn(
                "h-4 w-4",
                selectedPackage === pkg.tokens ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="font-medium">{pkg.label}</span>
              {pkg.popular && (
                <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  Populär
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="font-bold">{pkg.price} kr</span>
              {pkg.savings && (
                <span className="text-xs text-green-600 ml-2">{pkg.savings}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Button 
        onClick={handlePurchase} 
        disabled={!selectedPackage || purchasing}
        className="w-full"
      >
        {purchasing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Omdirigerar...
          </>
        ) : selectedPackage ? (
          `Köp ${formatTokens(selectedPackage)} tokens`
        ) : (
          "Välj ett paket"
        )}
      </Button>
    </div>
  )
}

export interface BuyCreditsCheckoutProps {
  selectedPackage: {
    tokens: number
    price: number
    label: string
  }
  tokens: number
}

export function BuyCreditsCheckout({ selectedPackage }: BuyCreditsCheckoutProps) {
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async () => {
    setPurchasing(true)
    setError(null)
    
    try {
      const response = await fetch('/api/stripe/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: selectedPackage.tokens }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte starta köp')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Ingen checkout-URL mottagen')
      }
    } catch (err) {
      console.error('Credits purchase error:', err)
      setError(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <h4 className="font-semibold flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        Bekräfta köp
      </h4>

      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-medium">{selectedPackage.label}</span>
        </div>
        <span className="text-xl font-bold">{selectedPackage.price} kr</span>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Button 
        onClick={handlePurchase} 
        disabled={purchasing}
        className="w-full"
        size="lg"
      >
        {purchasing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Omdirigerar till kassan...
          </>
        ) : (
          "Gå till kassan"
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Du omdirigeras till Stripe för säker betalning.
      </p>
    </div>
  )
}
