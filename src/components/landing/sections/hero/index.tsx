"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { HeroDemo } from "./demo"

export function Hero() {
  // Ref for the demo container to detect visibility
  const demoRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(demoRef, { amount: 0.3 }) // 30% visible to trigger

  // Track current step for animations
  const [step, setStep] = useState(0)

  // Force restart of timeline
  const [restartKey, setRestartKey] = useState(0)
  const [isPaused, setIsPaused] = useState(true) // Start paused until visible
  const [timelineOffset, setTimelineOffset] = useState(0)

  // Pause/resume based on visibility
  useEffect(() => {
    if (isInView) {
      // Use a timeout to avoid synchronous state update during render phase of parent
      const timer = setTimeout(() => {
        setStep(0)
        setTimelineOffset(0)
        setIsPaused(false)
        setRestartKey(prev => prev + 1)
      }, 0)
      return () => clearTimeout(timer)
    } else {
      // When going out of view, pause
      const timer = setTimeout(() => setIsPaused(true), 0)
      return () => clearTimeout(timer)
    }
  }, [isInView])

  // Handle window resize to update coordinates in the demo
  useEffect(() => {
    const handleResize = () => {
      // Debounce restart to avoid rapid flickering
      const id = setTimeout(() => {
        setRestartKey(prev => prev + 1)
      }, 500)
      return () => clearTimeout(id)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    setIsPaused(false)

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
    <section className="px-6 md:px-12 lg:px-24 pt-8 pb-16 max-w-[1400px] mx-auto">
      {/* Centered Text Content - Above */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        {/* System Badge */}
        <div className="flex justify-center mb-8">
          <div className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-violet-200 rounded-full overflow-hidden shadow-sm">
            <div className="absolute inset-0 opacity-[0.08] bg-dither-pattern" />
            <div className="relative flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-xs font-mono text-stone-600 uppercase tracking-widest leading-none">Redo att köras</span>
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight leading-[1.1] mb-6 max-w-3xl mx-auto">
          <span className="hero-title-glow">Din bokföring, fast smartare</span> — för svenska företag.
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-stone-600 leading-relaxed max-w-2xl mx-auto mb-10">
          Scope automatiserar din administration — kvitton, löner, moms. Vi automatiserar det manuella, så du kan fokusera på affärerna.
        </p>

        {/* Dual CTAs - Centered */}
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="h-12 px-8 bg-stone-900 text-white rounded-lg flex items-center gap-2 font-medium hover:bg-stone-800 transition-colors"
          >
            Kom igång gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="#contact"
            className="h-12 px-6 bg-white/10 backdrop-blur-md border border-white/20 text-stone-900 rounded-lg flex items-center gap-2 font-medium hover:bg-white/20 transition-all shadow-sm"
          >
            Boka demo
          </Link>
        </div>
      </motion.div>

      {/* Demo "Cinema Screen" - Below with margins */}
      <motion.div
        ref={demoRef}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative"
      >
        {/* Stepper - Above demo */}
        <div className="flex justify-center mb-6">
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
                      <div className="absolute inset-0 border-t-2 border-stone-200 border-dotted" />
                      <div
                        className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out ${isComplete ? 'bg-emerald-500' : 'bg-stone-900'}`}
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
                    ? 'bg-stone-900 border-stone-900'
                    : index < currentSection
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'bg-white border-stone-300'
                    }`}>
                    {index < currentSection ? (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${currentSection === index ? 'bg-white' : 'bg-transparent'}`} />
                    )}
                  </div>
                  <span className={`text-xs font-medium transition-colors duration-300 ${currentSection === index
                    ? 'text-stone-900'
                    : 'text-stone-500 group-hover:text-stone-700'
                    }`}>
                    {section.name}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Container - Cinema Screen */}
        <div className="bg-stone-100 rounded-2xl p-4 border border-stone-200">
          <HeroDemo
            step={step}
            setStep={setStep}
            restartKey={restartKey}
            timelineOffset={timelineOffset}
            setTimelineOffset={setTimelineOffset}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            onLoopComplete={() => setRestartKey(prev => prev + 1)}
          />
        </div>
      </motion.div>
    </section>
  )
}

