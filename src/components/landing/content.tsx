"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

import { Section } from "./ui"

// =============================================================================
// Navbar
// =============================================================================

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 inset-x-0 z-50 h-16 border-b border-stone-200 bg-white/80 backdrop-blur-md will-change-transform-opacity"
    >
      <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-stone-900 rounded-sm" />
          <span className="text-stone-900 font-bold tracking-tight text-lg">Scope AI</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <Link href="#features" className="hover:text-stone-900 transition-colors">Funktioner</Link>
            <Link href="#pricing" className="hover:text-stone-900 transition-colors">Priser</Link>
          </div>
          <div className="h-4 w-[1px] bg-stone-200 hidden md:block" />
          <Link href="/login" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
            Logga in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-stone-900 text-white px-4 py-2 rounded-md hover:bg-stone-800 transition-colors"
          >
            Kom igång
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}

// =============================================================================
// Pricing
// =============================================================================

export function Pricing() {
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
          { name: "Free", price: billing === "monthly" ? "0 kr" : "0 kr", period: "/mån", desc: "Alla funktioner — du bokför själv", features: ["Bokföring & transaktioner", "Momsdeklarationer", "Löner & AGI", "Kvitton & fakturor", "Banksynk", "Rapporter & årsredovisning"] },
          { name: "Professional", price: billing === "monthly" ? "449 kr" : "379 kr", period: "/mån", desc: "AI gör jobbet åt dig", highlight: true, features: ["Allt i Free, plus:", "AI-kategoriserar transaktioner", "AI-assisterad bokföring", "AI-genererade deklarationer", "AI-lönebesked & AGI", "Prioriterad support"] },
          { name: "Enterprise", price: "Kommer snart", period: "", desc: "För koncerner och flerbolagsstrukturer", comingSoon: true, features: ["Allt i Professional", "Hantera flera bolag", "API-åtkomst", "Dedikerad kontaktperson", "Skräddarsydda integrationer"] },
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

            <Link 
              href={tier.price === "Kommer snart" ? "#" : "/register"}
              className={cn(
              "w-full py-3 text-sm font-medium rounded-lg transition-colors border text-center block",
              tier.highlight 
                ? "bg-stone-900 text-white border-stone-900 hover:bg-stone-800" 
                : tier.price === "Kommer snart"
                  ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed"
                  : "bg-white text-stone-900 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
            )}>
              {tier.price === "Kommer snart" ? "Meddela mig" : "Kom igång"}
            </Link>
          </div>
        ))}
      </div>
    </Section>
  )
}

// =============================================================================
// Testimonials
// =============================================================================

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
    <Section className="overflow-hidden">
      <div className="mb-12">
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
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex 
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
    </Section>
  )
}

// =============================================================================
// Footer
// =============================================================================

export function Footer() {
  return (
    <footer className="bg-stone-50 text-stone-600 py-24 px-6 border-t border-stone-200">
      <div className="max-w-[1400px] mx-auto grid md:grid-cols-5 gap-12">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 bg-stone-900 rounded-sm" />
            <span className="text-stone-900 font-bold tracking-tight text-lg">Scope AI</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs mb-8">
            AI-driven bokföring för svenska företag. Automatisera hela din ekonomi.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-sm font-medium bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors"
          >
            Kom igång gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {[
          { title: "Produkt", links: ["Plattform", "Funktioner", "Priser", "API"] },
          { title: "Företag", links: ["Om oss", "Karriär", "Blogg", "Kontakt"] },
          { title: "Juridik", links: ["Integritetspolicy", "Villkor", "Säkerhet", "GDPR"] },
        ].map((col) => (
          <nav key={col.title} aria-labelledby={`footer-${col.title.toLowerCase()}`}>
            <h4 id={`footer-${col.title.toLowerCase()}`} className="text-stone-900 font-medium mb-6">{col.title}</h4>
            <ul className="space-y-4 text-sm">
              {col.links.map(link => (
                <li key={link}>
                  <Link 
                    href="#" 
                    className="hover:text-stone-900 transition-colors"
                    aria-label={`${link} - ${col.title}`}
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
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
