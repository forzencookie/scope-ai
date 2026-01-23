"use client"

import { Bot, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useCreatePayslipLogic, PayslipCreateDialogProps } from "./use-create-payslip-logic"
import { StepEmployeeSelect } from "./step-employee-select"
import { StepAdjustments } from "./step-adjustments"
import { StepReview } from "./step-review"

// Re-export props so consumers don't need to import from logic file
export type { PayslipCreateDialogProps }

export function PayslipCreateDialog(props: PayslipCreateDialogProps) {
    const {
        employees, isLoadingEmployees,
        step, setStep,
        selectedEmployee, setSelectedEmployee,
        selectedEmp,
        
        chatInput, setChatInput,
        chatMessages,
        handleSendMessage,
        
        aiDeductions,
        recommendedSalary,
        customSalary, setCustomSalary,
        useAIRecommendation, setUseAIRecommendation,
        finalSalary,
        tax,
        netSalary,
        isCreating,
        handleConfirmPayslip,
        resetDialog
    } = useCreatePayslipLogic(props)

    return (
        <Dialog open={props.open} onOpenChange={(newOpen) => {
            if (!newOpen) resetDialog()
            props.onOpenChange(newOpen)
        }}>
            <DialogContent className="sm:max-w-lg">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                            </div>
                            {s < 3 && (
                                <div className={cn(
                                    "w-8 h-0.5",
                                    step > s ? "bg-primary" : "bg-muted"
                                )} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step 1: Select Employee */}
                {step === 1 && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Välj anställd</DialogTitle>
                        </DialogHeader>
                        <StepEmployeeSelect
                            employees={employees}
                            isLoading={isLoadingEmployees}
                            selectedEmployee={selectedEmployee}
                            setSelectedEmployee={setSelectedEmployee}
                            onNext={() => setStep(2)}
                            onCancel={resetDialog}
                        />
                    </>
                )}

                {/* Step 2: AI Chat for Details */}
                {step === 2 && selectedEmp && (
                    <>
                         <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Bot className="h-5 w-5 text-purple-600" />
                                Berätta om {selectedEmp.name}s månad
                            </DialogTitle>
                        </DialogHeader>
                        <StepAdjustments
                            selectedEmp={selectedEmp}
                            chatMessages={chatMessages}
                            chatInput={chatInput}
                            setChatInput={setChatInput}
                            onSendMessage={handleSendMessage}
                            onNext={() => setStep(3)}
                            onBack={() => setStep(1)}
                        />
                    </>
                )}

                {/* Step 3: Review & Confirm */}
                {step === 3 && selectedEmp && (
                    <>
                         <DialogHeader>
                            <DialogTitle>Granska Lönebesked</DialogTitle>
                        </DialogHeader>
                        <StepReview
                            selectedEmp={selectedEmp}
                            recommendedSalary={recommendedSalary}
                            customSalary={customSalary}
                            setCustomSalary={setCustomSalary}
                            useAIRecommendation={useAIRecommendation}
                            setUseAIRecommendation={setUseAIRecommendation}
                            finalSalary={finalSalary}
                            tax={tax}
                            netSalary={netSalary}
                            aiDeductions={aiDeductions}
                            isCreating={isCreating}
                            onConfirm={handleConfirmPayslip}
                            onBack={() => setStep(2)}
                        />
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
