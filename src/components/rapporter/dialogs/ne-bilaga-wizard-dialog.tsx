"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatNumber } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"
import { ReportWizardShell } from "@/components/shared"
import { useToast } from "@/components/ui/toast"
import { downloadElementAsPDF } from "@/lib/exports/pdf-generator"

interface NEBilagaData {
    R1: number
    R5: number
    R6: number
    R7: number
    R8: number
    R9: number
    R10: number
    R11: number
    R12: number
    R13: number
    R14: number
    R15: number
    R24: number
    egenavgifter: number
    slutligtResultat: number
    taxYear: number
}

interface NEBilagaWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: NEBilagaData
    onConfirm?: () => void
}

export function NEBilagaWizardDialog({
    open,
    onOpenChange,
    data,
    onConfirm,
}: NEBilagaWizardDialogProps) {
    const toast = useToast()
    const [isSaving, setIsSaving] = useState(false)
    const [status, setStatus] = useState<"draft" | "done">("draft")

    // Editable fields — initialized from auto-calculated data
    const [form, setForm] = useState({
        R1: data.R1,
        R5: data.R5,
        R7: data.R7,
        R8: data.R8,
        R9: data.R9,
        R10: data.R10,
        periodiseringsfond: 0,
        aterforingPeriodiseringsfond: 0,
    })

    // Reset form when data changes
    useEffect(() => {
        setForm({
            R1: data.R1,
            R5: data.R5,
            R7: data.R7,
            R8: data.R8,
            R9: data.R9,
            R10: data.R10,
            periodiseringsfond: 0,
            aterforingPeriodiseringsfond: 0,
        })
        setStatus("draft")
    }, [data])

    // Recalculate derived values from form
    const summaIntakter = form.R1 + form.R5
    const summaKostnader = form.R7 + form.R8 + form.R9 + form.R10
    const resultatForeEgenavgifter = summaIntakter + summaKostnader

    const egenavgifterRate = 0.2897
    const schablonavdrag = resultatForeEgenavgifter > 0
        ? Math.round(resultatForeEgenavgifter * 0.25 * egenavgifterRate)
        : 0

    const maxPeriodiseringsfond = resultatForeEgenavgifter > 0
        ? Math.round(resultatForeEgenavgifter * 0.30)
        : 0

    const resultatEfterAvdrag = resultatForeEgenavgifter - schablonavdrag - form.periodiseringsfond + form.aterforingPeriodiseringsfond
    const egenavgifter = resultatEfterAvdrag > 0
        ? Math.round(resultatEfterAvdrag * egenavgifterRate)
        : 0
    const slutligtResultat = resultatEfterAvdrag - egenavgifter

    const handleInputChange = (field: keyof typeof form, value: string) => {
        const numValue = parseInt(value.replace(/[^\d-]/g, '')) || 0
        setFormField(field, numValue)
    }

    const setFormField = (field: keyof typeof form, value: number) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleSaveDraft = async () => {
        setIsSaving(true)
        try {
            await fetch('/api/reports/income-declaration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_type: 'ne-bilaga',
                    tax_year: data.taxYear,
                    status: 'draft',
                    data: {
                        ...form,
                        summaIntakter,
                        summaKostnader,
                        resultatForeEgenavgifter,
                        schablonavdrag,
                        resultatEfterAvdrag,
                        egenavgifter,
                        slutligtResultat,
                    }
                })
            })
            toast.success("Sparat", "NE-bilaga sparad som utkast.")
            setStatus("draft")
        } catch {
            toast.error("Fel", "Kunde inte spara.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleMarkDone = async () => {
        setIsSaving(true)
        try {
            await fetch('/api/reports/income-declaration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_type: 'ne-bilaga',
                    tax_year: data.taxYear,
                    status: 'submitted',
                    data: {
                        ...form,
                        summaIntakter,
                        summaKostnader,
                        resultatForeEgenavgifter,
                        schablonavdrag,
                        resultatEfterAvdrag,
                        egenavgifter,
                        slutligtResultat,
                    }
                })
            })
            toast.success("Klar", "NE-bilaga markerad som inlämnad.")
            setStatus("done")
            onConfirm?.()
        } catch {
            toast.error("Fel", "Kunde inte uppdatera status.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDownload = async () => {
        toast.info("Exporterar", "Förbereder PDF...")
        try {
            await downloadElementAsPDF({
                fileName: `NE-bilaga-${data.taxYear}`,
                elementId: 'ne-bilaga-content'
            })
            toast.success("Klart", "PDF har laddats ner.")
        } catch {
            toast.error("Fel", "Kunde inte skapa PDF.")
        }
    }

    return (
        <ReportWizardShell
            open={open}
            onOpenChange={onOpenChange}
            title={`NE-bilaga — Inkomstår ${data.taxYear}`}
            subtitle="Granska och justera värden från bokföringen."
            steps={["Redigera", "Granska"]}
            onSaveDraft={handleSaveDraft}
            onMarkDone={handleMarkDone}
            onDownload={handleDownload}
            isSaving={isSaving}
            status={status}
        >
            {(step) => step === 0 ? (
                /* Step 1: Edit */
                <div className="space-y-6">
                    {/* Revenue */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Intäkter
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">R1. Nettoomsättning</Label>
                                <Input
                                    value={formatNumber(form.R1)}
                                    onChange={(e) => handleInputChange('R1', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">R5. Övriga intäkter</Label>
                                <Input
                                    value={formatNumber(form.R5)}
                                    onChange={(e) => handleInputChange('R5', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Costs */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Kostnader
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">R7. Varuinköp</Label>
                                <Input
                                    value={formatNumber(form.R7)}
                                    onChange={(e) => handleInputChange('R7', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">R8. Övriga kostnader</Label>
                                <Input
                                    value={formatNumber(form.R8)}
                                    onChange={(e) => handleInputChange('R8', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">R9. Personalkostnader</Label>
                                <Input
                                    value={formatNumber(form.R9)}
                                    onChange={(e) => handleInputChange('R9', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">R10. Avskrivningar</Label>
                                <Input
                                    value={formatNumber(form.R10)}
                                    onChange={(e) => handleInputChange('R10', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tax adjustments */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Skattemässiga justeringar
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">R14. Periodiseringsfond (avsättning)</Label>
                                <Input
                                    value={formatNumber(form.periodiseringsfond)}
                                    onChange={(e) => handleInputChange('periodiseringsfond', e.target.value)}
                                    className="h-9"
                                    placeholder="0"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Max {formatNumber(maxPeriodiseringsfond)} kr (30% av resultat)
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">R15. Återföring periodiseringsfond</Label>
                                <Input
                                    value={formatNumber(form.aterforingPeriodiseringsfond)}
                                    onChange={(e) => handleInputChange('aterforingPeriodiseringsfond', e.target.value)}
                                    className="h-9"
                                    placeholder="0"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Från tidigare års avsättningar
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Calculated summary */}
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                        <p className="font-medium text-muted-foreground">Beräknade värden:</p>
                        <div className="flex justify-between">
                            <span>R12. Resultat före egenavgifter</span>
                            <span className="font-medium">{formatNumber(resultatForeEgenavgifter)} kr</span>
                        </div>
                        <div className="flex justify-between">
                            <span>R13. Schablonavdrag (25% × 28,97%)</span>
                            <span className="font-medium">-{formatNumber(schablonavdrag)} kr</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2">
                            <span>R24. Överskott</span>
                            <span>{formatNumber(resultatEfterAvdrag)} kr</span>
                        </div>
                    </div>
                </div>
            ) : (
                /* Step 2: Review */
                <div className="space-y-4">
                    <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                                📄
                            </div>
                            <div>
                                <p className="font-medium">NE-bilaga — Inkomstår {data.taxYear}</p>
                                <p className="text-sm text-muted-foreground">Enskild firma</p>
                            </div>
                        </div>

                        <div className="border-t pt-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Nettoomsättning (R1)</span>
                                <span>{formatNumber(form.R1)} kr</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Övriga intäkter (R5)</span>
                                <span>{formatNumber(form.R5)} kr</span>
                            </div>
                            <div className="flex justify-between font-medium">
                                <span>Summa intäkter</span>
                                <span>{formatNumber(summaIntakter)} kr</span>
                            </div>
                        </div>

                        <div className="border-t pt-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Kostnader totalt</span>
                                <span>{formatNumber(summaKostnader)} kr</span>
                            </div>
                            <div className="flex justify-between font-medium">
                                <span>Resultat (R12)</span>
                                <span>{formatNumber(resultatForeEgenavgifter)} kr</span>
                            </div>
                        </div>

                        <div className="border-t pt-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Schablonavdrag (R13)</span>
                                <span>-{formatNumber(schablonavdrag)} kr</span>
                            </div>
                            {form.periodiseringsfond > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Periodiseringsfond (R14)</span>
                                    <span>-{formatNumber(form.periodiseringsfond)} kr</span>
                                </div>
                            )}
                            {form.aterforingPeriodiseringsfond > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Återföring (R15)</span>
                                    <span>+{formatNumber(form.aterforingPeriodiseringsfond)} kr</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-3">
                            <div className="flex justify-between items-baseline">
                                <span className="font-medium">Överskott (R24)</span>
                                <span className="text-2xl font-bold">{formatNumber(resultatEfterAvdrag)} kr</span>
                            </div>
                            <div className="flex justify-between items-baseline mt-2">
                                <span className="text-sm text-muted-foreground">Egenavgifter (28,97%)</span>
                                <span className="font-medium text-red-600">-{formatNumber(egenavgifter)} kr</span>
                            </div>
                            <div className="flex justify-between items-baseline mt-1">
                                <span className="text-sm font-medium">Netto efter egenavgifter</span>
                                <span className="font-bold text-green-600">{formatNumber(slutligtResultat)} kr</span>
                            </div>
                        </div>

                        <div className="border-t pt-3">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>Beräknat från bokföring, justerat manuellt</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        Deadline: 2 maj {data.taxYear + 1}
                    </p>
                </div>
            )}
        </ReportWizardShell>
    )
}
