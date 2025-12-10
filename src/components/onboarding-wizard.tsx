"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Check, 
  ChevronRight, 
  Building2, 
  CreditCard, 
  FileText, 
  Users,
  Sparkles,
  ArrowRight,
  ExternalLink,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Onboarding steps configuration with warm Swedish messaging
const onboardingSteps = [
  {
    id: "welcome",
    title: "Välkommen till Scope AI! 🇸🇪",
    description: "Vi hjälper dig komma igång smidigt med din bokföring. Det tar bara några minuter — sen är du fri att fokusera på det du brinner för.",
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "company",
    title: "Ditt företag",
    description: "Vi hämtar uppgifterna direkt från Bolagsverket så du slipper skriva något själv.",
    icon: Building2,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    action: {
      label: "Hämta från Bolagsverket",
      href: "/settings/company-info",
    },
    fields: [
      { label: "Organisationsnummer", placeholder: "XXXXXX-XXXX", value: "559123-4567" },
      { label: "Företagsnamn", placeholder: "AB Exempel", value: "Scope AI AB" },
    ],
  },
  {
    id: "bank",
    title: "Koppla din bank",
    description: "Säker anslutning via Open Banking — dina transaktioner hämtas automatiskt varje dag.",
    icon: CreditCard,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    integrations: [
      { name: "SEB", logo: "/logos/seb.svg", popular: true },
      { name: "Swedbank", logo: "/logos/swedbank.svg", popular: true },
      { name: "Nordea", logo: "/logos/nordea.svg", popular: true },
      { name: "Handelsbanken", logo: "/logos/handelsbanken.svg" },
      { name: "Danske Bank", logo: "/logos/danske.svg" },
    ],
  },
  {
    id: "documents",
    title: "Ladda upp underlag",
    description: "Har du kvitton och fakturor? Släpp dem här så tar AI:n hand om resten.",
    icon: FileText,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    options: [
      { label: "Ladda upp filer", description: "Dra och släpp PDF, bilder eller Excel-filer" },
      { label: "Koppla e-post", description: "Automatiskt importera bifogade fakturor" },
      { label: "Jag gör det senare", description: "Ingen stress — du kan lägga till underlag när som helst" },
    ],
  },
  {
    id: "team",
    title: "Bjud in ditt team",
    description: "Samarbeta med kollegor eller ge din revisor läsåtkomst. Tillsammans blir det enklare!",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    optional: true,
    roles: [
      { role: "Admin", description: "Full åtkomst till allt" },
      { role: "Bokförare", description: "Kan hantera transaktioner" },
      { role: "Revisor", description: "Endast läsåtkomst" },
    ],
  },
]

