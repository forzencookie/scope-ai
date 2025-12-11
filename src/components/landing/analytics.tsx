"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { TrendingUp, Calendar, PieChart, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

import { Section } from "./section"
import { StatusBadge } from "./status-badge"

export function Analytics() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  return (
    <Section id="analytics" className="bg-white border-y border-stone-200">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight mb-4">Financial Clarity</h2>
          <p className="text-stone-600 leading-relaxed mb-8">
            Real-time visibility into cash flow, tax obligations, payroll trends, and filing deadlines. 
            No spreadsheets, no guessing.
          </p>
          <div className="space-y-4">
            {[
              { label: "Cash flow forecasting", icon: TrendingUp },
              { label: "Tax deadline tracking", icon: Calendar },
              { label: "Expense breakdown", icon: PieChart },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-stone-700">
                <div className="p-2 bg-stone-100 border border-stone-200 rounded-lg">
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Floating Dashboard */}
        <div ref={ref} className="relative">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono text-stone-600 uppercase tracking-wider">Dashboard</span>
              <StatusBadge status="active" />
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: "Revenue MTD", value: "847,200 kr", change: "+12.4%" },
                { label: "Pending VAT", value: "42,150 kr", change: "Due 12d" },
                { label: "Payroll Next", value: "156,800 kr", change: "25th" },
                { label: "Receipts", value: "12 new", change: "Auto-sorted" },
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="bg-white border border-stone-200 rounded-lg p-4 will-change-transform-opacity"
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
            <div className="h-32 bg-white border border-stone-200 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-1">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={isInView ? { height: `${h}%` } : {}}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                    className="flex-1 bg-stone-200 hover:bg-stone-300 rounded-t transition-colors"
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
    </Section>
  )
}
