
"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Check, ChevronRight, Command, CreditCard, FileText, Globe, LayoutDashboard, Shield, Users, Zap, Activity, Building, Lock, TrendingUp, Calendar, PieChart, ArrowUpRight, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { IntegrationLogos } from "@/components/integration-logos"

// --- Components ---

function Section({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("px-6 py-24 md:py-32 max-w-[1400px] mx-auto", className)}>
      {children}
    </section>
  )
}

function GridBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <div className="absolute inset-0 bg-white" />
      {/* Dithered gradient background - positioned at actual top */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.12]" style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='1' height='1' fill='%23000'/%3E%3Crect x='2' y='1' width='1' height='1' fill='%23000'/%3E%3Crect x='1' y='2' width='1' height='1' fill='%23000'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23000'/%3E%3C/svg%3E")`,
        backgroundSize: '4px 4px',
        maskImage: 'radial-gradient(ellipse at top right, black 0%, transparent 60%)'
      }} />
      {/* Bottom left dither accent */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-[0.08]" style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='1' height='1' fill='%23000'/%3E%3Crect x='2' y='1' width='1' height='1' fill='%23000'/%3E%3Crect x='1' y='2' width='1' height='1' fill='%23000'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23000'/%3E%3C/svg%3E")`,
        backgroundSize: '4px 4px',
        maskImage: 'radial-gradient(ellipse at bottom left, black 0%, transparent 60%)'
      }} />
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e7e5e4_1px,transparent_1px),linear-gradient(to_bottom,#e7e5e4_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
    </div>
  )
}

function StatusBadge({ status }: { status: "active" | "pending" | "complete" | "warning" }) {
  const colors = {
    active: "bg-blue-100 text-blue-700 border-blue-300",
    pending: "bg-amber-100 text-amber-700 border-amber-300",
    complete: "bg-emerald-100 text-emerald-700 border-emerald-300",
    warning: "bg-red-100 text-red-700 border-red-300",
  }

  const labels = {
    active: "Processing",
    pending: "Pending",
    complete: "Complete",
    warning: "Attention",
  }

  return (
    <span className={cn("text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 border", colors[status])}>
      {labels[status]}
    </span>
  )
}

function DitherPattern({ className, opacity = 0.1 }: { className?: string; opacity?: number }) {
  return (
    <div 
      className={cn("absolute pointer-events-none", className)}
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='1' height='1' fill='%23000'/%3E%3Crect x='2' y='1' width='1' height='1' fill='%23000'/%3E%3Crect x='1' y='2' width='1' height='1' fill='%23000'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23000'/%3E%3C/svg%3E")`,
        backgroundSize: '4px 4px'
      }}
    />
  )
}

// --- Sections ---

function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 inset-x-0 z-50 h-16 border-b border-stone-200 bg-white/80 backdrop-blur-md"
    >
      <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-stone-900 rounded-sm" />
          <span className="text-stone-900 font-bold tracking-tight text-lg">Scope AI</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <Link href="#features" className="hover:text-stone-900 transition-colors">Platform</Link>
            <Link href="#pricing" className="hover:text-stone-900 transition-colors">Pricing</Link>
          </div>
          <div className="h-4 w-[1px] bg-stone-200 hidden md:block" />
          <Link href="/transactions" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
            Log in
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium bg-stone-900 text-white px-4 py-2 rounded-md hover:bg-stone-800 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}

