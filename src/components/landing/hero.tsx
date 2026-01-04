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
          AI-driven bokföring för svenska företag.
        </h1>
        <p className="text-xl text-stone-600 leading-relaxed max-w-lg mb-10">
          Scope AI automatiserar hela din ekonomi — från transaktioner och kvitton till moms, löner och årsredovisning. Allt med svensk AI som förstår BAS-kontoplanen.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/register"
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

      import {ScopeDogIllustration} from "@/components/ui/icons/scope-dog-illustration"

      // ... (in component)

      {/* Control Board Animation / Illustration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative aspect-square md:aspect-[4/3] flex items-center justify-center p-6 will-change-transform-opacity"
      >
        <div className="relative w-full h-full max-w-md">
          <ScopeDogIllustration className="w-full h-full text-stone-900" />

          {/* Optional: Keep dither pattern behind if desired, or remove */}
          <DitherPattern className="inset-0 opacity-[0.05] absolute -z-10" />
        </div>
      </motion.div>
    </Section>
  )
}
