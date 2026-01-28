"use client"

import { useState } from "react"
import { Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useCompliance } from "@/hooks/use-compliance"
import type { CorporateActionType } from "@/types/events"
import { corporateActionTypeMeta } from "@/types/events"

import { StepSelect } from "./step-select"
import { ConfigureStep } from "./configure-step"
import { StepPreview } from "./step-preview"
import { StepComplete } from "./step-complete"

interface ActionWizardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onComplete?: (actionType: CorporateActionType) => void
    /** Filter which action types are available. If not provided, all actions are shown. */
    allowedActions?: CorporateActionType[]
}

type WizardStep = 'select' | 'configure' | 'preview' | 'complete'

export function ActionWizard({ open, onOpenChange, onComplete, allowedActions }: ActionWizardProps) {
    const [step, setStep] = useState<WizardStep>('select')
    const [selectedAction, setSelectedAction] = useState<CorporateActionType | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [actionData, setActionData] = useState<any>(null)

    const { shareholders, addDocument, isAddingDoc } = useCompliance()
    const [isCreatingRoadmap, setIsCreatingRoadmap] = useState(false)

    const handleSelectAction = (actionType: CorporateActionType) => {
        setSelectedAction(actionType)
        setStep('configure')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleConfigure = (data: any) => {
        setActionData(data)
        setStep('preview')
    }

    const handleReset = () => {
        setStep('select')
        setSelectedAction(null)
        setActionData(null)
        onOpenChange(false)
    }

    const handleComplete = async () => {
        if (selectedAction) {
            if (selectedAction === 'roadmap') {
                if (isCreatingRoadmap) return // Prevent double submission
                setIsCreatingRoadmap(true)
                try {
                    const { createRoadmap } = await import('@/services/roadmap-service')
                    await createRoadmap({
                        title: actionData.roadmapTitle || 'Ny företagsplan',
                        description: actionData.description,
                        steps: [
                            { title: 'Planering', description: 'Definiera dina mål och gör en nulägesanalys.' },
                            { title: 'Förberedelser', description: 'Samla nödvändig information och dokumentation.' },
                            { title: 'Genomförande', description: 'Utför de planerade aktiviteterna.' }
                        ]
                    })
                    setStep('complete')
                } finally {
                    setIsCreatingRoadmap(false)
                }
                return
            } else {
                const meta = corporateActionTypeMeta[selectedAction]
                await addDocument({
                    type: 'board_meeting_minutes',
                    title: `${meta.label} - ${new Date().toLocaleDateString()}`,
                    date: actionData?.changeDate || actionData?.effectiveDate || new Date().toISOString().split('T')[0],
                    content: JSON.stringify(actionData),
                    status: 'draft',
                    source: 'manual'
                })

                if (onComplete) {
                    onComplete(selectedAction)
                }
                setStep('complete')
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-xl border-indigo-100/20 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">
                        {step === 'select' && 'Ny bolagsåtgärd'}
                        {step === 'configure' && selectedAction && corporateActionTypeMeta[selectedAction]?.label}
                        {step === 'preview' && 'Granska och godkänn'}
                        {step === 'complete' && 'Åtgärd skapad'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground/80">
                        {step === 'select' && 'Välj vilken typ av åtgärd du vill genomföra.'}
                        {step === 'configure' && 'Fyll i detaljerna för denna åtgärd.'}
                        {step === 'preview' && 'Kontrollera att allt ser korrekt ut innan du fortsätter.'}
                        {step === 'complete' && 'Din åtgärd har skapats och väntar på nästa steg.'}
                    </DialogDescription>
                </DialogHeader>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 py-6">
                    {(['select', 'configure', 'preview', 'complete'] as WizardStep[]).map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                                step === s ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none scale-110" :
                                    (['select', 'configure', 'preview', 'complete'].indexOf(step) > i)
                                        ? "bg-emerald-500 text-white"
                                        : "bg-muted text-muted-foreground/50 border border-muted"
                            )}>
                                {(['select', 'configure', 'preview', 'complete'].indexOf(step) > i) ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    i + 1
                                )}
                            </div>
                            {i < 3 && <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/30" />}
                        </div>
                    ))}
                </div>

                {/* Step content */}
                <div className="py-2 min-h-[300px]">
                    {step === 'select' && (
                        <StepSelect onSelect={handleSelectAction} allowedActions={allowedActions} />
                    )}

                    {step === 'configure' && selectedAction && (
                        <ConfigureStep
                            actionType={selectedAction}
                            onBack={() => setStep('select')}
                            onSubmit={handleConfigure}
                            shareholders={shareholders}
                        />
                    )}

                    {step === 'preview' && selectedAction && (
                        <StepPreview
                            selectedAction={selectedAction}
                            isAddingDoc={isAddingDoc || isCreatingRoadmap}
                            onBack={() => setStep('configure')}
                            onComplete={handleComplete}
                        />
                    )}

                    {step === 'complete' && selectedAction && (
                        <StepComplete onClose={handleReset} actionType={selectedAction} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
