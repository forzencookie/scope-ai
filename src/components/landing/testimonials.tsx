"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const testimonials = [
    {
      quote: "Scope AI har eliminerat vårt månatliga administrationsarbete. Det som brukade ta dagar sker nu automatiskt.",
      author: "Anna Lindberg",
      title: "CFO, TechVenture AB",
    },
    {
      quote: "Momsdeklarationen sköter sig själv. Jag får ett meddelande att det är klart, och det är allt.",
      author: "Erik Johansson",
      title: "Grundare, Nordic Solutions",
    },
    {
      quote: "Bara löneautomatiseringen sparade oss 20 timmar per månad. Det är inte bara mjukvara, det är sinnesro.",
      author: "Maria Svensson",
      title: "Operations Manager, Growth Co",
    },
  ]

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollContainerRef.current
    if (!container) return

    const cardWidth = 400 + 24 // card width + gap
    container.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    })
    setCurrentIndex(index)
  }, [])

  const handlePrevious = useCallback(() => {
    const newIndex = currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1
    scrollToIndex(newIndex)
  }, [currentIndex, testimonials.length, scrollToIndex])

  const handleNext = useCallback(() => {
    const newIndex = currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1
    scrollToIndex(newIndex)
  }, [currentIndex, testimonials.length, scrollToIndex])

  // Update currentIndex based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const cardWidth = 400 + 24
      const newIndex = Math.round(container.scrollLeft / cardWidth)
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < testimonials.length) {
        setCurrentIndex(newIndex)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [currentIndex, testimonials.length])

  return (
    <section className="px-3 md:px-4 py-8 max-w-[2400px] mx-auto overflow-hidden">
      <div className="bg-stone-50 rounded-3xl p-8 md:p-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Betrodd av svenska företag</h2>
        </div>

        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 w-[400px] bg-white border border-stone-200 rounded-xl p-8 group hover:border-stone-300 transition-colors will-change-transform-opacity"
              >
                {/* Subtle texture overlay */}
                <div className="absolute inset-0 opacity-[0.02] bg-noise-texture" />

                <blockquote className="text-lg text-stone-700 leading-relaxed mb-8 font-serif italic">
                  &quot;{t.quote}&quot;
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

          {/* Navigation controls */}
          <div className="hidden md:flex items-center justify-between mt-6">
            {/* Navigation arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                className="p-2 border border-stone-200 rounded-lg hover:border-stone-300 hover:bg-stone-100 transition-colors"
                aria-label="Föregående omdöme"
              >
                <ChevronLeft className="w-4 h-4 text-stone-600" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 border border-stone-200 rounded-lg hover:border-stone-300 hover:bg-stone-100 transition-colors"
                aria-label="Nästa omdöme"
              >
                <ChevronRight className="w-4 h-4 text-stone-600" />
              </button>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex
                    ? 'bg-stone-900'
                    : 'bg-stone-300 hover:bg-stone-400'
                    }`}
                  aria-label={`Gå till omdöme ${i + 1}`}
                  aria-current={i === currentIndex ? 'true' : 'false'}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
