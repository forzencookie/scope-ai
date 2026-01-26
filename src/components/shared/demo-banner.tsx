"use client"

/**
 * Demo Mode Banner
 * 
 * Shows a dismissable banner for demo users explaining the demo mode
 * and providing a clear path to upgrade.
 */

import * as React from "react"
import { X, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSubscription } from "@/hooks/use-subscription"
import Link from "next/link"

export function DemoBanner() {
  const { isDemo, loading } = useSubscription()
  const [dismissed, setDismissed] = React.useState(false)

  // Check localStorage on mount
  React.useEffect(() => {
    const wasDismissed = localStorage.getItem("demo-banner-dismissed")
    if (wasDismissed) {
      setDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem("demo-banner-dismissed", "true")
  }

  if (loading || !isDemo || dismissed) {
    return null
  }

  return (
    <div className="relative bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-b border-amber-500/20">
      <div className="container flex items-center justify-between gap-4 py-2.5 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Demo-läge
            </span>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Du utforskar med simulerade data och AI. Riktiga funktioner kräver uppgradering.
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500/30 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
            asChild
          >
            <Link href="/priser">
              Uppgradera
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Stäng</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
