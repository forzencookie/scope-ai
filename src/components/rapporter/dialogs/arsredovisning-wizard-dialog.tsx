"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatNumber } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"

export interface ArsredovisningWizardData {
    fiscalYear: number
    fiscalYearRange: string
    deadline: string
    companyType: string
    financials: {
        revenue: number
        netIncome: number
        totalAssets: number
    }
    // User-provided text
    forvaltningsberattelse?: {
        verksamhet: string
        vasentligaHandelser: string
        framtidsutsikter: string
    }
    resultatdisposition?: {
        balanserat: number
        arsResultat: number
        utdelning: number
        tillBalanserat: number
    }
}

interface ArsredovisningWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm?: () => void
    data?: ArsredovisningWizardData
}

function getDefaultData(): ArsredovisningWizardData {
    const currentYear = new Date().getFullYear()
    const fiscalYear = currentYear - 1
    return {
        fiscalYear,
        fiscalYearRange: `${fiscalYear}-01-01 – ${fiscalYear}-12-31`,
        deadline: `30 jun ${currentYear}`,
        companyType: "Aktiebolag",
        financials: {
            revenue: 0,
            netIncome: 0,
            totalAssets: 0,
        },
    }
}

export function ArsredovisningWizardDialog({ open, onOpenChange, onConfirm, data }: ArsredovisningWizardDialogProps) {
    const initialData = data || getDefaultData()

    // User-editable fields
    const [formData, setFormData] = useState({
        // Förvaltningsberättelse
        verksamhet: initialData.forvaltningsberattelse?.verksamhet || "",
        vasentligaHandelser: initialData.forvaltningsberattelse?.vasentligaHandelser || "",
        framtidsutsikter: initialData.forvaltningsberattelse?.framtidsutsikter || "",
        // Resultatdisposition
        utdelning: initialData.resultatdisposition?.utdelning || 0,
    })

    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Calculate resultatdisposition
    const arsResultat = initialData.financials.netIncome
    const balanserat = 0 // Would come from previous year's årsredovisning
    const tillBalanserat = balanserat + arsResultat - formData.utdelning

    const handleInputChange = (field: keyof typeof formData, value: string | number) => {
        if (field === 'utdelning') {
            const numValue = parseInt(String(value).replace(/\D/g, '')) || 0
            setFormData(prev => ({ ...prev, [field]: numValue }))
        } else {
            setFormData(prev => ({ ...prev, [field]: value }))
        }
    }

    const resetDialog = () => {
        setStep(1)
        setFormData({
            verksamhet: initialData.forvaltningsberattelse?.verksamhet || "",
            vasentligaHandelser: initialData.forvaltningsberattelse?.vasentligaHandelser || "",
            framtidsutsikter: initialData.forvaltningsberattelse?.framtidsutsikter || "",
            utdelning: initialData.resultatdisposition?.utdelning || 0,
        })
        setIsSubmitting(false)
        onOpenChange(false)
    }

    const handleConfirm = async () => {
        if (isSubmitting) return
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/reports/annual-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fiscalYear: initialData.fiscalYear,
                    data: {
                        financials: initialData.financials,
                        forvaltningsberattelse: {
                            verksamhet: formData.verksamhet,
                            vasentligaHandelser: formData.vasentligaHandelser,
                            framtidsutsikter: formData.framtidsutsikter,
                        },
                        resultatdisposition: {
                            balanserat,
                            arsResultat,
                            utdelning: formData.utdelning,
                            tillBalanserat,
                        },
                    },
                    status: 'draft',
                }),
            })

            if (response.ok) {
                onConfirm?.()
                resetDialog()
            }
        } catch (err) {
            console.error("Failed to save annual report:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && resetDialog()}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                                {s}
                            </div>
                            {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Review financials */}
                {step === 1 && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Årsredovisning {initialData.fiscalYear}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <p className="text-sm text-muted-foreground">
                                Granska beräknade nyckeltal från bokföringen.
                            </p>

                            {/* Auto-calculated financials */}
                            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Nyckeltal från bokföringen
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Nettoomsättning</span>
                                        <span className="font-medium">{formatNumber(initialData.financials.revenue)} kr</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Årets resultat</span>
                                        <span className={`font-medium ${arsResultat >= 0 ? '' : 'text-red-600'}`}>
                                            {formatNumber(arsResultat)} kr
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Balansomslutning</span>
                                        <span className="font-medium">{formatNumber(initialData.financials.totalAssets)} kr</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs pt-2 border-t">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                    <span className="text-muted-foreground">Resultat- och balansräkning beräknade</span>
                                </div>
                            </div>

                            {/* Period info */}
                            <div className="bg-muted/30 rounded-lg p-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Räkenskapsår</span>
                                    <span>{initialData.fiscalYearRange}</span>
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-muted-foreground">Regelverk</span>
                                    <span>K2</span>
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-muted-foreground">Deadline Bolagsverket</span>
                                    <span>{initialData.deadline}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={resetDialog}>
                                Avbryt
                            </Button>
                            <Button className="flex-1" onClick={() => setStep(2)}>
                                Nästa
                            </Button>
                        </div>
                    </>
                )}

                {/* Step 2: Förvaltningsberättelse */}
                {step === 2 && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Förvaltningsberättelse</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">
                                Fyll i information till förvaltningsberättelsen. Dessa fält är obligatoriska för K2.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="verksamhet" className="text-xs">
                                        Allmänt om verksamheten
                                    </Label>
                                    <Textarea
                                        id="verksamhet"
                                        value={formData.verksamhet}
                                        onChange={(e) => handleInputChange('verksamhet', e.target.value)}
                                        placeholder="Beskriv bolagets verksamhet..."
                                        className="min-h-[80px]"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        T.ex. &quot;Bolaget bedriver konsultverksamhet inom IT.&quot;
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="handelser" className="text-xs">
                                        Väsentliga händelser under året
                                    </Label>
                                    <Textarea
                                        id="handelser"
                                        value={formData.vasentligaHandelser}
                                        onChange={(e) => handleInputChange('vasentligaHandelser', e.target.value)}
                                        placeholder="Beskriv viktiga händelser..."
                                        className="min-h-[80px]"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Lämna tomt om inga väsentliga händelser har inträffat.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="framtid" className="text-xs">
                                        Framtida utveckling (valfritt)
                                    </Label>
                                    <Textarea
                                        id="framtid"
                                        value={formData.framtidsutsikter}
                                        onChange={(e) => handleInputChange('framtidsutsikter', e.target.value)}
                                        placeholder="Förväntad framtida utveckling..."
                                        className="min-h-[60px]"
                                    />
                                </div>
                            </div>

                            {/* Resultatdisposition */}
                            <div className="border-t pt-4 space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Resultatdisposition
                                </h4>

                                <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Balanserat resultat</span>
                                        <span>{formatNumber(balanserat)} kr</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Årets resultat</span>
                                        <span>{formatNumber(arsResultat)} kr</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="utdelning" className="text-xs">
                                        Föreslagen utdelning
                                    </Label>
                                    <Input
                                        id="utdelning"
                                        value={formatNumber(formData.utdelning)}
                                        onChange={(e) => handleInputChange('utdelning', e.target.value)}
                                        className="h-9"
                                    />
                                    {arsResultat > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            Max utdelningsbart: {formatNumber(balanserat + arsResultat)} kr
                                        </p>
                                    )}
                                </div>

                                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>Balanseras i ny räkning</span>
                                        <span>{formatNumber(tillBalanserat)} kr</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                                Tillbaka
                            </Button>
                            <Button className="flex-1" onClick={() => setStep(3)}>
                                Granska
                            </Button>
                        </div>
                    </>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Bekräfta årsredovisning</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span>🏢</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">Årsredovisning {initialData.fiscalYear}</p>
                                        <p className="text-sm text-muted-foreground">K2-regelverk</p>
                                    </div>
                                </div>

                                <div className="border-t pt-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Nettoomsättning</span>
                                        <span>{formatNumber(initialData.financials.revenue)} kr</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Årets resultat</span>
                                        <span>{formatNumber(arsResultat)} kr</span>
                                    </div>
                                    {formData.utdelning > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Föreslagen utdelning</span>
                                            <span>{formatNumber(formData.utdelning)} kr</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-3 space-y-1">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span>Resultaträkning</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span>Balansräkning</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className={`h-4 w-4 ${formData.verksamhet ? 'text-green-600' : 'text-muted-foreground'}`} />
                                        <span>Förvaltningsberättelse</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span>Resultatdisposition</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Noter (genereras automatiskt)</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground text-center">
                                Deadline: {initialData.deadline}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={isSubmitting}>
                                Tillbaka
                            </Button>
                            <Button className="flex-1" onClick={handleConfirm} disabled={isSubmitting}>
                                {isSubmitting ? "Sparar..." : "Spara årsredovisning"}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
