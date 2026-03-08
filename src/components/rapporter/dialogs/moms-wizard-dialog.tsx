"use client"

import { useState, useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatNumber } from "@/lib/utils"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { type VatReport, createEmptyVatReport, recalculateVatReport } from "@/services/processors/vat"

interface MomsWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm?: () => void
    initialData?: VatReport
}

function getDefaultPeriodName(): string {
    const now = new Date()
    const quarter = Math.floor(now.getMonth() / 3) + 1
    return `Q${quarter} ${now.getFullYear()}`
}

function getDefaultDueDate(): string {
    const now = new Date()
    now.setMonth(now.getMonth() + 1)
    now.setDate(12)
    return now.toLocaleDateString('sv-SE')
}

export function MomsWizardDialog({ open, onOpenChange, onConfirm, initialData }: MomsWizardDialogProps) {
    const baseData = useMemo<VatReport>(() => {
        if (initialData) return initialData
        return createEmptyVatReport(getDefaultPeriodName(), getDefaultDueDate(), 'upcoming')
    }, [initialData])

    // Editable form state - key fields accountants need to verify/edit
    const [formData, setFormData] = useState({
        // Section A: Sales bases
        ruta05: baseData.ruta05, // Momspliktig försäljning 25%
        ruta06: baseData.ruta06, // Momspliktig försäljning 12%
        ruta07: baseData.ruta07, // Momspliktig försäljning 6%
        // Section B: Output VAT (auto-calculated from bases, but editable)
        ruta10: baseData.ruta10, // Utgående moms 25%
        ruta11: baseData.ruta11, // Utgående moms 12%
        ruta12: baseData.ruta12, // Utgående moms 6%
        // Section C: EU/Import purchases (reverse charge)
        ruta20: baseData.ruta20, // Inköp varor EU
        ruta21: baseData.ruta21, // Inköp tjänster EU
        ruta22: baseData.ruta22, // Inköp tjänster utanför EU
        // Section E: Exempt sales
        ruta35: baseData.ruta35, // EU-försäljning varor
        ruta36: baseData.ruta36, // Export utanför EU
        ruta39: baseData.ruta39, // EU-försäljning tjänster
        // Section F: Input VAT
        ruta48: baseData.ruta48, // Ingående moms
    })

    const [step, setStep] = useState<1 | 2>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Calculate totals
    const totalOutputVat = formData.ruta10 + formData.ruta11 + formData.ruta12
    const netVat = totalOutputVat - formData.ruta48

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        const numValue = parseInt(value.replace(/\D/g, '')) || 0
        setFormData(prev => ({ ...prev, [field]: numValue }))
    }

    // Auto-calculate VAT from base when base changes
    const handleBaseChange = (baseField: 'ruta05' | 'ruta06' | 'ruta07', value: string) => {
        const numValue = parseInt(value.replace(/\D/g, '')) || 0
        const vatField = baseField === 'ruta05' ? 'ruta10' : baseField === 'ruta06' ? 'ruta11' : 'ruta12'
        const vatRate = baseField === 'ruta05' ? 0.25 : baseField === 'ruta06' ? 0.12 : 0.06

        setFormData(prev => ({
            ...prev,
            [baseField]: numValue,
            [vatField]: Math.round(numValue * vatRate)
        }))
    }

    const resetDialog = () => {
        setStep(1)
        setFormData({
            ruta05: baseData.ruta05,
            ruta06: baseData.ruta06,
            ruta07: baseData.ruta07,
            ruta10: baseData.ruta10,
            ruta11: baseData.ruta11,
            ruta12: baseData.ruta12,
            ruta20: baseData.ruta20,
            ruta21: baseData.ruta21,
            ruta22: baseData.ruta22,
            ruta35: baseData.ruta35,
            ruta36: baseData.ruta36,
            ruta39: baseData.ruta39,
            ruta48: baseData.ruta48,
        })
        setIsSubmitting(false)
        onOpenChange(false)
    }

    const handleConfirm = async () => {
        if (isSubmitting) return
        setIsSubmitting(true)

        try {
            // Build complete VatReport — preserve any non-form fields from initialData
            // (e.g. ruta08, ruta23, ruta30-32, ruta42, etc. computed by the calculator)
            const report: VatReport = {
                ...baseData,
                ...formData,
            }
            const finalReport = recalculateVatReport(report)

            const response = await fetch('/api/reports/vat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    period_id: baseData.periodId,
                    report_type: 'vat',
                    data: finalReport,
                    status: 'draft',
                })
            })

            if (response.ok) {
                onConfirm?.()
                resetDialog()
            }
        } catch (err) {
            console.error("Failed to save VAT report:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && resetDialog()}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    {[1, 2].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                                {s}
                            </div>
                            {s < 2 && <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Edit values */}
                {step === 1 && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Momsdeklaration - {baseData.period}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <p className="text-sm text-muted-foreground">
                                Värdena är beräknade från bokföringen. Granska och justera vid behov.
                            </p>

                            {/* Section A: Momspliktig försäljning */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    A. Momspliktig försäljning
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ruta05" className="text-xs">05. Försäljning 25%</Label>
                                        <Input
                                            id="ruta05"
                                            value={formatNumber(formData.ruta05)}
                                            onChange={(e) => handleBaseChange('ruta05', e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ruta10" className="text-xs">10. Moms 25%</Label>
                                        <Input
                                            id="ruta10"
                                            value={formatNumber(formData.ruta10)}
                                            onChange={(e) => handleInputChange('ruta10', e.target.value)}
                                            className="h-9 bg-muted/30"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ruta06" className="text-xs">06. Försäljning 12%</Label>
                                        <Input
                                            id="ruta06"
                                            value={formatNumber(formData.ruta06)}
                                            onChange={(e) => handleBaseChange('ruta06', e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ruta11" className="text-xs">11. Moms 12%</Label>
                                        <Input
                                            id="ruta11"
                                            value={formatNumber(formData.ruta11)}
                                            onChange={(e) => handleInputChange('ruta11', e.target.value)}
                                            className="h-9 bg-muted/30"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ruta07" className="text-xs">07. Försäljning 6%</Label>
                                        <Input
                                            id="ruta07"
                                            value={formatNumber(formData.ruta07)}
                                            onChange={(e) => handleBaseChange('ruta07', e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ruta12" className="text-xs">12. Moms 6%</Label>
                                        <Input
                                            id="ruta12"
                                            value={formatNumber(formData.ruta12)}
                                            onChange={(e) => handleInputChange('ruta12', e.target.value)}
                                            className="h-9 bg-muted/30"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section C: EU-inköp */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    C. Inköp med omvänd moms
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ruta20" className="text-xs">20. Varor EU</Label>
                                        <Input
                                            id="ruta20"
                                            value={formatNumber(formData.ruta20)}
                                            onChange={(e) => handleInputChange('ruta20', e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ruta21" className="text-xs">21. Tjänster EU</Label>
                                        <Input
                                            id="ruta21"
                                            value={formatNumber(formData.ruta21)}
                                            onChange={(e) => handleInputChange('ruta21', e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ruta22" className="text-xs">22. Tjänster utanför EU</Label>
                                        <Input
                                            id="ruta22"
                                            value={formatNumber(formData.ruta22)}
                                            onChange={(e) => handleInputChange('ruta22', e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section E: Momsfri försäljning */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    E. Momsfri försäljning
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ruta35" className="text-xs">35. Varor till EU</Label>
                                        <Input
                                            id="ruta35"
                                            value={formatNumber(formData.ruta35)}
                                            onChange={(e) => handleInputChange('ruta35', e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ruta36" className="text-xs">36. Export</Label>
                                        <Input
                                            id="ruta36"
                                            value={formatNumber(formData.ruta36)}
                                            onChange={(e) => handleInputChange('ruta36', e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ruta39" className="text-xs">39. Tjänster till EU</Label>
                                        <Input
                                            id="ruta39"
                                            value={formatNumber(formData.ruta39)}
                                            onChange={(e) => handleInputChange('ruta39', e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section F: Ingående moms */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    F. Ingående moms
                                </h4>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ruta48" className="text-xs">48. Ingående moms att dra av</Label>
                                    <Input
                                        id="ruta48"
                                        value={formatNumber(formData.ruta48)}
                                        onChange={(e) => handleInputChange('ruta48', e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Utgående moms totalt</span>
                                    <span className="font-medium">{formatNumber(totalOutputVat)} kr</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Ingående moms</span>
                                    <span className="font-medium text-green-600">-{formatNumber(formData.ruta48)} kr</span>
                                </div>
                                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                                    <span>Moms att {netVat >= 0 ? 'betala' : 'få tillbaka'}</span>
                                    <span className={netVat >= 0 ? '' : 'text-green-600'}>{formatNumber(Math.abs(netVat))} kr</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={resetDialog}>
                                Avbryt
                            </Button>
                            <Button className="flex-1" onClick={() => setStep(2)}>
                                Granska
                            </Button>
                        </div>
                    </>
                )}

                {/* Step 2: Confirm */}
                {step === 2 && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Bekräfta momsdeklaration</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span>📄</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">Momsdeklaration {baseData.period}</p>
                                        <p className="text-sm text-muted-foreground">SKV 4700</p>
                                    </div>
                                </div>

                                <div className="border-t pt-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Momspliktig försäljning</span>
                                        <span>{formatNumber(formData.ruta05 + formData.ruta06 + formData.ruta07)} kr</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Utgående moms</span>
                                        <span>{formatNumber(totalOutputVat)} kr</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Ingående moms</span>
                                        <span className="text-green-600">-{formatNumber(formData.ruta48)} kr</span>
                                    </div>
                                    {(formData.ruta35 > 0 || formData.ruta36 > 0 || formData.ruta39 > 0) && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Momsfri försäljning</span>
                                            <span>{formatNumber(formData.ruta35 + formData.ruta36 + formData.ruta39)} kr</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-3">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-medium">Moms att {netVat >= 0 ? 'betala' : 'få tillbaka'}</span>
                                        <span className={`text-2xl font-bold ${netVat < 0 ? 'text-green-600' : ''}`}>
                                            {formatNumber(Math.abs(netVat))} kr
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t pt-3 space-y-1">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span>Beräknat från bokföring</span>
                                    </div>
                                    {(formData.ruta20 > 0 || formData.ruta21 > 0 || formData.ruta22 > 0) && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <AlertCircle className="h-4 w-4 text-amber-500" />
                                            <span>Innehåller omvänd skattskyldighet</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground text-center">
                                Deadline: {baseData.dueDate}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={isSubmitting}>
                                Tillbaka
                            </Button>
                            <Button className="flex-1" onClick={handleConfirm} disabled={isSubmitting}>
                                {isSubmitting ? "Sparar..." : "Spara deklaration"}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
