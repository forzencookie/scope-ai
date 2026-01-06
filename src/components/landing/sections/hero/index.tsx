"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { SectionHeader } from "../../shared/section-header"
import { HeroDemo } from "./demo"

export function Hero() {
  // Track current step for animations
  const [step, setStep] = useState(0)

  // Force restart of timeline
  const [restartKey, setRestartKey] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [timelineOffset, setTimelineOffset] = useState(0)

  // Define sections for navigation
  const sections = [
    { id: 0, name: "Start", stepRange: [0, 1] },
    { id: 1, name: "Förfrågan", stepRange: [2, 4] },
    { id: 2, name: "Justering", stepRange: [5, 9] },
    { id: 3, name: "Klart", stepRange: [10, 12] },
  ]

  // Get current section based on step
  const currentSection = sections.findIndex(
    (s) => step >= s.stepRange[0] && step <= s.stepRange[1]
  )

  // Jump to a specific section
  const jumpToSection = (sectionId: number) => {
    // Always unpause to continue the loop
    setIsPaused(false)

    const section = sections[sectionId]

    if (sectionId === 0) {
      setStep(0)
      setTimelineOffset(1500)
      setRestartKey(prev => prev + 1)
    } else if (sectionId === 1) {
      setStep(4)
      setTimelineOffset(12500)
      setRestartKey(prev => prev + 1)
    } else if (sectionId === 2) {
      setStep(8)
      setTimelineOffset(23500)
      setRestartKey(prev => prev + 1)
    } else if (sectionId === 3) {
      setStep(12)
      setTimelineOffset(34500)
      setRestartKey(prev => prev + 1)
    }
  }

  return (
    <section className="px-3 md:px-4 pt-4 pb-12 max-w-[2400px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-background rounded-3xl overflow-hidden"
      >
        {/* Status Bar Row (Badge + Stepper) - Above content */}
        <div className="relative z-20 w-full px-8 md:px-16 pt-12 grid grid-cols-1 lg:grid-cols-[384px_1fr] gap-12">
          {/* Left Placeholder (Badge) */}
          <div className="flex items-center justify-start">
            {/* System Badge - Matched exactly to Login page styling */}
            <div className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-violet-200 rounded-full overflow-hidden shadow-sm">
              <div className="absolute inset-0 opacity-[0.08] bg-dither-pattern" />
              <div className="relative flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-xs font-mono text-stone-600 uppercase tracking-widest leading-none">Systemet är redo</span>
              </div>
            </div>
          </div>

          {/* Right Centered Container (Stepper) */}
          <div className="flex justify-center items-center">
            <div className="flex items-center">
              {sections.map((section, index) => (
                <div key={section.id} className="flex items-center">
                  {/* Connecting Line with Progress */}
                  {index > 0 && (() => {
                    const prevSection = sections[index - 1]
                    const isComplete = currentSection >= index
                    const isActive = currentSection === index - 1

                    let progress = 0
                    if (isComplete) {
                      progress = 100
                    } else if (isActive) {
                      const totalSteps = prevSection.stepRange[1] - prevSection.stepRange[0] + 1
                      const currentStepInSection = step - prevSection.stepRange[0]
                      progress = Math.min(100, Math.max(0, ((currentStepInSection + 0.5) / totalSteps) * 100))
                    }

                    return (
                      <div className="relative h-[2px] w-6 md:w-10 mx-2">
                        <div className="absolute inset-0 border-t-2 border-border border-dotted" />
                        <div
                          className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out ${isComplete ? 'bg-emerald-500' : 'bg-primary'
                            }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )
                  })()}

                  {/* Step Item */}
                  <button
                    onClick={() => jumpToSection(index)}
                    className="group flex items-center gap-2 relative"
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${currentSection === index
                      ? 'bg-primary border-primary'
                      : index < currentSection
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'bg-white border-border'
                      }`}>
                      {index < currentSection ? (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${currentSection === index ? 'bg-white' : 'bg-transparent'
                          }`} />
                      )}
                    </div>
                    <span className={`text-xs font-medium transition-colors duration-300 ${currentSection === index
                      ? 'text-foreground'
                      : 'text-muted-foreground group-hover:text-muted-foreground'
                      }`}>
                      {section.name}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Flexible layout - left shrinks, right grows */}
        <div className="relative z-10 w-full px-8 md:px-16 pt-8 pb-16 flex flex-col lg:flex-row gap-12 items-stretch">

          {/* Left Column: Content - shrink to fit */}
          <div className="flex flex-col items-start justify-center text-left lg:max-w-sm shrink-0">
            <SectionHeader
              title="AI-driven bokföring för svenska företag."
              description="Scope AI automatiserar hela din ekonomi — från transaktioner och kvitton till moms, löner och årsredovisning."
              align="left"
              className="mb-10"
            />

            {/* CTA Button */}
            <Link
              href="/register"
              className="h-12 px-8 bg-primary text-white rounded-lg flex items-center gap-2 font-medium hover:bg-stone-800 transition-colors"
            >
              Kom igång gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right Column: Chat Demo - grows to fill */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full h-full relative z-10 lg:mt-0 mt-8"
            >
              {/* Outer border layer for visual depth - Standardized with Bento Grid */}
              <div className="bg-muted/30 rounded-2xl p-3 border border-border/50">
                <HeroDemo
                  step={step}
                  setStep={setStep}
                  restartKey={restartKey}
                  timelineOffset={timelineOffset}
                  setTimelineOffset={setTimelineOffset}
                  isPaused={isPaused}
                  setIsPaused={setIsPaused}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
