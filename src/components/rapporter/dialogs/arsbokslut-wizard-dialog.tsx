"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatNumber } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"
import { ReportWizardShell } from "@/components/shared"
import { useToast } from "@/components/ui/toast"
import { downloadElementAsPDF } from "@/lib/exports/pdf-generator"

interface ArsbokslutData {
    sales: number
    materials: number
    externalExpenses: number
    personnel: number
    depreciations: number
    financialItems: number
    result: number
    fixedAssets: number
    receivables: number
    cash: number
    totalAssets: number
    equity: number
    payables: number
    taxes: number
    otherLiabilities: number
    totalEqLiab: number
    fiscalYear: string
    companyType: string
}

interface ArsbokslutWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: ArsbokslutData
    onConfirm?: () => void
}

export function ArsbokslutWizardDialog({
    open,
    onOpenChange,
    data,
    onConfirm,
}: ArsbokslutWizardDialogProps) {
    const toast = useToast()
    const [isSaving, setIsSaving] = useState(false)
    const [status, setStatus] = useState<"draft" | "done">("draft")

    const [form, setForm] = useState({
        sales: data.sales,
        materials: data.materials,
        externalExpenses: data.externalExpenses,
        personnel: data.personnel,
        depreciations: data.depreciations,
        financialItems: data.financialItems,
        fixedAssets: data.fixedAssets,
        receivables: data.receivables,
        cash: data.cash,
        equity: data.equity,
        payables: data.payables,
        taxes: data.taxes,
        otherLiabilities: data.otherLiabilities,
    })

    useEffect(() => {
        setForm({
            sales: data.sales,
            materials: data.materials,
            externalExpenses: data.externalExpenses,
            personnel: data.personnel,
            depreciations: data.depreciations,
            financialItems: data.financialItems,
            fixedAssets: data.fixedAssets,
            receivables: data.receivables,
            cash: data.cash,
            equity: data.equity,
            payables: data.payables,
            taxes: data.taxes,
            otherLiabilities: data.otherLiabilities,
        })
        setStatus("draft")
    }, [data])

    // Derived values
    const result = form.sales - form.materials - form.externalExpenses - form.personnel - form.depreciations + form.financialItems
    const totalAssets = form.fixedAssets + form.receivables + form.cash
    const totalEqLiab = form.equity + result + form.payables + form.taxes + form.otherLiabilities

    const handleInputChange = (field: keyof typeof form, value: string) => {
        const numValue = parseInt(value.replace(/[^\d-]/g, '')) || 0
        setForm(prev => ({ ...prev, [field]: numValue }))
    }

    const handleSaveDraft = async () => {
        setIsSaving(true)
        try {
            await fetch('/api/reports/income-declaration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_type: 'arsbokslut',
                    tax_year: data.fiscalYear,
                    status: 'draft',
                    data: { ...form, result, totalAssets, totalEqLiab }
                })
            })
            toast.success("Sparat", "Årsbokslut sparat som utkast.")
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
                    report_type: 'arsbokslut',
                    tax_year: data.fiscalYear,
                    status: 'submitted',
                    data: { ...form, result, totalAssets, totalEqLiab }
                })
            })
            toast.success("Klar", "Årsbokslut markerat som klart.")
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
                fileName: `Arsbokslut-${data.fiscalYear}`,
                elementId: 'arsbokslut-wizard-content'
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
            title={`Årsbokslut — ${data.fiscalYear}`}
            subtitle="Granska och justera belopp från bokföringen."
            steps={["Resultaträkning", "Balansräkning", "Granska"]}
            onSaveDraft={handleSaveDraft}
            onMarkDone={handleMarkDone}
            onDownload={handleDownload}
            isSaving={isSaving}
            status={status}
        >
            {(step) => step === 0 ? (
                /* Step 1: P&L */
                <div className="space-y-6">
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Intäkter
                        </h4>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Försäljning och övriga intäkter</Label>
                            <Input
                                value={formatNumber(form.sales)}
                                onChange={(e) => handleInputChange('sales', e.target.value)}
                                className="h-9"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Kostnader
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Varor och material</Label>
                                <Input
                                    value={formatNumber(form.materials)}
                                    onChange={(e) => handleInputChange('materials', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Övriga externa kostnader</Label>
                                <Input
                                    value={formatNumber(form.externalExpenses)}
                                    onChange={(e) => handleInputChange('externalExpenses', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Personalkostnader</Label>
                                <Input
                                    value={formatNumber(form.personnel)}
                                    onChange={(e) => handleInputChange('personnel', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Avskrivningar</Label>
                                <Input
                                    value={formatNumber(form.depreciations)}
                                    onChange={(e) => handleInputChange('depreciations', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Finansiella poster
                        </h4>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Ränteintäkter/räntekostnader netto</Label>
                            <Input
                                value={formatNumber(form.financialItems)}
                                onChange={(e) => handleInputChange('financialItems', e.target.value)}
                                className="h-9"
                            />
                        </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex justify-between font-semibold">
                            <span>Årets resultat</span>
                            <span>{formatNumber(result)} kr</span>
                        </div>
                    </div>
                </div>
            ) : step === 1 ? (
                /* Step 2: Balance Sheet */
                <div className="space-y-6">
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Tillgångar
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Anläggningstillgångar</Label>
                                <Input
                                    value={formatNumber(form.fixedAssets)}
                                    onChange={(e) => handleInputChange('fixedAssets', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Kundfordringar mm</Label>
                                <Input
                                    value={formatNumber(form.receivables)}
                                    onChange={(e) => handleInputChange('receivables', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Kassa och bank</Label>
                                <Input
                                    value={formatNumber(form.cash)}
                                    onChange={(e) => handleInputChange('cash', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 text-sm">
                            <div className="flex justify-between font-medium">
                                <span>Summa tillgångar</span>
                                <span>{formatNumber(totalAssets)} kr</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Eget kapital och skulder
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Eget kapital</Label>
                                <Input
                                    value={formatNumber(form.equity)}
                                    onChange={(e) => handleInputChange('equity', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Leverantörsskulder</Label>
                                <Input
                                    value={formatNumber(form.payables)}
                                    onChange={(e) => handleInputChange('payables', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Skatteskulder</Label>
                                <Input
                                    value={formatNumber(form.taxes)}
                                    onChange={(e) => handleInputChange('taxes', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Övriga skulder</Label>
                                <Input
                                    value={formatNumber(form.otherLiabilities)}
                                    onChange={(e) => handleInputChange('otherLiabilities', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 text-sm">
                            <div className="flex justify-between font-medium">
                                <span>Summa EK + skulder</span>
                                <span>{formatNumber(totalEqLiab)} kr</span>
                            </div>
                        </div>
                    </div>

                    {totalAssets !== totalEqLiab && (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
                            Balansräkningen stämmer inte. Differens: {formatNumber(totalAssets - totalEqLiab)} kr
                        </div>
                    )}
                </div>
            ) : (
                /* Step 3: Review */
                <div id="arsbokslut-wizard-content" className="space-y-4">
                    <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                                📊
                            </div>
                            <div>
                                <p className="font-medium">Årsbokslut — {data.fiscalYear}</p>
                                <p className="text-sm text-muted-foreground">{data.companyType}</p>
                            </div>
                        </div>

                        <div className="border-t pt-3 space-y-2 text-sm">
                            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Resultaträkning</p>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Intäkter</span>
                                <span>{formatNumber(form.sales)} kr</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Kostnader</span>
                                <span>{formatNumber(-(form.materials + form.externalExpenses + form.personnel + form.depreciations))} kr</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Finansiella poster</span>
                                <span>{formatNumber(form.financialItems)} kr</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t pt-2">
                                <span>Årets resultat</span>
                                <span>{formatNumber(result)} kr</span>
                            </div>
                        </div>

                        <div className="border-t pt-3 space-y-2 text-sm">
                            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Balansräkning</p>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tillgångar</span>
                                <span>{formatNumber(totalAssets)} kr</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">EK + Skulder</span>
                                <span>{formatNumber(totalEqLiab)} kr</span>
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
                        Deadline: 30 juni {parseInt(data.fiscalYear.split('-')[0]) + 1 || ''}
                    </p>
                </div>
            )}
        </ReportWizardShell>
    )
}
