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
import { formatNumber } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"
import type { K10Data } from "../k10/use-k10-calculation"

export interface K10WizardData {
    taxYear: number
    deadline: string
    k10Data: K10Data
}

interface K10WizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm?: () => void
    data?: K10WizardData
}

function getDefaultData(): K10WizardData {
    const currentYear = new Date().getFullYear()
    return {
        taxYear: currentYear - 1,
        deadline: `2 maj ${currentYear}`,
        k10Data: {
            year: (currentYear - 1).toString(),
            schablonbelopp: 0,
            lonebaseratUtrymme: 0,
            gransbelopp: 0,
            totalDividends: 0,
            remainingUtrymme: 0,
            aktiekapital: 25000,
            omkostnadsbelopp: 25000,
            agarandel: 100,
            egenLon: 0,
            klararLonekrav: false,
            hasData: false,
            sparatUtdelningsutrymme: 0,
        },
    }
}

export function K10WizardDialog({ open, onOpenChange, onConfirm, data }: K10WizardDialogProps) {
    const initialData = data || getDefaultData()

    // Editable form state
    const [formData, setFormData] = useState({
        aktiekapital: initialData.k10Data.aktiekapital,
        omkostnadsbelopp: initialData.k10Data.omkostnadsbelopp,
        agarandel: initialData.k10Data.agarandel,
        totalDividends: initialData.k10Data.totalDividends,
        sparatUtrymmeTidigareAr: 0, // User can add saved space from previous years
    })

    const [step, setStep] = useState<1 | 2>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Recalculate based on form input
    const k10 = initialData.k10Data
    const schablonbelopp = k10.schablonbelopp
    const lonebaseratUtrymme = k10.lonebaseratUtrymme
    const gransbelopp = Math.max(schablonbelopp, lonebaseratUtrymme) + formData.sparatUtrymmeTidigareAr
    const remainingUtrymme = gransbelopp - formData.totalDividends
    const usesMainRule = lonebaseratUtrymme > schablonbelopp

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        const numValue = parseInt(value.replace(/\D/g, '')) || 0
        setFormData(prev => ({ ...prev, [field]: numValue }))
    }

    const resetDialog = () => {
        setStep(1)
        setFormData({
            aktiekapital: initialData.k10Data.aktiekapital,
            omkostnadsbelopp: initialData.k10Data.omkostnadsbelopp,
            agarandel: initialData.k10Data.agarandel,
            totalDividends: initialData.k10Data.totalDividends,
            sparatUtrymmeTidigareAr: 0,
        })
        setIsSubmitting(false)
        onOpenChange(false)
    }

    const handleConfirm = async () => {
        if (isSubmitting) return
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/reports/k10', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taxYear: initialData.taxYear,
                    data: {
                        ...k10,
                        aktiekapital: formData.aktiekapital,
                        omkostnadsbelopp: formData.omkostnadsbelopp,
                        agarandel: formData.agarandel,
                        totalDividends: formData.totalDividends,
                        gransbelopp,
                        remainingUtrymme,
                    },
                    status: 'draft',
                }),
            })

            if (response.ok) {
                onConfirm?.()
                resetDialog()
            }
        } catch (err) {
            console.error("Failed to save K10 declaration:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && resetDialog()}>
            <DialogContent className="sm:max-w-lg">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    {[1, 2].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                }`}
                            >
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
                            <DialogTitle>K10 - Inkomstår {initialData.taxYear}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">
                                Granska och justera uppgifterna. Värdena är förberäknade från bokföringen.
                            </p>

                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="aktiekapital">Aktiekapital (kr)</Label>
                                        <Input
                                            id="aktiekapital"
                                            value={formatNumber(formData.aktiekapital)}
                                            onChange={(e) => handleInputChange('aktiekapital', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="omkostnadsbelopp">Omkostnadsbelopp (kr)</Label>
                                        <Input
                                            id="omkostnadsbelopp"
                                            value={formatNumber(formData.omkostnadsbelopp)}
                                            onChange={(e) => handleInputChange('omkostnadsbelopp', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="agarandel">Ägarandel (%)</Label>
                                        <Input
                                            id="agarandel"
                                            value={formData.agarandel}
                                            onChange={(e) => handleInputChange('agarandel', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="totalDividends">Tagen utdelning (kr)</Label>
                                        <Input
                                            id="totalDividends"
                                            value={formatNumber(formData.totalDividends)}
                                            onChange={(e) => handleInputChange('totalDividends', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sparatUtrymme">Sparat utrymme från tidigare år (kr)</Label>
                                    <Input
                                        id="sparatUtrymme"
                                        value={formatNumber(formData.sparatUtrymmeTidigareAr)}
                                        onChange={(e) => handleInputChange('sparatUtrymmeTidigareAr', e.target.value)}
                                        placeholder="0"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Lägg till sparat gränsbelopp som inte utnyttjades tidigare år.
                                    </p>
                                </div>
                            </div>

                            {/* Calculated values (read-only) */}
                            <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-2">
                                <p className="font-medium text-muted-foreground">Beräknade värden:</p>
                                <div className="flex justify-between">
                                    <span>Schablonbelopp (förenklingsregeln)</span>
                                    <span className="font-medium">{formatNumber(schablonbelopp)} kr</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Lönebaserat utrymme (huvudregeln)</span>
                                    <span className="font-medium">{formatNumber(lonebaseratUtrymme)} kr</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Lönekrav</span>
                                    <span className={k10.klararLonekrav ? "text-green-600" : "text-muted-foreground"}>
                                        {k10.klararLonekrav ? "Uppfyllt" : "Ej uppfyllt"}
                                    </span>
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
                            <DialogTitle>Bekräfta K10</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span>📄</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">K10 - Inkomstår {initialData.taxYear}</p>
                                        <p className="text-sm text-muted-foreground">Kvalificerade andelar</p>
                                    </div>
                                </div>

                                <div className="border-t pt-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Aktiekapital</span>
                                        <span>{formatNumber(formData.aktiekapital)} kr</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Ägarandel</span>
                                        <span>{formData.agarandel}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            {usesMainRule ? "Lönebaserat utrymme" : "Schablonbelopp"}
                                        </span>
                                        <span>{formatNumber(usesMainRule ? lonebaseratUtrymme : schablonbelopp)} kr</span>
                                    </div>
                                    {formData.sparatUtrymmeTidigareAr > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Sparat från tidigare år</span>
                                            <span>{formatNumber(formData.sparatUtrymmeTidigareAr)} kr</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tagen utdelning</span>
                                        <span className="text-green-600">-{formatNumber(formData.totalDividends)} kr</span>
                                    </div>
                                </div>

                                <div className="border-t pt-3">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-medium">Gränsbelopp</span>
                                        <span className="text-2xl font-bold">{formatNumber(gransbelopp)} kr</span>
                                    </div>
                                    <div className="flex justify-between items-baseline mt-1">
                                        <span className="text-sm text-muted-foreground">Sparat till nästa år</span>
                                        <span className="font-medium">{formatNumber(remainingUtrymme)} kr</span>
                                    </div>
                                </div>

                                <div className="border-t pt-3">
                                    <p className="text-sm text-muted-foreground mb-2">Tillämpas:</p>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span>{usesMainRule ? "Huvudregeln (lönebaserat)" : "Förenklingsregeln (schablon)"}</span>
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
                                {isSubmitting ? "Sparar..." : "Spara K10"}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
