"use client"

import { useState, useMemo } from "react"
import {
    Users,
    Coins,
    TrendingUp,
    Building2,
    FileText,
    ChevronRight,
    Check,
    Plus,
    Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { CorporateActionType } from "@/types/events"
import { corporateActionTypeMeta } from "@/types/events"
import { useCompliance, type Shareholder } from "@/hooks/use-compliance"

// Icon mapping for corporate action types
const actionIcons: Record<CorporateActionType, React.ElementType> = {
    board_change: Users,
    dividend: Coins,
    capital_change: TrendingUp,
    authority_filing: Building2,
    statute_change: FileText,
}

// Configure step with real form fields
interface ConfigureStepProps {
    actionType: CorporateActionType
    onBack: () => void
    onContinue: (data: any) => void
    shareholders: Shareholder[]
}

function ConfigureStep({ actionType, onBack, onContinue, shareholders }: ConfigureStepProps) {
    const [formData, setFormData] = useState<Record<string, string>>({})

    // For board change
    const [boardMembers, setBoardMembers] = useState<string[]>(['Rice'])

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleAddMember = () => {
        if (formData.newMember) {
            setBoardMembers(prev => [...prev, formData.newMember])
            setFormData(prev => ({ ...prev, newMember: '' }))
        }
    }

    const handleRemoveMember = (name: string) => {
        setBoardMembers(prev => prev.filter(m => m !== name))
    }

    const handleSubmit = () => {
        onContinue({ ...formData, boardMembers })
    }

    // Board change form
    if (actionType === 'board_change') {
        return (
            <div className="space-y-4">
                <Card className="p-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Nuvarande / Ny styrelse</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {boardMembers.map(name => (
                                    <div key={name} className="text-sm px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-lg flex items-center gap-2">
                                        <span className="font-medium">{name}</span>
                                        <button
                                            onClick={() => handleRemoveMember(name)}
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-3 pt-2">
                            <div>
                                <Label htmlFor="newMember">Lägg till styrelseledamot</Label>
                                <div className="flex gap-2 mt-1.5">
                                    <Input
                                        id="newMember"
                                        placeholder="Namn på ledamot"
                                        value={formData.newMember || ''}
                                        onChange={(e) => handleChange('newMember', e.target.value)}
                                    />
                                    <Button variant="outline" size="icon" onClick={handleAddMember}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="changeDate">Ändringsdatum</Label>
                                <Input
                                    id="changeDate"
                                    type="date"
                                    value={formData.changeDate || new Date().toISOString().split('T')[0]}
                                    onChange={(e) => handleChange('changeDate', e.target.value)}
                                    className="mt-1.5"
                                />
                            </div>
                        </div>
                    </div>
                </Card>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onBack}>Tillbaka</Button>
                    <Button onClick={handleSubmit}>Fortsätt till granskning</Button>
                </div>
            </div>
        )
    }

    // Dividend form
    if (actionType === 'dividend') {
        const totalShares = shareholders.reduce((acc, s) => acc + s.shares_count, 0)
        return (
            <div className="space-y-4">
                <Card className="p-4">
                    <div className="space-y-4">
                        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900">
                            <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                Totalt antal aktier: <span className="font-bold">{totalShares.toLocaleString()}</span>
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="dividendTotal">Total utdelning (SEK)</Label>
                            <Input
                                id="dividendTotal"
                                type="number"
                                placeholder="t.ex. 100000"
                                value={formData.dividendTotal || ''}
                                onChange={(e) => handleChange('dividendTotal', e.target.value)}
                                className="mt-1.5"
                            />
                            {formData.dividendTotal && totalShares > 0 && (
                                <p className="text-xs text-muted-foreground mt-2 px-1">
                                    = {(parseFloat(formData.dividendTotal) / totalShares).toFixed(2)} SEK per aktie
                                </p>
                            )}
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Fördelning per aktieägare</Label>
                            <div className="space-y-1.5 mt-2">
                                {shareholders.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">Inga aktieägare hittades.</p>
                                ) : (
                                    shareholders.map(s => (
                                        <div key={s.id} className="flex justify-between items-center text-sm p-2.5 bg-muted/30 rounded-lg border border-transparent hover:border-muted-foreground/10 transition-colors">
                                            <span className="font-medium">{s.name} <span className="text-muted-foreground font-normal ml-1">({s.shares_percentage}%)</span></span>
                                            <span className="font-mono">
                                                {formData.dividendTotal
                                                    ? (parseFloat(formData.dividendTotal) * s.shares_percentage / 100).toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                                                    : '–'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onBack}>Tillbaka</Button>
                    <Button onClick={handleSubmit}>Fortsätt till granskning</Button>
                </div>
            </div>
        )
    }

    // Default form for other types
    return (
        <div className="space-y-4">
            <Card className="p-4">
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="description">Beskrivning</Label>
                        <Input
                            id="description"
                            placeholder="Beskriv åtgärden..."
                            value={formData.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="effectiveDate">Giltighetsdatum</Label>
                        <Input
                            id="effectiveDate"
                            type="date"
                            value={formData.effectiveDate || new Date().toISOString().split('T')[0]}
                            onChange={(e) => handleChange('effectiveDate', e.target.value)}
                            className="mt-1"
                        />
                    </div>
                </div>
            </Card>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onBack}>Tillbaka</Button>
                <Button onClick={handleSubmit}>Fortsätt till granskning</Button>
            </div>
        </div>
    )
}

interface ActionWizardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onComplete?: (actionType: CorporateActionType) => void
}

type WizardStep = 'select' | 'configure' | 'preview' | 'complete'

export function ActionWizard({ open, onOpenChange, onComplete }: ActionWizardProps) {
    const [step, setStep] = useState<WizardStep>('select')
    const [selectedAction, setSelectedAction] = useState<CorporateActionType | null>(null)
    const [actionData, setActionData] = useState<any>(null)

    const { shareholders, addDocument, isAddingDoc } = useCompliance()

    const handleSelectAction = (actionType: CorporateActionType) => {
        setSelectedAction(actionType)
        setStep('configure')
    }

    const handleConfigure = (data: any) => {
        setActionData(data)
        setStep('preview')
    }

    const handleComplete = async () => {
        if (selectedAction) {
            // Persist to real DB
            const meta = corporateActionTypeMeta[selectedAction]
            await addDocument({
                type: 'board_meeting_minutes', // Default to board minutes for these actions
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

    const handleReset = () => {
        setStep('select')
        setSelectedAction(null)
        setActionData(null)
        onOpenChange(false)
    }

    const actionTypes: CorporateActionType[] = [
        'board_change',
        'dividend',
        'capital_change',
        'authority_filing',
        'statute_change',
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-xl border-indigo-100/20 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">
                        {step === 'select' && 'Ny bolagsåtgärd'}
                        {step === 'configure' && corporateActionTypeMeta[selectedAction!]?.label}
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
                        <div className="grid gap-4 sm:grid-cols-2">
                            {actionTypes.map((actionType) => {
                                const meta = corporateActionTypeMeta[actionType]
                                const Icon = actionIcons[actionType]
                                return (
                                    <Card
                                        key={actionType}
                                        className="group cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/20 transition-all duration-300 border-indigo-100/10"
                                        onClick={() => handleSelectAction(actionType)}
                                    >
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                                                    <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <CardTitle className="text-lg font-semibold">{meta.label}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription className="text-sm leading-relaxed">
                                                {actionType === 'board_change' && 'Ändra styrelse, verkställande direktör eller personkrets.'}
                                                {actionType === 'dividend' && 'Besluta och verkställ utdelning till aktieägare.'}
                                                {actionType === 'capital_change' && 'Höj eller sänk aktiekapitalet.'}
                                                {actionType === 'authority_filing' && 'Anmäl förändringar till Bolagsverket eller Skatteverket.'}
                                                {actionType === 'statute_change' && 'Ändra bolagsordningen och stadgar.'}
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}

                    {step === 'configure' && selectedAction && (
                        <ConfigureStep
                            actionType={selectedAction}
                            onBack={() => setStep('select')}
                            onContinue={handleConfigure}
                            shareholders={shareholders}
                        />
                    )}

                    {step === 'preview' && selectedAction && (
                        <div className="space-y-4">
                            <Card className="p-6 border-indigo-100/20 bg-indigo-50/5 dark:bg-indigo-950/10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900">
                                        {(() => {
                                            const Icon = actionIcons[selectedAction]
                                            return <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                        })()}
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold tracking-tight">{corporateActionTypeMeta[selectedAction].label}</p>
                                        <p className="text-sm text-indigo-500 font-medium tracking-wide uppercase">Genererar utkast till protokoll</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-amber-50/80 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50 backdrop-blur-sm">
                                    <div className="flex gap-3">
                                        <div className="h-5 w-5 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0">⚠️</div>
                                        <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
                                            Denna åtgärd kräver digital signatur från behörig firmatecknare innan den kan registreras hos Bolagsverket.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="ghost" onClick={() => setStep('configure')}>
                                    Gör ändringar
                                </Button>
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none min-w-[140px]"
                                    onClick={handleComplete}
                                    disabled={isAddingDoc}
                                >
                                    {isAddingDoc ? 'Skapar...' : 'Skapa åtgärd'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'complete' && (
                        <div className="text-center py-8 space-y-6">
                            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center border-4 border-emerald-50 dark:border-emerald-900 animate-in zoom-in duration-500">
                                <Check className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-bold">Åtgärden har registrerats!</p>
                                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                                    Vi har genererat ett utkast till styrelseprotokoll. Du hittar det nu i dokumentlistan för granskning och signering.
                                </p>
                            </div>
                            <div className="pt-4">
                                <Button
                                    onClick={handleReset}
                                    className="min-w-[120px] bg-foreground text-background hover:bg-foreground/90"
                                >
                                    Stäng
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
