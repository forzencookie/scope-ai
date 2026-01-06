"use client"

import { cn } from "@/lib/utils"

// =============================================================================
// Section
// =============================================================================

interface SectionProps {
  children: React.ReactNode
  className?: string
  id?: string
}

export function Section({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("px-3 md:px-4 py-24 md:py-32 max-w-[2400px] mx-auto", className)}>
      {children}
    </section>
  )
}

// =============================================================================
// StatusBadge
// =============================================================================

export type BadgeStatus = "active" | "pending" | "complete" | "warning"

interface StatusBadgeProps {
  status: BadgeStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = {
    active: "bg-violet-100 text-violet-700 border-violet-300",
    pending: "bg-amber-100 text-amber-700 border-amber-300",
    complete: "bg-emerald-100 text-emerald-700 border-emerald-300",
    warning: "bg-red-100 text-red-700 border-red-300",
  }

  const labels = {
    active: "Aktiv",
    pending: "Väntar",
    complete: "Klar",
    warning: "Varning",
  }

  return (
    <span className={cn("text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 border", colors[status])}>
      {labels[status]}
    </span>
  )
}

// =============================================================================
// DitherPattern
// =============================================================================

interface DitherPatternProps {
  className?: string
  opacity?: number
}

export function DitherPattern({ className, opacity = 0.1 }: DitherPatternProps) {
  return (
    <div
      className={cn("absolute pointer-events-none bg-dither-pattern", className)}
      style={{ opacity }}
    />
  )
}

// =============================================================================
// GridBackground
// =============================================================================

export function GridBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <div className="absolute inset-0 bg-white" />
      {/* Dithered gradient background - positioned at actual top */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.12] bg-dither-pattern mask-radial-tr" />
      {/* Bottom left dither accent */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-[0.08] bg-dither-pattern mask-radial-bl" />
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-noise-texture" />
      <div className="absolute inset-0 bg-grid-stone mask-radial-top opacity-40" />
    </div>
  )
}

// =============================================================================
// SocialProof
// =============================================================================

export function SocialProof() {
  const logos = ["Volvo", "Klarna", "Spotify", "H&M", "IKEA", "Ericsson", "Northvolt", "Truecaller"]

  return (
    <section className="px-3 md:px-4 py-4 max-w-[2400px] mx-auto">
      <div className="bg-stone-50 rounded-2xl py-6 overflow-hidden">
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
    </section>
  )
}

