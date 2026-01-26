"use client"

import { useState } from "react"
import { Zap, Sparkles, Check, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CREDIT_PACKAGES } from "@/lib/subscription"
import { formatTokens } from "@/hooks/use-ai-usage"
import { cn } from "@/lib/utils"

interface BuyCreditsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Show urgency message when user is out of tokens */
  outOfTokens?: boolean
  /** Callback when purchase is initiated */
  onPurchase?: (packageTokens: number) => void
}

export function BuyCreditsDialog({
  open,
  onOpenChange,
  outOfTokens = false,
  onPurchase,
}: BuyCreditsDialogProps) {
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
        // Redirect to Stripe checkout
        onPurchase?.(selectedPackage)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Köp extra AI-credits
          </DialogTitle>
          <DialogDescription>
            {outOfTokens ? (
              <span className="text-red-600 dark:text-red-400">
                Du har förbrukat din månadskvot. Köp fler credits för att fortsätta använda AI.
              </span>
            ) : (
              "Fyll på din AI-budget för att fortsätta använda alla modeller."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <button
              key={pkg.tokens}
              onClick={() => setSelectedPackage(pkg.tokens)}
              className={cn(
                "relative flex items-center justify-between rounded-lg border-2 p-4 text-left transition-all",
                "hover:border-primary/50 hover:bg-accent/30",
                selectedPackage === pkg.tokens 
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                  : "border-border",
                pkg.popular && !selectedPackage && "border-primary/50 bg-primary/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  selectedPackage === pkg.tokens 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                )}>
                  {selectedPackage === pkg.tokens ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">{pkg.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {(pkg.price / (pkg.tokens / 1000000)).toFixed(0)} kr/1M tokens
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold">{pkg.price} kr</div>
                {pkg.savings && (
                  <div className="text-xs text-green-600 font-medium">{pkg.savings}</div>
                )}
              </div>

              {pkg.popular && (
                <span className="absolute -top-2 left-4 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  Populär
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {error && (
            <p className="text-sm text-center text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <Button 
            onClick={handlePurchase} 
            disabled={!selectedPackage || purchasing}
            className="w-full"
            size="lg"
          >
            {purchasing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Omdirigerar till kassan...
              </>
            ) : selectedPackage ? (
              `Köp ${formatTokens(selectedPackage)} tokens`
            ) : (
              "Välj ett paket"
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Köpta credits förfaller aldrig och dras först efter din månadskvot.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
