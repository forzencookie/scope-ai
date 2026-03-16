"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, CheckCircle2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"
import { useCompany } from "@/providers/company-provider"
import { onboardingSteps } from "./step-config"

// Step renderers
import {
    WelcomeStep,
    OnboardingModeStep,
    CompanyTypeStep,
    CompanyInfoStep,
    ShareStructureStep,
    ShareholdersStep,
    PartnersStep,
    ProfileStep,
    ImportHistoryStep,
    DocumentsStep,
    TeamStep,
} from "./steps"

interface OnboardingPageProps {
    onComplete: () => void
    onSkip: () => void
}

// Shareholder/Partner types matching the seed API
interface OnboardingShareholder {
    name: string
    ssn: string
    shares: number
    shareClass: "A" | "B"
}

interface OnboardingPartner {
    name: string
    ssn: string
    type: "komplementär" | "kommanditdelägare"
    capitalContribution: number
}

export type { OnboardingShareholder, OnboardingPartner }

export function OnboardingPage({ onComplete, onSkip }: OnboardingPageProps) {
    const { companyType, updateCompany } = useCompany()
    const [currentStep, setCurrentStep] = useState(0)
    const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

    // Collected data from steps (persisted via ref so it survives step transitions)
    const shareholdersRef = useRef<OnboardingShareholder[]>([])
    const partnersRef = useRef<OnboardingPartner[]>([])

    const step = onboardingSteps[currentStep]
    const isLastStep = currentStep === onboardingSteps.length - 1
    const isFirstStep = currentStep === 0

    // Seed shareholders/partners to database
    const seedData = useCallback(async () => {
        const shareholders = shareholdersRef.current
        const partners = partnersRef.current

        if (shareholders.length === 0 && partners.length === 0) return

        try {
            await fetch("/api/onboarding/seed", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyType,
                    shareholders: shareholders.length > 0
                        ? shareholders.map(s => ({
                            name: s.name,
                            ssn_org_nr: s.ssn,
                            shares_count: s.shares,
                            shares_percentage: 0,
                            share_class: s.shareClass,
                        }))
                        : undefined,
                    partners: partners.length > 0
                        ? partners.map(p => ({
                            name: p.name,
                            ssn_org_nr: p.ssn,
                            type: p.type,
                            capital_contribution: p.capitalContribution,
                            ownership_percentage: 0,
                        }))
                        : undefined,
                }),
            })
        } catch (error) {
            console.error("[Onboarding] Failed to seed data:", error)
        }
    }, [companyType])

    const handleNext = useCallback(() => {
        setCompletedSteps(prev => new Set([...prev, step.id]))

        if (isLastStep) {
            seedData().then(() => {
                updateCompany({ onboardingComplete: true })
                onComplete()
            })
        } else {
            setCurrentStep(prev => prev + 1)
        }
    }, [isLastStep, onComplete, step.id, seedData, updateCompany])

    const handleSkip = useCallback(() => {
        setCurrentStep(prev => prev + 1)
    }, [])

    const handleBack = useCallback(() => {
        if (isFirstStep) return
        setCurrentStep(prev => prev - 1)
    }, [isFirstStep])

    const handleSelectMode = useCallback((mode: "fresh" | "existing") => {
        updateCompany({ onboardingMode: mode })
        setCompletedSteps(prev => new Set([...prev, step.id]))
        setCurrentStep(prev => prev + 1)
    }, [step.id, updateCompany])

    // Render the appropriate step content
    const renderStepContent = () => {
        switch (step.id) {
            case "welcome":
                return <WelcomeStep />
            case "onboarding-mode":
                return <OnboardingModeStep onSelectMode={handleSelectMode} />
            case "company-type":
                return <CompanyTypeStep />
            case "company":
                return <CompanyInfoStep />
            case "share-structure":
                return <ShareStructureStep />
            case "shareholders":
                return (
                    <ShareholdersStep
                        initialData={shareholdersRef.current}
                        onDataChange={(data) => { shareholdersRef.current = data }}
                    />
                )
            case "partners":
                return (
                    <PartnersStep
                        initialData={partnersRef.current}
                        onDataChange={(data) => { partnersRef.current = data }}
                    />
                )
            case "profile":
                return <ProfileStep />
            case "import-history":
                return <ImportHistoryStep />
            case "documents":
                return <DocumentsStep step={step} />
            case "team":
                return <TeamStep step={step} />
            default:
                return null
        }
    }

    return (
        <div
            className="min-h-screen flex flex-col text-white font-sans selection:bg-white/30"
            style={{ backgroundColor: '#050505' }}
        >
            {/* Header */}
            <header className="flex items-center justify-between px-6 md:px-10 py-5">
                <div className="flex items-center gap-3">
                    <ScopeAILogo className="h-6 w-6 text-white" />
                    <span className="font-semibold text-[15px] tracking-tight text-white">scope ai</span>
                </div>
                <button
                    onClick={onSkip}
                    className="text-white/40 hover:text-white/70 transition-colors text-sm flex items-center gap-1"
                >
                    Hoppa över för nu
                    <ChevronRight className="h-4 w-4" />
                </button>
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center overflow-auto py-8 px-5">
                <div className="w-full max-w-[440px] md:max-w-[540px]">
                    {/* Step indicators */}
                    <div className="flex items-center justify-center gap-1.5 mb-10">
                        {onboardingSteps.map((s, index) => (
                            <div
                                key={s.id}
                                className={cn(
                                    "h-1 rounded-full transition-all duration-300",
                                    index === currentStep
                                        ? "w-8 bg-white"
                                        : completedSteps.has(s.id)
                                            ? "w-4 bg-white/40"
                                            : "w-4 bg-white/10"
                                )}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="text-center"
                        >
                            {/* Step header */}
                            <div className="text-center mb-8">
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-3 leading-[1.15]">{step.title}</h1>
                                <p className="text-white/40 max-w-md mx-auto text-[15px] leading-relaxed">{step.description}</p>
                            </div>

                            {/* Separator — hidden on welcome */}
                            {step.id !== "welcome" && <div className="h-px bg-white/10 mb-8" />}

                            {/* Step-specific content */}
                            {renderStepContent()}
                        </motion.div>
                    </AnimatePresence>

                    {/* Footer navigation — welcome uses inline button instead */}
                    {step.id === "welcome" ? (
                        <div className="flex justify-center mt-10">
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium bg-white text-[#050505] hover:bg-white/90 transition-all"
                            >
                                Fortsätt
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
                            <div>
                                {!isFirstStep && (
                                    <button
                                        onClick={handleBack}
                                        className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Tillbaka
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {step.optional && (
                                    <button
                                        onClick={handleSkip}
                                        className="px-5 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors"
                                    >
                                        Hoppa över
                                    </button>
                                )}
                                {/* Hide "Fortsätt" for onboarding-mode since buttons are in the step */}
                                {step.id !== "onboarding-mode" && (
                                    <button
                                        onClick={handleNext}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-white text-[#050505] hover:bg-white/90 transition-all"
                                    >
                                        {isLastStep ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Kom igång
                                            </>
                                        ) : (
                                            <>
                                                Fortsätt
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="px-6 py-4">
                <div className="flex items-center justify-center gap-2 text-xs text-white/30">
                    <span>Steg {currentStep + 1} av {onboardingSteps.length}</span>
                    <span>•</span>
                    <span>Designad & utvecklad i Sverige 🇸🇪</span>
                </div>
            </footer>
        </div>
    )
}
