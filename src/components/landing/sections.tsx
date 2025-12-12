"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { 
  TrendingUp, Calendar, PieChart, ArrowUpRight, ArrowRight,
  Users, Building, FileText, Check, LayoutDashboard
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { IntegrationLogos } from "@/components/integration-logos"

import { Section, StatusBadge, DitherPattern } from "./ui"

// =============================================================================
// Hero
// =============================================================================

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
                className="h-full bg-violet-500 rounded-full"
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

// =============================================================================
// Analytics
// =============================================================================

export function Analytics() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  return (
    <Section id="analytics" className="bg-white border-y border-stone-200">
      <div className="grid md:grid-cols-2 gap-16 items-center">
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

// =============================================================================
// BentoGrid
// =============================================================================

export function BentoGrid() {
  return (
    <Section id="features">
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-stone-900 tracking-tight mb-4">Allt du behöver. Automatiserat.</h2>
        <p className="text-stone-600 max-w-2xl">
          Från daglig bokföring till årsredovisning — varje modul är byggd för att spara dig tid med AI som förstår svensk redovisning.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
        {/* Card 1: Books (Wide) - Row 1, Cols 1-2 */}
        <div className="md:col-span-2 md:row-span-1 bg-white border border-stone-200 rounded-xl p-8 hover:border-stone-300 transition-colors group">
          <div className="h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-stone-100 border border-stone-200 rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-stone-600" />
              </div>
              <StatusBadge status="complete" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-black transition-colors">AI-bokföring</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Banktransaktioner kategoriseras automatiskt mot BAS-kontoplanen. AI:n lär sig dina mönster och föreslår konteringar.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: VAT (Square) - Row 1, Col 3 */}
        <div className="md:col-span-1 md:row-span-1 bg-white border border-stone-200 rounded-xl p-8 hover:border-stone-300 transition-colors group">
          <div className="h-full flex flex-col justify-between">
            <div className="p-2 bg-stone-100 border border-stone-200 rounded-lg w-fit">
              <Building className="w-5 h-5 text-stone-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-black transition-colors">Momsdeklaration</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Genereras automatiskt från bokföringen. Skicka direkt till Skatteverket.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Payroll (Vertical) - Row 1-2, Col 4 */}
        <div className="md:col-span-1 md:row-span-2 bg-white border border-stone-200 rounded-xl p-8 hover:border-stone-300 transition-colors group">
          <div className="h-full flex flex-col">
            <div className="p-2 bg-stone-100 border border-stone-200 rounded-lg w-fit mb-8">
              <Users className="w-5 h-5 text-stone-600" />
            </div>
            <div className="space-y-4 flex-1">
              {[
                { label: "Löner", status: "complete" as const },
                { label: "Arbetsgivaravgift", status: "complete" as const },
                { label: "Pension", status: "pending" as const },
                { label: "Semester", status: "active" as const },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-stone-200 last:border-0">
                  <span className="text-sm font-medium text-stone-700">{item.label}</span>
                  <div className={cn("w-2 h-2 rounded-full", {
                    "bg-emerald-500": item.status === "complete",
                    "bg-amber-500": item.status === "pending",
                    "bg-violet-500": item.status === "active",
                  })} />
                </div>
              ))}
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-black transition-colors">Löner & AGI</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                AI beräknar löner, skatter och arbetsgivaravgifter. Lönebesked och AGI-deklarationer genereras automatiskt.
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Documents (Wide) - Row 2, Cols 1-3 */}
        <div className="md:col-span-3 md:row-span-1 bg-white border border-stone-200 rounded-xl p-8 text-stone-900 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.03)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] group-hover:animate-shine pointer-events-none" />
          <div className="relative z-10 h-full flex items-center justify-between">
            <div className="max-w-md">
              <div className="p-2 bg-stone-100 border border-stone-200 rounded-lg w-fit mb-6">
                <FileText className="w-5 h-5 text-stone-700" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Kvitton & Fakturor</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Skanna kvitton, ladda upp fakturor — AI:n matchar automatiskt mot transaktioner och föreslår kontering.
              </p>
            </div>
            <div className="hidden md:flex gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-24 h-32 bg-stone-100 border border-stone-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

// =============================================================================
// IntegrationMesh
// =============================================================================