function Hero() {
  return (
    <Section className="pt-48 pb-20 md:pt-64 md:pb-32 grid md:grid-cols-2 gap-12 items-center relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-2 py-1 bg-stone-100 border border-stone-200 rounded-full mb-8 relative overflow-hidden">
          <DitherPattern className="inset-0 opacity-[0.05]" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse relative z-10" />
          <span className="text-xs font-mono text-stone-600 uppercase tracking-widest relative z-10">System Operational</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-stone-900 tracking-tight leading-[1.05] mb-6">
          The operating system for your Swedish company.
        </h1>
        <p className="text-xl text-stone-600 leading-relaxed max-w-lg mb-10">
          Scope AI automates bookkeeping, payroll, VAT, receipts, and compliance — so your AB runs itself.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="group h-12 px-6 bg-stone-900 text-white rounded-lg flex items-center gap-2 font-medium hover:bg-stone-800 transition-all hover:pr-4 relative overflow-hidden"
          >
            <DitherPattern className="inset-0 opacity-[0.15]" />
            <span className="relative z-10">Get started</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10" />
          </Link>
          <Link
            href="#"
            className="h-12 px-6 border border-stone-300 text-stone-900 rounded-lg flex items-center font-medium hover:bg-stone-50 transition-colors"
          >
            Talk to sales
          </Link>
        </div>
      </motion.div>

      {/* Control Board Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative aspect-square md:aspect-[4/3] bg-stone-50 border border-stone-200 rounded-xl p-6 grid grid-cols-2 gap-4 overflow-hidden"
      >
        {/* Dither background - very subtle */}
        <DitherPattern className="inset-0 opacity-[0.02]" />
        
        {/* Module 1: Payroll */}
        <div className="col-span-2 bg-stone-100 border border-stone-200 rounded-lg p-4 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-stone-600" />
              <span className="text-xs font-mono text-stone-600 uppercase">Payroll Run</span>
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
              <span>Calculating taxes...</span>
              <span>85%</span>
            </div>
          </div>
        </div>

        {/* Module 2: VAT */}
        <div className="bg-stone-100 border border-stone-200 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-4 h-4 text-stone-600" />
            <span className="text-xs font-mono text-stone-600 uppercase">VAT</span>
          </div>
          <div className="text-2xl font-bold text-stone-900">25.0%</div>
          <div className="text-xs text-stone-500">Next report: 12 days</div>
        </div>

        {/* Module 3: Receipts */}
        <div className="bg-stone-100 border border-stone-200 rounded-lg p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-stone-600" />
              <span className="text-xs font-mono text-stone-600 uppercase">Inbox</span>
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

function BentoGrid() {
  return (
    <Section id="features">
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-stone-900 tracking-tight mb-4">The Architectural Interface</h2>
        <p className="text-stone-600 max-w-2xl">
          Every financial operation is isolated, modularized, and automated. No clutter, just control.
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
              <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-black transition-colors">Autonomous Bookkeeping</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Direct bank feeds are classified by AI, reconciled against receipts, and balanced in real-time.
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
              <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-black transition-colors">VAT Automation</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Accurate filings, delivered.
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
                { label: "Salaries", status: "complete" as const },
                { label: "Employer Tax", status: "complete" as const },
                { label: "Pension", status: "pending" as const },
                { label: "Vacation", status: "active" as const },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-stone-200 last:border-0">
                  <span className="text-sm font-medium text-stone-700">{item.label}</span>
                  <div className={cn("w-2 h-2 rounded-full", {
                    "bg-emerald-500": item.status === "complete",
                    "bg-amber-500": item.status === "pending",
                    "bg-blue-500": item.status === "active",
                  })} />
                </div>
              ))}
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-black transition-colors">Payroll Engine</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                One click calculates salaries, generates payslips, and files taxes.
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
              <h3 className="text-lg font-bold text-stone-900 mb-2">Unified Document System</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Every invoice, receipt, and contract is automatically sorted, tagged, and linked to its corresponding transaction.
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

function IntegrationMesh() {
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
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight mb-4">Your entire company. Synchronized.</h2>
          <p className="text-stone-600 leading-relaxed">
            Bank feeds, tax authority integrations, payroll, receipts, and compliance — unified into one intelligent system.
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
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0">
                      <animate 
                        attributeName="offset" 
                        values="0;1" 
                        dur="1.5s" 
                        repeatCount="indefinite"
                        begin={`${i * 0.2}s`}
                      />
                    </stop>
                    <stop offset="10%" stopColor="#3b82f6" stopOpacity="1">
                      <animate 
                        attributeName="offset" 
                        values="0.1;1.1" 
                        dur="1.5s" 
                        repeatCount="indefinite"
                        begin={`${i * 0.2}s`}
                      />
                    </stop>
                    <stop offset="20%" stopColor="#60a5fa" stopOpacity="0">
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
            transition={{ duration: 0.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center z-10 border border-stone-200"
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
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
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

function SocialProof() {
  const logos = ["Volvo", "Klarna", "Spotify", "H&M", "IKEA", "Ericsson", "Northvolt", "Truecaller"]
  
  return (
    <div className="border-b border-stone-200 bg-white py-8 overflow-hidden">
      <div className="flex animate-marquee">
        {[...logos, ...logos].map((logo, i) => (
          <div 
            key={i} 
            className="flex-shrink-0 px-12 text-xl font-bold text-stone-400 hover:text-stone-600 transition-colors duration-300 cursor-default"
          >
            {logo}
          </div>
        ))}
      </div>
    </div>
  )
}

function Analytics() {
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
                  className="bg-white border border-stone-200 rounded-lg p-4"
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

function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const testimonials = [
    {
      quote: "Scope AI eliminated our monthly admin work. What used to take days now happens automatically.",
      author: "Anna Lindberg",
      title: "CFO, TechVenture AB",
    },
    {
      quote: "VAT filings now just happen. I get a notification that it's done, and that's it.",
      author: "Erik Johansson",
      title: "Founder, Nordic Solutions",
    },
    {
      quote: "The payroll automation alone saved us 20 hours per month. It's not just software, it's peace of mind.",
      author: "Maria Svensson",
      title: "Operations Manager, Growth Co",
    },
  ]
  
  return (
    <Section className="overflow-hidden">
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Trusted by Swedish companies</h2>
      </div>
      
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex-shrink-0 w-[400px] bg-white border border-stone-200 rounded-xl p-8 group hover:border-stone-300 transition-colors"
            >
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
              
              <blockquote className="text-lg text-stone-700 leading-relaxed mb-8 font-serif italic">
                "{t.quote}"
              </blockquote>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center">
                  <span className="text-stone-700 text-sm font-medium">{t.author.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-stone-900">{t.author}</div>
                  <div className="text-xs text-stone-500">{t.title}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Navigation arrows */}
        <div className="hidden md:flex items-center gap-2 mt-6">
          <button className="p-2 border border-stone-200 rounded-lg hover:border-stone-300 hover:bg-stone-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-stone-600" />
          </button>
          <button className="p-2 border border-stone-200 rounded-lg hover:border-stone-300 hover:bg-stone-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-stone-600" />
          </button>
        </div>
      </div>
    </Section>
  )
}

function Pricing() {
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

function Footer() {
  return (
    <footer className="bg-stone-50 text-stone-600 py-24 px-6 border-t border-stone-200">
      <div className="max-w-[1400px] mx-auto grid md:grid-cols-5 gap-12">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 bg-stone-900 rounded-sm" />
            <span className="text-stone-900 font-bold tracking-tight text-lg">Scope AI</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs mb-8">
            The operating system for the next generation of Swedish companies.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors"
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {[
          { title: "Product", links: ["Platform", "Features", "Pricing", "API"] },
          { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
          { title: "Legal", links: ["Privacy", "Terms", "Security", "GDPR"] },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="text-stone-900 font-medium mb-6">{col.title}</h4>
            <ul className="space-y-4 text-sm">
              {col.links.map(link => (
                <li key={link}>
                  <Link href="#" className="hover:text-stone-900 transition-colors">{link}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-stone-200">
        <div className="text-xs text-stone-500">
          © 2024 Scope AI AB. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default function ScopeLandingPage() {
  return (
    <main className="min-h-screen relative font-sans text-stone-900 selection:bg-stone-200 selection:text-stone-900 scroll-smooth">
      <GridBackground />
      <Navbar />
      <Hero />
      <SocialProof />
      <BentoGrid />
      <IntegrationMesh />
      <Analytics />
      <Testimonials />
      <Pricing />
      <Footer />
    </main>
  )
}
