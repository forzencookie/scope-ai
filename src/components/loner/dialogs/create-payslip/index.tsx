"use client"

import { Bot, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useCompany } from "@/providers"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { PayslipPreview } from "@/components/ai/previews/documents/payslip-preview"
import { useCreatePayslipLogic, PayslipCreateDialogProps } from "./use-create-payslip-logic"
import { StepEmployeeSelect } from "./step-employee-select"
import { StepAdjustments } from "./step-adjustments"

// Re-export props so consumers don't need to import from logic file
export type { PayslipCreateDialogProps }

export function PayslipCreateDialog(props: PayslipCreateDialogProps) {
    const { company } = useCompany()
    const companyName = company?.name || ""
    const companyOrgNr = company?.orgNumber || ""

    const {
        employees, filteredEmployees, isLoadingEmployees,
        selectedEmployee, setSelectedEmployee,
        selectedEmp,
        canProceedFromStep1,
        currentPeriod,

        // Manual entry
        useManualEntry, setUseManualEntry,
        manualPerson, setManualPerson,
        saveAsEmployee, setSaveAsEmployee,
        searchQuery, setSearchQuery,
        defaultTaxPercent,

        chatInput, setChatInput,
        chatMessages,
        handleSendMessage,

        aiDeductions,
        recommendedSalary,
        customSalary, setCustomSalary,
        useAIRecommendation, setUseAIRecommendation,
        finalSalary,
        tax,
        taxRate,
        netSalary,
        employerContribution,
        isCreating,
        handleConfirmPayslip,
        resetDialog
    } = useCreatePayslipLogic(props)

    const previewProps = {
        company: { name: companyName, orgNumber: companyOrgNr },
        employee: {
            name: selectedEmp?.name || "",
            personalNumber: selectedEmp?.personalNumber,
            role: selectedEmp?.role,
        },
        period: currentPeriod,
        grossSalary: finalSalary,
        adjustments: aiDeductions.map(d => ({
            label: d.label,
            amount: Math.abs(d.amount),
            type: (d.amount < 0 ? "addition" : "deduction") as "addition" | "deduction"
        })),
        taxRate: taxRate,
        taxAmount: tax,
        netSalary: netSalary,
        employerContributions: employerContribution,
    }

    return (
        <Dialog open={props.open} onOpenChange={(newOpen) => {
            if (!newOpen) resetDialog()
            props.onOpenChange(newOpen)
        }}>
            <DialogContent
                className="max-h-[90vh] max-w-[95vw]"
                defaultExpanded
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Skapa Lönebesked
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-row gap-6">
                    {/* Left Side — Form */}
                    <div className="w-1/2 space-y-5 py-2 overflow-y-auto px-1 -mx-1 max-h-[calc(90vh-180px)] pr-4">
                        {/* Section 1: Employee Selection */}
                        <StepEmployeeSelect
                            employees={employees}
                            filteredEmployees={filteredEmployees}
                            isLoading={isLoadingEmployees}
                            selectedEmployee={selectedEmployee}
                            setSelectedEmployee={setSelectedEmployee}
                            useManualEntry={useManualEntry}
                            setUseManualEntry={setUseManualEntry}
                            manualPerson={manualPerson}
                            setManualPerson={setManualPerson}
                            saveAsEmployee={saveAsEmployee}
                            setSaveAsEmployee={setSaveAsEmployee}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            defaultTaxPercent={defaultTaxPercent}
                        />

                        {/* Section 2: AI Adjustments — visible once employee is selected */}
                        {selectedEmp && (
                            <>
                                <div className="border-t" />
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                        <Bot className="h-3.5 w-3.5 text-purple-600" />
                                        Justeringar
                                    </Label>
                                    <StepAdjustments
                                        selectedEmp={selectedEmp}
                                        chatMessages={chatMessages}
                                        chatInput={chatInput}
                                        setChatInput={setChatInput}
                                        onSendMessage={handleSendMessage}
                                    />
                                </div>
                            </>
                        )}

                        {/* Section 3: Salary Controls — visible once employee is selected */}
                        {selectedEmp && (
                            <>
                                <div className="border-t" />
                                <div className="space-y-3">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                        Löneinställningar
                                    </Label>

                                    {/* AI recommendation toggle */}
                                    <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                                        <Switch
                                            id="ai-mode"
                                            checked={useAIRecommendation}
                                            onCheckedChange={setUseAIRecommendation}
                                        />
                                        <Label htmlFor="ai-mode" className="flex-1 cursor-pointer text-sm">
                                            Använd AI-rekommendation ({recommendedSalary.toLocaleString("sv-SE")} kr)
                                        </Label>
                                    </div>

                                    {/* Custom salary input */}
                                    {!useAIRecommendation && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <Label>Anpassad Bruttolön</Label>
                                            <Input
                                                type="number"
                                                value={customSalary}
                                                onChange={e => setCustomSalary(e.target.value)}
                                                placeholder="Ange belopp..."
                                            />
                                        </div>
                                    )}

                                    {/* AI deductions summary */}
                                    {aiDeductions.length > 0 && (
                                        <div className="space-y-1.5 text-sm">
                                            {aiDeductions.map((d, i) => (
                                                <div key={i} className="flex justify-between">
                                                    <span className="flex items-center gap-1.5">
                                                        <Bot className="h-3 w-3 text-purple-600" />
                                                        {d.label}
                                                    </span>
                                                    <span className={cn("font-medium", d.amount < 0 ? "text-green-600" : "text-red-600")}>
                                                        {d.amount > 0 ? "-" : "+"}{Math.abs(d.amount).toLocaleString("sv-SE")} kr
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Side — Live PayslipPreview */}
                    <div className="w-1/2 max-h-[calc(90vh-180px)] overflow-y-auto border-l pl-6">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 block">
                            Förhandsgranska
                        </Label>
                        {selectedEmp ? (
                            <PayslipPreview {...previewProps} />
                        ) : (
                            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                                Välj en anställd för att se förhandsgranskning
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isCreating}>Avbryt</Button>
                    </DialogClose>
                    <Button
                        onClick={handleConfirmPayslip}
                        disabled={!canProceedFromStep1 || isCreating}
                    >
                        {isCreating ? "Skapar..." : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Signera &amp; Skapa
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
