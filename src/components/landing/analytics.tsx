"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { TrendingUp, Calendar, PieChart, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./ui"

export function Analytics() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="px-3 md:px-4 py-8 max-w-[2400px] mx-auto">
      <div className="bg-stone-50 rounded-3xl p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-stone-900 tracking-tight mb-4">Realtidsöversikt över din ekonomi</h2>
            <p className="text-stone-600 leading-relaxed mb-8">
              Se kassaflöde, momsunderlag, lönekostnader och deadlines — allt uppdaterat i realtid.
              AI:n kategoriserar transaktioner automatiskt och flaggar avvikelser.
            </p>
            <div className="space-y-4">
              {[
                { label: "AI-kategorisering av transaktioner", icon: TrendingUp },
                { label: "Automatiska momsberäkningar", icon: Calendar },
                { label: "Intelligenta varningar & påminnelser", icon: PieChart },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-stone-700">
                  <div className="p-2 bg-white border border-stone-200 rounded-lg">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Dashboard */}
          <div ref={ref} className="relative">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-mono text-stone-600 uppercase tracking-wider">Dashboard</span>
                <StatusBadge status="active" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: "Omsättning MTD", value: "847 200 kr", change: "+12,4%" },
                  { label: "Kommande Moms", value: "42 150 kr", change: "Om 12 dagar" },
                  { label: "Nästa Lönekörning", value: "156 800 kr", change: "25:e" },
                  { label: "Kvitton", value: "12 nya", change: "Auto-sorterade" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="bg-stone-50 border border-stone-200 rounded-xl p-4 will-change-transform-opacity"
                  >
                    <div className="text-xs text-stone-500 mb-1">{stat.label}</div>
                    <div className="text-lg font-bold text-stone-900">{stat.value}</div>
                    <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {stat.change}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Chart placeholder */}
              <div className="h-32 bg-stone-50 border border-stone-200 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-1">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={isInView ? { height: `${h}%` } : {}}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                      className="flex-1 bg-stone-300 hover:bg-stone-400 rounded-t transition-colors"
                    />
                  ))}
                </div>
              </div>

              {/* Compliance indicators */}
              <div className="mt-6 flex items-center gap-4">
                {[
                  { label: "Moms", status: "complete" as const },
                  { label: "AGI", status: "complete" as const },
                  { label: "Årsredovisning", status: "pending" as const },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={cn("w-2 h-2", {
                      "bg-emerald-500": item.status === "complete",
                      "bg-amber-500": item.status === "pending",
                    })} />
                    <span className="text-xs text-stone-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
