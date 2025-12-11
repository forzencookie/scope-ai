"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

import { Section } from "./section"

export function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  
  return (
    <Section id="pricing">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-stone-900 tracking-tight mb-4">Transparent pricing</h2>
        <p className="text-stone-600 mb-8">No hidden fees. Cancel anytime.</p>
        
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
      
      <div className="grid md:grid-cols-3 gap-0">
        {[
          { name: "Starter", price: billing === "monthly" ? "0 kr" : "0 kr", period: "/mån", desc: "For dormant or new ABs", features: ["Basic bookkeeping", "Receipt scanning", "Bank sync", "Email support"] },
          { name: "Standard", price: billing === "monthly" ? "299 kr" : "249 kr", period: "/mån", desc: "For growing companies", highlight: true, features: ["Everything in Starter", "Payroll automation", "VAT filings", "Priority support", "Unlimited users"] },
          { name: "Enterprise", price: "Custom", period: "", desc: "Multi-entity support", features: ["Everything in Standard", "Multi-company", "API access", "Dedicated manager", "Custom integrations"] },
        ].map((tier, i) => (
          <div
            key={i}
            className={cn(
              "p-8 border border-stone-200 rounded-xl bg-white relative transition-colors",
              tier.highlight ? "border-stone-900 z-10" : "hover:border-stone-300",
              i === 0 ? "md:border-r-0" : "",
              i === 2 ? "md:border-l-0" : ""
            )}
          >
            {tier.highlight && (
              <div className="absolute top-3 right-3">
                <span className="text-xs font-medium bg-stone-900 text-white px-2 py-1 rounded">Popular</span>
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

            <button className={cn(
              "w-full py-3 text-sm font-medium rounded-lg transition-colors border",
              tier.highlight 
                ? "bg-stone-900 text-white border-stone-900 hover:bg-stone-800" 
                : "bg-white text-stone-900 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
            )}>
              {tier.price === "Custom" ? "Contact sales" : "Get started"}
            </button>
          </div>
        ))}
      </div>
    </Section>
  )
}
