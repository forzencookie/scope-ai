"use client"

import { useState, useCallback, type ReactNode } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Save, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react"

// =============================================================================
// Types
// =============================================================================

export type ReportStatus = "draft" | "done"

export interface ReportWizardShellProps {
    /** Dialog open state */
    open: boolean
    onOpenChange: (open: boolean) => void

    /** Report title shown in dialog header */
    title: string
    /** Optional subtitle (period, year, etc.) */
    subtitle?: string

    /** Step labels — e.g. ["Redigera", "Granska"]. Single-step if length 1. */
    steps: string[]

    /** Render function — receives current step index (0-based) */
    children: (currentStep: number) => ReactNode

    /** Called when user clicks "Spara utkast" */
    onSaveDraft: () => Promise<void> | void
    /** Called when user clicks "Markera klar" */
    onMarkDone?: () => Promise<void> | void
    /** Called when user clicks "Ladda ner" */
    onDownload?: () => void

    /** Current report status */
    status?: ReportStatus
    /** Whether a save operation is in progress */
    isSaving?: boolean
    /** Whether the current step allows proceeding (default: true) */
    canProceed?: boolean
    /** Max width class for dialog (default: sm:max-w-xl) */
    maxWidth?: string
}

// =============================================================================
// Component
// =============================================================================

export function ReportWizardShell({
    open,
    onOpenChange,
    title,
    subtitle,
    steps,
    children,
    onSaveDraft,
    onMarkDone,
    onDownload,
    status = "draft",
    isSaving = false,
    canProceed = true,
    maxWidth = "sm:max-w-xl",
}: ReportWizardShellProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const totalSteps = steps.length
    const isFirstStep = currentStep === 0
    const isLastStep = currentStep === totalSteps - 1

    const resetAndClose = useCallback(() => {
        setCurrentStep(0)
        onOpenChange(false)
    }, [onOpenChange])

    const handleNext = () => {
        if (isLastStep || !canProceed) return
        setCurrentStep(prev => prev + 1)
    }

    const handleBack = () => {
        if (isFirstStep) return
        setCurrentStep(prev => prev - 1)
    }

    const handleSaveDraft = async () => {
        if (isSaving) return
        await onSaveDraft()
    }

    const handleMarkDone = async () => {
        if (isSaving || !onMarkDone) return
        await onMarkDone()
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) resetAndClose()
            else onOpenChange(true)
        }}>
            <DialogContent className={`${maxWidth} max-h-[90vh] overflow-y-auto`}>
                {/* Step Indicator — only show if multiple steps */}
                {totalSteps > 1 && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {steps.map((label, idx) => (
                            <div key={label} className="flex items-center gap-2">
                                <div
                                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                                        currentStep >= idx
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                    title={label}
                                >
                                    {currentStep > idx ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                        idx + 1
                                    )}
                                </div>
                                {idx < totalSteps - 1 && (
                                    <div className={`w-8 h-0.5 transition-colors ${
                                        currentStep > idx ? "bg-primary" : "bg-muted"
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Header */}
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
                </DialogHeader>

                {/* Step Content */}
                <div className="py-4">
                    {children(currentStep)}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center gap-3">
                    {/* Left side: Back or Cancel */}
                    {isFirstStep ? (
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={resetAndClose}
                            disabled={isSaving}
                        >
                            Avbryt
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleBack}
                            disabled={isSaving}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Tillbaka
                        </Button>
                    )}

                    {/* Right side: Next or Action buttons */}
                    {!isLastStep ? (
                        <Button
                            className="flex-1"
                            onClick={handleNext}
                            disabled={!canProceed}
                        >
                            {steps[currentStep + 1] || "Nästa"}
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <div className="flex gap-2 flex-1">
                            {/* Save Draft */}
                            <Button
                                variant={status === "done" ? "outline" : "default"}
                                className="flex-1"
                                onClick={handleSaveDraft}
                                disabled={isSaving}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? "Sparar..." : "Spara utkast"}
                            </Button>

                            {/* Mark Done — only if handler provided */}
                            {onMarkDone && status !== "done" && (
                                <Button
                                    variant="default"
                                    className="flex-1"
                                    onClick={handleMarkDone}
                                    disabled={isSaving}
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Klar
                                </Button>
                            )}

                            {/* Download — always available */}
                            {onDownload && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={onDownload}
                                    disabled={isSaving}
                                    title="Ladda ner"
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
