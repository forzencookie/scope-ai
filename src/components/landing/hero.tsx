"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

// Demo cursor component - macOS-style pointer
function DemoCursor({ x, y, clicking }: { x: number; y: number; clicking: boolean }) {
  return (
    <motion.div
      className="absolute z-50 pointer-events-none"
      initial={{ x, y }}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.div
        animate={{ scale: clicking ? 0.9 : 1 }}
        transition={{ duration: 0.08 }}
      >
        {/* macOS-style pointer cursor */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="drop-shadow-lg">
          <path
            d="M8.5 4.5L8.5 22.5L12.5 18.5L15.5 25.5L18.5 24L15.5 17L21.5 17L8.5 4.5Z"
            fill="white"
            stroke="#1c1917"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
      {/* Click ripple effect */}
      <AnimatePresence>
        {clicking && (
          <motion.div
            className="absolute top-3 left-1 w-3 h-3 rounded-full bg-stone-900/20"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function Hero() {
  // Track current step for animations
  const [step, setStep] = useState(0)

  // Force restart of timeline
  const [restartKey, setRestartKey] = useState(0)
  const [inputText, setInputText] = useState("")
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [clicking, setClicking] = useState(false)
  const [typedComment, setTypedComment] = useState("")
  const [aiStreamText, setAiStreamText] = useState("")
  const [hoverButton, setHoverButton] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)

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

  const [timelineOffset, setTimelineOffset] = useState(0)

  // Jump to a specific section
  const jumpToSection = (sectionId: number) => {
    // Always unpause to continue the loop
    setIsPaused(false)

    const section = sections[sectionId]
    const targetStep = section.stepRange[0]

    // Reset relevant state based on section
    setCursorPos({ x: 0, y: 0 })
    setHoverButton(null)
    setClicking(false)

    if (sectionId === 0) {
      setStep(0)
      setInputText("")
      setTypedComment("")
      setTimelineOffset(1500)
      setRestartKey(prev => prev + 1)
    } else if (sectionId === 1) {
      setStep(4) // Show first AI card
      setInputText("")
      setTypedComment("")
      setAiStreamText("")
      setTimelineOffset(12500) // Skip to start of action
      setRestartKey(prev => prev + 1)
    } else if (sectionId === 2) {
      setStep(8) // Show updated card with comment
      setInputText("")
      setTypedComment("Ändra konto till 5810")
      setAiStreamText("")
      setTimelineOffset(23500) // Skip to start of action
      setRestartKey(prev => prev + 1)
    } else if (sectionId === 3) {
      setStep(12) // Show final AI response
      setInputText("")
      setTypedComment("")
      setAiStreamText("Inga problem! 🙌 Det var ditt 47:e kvitto denna månad — du håller ett bra tempo.")
      setTimelineOffset(34500)
      setRestartKey(prev => prev + 1)
    }
  }

  // Steps:
  // 0: Welcome state - greeting visible, no activity
  // 1: User clicked input, typing starts, greeting fades
  // 2: Message sent, user bubble appears
  // 3: AI thinking
  // 4: AI response + card
  // 5: Cursor to Kommentera, click
  // 6: Typing comment in input
  // 7: Comment sent
  // 8: AI thinking
  // 9: AI adjusted card
  // 10: Cursor to Godkänn, click
  // 11: Success card

  useEffect(() => {
    // If paused, don't run the timeline
    if (isPaused) return

    const userMessage = "Bokför det här kvittot"
    const comment = "Ändra konto till 5810"

    const timeline = [
      // Phase 1: Cursor appears at input bar, greeting fades, typing starts
      { delay: 2000, action: () => setCursorPos({ x: 200, y: 465 }) },
      // Highlight input and click (wait for cursor to arrive - approx 600ms)
      { delay: 2700, action: () => setHoverButton('input') },
      { delay: 2850, action: () => { setClicking(true); setTimeout(() => setClicking(false), 100) } },
      // Type in input bar (70ms per char)
      ...userMessage.split('').map((_, i) => ({
        delay: 3000 + i * 70,
        action: () => setInputText(userMessage.slice(0, i + 1))
      })),
      // Pause after typing
      // Cursor to send button
      { delay: 6000, action: () => setCursorPos({ x: 540, y: 485 }) },
      { delay: 6400, action: () => setHoverButton('send') },
      // Click send
      { delay: 6800, action: () => { setClicking(true); setTimeout(() => setClicking(false), 100) } },
      // Clear input, show message
      { delay: 7100, action: () => { setInputText(""); setStep(2); setHoverButton(null) } },
      // Hide cursor
      { delay: 7300, action: () => setCursorPos({ x: 0, y: 0 }) },
      // AI thinking (longer pause)
      { delay: 8000, action: () => setStep(3) },
      // AI response + card (pause to read)
      { delay: 10000, action: () => setStep(4) },
      // Cursor to Kommentera button (wait for user to read card)
      { delay: 13000, action: () => setCursorPos({ x: 140, y: 295 }) },
      { delay: 13500, action: () => setHoverButton('kommentera') },
      // Click Kommentera
      { delay: 14000, action: () => { setClicking(true); setTimeout(() => setClicking(false), 100) } },
      // Input bar highlights immediately (like auto-focus), cursor hides
      { delay: 14300, action: () => { setStep(5); setHoverButton('input'); setCursorPos({ x: 0, y: 0 }) } },
      // Type comment directly (slower - 70ms per char)
      ...comment.split('').map((_, i) => ({
        delay: 14800 + i * 70,
        action: () => setInputText(comment.slice(0, i + 1))
      })),
      // Done typing, remove input highlight
      { delay: 16500, action: () => setHoverButton(null) },
      // Cursor to send
      { delay: 17200, action: () => setCursorPos({ x: 540, y: 485 }) },
      { delay: 17600, action: () => setHoverButton('send') },
      // Click send
      { delay: 18000, action: () => { setClicking(true); setTimeout(() => setClicking(false), 100) } },
      // Clear input, show comment
      { delay: 18300, action: () => { setInputText(""); setTypedComment(comment); setStep(6); setHoverButton(null) } },
      // Hide cursor
      { delay: 18500, action: () => setCursorPos({ x: 0, y: 0 }) },
      // AI thinking (longer pause)
      { delay: 19000, action: () => setStep(7) },
      // AI adjusted card (pause to read)
      { delay: 21000, action: () => setStep(8) },
      // Cursor to Godkänn button (wait for user to read)
      { delay: 24000, action: () => setCursorPos({ x: 40, y: 240 }) },
      { delay: 24500, action: () => setHoverButton('godkann') },
      // Click Godkänn
      { delay: 25000, action: () => { setClicking(true); setTimeout(() => setClicking(false), 100) } },
      // Success (pause to see transformation)
      { delay: 25300, action: () => { setStep(9); setCursorPos({ x: 0, y: 0 }); setHoverButton(null) } },
      // Pause to view success card (longer)
      { delay: 28000, action: () => setCursorPos({ x: 200, y: 465 }) },
      { delay: 28500, action: () => setHoverButton('input') },
      { delay: 29000, action: () => { setClicking(true); setTimeout(() => setClicking(false), 100); setHoverButton(null) } },
      // Type thank you character by character (slower)
      { delay: 29400, action: () => setInputText("T") },
      { delay: 29600, action: () => setInputText("Ta") },
      { delay: 29800, action: () => setInputText("Tac") },
      { delay: 30000, action: () => setInputText("Tack") },
      { delay: 30200, action: () => setInputText("Tack!") },
      // Cursor to send
      { delay: 31000, action: () => setCursorPos({ x: 540, y: 485 }) },
      { delay: 31400, action: () => setHoverButton('send') },
      { delay: 31800, action: () => { setClicking(true); setTimeout(() => setClicking(false), 100) } },
      // Show thank you, hide success card
      { delay: 32100, action: () => { setInputText(""); setStep(10); setHoverButton(null) } },
      { delay: 32300, action: () => setCursorPos({ x: 0, y: 0 }) },
      // AI thinking (longer)
      { delay: 32800, action: () => setStep(11) },
      // AI response - stream text
      { delay: 34500, action: () => setStep(12) },
      // Stream the AI response text (slower - 35ms per char)
      ..."Inga problem! 🙌 Det var ditt 47:e kvitto denna månad — du håller ett bra tempo.".split('').map((_, i) => ({
        delay: 34700 + i * 35,
        action: () => setAiStreamText("Inga problem! 🙌 Det var ditt 47:e kvitto denna månad — du håller ett bra tempo.".slice(0, i + 1))
      })),
      // Reset after longer pause
      {
        delay: 42000, action: () => {
          setStep(0)
          setInputText("")
          setTypedComment("")
          setAiStreamText("")
          setHoverButton(null)
          setCursorPos({ x: 0, y: 0 })
          setTimelineOffset(0)
          setRestartKey(prev => prev + 1)
        }
      },
    ]

    // Calculate active timeline based on offset
    const activeTimeline = timeline
      .filter(item => item.delay > timelineOffset)
      .map(item => ({ ...item, delay: item.delay - timelineOffset }))

    const timeouts = activeTimeline.map(({ delay, action }) => setTimeout(action, delay))
    return () => timeouts.forEach(clearTimeout)
  }, [isPaused, restartKey])

  const showCursor = (cursorPos.x > 0 || cursorPos.y > 0)
  const showGreeting = step === 0

  return (
    <section className="px-3 md:px-4 py-8 max-w-[2400px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gradient-to-b from-stone-100 to-stone-50 rounded-3xl overflow-hidden"
      >
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-grid-stone opacity-20" />
        <div className="absolute top-0 inset-x-0 h-[500px] opacity-[0.06] bg-dither-pattern mask-radial-top" />

        {/* Flexible layout - left shrinks, right grows */}
        <div className="relative z-10 w-full px-8 md:px-16 py-16 flex flex-col lg:flex-row gap-12 items-stretch">

          {/* Left Column: Content - shrink to fit */}
          <div className="flex flex-col items-start text-left lg:max-w-md shrink-0">
            {/* Status Badge */}
            <div className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-full mb-8 overflow-hidden">
              <div className="absolute inset-0 opacity-[0.08] bg-dither-pattern" />
              <div className="relative flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-stone-600 uppercase tracking-widest">Systemet är redo</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight leading-[1.1] mb-6">
              AI-driven bokföring för svenska företag.
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-stone-600 leading-relaxed mb-10">
              Scope AI automatiserar hela din ekonomi — från transaktioner och kvitton till moms, löner och årsredovisning.
            </p>

            {/* CTA Button */}
            <Link
              href="/register"
              className="h-12 px-8 bg-stone-900 text-white rounded-full flex items-center gap-2 font-medium hover:bg-stone-800 transition-colors"
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
              {/* Navigation Dots */}
              {/* Navigation Stepper */}
              <div className="flex justify-center items-center mb-6 px-4">
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
                        // Add 0.5 to show some progress even at start of step, and smooth it out
                        progress = Math.min(100, Math.max(0, ((currentStepInSection + 0.5) / totalSteps) * 100))
                      }

                      return (
                        <div className="relative h-[2px] w-6 md:w-10 mx-2">
                          {/* Background Dotted Line */}
                          <div className="absolute inset-0 border-t-2 border-stone-200 border-dotted" />

                          {/* Progress Fill */}
                          <div
                            className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out ${isComplete ? 'bg-emerald-500' : 'bg-stone-900'
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
                      {/* Circle Indicator */}
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${currentSection === index
                        ? 'bg-stone-900 border-stone-900'
                        : index < currentSection
                          ? 'bg-emerald-500 border-emerald-500' // Completed steps
                          : 'bg-white border-stone-200 group-hover:border-stone-300'
                        }`}>
                        {index < currentSection ? (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${currentSection === index ? 'bg-white' : 'bg-transparent'
                            }`} />
                        )}
                      </div>

                      {/* Label */}
                      <span className={`text-xs font-medium transition-colors duration-300 ${currentSection === index
                        ? 'text-stone-900'
                        : 'text-stone-400 group-hover:text-stone-600'
                        }`}>
                        {section.name}
                      </span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-3xl shadow-2xl shadow-stone-200/50 p-6 flex flex-col h-[560px] relative overflow-hidden">
                {/* Cursor */}
                {showCursor && (
                  <DemoCursor x={cursorPos.x} y={cursorPos.y} clicking={clicking} />
                )}

                {/* Welcome State - Greeting (fades when user starts) */}
                <AnimatePresence>
                  {showGreeting && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-6"
                    >
                      {/* Scope Logo */}
                      <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center mb-6">
                        <div className="w-5 h-5 bg-white rounded-sm" />
                      </div>
                      {/* Greeting */}
                      <p className="text-xl text-stone-600 text-center max-w-sm">
                        God eftermiddag! Vad vill du att jag hjälper dig med idag?
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chat Messages - visible after greeting fades */}
                <div className={`flex flex-col gap-3 flex-1 transition-opacity duration-300 ${showGreeting ? 'opacity-0' : 'opacity-100'}`}>
                  {/* User Message - only visible in first round (before comment sent) */}
                  <AnimatePresence>
                    {step >= 2 && step < 6 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-end gap-2"
                      >
                        <div className="rounded-lg px-3 py-1.5 bg-stone-900 text-white">
                          <p className="text-sm">Bokför det här kvittot</p>
                        </div>
                        <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-2 pr-3 text-xs">
                          <div className="w-8 h-8 rounded bg-stone-200 flex items-center justify-center">
                            <span className="text-lg">🧾</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-stone-700">taxi_kvitto.jpg</span>
                            <span className="text-stone-500">12 KB</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI Thinking - first round */}
                  <AnimatePresence>
                    {step === 3 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-stone-400"
                      >
                        Tänker...
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI Response + Original Card (before comment) */}
                  <AnimatePresence>
                    {step >= 4 && step < 6 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <p className="text-sm text-stone-700">
                          Jag tolkade kvittot. Vill du att jag bokför det?
                        </p>

                        <div className="rounded-xl border-2 border-dashed border-stone-400/40 bg-stone-50/50 overflow-hidden">
                          <div className="px-4 py-3 border-b border-stone-200/40 flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-200/60 text-base">
                              🧾
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">Skapa kvitto</h3>
                              <p className="text-xs text-stone-500">Taxi Stockholm AB • -495 kr</p>
                            </div>
                          </div>
                          <div className="px-4 py-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-stone-500">Leverantör</span>
                              <span className="font-medium">Taxi Stockholm AB</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-stone-500">Konto</span>
                              <span className="font-medium">5800 Resekostnader</span>
                            </div>
                          </div>
                          <div className="px-4 py-3 border-t border-stone-200/40 flex items-center gap-2">
                            <button className="h-7 px-3 bg-stone-900 text-white text-xs font-medium rounded-md flex items-center gap-1">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                              Godkänn
                            </button>
                            <button className={`h-7 px-3 text-stone-600 text-xs font-medium rounded-md ${hoverButton === 'kommentera' ? 'bg-stone-200' : 'hover:bg-stone-100'}`}>
                              Kommentera
                            </button>
                            <button className="h-7 px-3 text-stone-600 text-xs font-medium rounded-md hover:bg-stone-100 ml-auto">
                              Avbryt
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* User Comment */}
                  <AnimatePresence>
                    {step >= 6 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-end"
                      >
                        <div className="rounded-lg px-3 py-1.5 bg-stone-900 text-white">
                          <p className="text-sm">{typedComment}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI Thinking - second round (after comment) */}
                  <AnimatePresence>
                    {step === 7 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-stone-400"
                      >
                        Tänker...
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI Response + Card (transforms to green when approved) */}
                  <AnimatePresence>
                    {step >= 8 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <p className="text-sm text-stone-700">
                          {step === 9
                            ? "Klart! Kvittot är nu bokfört."
                            : "Perfekt, jag ändrade kontot. Godkänn för att bokföra."
                          }
                        </p>

                        {/* Card - transforms to green when step === 9 */}
                        <div className={`rounded-xl border-2 overflow-hidden transition-colors duration-300 ${step === 9
                          ? 'border-emerald-500 bg-emerald-50/30'
                          : 'border-dashed border-stone-400/40 bg-stone-50/50'
                          }`}>
                          <div className={`px-4 py-3 flex items-center gap-3 ${step === 9 ? 'border-b border-emerald-200/60' : 'border-b border-stone-200/40'
                            }`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${step === 9 ? 'bg-emerald-500/20' : 'bg-stone-200/60'
                              }`}>
                              {step === 9 ? (
                                <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                              ) : (
                                <span>🧾</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">Skapa kvitto</h3>
                              <p className="text-xs text-stone-500">Taxi Stockholm AB • -495 kr</p>
                            </div>
                            {step === 9 && (
                              <span className="text-xs font-medium px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-700">
                                Bokfört ✓
                              </span>
                            )}
                          </div>
                          <div className="px-4 py-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-stone-500">Leverantör</span>
                              <span className="font-medium">Taxi Stockholm AB</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-stone-500">Konto</span>
                              <span className="font-medium text-emerald-600">5810 Taxi & Transport</span>
                            </div>
                          </div>
                          {/* Buttons - only show before approval */}
                          {step < 9 && (
                            <div className="px-4 py-3 border-t border-stone-200/40 flex items-center gap-2">
                              <button className={`h-7 px-3 text-white text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${hoverButton === 'godkann' ? 'bg-stone-700' : 'bg-stone-900'}`}>
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                Godkänn
                              </button>
                              <button className="h-7 px-3 text-stone-600 text-xs font-medium rounded-md hover:bg-stone-100">
                                Kommentera
                              </button>
                              <button className="h-7 px-3 text-stone-600 text-xs font-medium rounded-md hover:bg-stone-100 ml-auto">
                                Avbryt
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* User Thank You */}
                  <AnimatePresence>
                    {step >= 10 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-end"
                      >
                        <div className="rounded-lg px-3 py-1.5 bg-stone-900 text-white">
                          <p className="text-sm">Tack!</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI Thinking - after thank you */}
                  <AnimatePresence>
                    {step === 11 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-stone-400"
                      >
                        Tänker...
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI Encouraging Response - streaming */}
                  <AnimatePresence>
                    {step === 12 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <p className="text-sm text-stone-700">
                          {aiStreamText}<span className="animate-pulse">|</span>
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input Bar */}
                <div className="mt-auto pt-4">
                  <div className={`bg-stone-100/60 border-2 rounded-xl overflow-hidden transition-colors ${hoverButton === 'input' ? 'border-stone-400' : 'border-stone-200/60'}`}>
                    <div className="px-4 py-3 min-h-[24px]">
                      {inputText ? (
                        <span className="text-stone-900 text-sm">{inputText}<span className="animate-pulse">|</span></span>
                      ) : (
                        <span className="text-stone-400 text-sm">Skriv ett meddelande...</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between px-2 pb-2">
                      <div className="flex items-center gap-0.5">
                        <div className="h-7 w-7 rounded-md flex items-center justify-center text-stone-400">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                        </div>
                        <div className="h-7 w-7 rounded-md flex items-center justify-center text-stone-400">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" /></svg>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <div className="h-7 w-7 rounded-md flex items-center justify-center text-stone-400">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                        </div>
                        <div className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${hoverButton === 'send' ? 'bg-stone-700' : 'bg-stone-900'}`}>
                          <ArrowRight className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