export function IntegrationMesh() {
  const integrations: { name: keyof typeof IntegrationLogos; angle: number }[] = [
    { name: "Skatteverket", angle: 0 },
    { name: "SEB", angle: 51 },
    { name: "Swedbank", angle: 103 },
    { name: "Handelsbanken", angle: 154 },
    { name: "Nordea", angle: 206 },
    { name: "Kivra", angle: 257 },
    { name: "BankID", angle: 309 },
  ]
  
  return (
    <Section className="border-y border-stone-200 bg-stone-50">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left side - Text only */}
        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight mb-4">Kopplat till allt du behöver.</h2>
          <p className="text-stone-600 leading-relaxed">
            Direktkoppling till svenska banker, Skatteverket, Kivra och BankID. Allt synkas automatiskt — inga manuella importer.
          </p>
        </div>

        {/* Right side - Orbital diagram with logos */}
        <div className="relative w-full max-w-sm mx-auto aspect-square">
          {/* Connection lines with energy flow */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 300">
            <defs>
              {/* Define individual gradients for each line direction */}
              {integrations.map((integration, i) => {
                const angleRad = (integration.angle - 90) * (Math.PI / 180)
                const x = 150 + Math.cos(angleRad) * 100
                const y = 150 + Math.sin(angleRad) * 100
                return (
                  <linearGradient 
                    key={`gradient-${i}`}
                    id={`energyGradient-${i}`} 
                    x1={x} y1={y} x2="150" y2="150"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0">
                      <animate 
                        attributeName="offset" 
                        values="0;1" 
                        dur="1.5s" 
                        repeatCount="indefinite"
                        begin={`${i * 0.2}s`}
                      />
                    </stop>
                    <stop offset="10%" stopColor="#8b5cf6" stopOpacity="1">
                      <animate 
                        attributeName="offset" 
                        values="0.1;1.1" 
                        dur="1.5s" 
                        repeatCount="indefinite"
                        begin={`${i * 0.2}s`}
                      />
                    </stop>
                    <stop offset="20%" stopColor="#a78bfa" stopOpacity="0">
                      <animate 
                        attributeName="offset" 
                        values="0.2;1.2" 
                        dur="1.5s" 
                        repeatCount="indefinite"
                        begin={`${i * 0.2}s`}
                      />
                    </stop>
                  </linearGradient>
                )
              })}
            </defs>
            
            {/* Static background lines */}
            {integrations.map((integration, i) => {
              const angleRad = (integration.angle - 90) * (Math.PI / 180)
              const x = 150 + Math.cos(angleRad) * 100
              const y = 150 + Math.sin(angleRad) * 100
              return (
                <line
                  key={`static-${i}`}
                  x1="150"
                  y1="150"
                  x2={x}
                  y2={y}
                  stroke="#d4d4d8"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.4"
                />
              )
            })}
            
            {/* Energy flow lines */}
            {integrations.map((integration, i) => {
              const angleRad = (integration.angle - 90) * (Math.PI / 180)
              const x = 150 + Math.cos(angleRad) * 100
              const y = 150 + Math.sin(angleRad) * 100
              return (
                <line
                  key={`energy-${i}`}
                  x1={x}
                  y1={y}
                  x2="150"
                  y2="150"
                  stroke={`url(#energyGradient-${i})`}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
          
          {/* Center hub - Scope AI (circle) - removed pulse animation */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center z-10 border border-stone-200 will-change-transform-opacity"
          >
            <span className="text-stone-900 font-bold text-xs">Scope AI</span>
          </motion.div>
          
          {/* Orbital integration nodes with logos */}
          {integrations.map((integration, i) => {
            const angleRad = (integration.angle - 90) * (Math.PI / 180)
            const radius = 33
            const x = 50 + Math.cos(angleRad) * radius
            const y = 50 + Math.sin(angleRad) * radius
            const LogoComponent = IntegrationLogos[integration.name]
            const isLargeSize = integration.name === "Handelsbanken"
            const isMediumSize = integration.name === "Nordea"
            
            return (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group will-change-transform-opacity"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div className={cn("bg-stone-50 border border-stone-200 rounded-full flex items-center justify-center hover:bg-white hover:border-stone-300 transition-all cursor-default", "w-12 h-12")}>
                  <LogoComponent className={cn("text-stone-900", isLargeSize ? "w-8 h-8" : isMediumSize ? "w-7 h-7" : "w-6 h-6")} />
                </div>
                {/* Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-stone-600 whitespace-nowrap">
                  {integration.name}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
