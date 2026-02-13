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
import { useAllTaxRates } from "@/hooks/use-tax-parameters"

export interface InkomstWizardData {
    taxYear: number
    deadline: string
    // From Ink2Processor.calculateAll().totals
    totals: {
        revenue: number
        expenses: number
        netIncome: number
        taxableResult: number
        totalAssets: number
        totalEquityAndLiabilities: number
    }
    // Key adjustable fields
    adjustments?: {
        previousYearLoss: number           // Tidigare års underskott
        periodiseringsfondAvsattning: number // Avsättning till periodiseringsfond
        periodiseringsfondAterforing: number // Återföring av periodiseringsfond
        ejAvdragsgillaKostnader: number    // Non-deductible costs (auto-calculated)
    }
}

interface InkomstWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm?: () => void
    data?: InkomstWizardData
}

function getDefaultData(): InkomstWizardData {
    const currentYear = new Date().getFullYear()
    return {
        taxYear: currentYear - 1,
        deadline: `1 jul ${currentYear}`,
        totals: {
            revenue: 0,
            expenses: 0,
            netIncome: 0,
            taxableResult: 0,
            totalAssets: 0,
            totalEquityAndLiabilities: 0,
        },
        adjustments: {
            previousYearLoss: 0,
            periodiseringsfondAvsattning: 0,
            periodiseringsfondAterforing: 0,
            ejAvdragsgillaKostnader: 0,
        }
    }
}

