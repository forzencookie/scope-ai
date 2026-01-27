"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Check, Gift, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSubscription } from "@/hooks/use-subscription"

// The Stripe promotion code ID for 10% off first month
// Create this in Stripe Dashboard: Coupons > Create coupon > 10% off, once, first month
// Then create a promotion code with a memorable code like "WELCOME10"
const DEMO_DISCOUNT_CODE = process.env.NEXT_PUBLIC_DEMO_DISCOUNT_CODE || ""

const STORAGE_KEY = "scope-demo-upgrade-shown"

interface DemoUpgradeModalProps {
  /** Force show the modal (for testing) */
  forceShow?: boolean
}

export function DemoUpgradeModal({ forceShow }: DemoUpgradeModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { isDemo, loading: subscriptionLoading } = useSubscription()

  // Show modal for demo users who haven't seen it yet
  useEffect(() => {
    if (subscriptionLoading) return

    // Only show for demo users
    if (!isDemo && !forceShow) return

    // Check if already shown this session
    const hasSeenModal = sessionStorage.getItem(STORAGE_KEY)
    if (hasSeenModal && !forceShow) return

    // Small delay so it doesn't pop up immediately
    const timer = setTimeout(() => {
      setIsOpen(true)
      sessionStorage.setItem(STORAGE_KEY, "true")
    }, 1500)

    return () => clearTimeout(timer)
  }, [isDemo, subscriptionLoading, forceShow])

  const handleUpgrade = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: "pro",
          discountCode: DEMO_DISCOUNT_CODE || undefined,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error("No checkout URL returned")
        setLoading(false)
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error)
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleMaybeLater = () => {
    setIsOpen(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-br from-violet-600 to-indigo-700 px-6 py-8 text-white">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                    Exklusivt erbjudande
                  </span>
                </div>

                <h2 className="text-2xl font-bold mb-2">
                  Tack för att du testar Scope AI!
                </h2>
                <p className="text-white/80 text-sm">
                  Du kör just nu demo-versionen med simulerad data. Uppgradera
                  för att låsa upp alla funktioner.
                </p>
              </div>

              {/* Discount badge */}
              <div className="px-6 -mt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Gift className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">
                      10% rabatt första månaden
                    </p>
                    <p className="text-sm text-amber-700">
                      Som tack för att du tog dig tid att utforska appen
                    </p>
                  </div>
                </div>
              </div>

              {/* Features list */}
              <div className="px-6 py-6">
                <p className="text-sm font-medium text-stone-900 mb-3">
                  Med Professional får du:
                </p>
                <ul className="space-y-2">
                  {[
                    "AI som kategoriserar transaktioner automatiskt",
                    "AI-assisterad bokföring & deklarationer",
                    "Riktig banksynkronisering",
                    "Prioriterad support",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-stone-600"
                    >
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price */}
              <div className="px-6 pb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-stone-900">
                    404 kr
                  </span>
                  <span className="text-stone-500 line-through">449 kr</span>
                  <span className="text-sm text-stone-500">/mån</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Första månaden, sedan 449 kr/mån. Avsluta när som helst.
                </p>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 space-y-3">
                <Button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white py-6"
                >
                  {loading ? (
                    "Laddar..."
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Uppgradera till Professional
                    </>
                  )}
                </Button>

                <button
                  onClick={handleMaybeLater}
                  className="w-full text-sm text-stone-500 hover:text-stone-700 transition-colors py-2"
                >
                  Fortsätt utforska demo först
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
