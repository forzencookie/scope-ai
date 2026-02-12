"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    BankStep,
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
                            shares_percentage: 0, // will be computed by DB
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
            // Seed collected data before completing
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

    const Icon = step.icon

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
            case "bank":
                return <BankStep />
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
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <ScopeAILogo className="h-7 w-7" />
                    <span className="font-semibold text-lg">Scope AI</span>
                </div>
                <Button
                    variant="ghost"
                    onClick={onSkip}
                    className="text-muted-foreground hover:text-foreground"
                >
                    Hoppa över för nu
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center overflow-auto py-8 px-4">
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="text-center"
                        >
                            {/* Step header */}
                            <div className="text-center mb-8">
                                <div className="flex justify-center">
                                    <div className={cn(step.bgColor && "inline-flex p-4 rounded-lg mb-4", step.bgColor)}>
                                        <Icon className={cn(step.bgColor ? "h-8 w-8" : "h-16 w-16 mb-4", step.color)} />
                                    </div>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-semibold mb-2">{step.title}</h1>
                                <p className="text-muted-foreground max-w-md mx-auto">{step.description}</p>
                            </div>

                            {/* Step-specific content */}
                            {renderStepContent()}
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
                            {/* Hide "Fortsätt" for onboarding-mode since buttons are in the step */}
                            {step.id !== "onboarding-mode" && (
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
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="px-6 py-4 border-t border-border">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span>Steg {currentStep + 1} av {onboardingSteps.length}</span>
                    <span>•</span>
                    <span>{step.title}</span>
                </div>
            </footer>
        </div>
    )
}
