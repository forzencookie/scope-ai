"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionHeader } from "../../shared/section-header"
import { useAuth } from "@/hooks/use-auth"

// Map tier names to API tier values
const TIER_MAP: Record<string, 'free' | 'pro' | 'enterprise'> = {
  "Free": "free",
  "Professional": "pro",
  "Enterprise": "enterprise",
}

export function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const handleSelectPlan = async (tierName: string, isComingSoon: boolean) => {
    if (isComingSoon) return
    
    const tier = TIER_MAP[tierName]
    
    // Free tier - just go to register or dashboard
    if (tier === "free") {
      router.push(isAuthenticated ? "/dashboard" : "/register")
      return
    }

    // Paid tier - if logged in, go directly to Stripe checkout
    if (isAuthenticated) {
      setLoadingTier(tierName)
      try {
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier }),
        })
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        }
      } catch (error) {
        console.error('Failed to create checkout session:', error)
      } finally {
        setLoadingTier(null)
      }
    } else {
      // Not logged in - go to register with plan param
      router.push(`/register?plan=${tier}`)
    }
  }

  return (
    <section id="pricing" className="px-6 md:px-12 lg:px-24 py-24 max-w-[1400px] mx-auto border-t border-stone-200">
      <SectionHeader
        badge="Priser"
        title="Transparent prissättning för alla"
        description="Inga dolda avgifter eller långa bindningstider. Välj det som passar ditt företag bäst."
        icon={CreditCard}
        className="mb-12"
      />
      <div className="bg-white border border-stone-200 rounded-3xl p-8 md:p-12">
        <div className="text-center mb-12">

          {/* Billing toggle */}
          <div className="inline-flex border border-stone-200 rounded-lg p-1 bg-stone-50">
            <button
              onClick={() => setBilling("monthly")}
              className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors",
                billing === "monthly" ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
              )}
            >
              Månadsvis
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors",
                billing === "yearly" ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
              )}
            >
              Årsvis
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "Free", price: billing === "monthly" ? "0 kr" : "0 kr", period: "/mån", desc: "Alla funktioner — du bokför själv", features: ["Bokföring & transaktioner", "Momsdeklarationer", "Löner & AGI", "Kvitton & fakturor", "Banksynk", "Rapporter & årsredovisning"] },
            { name: "Professional", price: billing === "monthly" ? "449 kr" : "379 kr", period: "/mån", desc: "AI gör jobbet åt dig", highlight: true, features: ["Allt i Free, plus:", "AI-kategoriserar transaktioner", "AI-assisterad bokföring", "AI-genererade deklarationer", "AI-lönebesked & AGI", "Prioriterad support"] },
            { name: "Enterprise", price: "Kommer snart", period: "", desc: "För koncerner och flerbolagsstrukturer", comingSoon: true, features: ["Allt i Professional", "Hantera flera bolag", "API-åtkomst", "Dedikerad kontaktperson", "Skräddarsydda integrationer"] },
          ].map((tier, i) => (
            <div
              key={i}
              className={cn(
                "p-8 border border-stone-200 rounded-2xl bg-stone-50 relative transition-colors",
                tier.highlight ? "border-stone-900 bg-white" : "hover:border-stone-300"
              )}
            >
              {tier.highlight && (
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium bg-stone-900 text-white px-2 py-1 rounded">Populär</span>
                </div>
              )}
              <h3 className="text-lg font-bold text-stone-900 mb-2">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-stone-900">{tier.price}</span>
                <span className="text-stone-500 text-sm">{tier.period}</span>
              </div>
              <p className="text-stone-600 text-sm mb-8">{tier.desc}</p>

              <ul className="space-y-3 mb-8">
                {tier.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-stone-600">
                    <Check className="w-4 h-4 text-stone-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(tier.name, tier.price === "Kommer snart")}
                disabled={tier.price === "Kommer snart" || loadingTier === tier.name}
                className={cn(
                  "w-full py-3 text-sm font-medium rounded-lg transition-colors border text-center block",
                  tier.highlight
                    ? "bg-stone-900 text-white border-stone-900 hover:bg-stone-800"
                    : tier.price === "Kommer snart"
                      ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed"
                      : "bg-white text-stone-900 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                )}>
                {loadingTier === tier.name ? "Laddar..." : tier.price === "Kommer snart" ? "Meddela mig" : "Kom igång"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
