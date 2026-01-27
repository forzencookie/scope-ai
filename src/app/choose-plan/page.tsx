"use client"

import { useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Check, Sparkles, Zap, Crown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"

const plans = [
  {
    id: "demo",
    name: "Demo",
    price: "0 kr",
    period: "/mån",
    description: "Utforska appen med simulerad data",
    highlight: false,
    icon: Sparkles,
    features: [
      "Full tillgång till alla funktioner",
      "Simulerad AI & data",
      "Ingen verklig banksynk",
      "Perfekt för att testa",
    ],
    cta: "Starta demo",
    note: "Ingen data sparas",
  },
  {
    id: "pro",
    name: "Professional",
    price: "449 kr",
    period: "/mån",
    description: "AI gör jobbet åt dig",
    highlight: true,
    icon: Zap,
    features: [
      "AI-kategoriserar transaktioner",
      "AI-assisterad bokföring",
      "Riktig banksynkronisering",
      "AI-genererade deklarationer",
      "Prioriterad support",
    ],
    cta: "Välj Professional",
    note: "Avsluta när som helst",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Kommer snart",
    period: "",
    description: "För koncerner och flerbolag",
    highlight: false,
    icon: Crown,
    comingSoon: true,
    features: [
      "Allt i Professional",
      "Hantera flera bolag",
      "API-åtkomst",
      "Dedikerad kontaktperson",
    ],
    cta: "Meddela mig",
    note: null,
  },
]

function PlanSelectionContent() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelectPlan = async (planId: string) => {
    if (planId === "enterprise") {
      // TODO: Show contact/waitlist form
      return
    }

    if (planId === "demo") {
      // Go directly to dashboard as demo user
      router.push("/dashboard")
      return
    }

    if (planId === "pro") {
      setLoading("pro")
      try {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "pro" }),
        })
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        }
      } catch (error) {
        console.error("Failed to create checkout:", error)
      } finally {
        setLoading(null)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Header */}
      <div className="px-6 py-8">
        <ScopeAILogo className="h-8 w-auto" />
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            Välj din plan
          </h1>
          <p className="text-lg text-stone-600 max-w-xl mx-auto">
            Testa gratis med demo eller kom igång direkt med Professional för
            fullständig AI-bokföring.
          </p>
        </motion.div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const isLoading = loading === plan.id

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative rounded-2xl border p-6 transition-all",
                  plan.highlight
                    ? "border-stone-900 bg-white shadow-lg scale-[1.02]"
                    : "border-stone-200 bg-stone-50 hover:border-stone-300"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-stone-900 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Rekommenderad
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <div
                    className={cn(
                      "inline-flex p-2 rounded-lg mb-3",
                      plan.highlight
                        ? "bg-stone-900 text-white"
                        : "bg-stone-200 text-stone-600"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-stone-900">
                    {plan.name}
                  </h2>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-stone-900">
                      {plan.price}
                    </span>
                    <span className="text-stone-500 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-stone-600 mt-2">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-stone-600"
                    >
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={plan.comingSoon || isLoading}
                  className={cn(
                    "w-full py-3 text-sm font-medium rounded-lg transition-colors",
                    plan.highlight
                      ? "bg-stone-900 text-white hover:bg-stone-800"
                      : plan.comingSoon
                        ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                        : "bg-white text-stone-900 border border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                  )}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Laddar...
                    </span>
                  ) : (
                    plan.cta
                  )}
                </button>

                {plan.note && (
                  <p className="text-xs text-stone-500 text-center mt-3">
                    {plan.note}
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-stone-500 mt-12">
          Du kan alltid uppgradera eller ändra din plan senare i inställningarna.
        </p>
      </div>
    </div>
  )
}

export default function ChoosePlanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
        </div>
      }
    >
      <PlanSelectionContent />
    </Suspense>
  )
}
