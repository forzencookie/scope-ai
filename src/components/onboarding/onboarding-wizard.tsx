"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check,
  ChevronRight,
  Building2,
  CreditCard,
  FileText,
  Users,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Landmark,
  UploadCloud,
  Percent,
  Receipt,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CompanyTypeSelector } from "./company-type-selector"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"

// Onboarding steps configuration with warm Swedish messaging
const onboardingSteps = [
  {
    id: "welcome",
    title: "Välkommen till Scope AI! 🇸🇪",
    description: "Vi hjälper dig komma igång smidigt med din bokföring. Det tar bara några minuter — sen är du fri att fokusera på det du brinner för.",
    icon: ScopeAILogo,
    color: "text-stone-900",
    bgColor: "",
  },
  {
    id: "onboarding-mode",
    title: "Nystartat eller befintligt företag?",
    description: "Välj hur du vill komma igång. Befintliga företag kan importera bokföring via SIE-fil.",
    icon: Building2,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
    hasOnboardingMode: true,
  },
  {
    id: "company-type",
    title: "Vilken företagsform har du?",
    description: "Vi anpassar funktioner, rapporter och deklarationer baserat på din företagsform.",
    icon: Landmark,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
    hasCompanyTypeSelector: true,
  },
  {
    id: "company",
    title: "Ditt företag",
    description: "Vi hämtar uppgifterna direkt från Bolagsverket så du slipper skriva något själv.",
    icon: Building2,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
    action: {
      label: "Hämta från Bolagsverket",
      href: "https://www.bolagsverket.se/foretag/hitta",
      external: true,
    },
    fields: [
      { label: "Organisationsnummer", placeholder: "XXXXXX-XXXX", value: "559123-4567" },
      { label: "Företagsnamn", placeholder: "AB Exempel", value: "Scope AI AB" },
    ],
  },
  {
    id: "share-structure",
    title: "Aktiekapital och aktier",
    description: "Ange ditt aktiekapital och antal aktier. Detta används för aktiebok och K10.",
    icon: Landmark,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    companyTypes: ["ab"], // Only show for AB
    hasShareStructure: true,
  },
  {
    id: "shareholders",
    title: "Aktieägare",
    description: "Lägg till företagets aktieägare. Du kan alltid ändra detta senare i aktieboken.",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    companyTypes: ["ab"],
    hasShareholders: true,
  },
  {
    id: "partners",
    title: "Delägare",
    description: "Lägg till bolagets delägare och deras kapitalinsats.",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    companyTypes: ["hb", "kb"], // Only for HB/KB
    hasPartners: true,
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
    moreBanks: [
      { name: "Sparbankerna", logo: "/logos/sparbanken.svg" },
      { name: "Länsförsäkringar", logo: "/logos/lansforsakringar.svg" },
      { name: "ICA Banken", logo: "/logos/ica.svg" },
      { name: "Skandiabanken", logo: "/logos/skandia.svg" },
      { name: "SBAB", logo: "/logos/sbab.svg" },
      { name: "Avanza", logo: "/logos/avanza.svg" },
      { name: "Nordnet", logo: "/logos/nordnet.svg" },
      { name: "Klarna", logo: "/logos/klarna.svg" },
    ],
  },
  {
    id: "import-history",
    title: "Importera historik",
    description: "Har du bokföring från ett annat system? Ladda upp en SIE-fil så importerar vi allt åt dig.",
    icon: UploadCloud,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    optional: true,
    existingOnly: true, // Only show for existing mode
    hasSIEImport: true,
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
  const [showMoreBanks, setShowMoreBanks] = useState(false)
  const step = onboardingSteps[currentStep]
  const isLastStep = currentStep === onboardingSteps.length - 1
  const isFirstStep = currentStep === 0

  const handleNext = useCallback(() => {
    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, step.id]))
    setShowMoreBanks(false)

    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }, [isLastStep, onComplete, step.id])

  const handleSkip = useCallback(() => {
    setShowMoreBanks(false)
    setCurrentStep(prev => prev + 1)
  }, [])

  const handleBack = useCallback(() => {
    if (isFirstStep) return
    setShowMoreBanks(false)
    setCurrentStep(prev => prev - 1)
  }, [isFirstStep])

  if (!isOpen) return null

  const Icon = step.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex flex-col bg-background"
      >
        {/* Header with logo and skip button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <ScopeAILogo className="h-7 w-7" />
            <span className="font-semibold text-lg">Scope AI</span>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            Hoppa över för nu
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Main content area - centered */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-auto py-8 px-4">
          <div className="w-full max-w-2xl">
            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {onboardingSteps.map((s, index) => (
                <div
                  key={s.id}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-200",
                    index === currentStep
                      ? "w-8 bg-primary"
                      : completedSteps.has(s.id)
                        ? "w-4 bg-primary"
                        : "w-4 bg-muted"
                  )}
                />
              ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={step.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="text-center"
              >
                {/* Step header */}
                <div className="text-center mb-8">
                  <div className="flex justify-center">
                    <div className={cn(step.bgColor && "inline-flex p-4 rounded-lg mb-4", step.bgColor)}>
                      <Icon className={cn(step.bgColor ? "h-8 w-8" : "h-16 w-16 mb-4", step.color)} />
                    </div>
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">{step.title}</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">{step.description}</p>
                </div>

                {/* Step-specific content */}
                {step.id === "welcome" && (
                  <div className="space-y-4 max-w-lg mx-auto">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { icon: Percent, label: "Automatiserad moms" },
                        { icon: ScopeAILogo, label: "AI-bokföring", color: "text-stone-900" },
                        { icon: Receipt, label: "Kvittohantering" },
                      ].map((feature) => (
                        <div key={feature.label} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <feature.icon className={cn("h-6 w-6", feature.color || "text-primary")} />
                          <span className="text-sm text-center">{feature.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step.id === "company-type" && (
                  <div className="w-full">
                    <CompanyTypeSelector showDescription={true} columns={2} />
                  </div>
                )}

                {step.id === "onboarding-mode" && (
                  <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                    <button
                      className="p-6 rounded-lg border-2 border-primary bg-primary/5 text-left hover:bg-primary/10 transition-colors"
                      onClick={() => {/* Would set onboardingMode to 'fresh' */ }}
                    >
                      <ScopeAILogo className="h-8 w-8 text-stone-900 mb-3" />
                      <h3 className="font-semibold mb-1">Nystartat företag</h3>
                      <p className="text-sm text-muted-foreground">Börja från noll med en ren bokföring</p>
                    </button>
                    <button
                      className="p-6 rounded-lg border-2 border-border text-left hover:border-primary hover:bg-primary/5 transition-colors"
                      onClick={() => {/* Would set onboardingMode to 'existing' */ }}
                    >
                      <UploadCloud className="h-8 w-8 text-muted-foreground mb-3" />
                      <h3 className="font-semibold mb-1">Befintligt företag</h3>
                      <p className="text-sm text-muted-foreground">Importera från annat bokföringssystem</p>
                    </button>
                  </div>
                )}

                {step.id === "share-structure" && (
                  <div className="space-y-4 max-w-sm mx-auto">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Aktiekapital</label>
                      <input
                        type="number"
                        defaultValue={25000}
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Minst 25 000 kr för privat AB</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Antal aktier totalt</label>
                      <input
                        type="number"
                        defaultValue={500}
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">A-aktier</label>
                        <input
                          type="number"
                          defaultValue={0}
                          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">B-aktier</label>
                        <input
                          type="number"
                          defaultValue={500}
                          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step.id === "shareholders" && (
                  <div className="max-w-md mx-auto">
                    <div className="space-y-3 mb-4">
                      <div className="p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Johan Svensson</p>
                            <p className="text-sm text-muted-foreground">500 aktier (100%)</p>
                          </div>
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Lägg till aktieägare
                    </Button>
                  </div>
                )}

                {step.id === "partners" && (
                  <div className="max-w-md mx-auto">
                    <div className="space-y-3 mb-4">
                      <div className="p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Delägare 1</p>
                            <p className="text-sm text-muted-foreground">Kapitalinsats: 50 000 kr (50%)</p>
                          </div>
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Lägg till delägare
                    </Button>
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
                        <a href={step.action.href} target="_blank" rel="noopener noreferrer">
                          {step.action.label}
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {step.id === "bank" && (
                  <div className="max-w-md mx-auto text-center">
                    <div className="p-6 rounded-lg border-2 border-dashed border-border bg-muted/30">
                      <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">Bankintegration kommer snart</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Vi arbetar på att erbjuda säker bankintegration.
                        Under tiden kan du importera transaktioner och SIE-filer manuellt.
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
                        <ScopeAILogo className="h-3 w-3 text-stone-900" />
                        Kommer snart
                      </span>
                    </div>
                  </div>
                )}

                {step.id === "import-history" && (
                  <div className="max-w-md mx-auto">
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('sie-upload')?.click()}
                    >
                      <input
                        id="sie-upload"
                        type="file"
                        accept=".se,.si,.sie"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return

                          // Handle upload
                          const formData = new FormData()
                          formData.append('file', file)

                          try {
                            // Show loading state could be handled here if we exposed it
                            const res = await fetch('/api/sie/import', {
                              method: 'POST',
                              body: formData
                            })
                            const data = await res.json()
                            if (data.success) {
                              // Maybe show specific success UI or toast?
                              // For wizard flow, we might just want to show "Imported!" or auto-advance?
                              // Let's simplify and show success text in this box.
                              alert(`Importerade ${data.stats.verifications} verifikationer och ${data.stats.accounts} konton!`)
                            }
                          } catch (err) {
                            console.error(err)
                            alert("Kunde inte importera filen.")
                          }
                        }}
                      />
                      <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-1">Släpp din SIE-fil här</h3>
                      <p className="text-sm text-muted-foreground">eller klicka för att välja fil</p>
                      <p className="text-xs text-muted-foreground mt-4">Stöder SIE4 standarden (.se)</p>
                    </div>
                  </div>
                )}

                {step.id === "documents" && step.options && (
                  <div className="space-y-3 max-w-md mx-auto">
                    {step.options.map((option, index) => (
                      <button
                        key={option.label}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5",
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

            {/* Footer navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <div>
                {!isFirstStep && (
                  <Button variant="ghost" onClick={handleBack}>
                    Tillbaka
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {step.optional && (
                  <Button variant="outline" onClick={handleSkip}>
                    Hoppa över
                  </Button>
                )}
                <Button onClick={handleNext} size="lg">
                  {isLastStep ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Kom igång med Scope AI
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
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook to check if onboarding is needed
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true)

  useEffect(() => {
    // Check localStorage for permanent completion
    const completed = localStorage.getItem("scope-onboarding-completed")
    if (completed) {
      setTimeout(() => setHasCompletedOnboarding(true), 0)
      return
    }

    // Check sessionStorage to see if already shown/skipped this session
    const shownThisSession = sessionStorage.getItem("scope-onboarding-shown")
    if (shownThisSession) {
      // Already shown this session, don't show again
      setTimeout(() => setHasCompletedOnboarding(false), 0)
      return
    }

    // First time this session - show onboarding
    setTimeout(() => setHasCompletedOnboarding(false), 0)
    sessionStorage.setItem("scope-onboarding-shown", "true")
    // Show onboarding after a short delay for smooth transition
    setTimeout(() => setShowOnboarding(true), 500)
  }, [])

  const completeOnboarding = useCallback(() => {
    localStorage.setItem("scope-onboarding-completed", "true")
    setHasCompletedOnboarding(true)
    setShowOnboarding(false)
  }, [])

  const skipOnboarding = useCallback(() => {
    // Mark as shown for this session so it won't reappear on navigation
    sessionStorage.setItem("scope-onboarding-shown", "true")
    setShowOnboarding(false)
  }, [])

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem("scope-onboarding-completed")
    sessionStorage.removeItem("scope-onboarding-shown")
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
