"use client"

import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Check, Sparkles, Zap, Crown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"

const plans = [
  {
    id: "pro",
    name: "Pro",
    price: "249 kr",
    period: "/mån",
    description: "För Enskild Firma och Förening",
    highlight: false,
    icon: Zap,
    features: [
      "AI-kategoriserar transaktioner",
      "AI-assisterad bokföring",
      "Riktig banksynkronisering",
      "AI-genererade deklarationer",
      "1 Användare",
    ],
    cta: "Välj Pro",
    note: "Avsluta när som helst",
  },
  {
    id: "max",
    name: "Max",
    price: "449 kr",
    period: "/mån",
    description: "För Aktiebolag, Handelsbolag och KB",
    highlight: true,
    icon: Crown,
    features: [
      "Allt i Pro",
      "Flera användare & team",
      "K10 och Årsredovisning",
      "API-åtkomst",
      "Prioriterad support",
    ],
    cta: "Välj Max",
    note: "Avsluta när som helst",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Anpassat",
    period: "",
    description: "För koncerner och flerbolag",
    highlight: false,
    icon: Sparkles,
    comingSoon: true,
    features: [
      "Allt i Max",
      "Obegränsad AI-användning",
      "Anpassade integrationer",
      "Dedikerad kontaktperson",
      "SLA & dedikerad support",
    ],
    cta: "Kontakta oss",
    note: null,
  },
]

function PlanSelectionContent() {
  const router = useRouter()

  const handleSelectPlan = (planId: string) => {
    if (planId === "enterprise") {
      // TODO: Show contact/waitlist form
      return
    }

    if (planId === "pro" || planId === "max") {
      router.push(`/dashboard/checkout?type=subscription&tier=${planId}`)
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#050505',
        backgroundImage: "url('/premiumbg-clean.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Header */}
      <div className="px-6 py-8">
        <ScopeAILogo className="h-8 w-auto text-white" />
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Välj din plan
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl mx-auto">
            Välj den plan som passar din företagsform bäst.
          </p>
        </motion.div>

        {/* Plan cards */}
        <div className="flex flex-col md:flex-row justify-center gap-6 max-w-4xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative rounded-2xl border p-6 transition-all flex-1",
                  plan.highlight
                    ? "border-white/30 bg-white/10 backdrop-blur-sm shadow-lg scale-[1.02] z-10"
                    : "border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-white text-neutral-900 text-xs font-medium px-3 py-1 rounded-full">
                      Rekommenderad
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <div
                    className={cn(
                      "inline-flex p-2 rounded-lg mb-3",
                      plan.highlight
                        ? "bg-white/20 text-white"
                        : "bg-white/10 text-neutral-400"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {plan.name}
                  </h2>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-neutral-500 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-neutral-400 mt-2">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-neutral-300"
                    >
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={plan.comingSoon}
                  className={cn(
                    "w-full py-3 text-sm font-medium rounded-lg transition-colors",
                    plan.highlight
                      ? "bg-white text-neutral-900 hover:bg-neutral-100"
                      : plan.comingSoon
                        ? "bg-white/5 text-neutral-600 cursor-not-allowed"
                        : "bg-white/10 text-white border border-white/10 hover:border-white/20 hover:bg-white/15"
                  )}
                >
                  {plan.cta}
                </button>

                {plan.note && (
                  <p className="text-xs text-neutral-500 text-center mt-3">
                    {plan.note}
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-neutral-500 mt-12">
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
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#050505' }}>
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      }
    >
      <PlanSelectionContent />
    </Suspense>
  )
}