interface OnboardingWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [isAnimating, setIsAnimating] = useState(false)

  const step = onboardingSteps[currentStep]
  const isLastStep = currentStep === onboardingSteps.length - 1
  const isFirstStep = currentStep === 0

  const handleNext = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    
    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, step.id]))
    
    if (isLastStep) {
      // Complete onboarding
      setTimeout(() => {
        onComplete()
      }, 300)
    } else {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1)
        setIsAnimating(false)
      }, 200)
    }
  }, [isAnimating, isLastStep, onComplete, step.id])

  const handleSkip = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep(prev => prev + 1)
      setIsAnimating(false)
    }, 200)
  }, [isAnimating])

  const handleBack = useCallback(() => {
    if (isAnimating || isFirstStep) return
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep(prev => prev - 1)
      setIsAnimating(false)
    }, 200)
  }, [isAnimating, isFirstStep])

  if (!isOpen) return null

  const Icon = step.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-2xl bg-background rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 pt-8 pb-4">
            {onboardingSteps.map((s, index) => (
              <div
                key={s.id}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentStep 
                    ? "w-8 bg-primary" 
                    : completedSteps.has(s.id)
                    ? "bg-primary"
                    : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="px-8 pb-8"
            >
              {/* Step header */}
              <div className="text-center mb-8">
                <div className={cn("inline-flex p-4 rounded-2xl mb-4", step.bgColor)}>
                  <Icon className={cn("h-8 w-8", step.color)} />
                </div>
                <h2 className="text-2xl font-semibold mb-2">{step.title}</h2>
                <p className="text-muted-foreground max-w-md mx-auto">{step.description}</p>
              </div>

              {/* Step-specific content */}
              {step.id === "welcome" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: CreditCard, label: "Automatisk banksync" },
                      { icon: Sparkles, label: "AI-bokföring" },
                      { icon: FileText, label: "Kvittohantering" },
                    ].map((feature) => (
                      <div key={feature.label} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50">
                        <feature.icon className="h-6 w-6 text-primary" />
                        <span className="text-sm text-center">{feature.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step.id === "company" && step.fields && (
                <div className="space-y-4 max-w-sm mx-auto">
                  {step.fields.map((field) => (
                    <div key={field.label}>
                      <label className="text-sm font-medium mb-1.5 block">{field.label}</label>
                      <input
                        type="text"
                        defaultValue={field.value}
                        placeholder={field.placeholder}
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  ))}
                  {step.action && (
                    <Button variant="outline" className="w-full mt-2" asChild>
                      <a href={step.action.href}>
                        {step.action.label}
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              )}

              {step.id === "bank" && step.integrations && (
                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                  {step.integrations.map((bank) => (
                    <button
                      key={bank.name}
                      className={cn(
                        "relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:border-primary hover:bg-primary/5",
                        bank.popular ? "border-border" : "border-border/50"
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg font-semibold">
                        {bank.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{bank.name}</span>
                      {bank.popular && (
                        <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                          Populär
                        </span>
                      )}
                    </button>
                  ))}
                  <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:border-border hover:text-foreground transition-all">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      +
                    </div>
                    <span className="text-sm">Fler banker</span>
                  </button>
                </div>
              )}

              {step.id === "documents" && step.options && (
                <div className="space-y-3 max-w-md mx-auto">
                  {step.options.map((option, index) => (
                    <button
                      key={option.label}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:border-primary hover:bg-primary/5",
                        index === 0 ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        index === 0 ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {index === 0 ? <FileText className="h-5 w-5" /> : 
                         index === 1 ? <span>@</span> : <ArrowRight className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      {index === 0 && <Check className="h-5 w-5 text-primary ml-auto" />}
                    </button>
                  ))}
                </div>
              )}

              {step.id === "team" && step.roles && (
                <div className="max-w-md mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="email"
                      placeholder="email@example.com"
                      className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <Button>Bjud in</Button>
                  </div>
                  <div className="space-y-2">
                    {step.roles.map((role) => (
                      <div key={role.role} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{role.role}</p>
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-4 border-t bg-muted/30">
            <div>
              {!isFirstStep && (
                <Button variant="ghost" onClick={handleBack} disabled={isAnimating}>
                  Tillbaka
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {step.optional && (
                <Button variant="ghost" onClick={handleSkip} disabled={isAnimating}>
                  Hoppa över
                </Button>
              )}
              <Button onClick={handleNext} disabled={isAnimating}>
                {isLastStep ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Kom igång
                  </>
                ) : (
                  <>
                    Fortsätt
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook to check if onboarding is needed
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true)

  useEffect(() => {
    // Check localStorage for onboarding status
    const completed = localStorage.getItem("scope-onboarding-completed")
    if (!completed) {
      setHasCompletedOnboarding(false)
      // Show onboarding after a short delay for smooth transition
      setTimeout(() => setShowOnboarding(true), 500)
    }
  }, [])

  const completeOnboarding = useCallback(() => {
    localStorage.setItem("scope-onboarding-completed", "true")
    setHasCompletedOnboarding(true)
    setShowOnboarding(false)
  }, [])

  const skipOnboarding = useCallback(() => {
    setShowOnboarding(false)
  }, [])

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem("scope-onboarding-completed")
    setHasCompletedOnboarding(false)
    setShowOnboarding(true)
  }, [])

  return {
    showOnboarding,
    hasCompletedOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  }
}