export function InkomstWizardDialog({ open, onOpenChange, onConfirm, data }: InkomstWizardDialogProps) {
    const initialData = data || getDefaultData()
    const { rates: taxRates } = useAllTaxRates(initialData.taxYear)

    // Editable adjustments
    const [formData, setFormData] = useState({
        previousYearLoss: initialData.adjustments?.previousYearLoss || 0,
        periodiseringsfondAvsattning: initialData.adjustments?.periodiseringsfondAvsattning || 0,
        periodiseringsfondAterforing: initialData.adjustments?.periodiseringsfondAterforing || 0,
        ejAvdragsgillaKostnader: initialData.adjustments?.ejAvdragsgillaKostnader || 0,
    })

    const [step, setStep] = useState<1 | 2>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Calculate adjusted taxable result
    const bokfortResultat = initialData.totals.netIncome
    const taxRate = taxRates.corporateTaxRate

    // Max periodiseringsfond: 25% of profit (if positive)
    const maxPeriodiseringsfond = bokfortResultat > 0 ? Math.round(bokfortResultat * 0.25) : 0

    const adjustedTaxableResult = useMemo(() => {
        let result = bokfortResultat
        // Add back non-deductible costs
        result += formData.ejAvdragsgillaKostnader
        // Add back periodiseringsfond återföring
        result += formData.periodiseringsfondAterforing
        // Subtract periodiseringsfond avsättning
        result -= formData.periodiseringsfondAvsattning
        // Subtract previous year losses
        result -= formData.previousYearLoss
        return result
    }, [bokfortResultat, formData])

    const estimatedTax = Math.max(0, Math.round(adjustedTaxableResult * taxRate))

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        const numValue = parseInt(value.replace(/\D/g, '')) || 0
        setFormData(prev => ({ ...prev, [field]: numValue }))
    }

    const resetDialog = () => {
        setStep(1)
        setFormData({
            previousYearLoss: initialData.adjustments?.previousYearLoss || 0,
            periodiseringsfondAvsattning: initialData.adjustments?.periodiseringsfondAvsattning || 0,
            periodiseringsfondAterforing: initialData.adjustments?.periodiseringsfondAterforing || 0,
            ejAvdragsgillaKostnader: initialData.adjustments?.ejAvdragsgillaKostnader || 0,
        })
        setIsSubmitting(false)
        onOpenChange(false)
    }

    const handleConfirm = async () => {
        if (isSubmitting) return
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/reports/income-declaration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taxYear: initialData.taxYear,
                    data: {
                        totals: initialData.totals,
                        adjustments: formData,
                        taxableResult: adjustedTaxableResult,
                        estimatedTax,
                    },
                    status: 'draft',
                }),
            })

            if (response.ok) {
                onConfirm?.()
                resetDialog()
            }
        } catch (err) {
            console.error("Failed to save income declaration:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Check if balance sheet balances
    const balanceSheetBalances = Math.abs(
        initialData.totals.totalAssets - initialData.totals.totalEquityAndLiabilities
    ) < 1

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

                {/* Step 1: Review & Edit */}
                {step === 1 && (
                    <>
                        <DialogHeader>
                            <DialogTitle>INK2 - Inkomstår {initialData.taxYear}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <p className="text-sm text-muted-foreground">
                                Granska beräknade värden från bokföringen och justera skattemässiga poster.
                            </p>

                            {/* Auto-calculated summary (read-only) */}
                            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Från bokföringen
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex justify-between">
                                        <span>Nettoomsättning</span>
                                        <span className="font-medium">{formatNumber(initialData.totals.revenue)} kr</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Kostnader</span>
                                        <span className="font-medium">-{formatNumber(initialData.totals.expenses)} kr</span>
                                    </div>
                                    <div className="flex justify-between col-span-2 border-t pt-2">
                                        <span className="font-medium">Bokfört resultat</span>
                                        <span className={`font-semibold ${bokfortResultat >= 0 ? '' : 'text-red-600'}`}>
                                            {formatNumber(bokfortResultat)} kr
                                        </span>
                                    </div>
                                </div>

                                {/* Balance sheet check */}
                                <div className="flex items-center gap-2 text-xs pt-2 border-t">
                                    {balanceSheetBalances ? (
                                        <>
                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                            <span className="text-muted-foreground">Balansräkning stämmer</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                            <span className="text-amber-600">Balansräkning stämmer inte</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Editable tax adjustments */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Skattemässiga justeringar
                                </h4>

                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ejAvdragsgilla" className="text-xs">
                                            Ej avdragsgilla kostnader (representation m.m.)
                                        </Label>
                                        <Input
                                            id="ejAvdragsgilla"
                                            value={formatNumber(formData.ejAvdragsgillaKostnader)}
                                            onChange={(e) => handleInputChange('ejAvdragsgillaKostnader', e.target.value)}
                                            className="h-9"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Beräknat automatiskt från konto 6070-6079
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="periodAterforing" className="text-xs">
                                                Återföring periodiseringsfond
                                            </Label>
                                            <Input
                                                id="periodAterforing"
                                                value={formatNumber(formData.periodiseringsfondAterforing)}
                                                onChange={(e) => handleInputChange('periodiseringsfondAterforing', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="periodAvsattning" className="text-xs">
                                                Avsättning periodiseringsfond
                                            </Label>
                                            <Input
                                                id="periodAvsattning"
                                                value={formatNumber(formData.periodiseringsfondAvsattning)}
                                                onChange={(e) => handleInputChange('periodiseringsfondAvsattning', e.target.value)}
                                                className="h-9"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Max {formatNumber(maxPeriodiseringsfond)} kr (25%)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="previousLoss" className="text-xs">
                                            Tidigare års underskott att utnyttja
                                        </Label>
                                        <Input
                                            id="previousLoss"
                                            value={formatNumber(formData.previousYearLoss)}
                                            onChange={(e) => handleInputChange('previousYearLoss', e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Calculated result */}
                            <div className="bg-primary/5 rounded-lg p-3 space-y-2 border border-primary/20">
                                <div className="flex justify-between text-sm">
                                    <span>Skattemässigt resultat</span>
                                    <span className={`font-semibold ${adjustedTaxableResult >= 0 ? '' : 'text-green-600'}`}>
                                        {formatNumber(adjustedTaxableResult)} kr
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Beräknad skatt ({(taxRates.corporateTaxRate * 100).toFixed(1).replace('.', ',')}%)</span>
                                    <span className="font-medium">{formatNumber(estimatedTax)} kr</span>
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
                            <DialogTitle>Bekräfta inkomstdeklaration</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span>📄</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">INK2 - Inkomstår {initialData.taxYear}</p>
                                        <p className="text-sm text-muted-foreground">Aktiebolag</p>
                                    </div>
                                </div>

                                <div className="border-t pt-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Nettoomsättning</span>
                                        <span>{formatNumber(initialData.totals.revenue)} kr</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Bokfört resultat</span>
                                        <span>{formatNumber(bokfortResultat)} kr</span>
                                    </div>
                                    {formData.ejAvdragsgillaKostnader > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">+ Ej avdragsgilla</span>
                                            <span>{formatNumber(formData.ejAvdragsgillaKostnader)} kr</span>
                                        </div>
                                    )}
                                    {formData.periodiseringsfondAvsattning > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">- Periodiseringsfond</span>
                                            <span className="text-green-600">-{formatNumber(formData.periodiseringsfondAvsattning)} kr</span>
                                        </div>
                                    )}
                                    {formData.previousYearLoss > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">- Tidigare underskott</span>
                                            <span className="text-green-600">-{formatNumber(formData.previousYearLoss)} kr</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-3">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-medium">Skattemässigt resultat</span>
                                        <span className="text-2xl font-bold">{formatNumber(adjustedTaxableResult)} kr</span>
                                    </div>
                                    <div className="flex justify-between items-baseline mt-1">
                                        <span className="text-sm text-muted-foreground">Beräknad skatt</span>
                                        <span className="font-medium">{formatNumber(estimatedTax)} kr</span>
                                    </div>
                                </div>

                                <div className="border-t pt-3 space-y-1">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span>Resultaträkning beräknad</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span>Balansräkning beräknad</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span>Skattemässiga justeringar</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground text-center">
                                Deadline: {initialData.deadline}
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
