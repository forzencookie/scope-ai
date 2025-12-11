"use client"

import { motion } from "framer-motion"
import { ArrowRight, Users, Building, FileText, Check } from "lucide-react"
import Link from "next/link"

import { Section } from "./section"
import { StatusBadge } from "./status-badge"
import { DitherPattern } from "./dither-pattern"

export function Hero() {
  return (
    <Section className="pt-48 pb-20 md:pt-64 md:pb-32 grid md:grid-cols-2 gap-12 items-center relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 will-change-transform-opacity"
      >
        <div className="inline-flex items-center gap-2 px-2 py-1 bg-stone-100 border border-stone-200 rounded-full mb-8 relative overflow-hidden">
          <DitherPattern className="inset-0 opacity-[0.05]" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse relative z-10" />
          <span className="text-xs font-mono text-stone-600 uppercase tracking-widest relative z-10">Systemet är redo</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-stone-900 tracking-tight leading-[1.05] mb-6">
          Ditt svenska företag, smart och enkelt.
        </h1>
        <p className="text-xl text-stone-600 leading-relaxed max-w-lg mb-10">
          Scope AI tar hand om bokföring, löner, moms och kvitton automatiskt — så du kan fokusera på det som verkligen betyder något.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="group h-12 px-6 bg-stone-900 text-white rounded-lg flex items-center gap-2 font-medium hover:bg-stone-800 transition-all hover:pr-4 relative overflow-hidden"
          >
            <DitherPattern className="inset-0 opacity-[0.15]" />
            <span className="relative z-10">Kom igång gratis</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10" />
          </Link>
          <Link
            href="#"
            className="h-12 px-6 border border-stone-300 text-stone-900 rounded-lg flex items-center font-medium hover:bg-stone-50 transition-colors"
          >
            Boka demo
          </Link>
        </div>
      </motion.div>

      {/* Control Board Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative aspect-square md:aspect-[4/3] bg-stone-50 border border-stone-200 rounded-xl p-6 grid grid-cols-2 gap-4 overflow-hidden will-change-transform-opacity"
      >
        {/* Dither background - very subtle */}
        <DitherPattern className="inset-0 opacity-[0.02]" />
        
        {/* Module 1: Payroll */}
        <div className="col-span-2 bg-stone-100 border border-stone-200 rounded-lg p-4 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-stone-600" />
              <span className="text-xs font-mono text-stone-600 uppercase">Lönekörning</span>
            </div>
            <StatusBadge status="active" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
            </div>
            <div className="flex justify-between text-xs text-stone-600 font-mono">
              <span>Beräknar skatter...</span>
              <span>85%</span>
            </div>
          </div>
        </div>

        {/* Module 2: VAT */}
        <div className="bg-stone-100 border border-stone-200 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-4 h-4 text-stone-600" />
            <span className="text-xs font-mono text-stone-600 uppercase">Moms</span>
          </div>
          <div className="text-2xl font-bold text-stone-900">25,0%</div>
          <div className="text-xs text-stone-500">Nästa rapport: 12 dagar</div>
        </div>

        {/* Module 3: Receipts */}
        <div className="bg-stone-100 border border-stone-200 rounded-lg p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-stone-600" />
              <span className="text-xs font-mono text-stone-600 uppercase">Inkorg</span>
            </div>
            <div className="w-2 h-2 bg-amber-500" />
          </div>
          <div className="space-y-2 mt-4">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1 + (i * 0.2), duration: 0.5 }}
                className="flex items-center justify-between p-2 bg-white border border-stone-200 rounded text-xs text-stone-600"
              >
                <span>Receipt_00{i}.pdf</span>
                <Check className="w-3 h-3 text-emerald-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </Section>
  )
}
