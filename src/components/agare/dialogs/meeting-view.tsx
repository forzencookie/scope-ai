"use client"

import { useState, useMemo, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Calendar,
    Clock,
    MapPin,
    Download,
    Edit2,
    Save,
    CheckCircle,
    Banknote,
    Scale,
    ArrowRight,
    ArrowLeft,
    User,
    AlertCircle,
    FileText,
    StickyNote,
    Sparkles,
} from "lucide-react"
import { formatDateLong, cn } from "@/lib/utils"
import { type GeneralMeeting, type GeneralMeetingDecision } from "@/types/ownership"
import { type MeetingStatus } from "@/lib/status-types"
import { AI_CHAT_EVENT, type PageContext } from "@/lib/ai/context"
import { FULL_ABL_AGENDA } from "./mote"

// ============================================================================
// Types & Constants
// ============================================================================

type MeetingStep = 'planerad' | 'kallelse' | 'genomford' | 'signerat'

const STAMMA_STEPS: { key: MeetingStep; label: string }[] = [
    { key: 'planerad', label: 'Planerad' },
    { key: 'kallelse', label: 'Kallelse' },
    { key: 'genomford', label: 'Genomförd' },
    { key: 'signerat', label: 'Signerat' },
]

const BOARD_STEPS: { key: MeetingStep; label: string }[] = [
    { key: 'planerad', label: 'Planerad' },
    { key: 'genomford', label: 'Genomförd' },
    { key: 'signerat', label: 'Signerat' },
]

const getSteps = (meeting: GeneralMeeting | null) =>
    meeting?.meetingCategory === 'styrelsemote' ? BOARD_STEPS : STAMMA_STEPS

const stepIndex = (step: MeetingStep, steps: { key: MeetingStep }[] = STAMMA_STEPS) =>
    steps.findIndex(s => s.key === step)

const statusToStep = (status: GeneralMeeting['status'], isBoard: boolean): MeetingStep => {
    switch (status) {
        case 'planerad': return 'planerad'
        case 'kallad': return isBoard ? 'planerad' : 'kallelse'
        case 'genomförd': return 'genomford'
        case 'protokoll signerat': return 'signerat'
        default: return 'planerad'
    }
}

const mapMeetingStatus = (status: GeneralMeeting['status']): MeetingStatus => {
    switch (status) {
        case 'planerad': return 'Planerad'
        case 'kallad': return 'Kallad'
        case 'genomförd': return 'Genomförd'
        case 'protokoll signerat': return 'Signerat'
        default: return 'Planerad'
    }
}

interface MeetingViewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    meeting: GeneralMeeting | null
    onUpdate?: (meeting: GeneralMeeting, updates: Partial<GeneralMeeting>) => Promise<void>
    onSaveKallelse?: (meetingId: string, kallelseText: string) => Promise<void>
    onBookDecision?: (meeting: GeneralMeeting, decision: GeneralMeetingDecision) => void
}

// Callback to advance the step after a status-changing action
type OnStepAdvance = (step: MeetingStep) => void

// ============================================================================
// Step Navigation
// ============================================================================

function StepNav({ currentStep, completedUpTo, onStepClick, steps }: {
    currentStep: MeetingStep
    completedUpTo: MeetingStep
    onStepClick: (step: MeetingStep) => void
    steps: { key: MeetingStep; label: string }[]
}) {
    const currentIdx = stepIndex(currentStep, steps)
    const completedIdx = stepIndex(completedUpTo, steps)

    return (
        <div className="flex items-center gap-1 text-sm">
            {steps.map((step, i) => {
                const isActive = step.key === currentStep
                const isCompleted = i <= completedIdx
                const isClickable = i <= completedIdx || i === completedIdx + 1

                return (
                    <div key={step.key} className="flex items-center gap-1">
                        {i > 0 && <span className="text-muted-foreground/40 mx-0.5">·</span>}
                        <button
                            onClick={() => isClickable && onStepClick(step.key)}
                            disabled={!isClickable}
                            className={cn(
                                "px-2 py-0.5 rounded-md transition-colors text-xs font-medium",
                                isActive && "bg-primary text-primary-foreground",
                                !isActive && isCompleted && "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer",
                                !isActive && !isCompleted && isClickable && "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50 cursor-pointer",
                                !isClickable && "text-muted-foreground/30 cursor-not-allowed"
                            )}
                        >
                            {step.label}
                        </button>
                    </div>
                )
            })}
        </div>
    )
}

// ============================================================================
// Inline Editable Field
// ============================================================================

function InlineEdit({
    value,
    displayValue,
    onSave,
    type = "text",
    placeholder,
    icon: Icon,
    label,
    editable = true,
}: {
    value: string
    displayValue?: string
    onSave: (value: string) => Promise<void>
    type?: "text" | "date" | "time"
    placeholder?: string
    icon?: React.ElementType
    label?: string
    editable?: boolean
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(value)
    const closedAt = useRef(0)

    const handleSave = async () => {
        if (editValue !== value) {
            await onSave(editValue)
        }
        closedAt.current = Date.now()
        setIsEditing(false)
    }

    const handleOpen = () => {
        if (!editable || isEditing) return
        if (Date.now() - closedAt.current < 200) return
        setEditValue(value)
        setIsEditing(true)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') { setEditValue(value); closedAt.current = Date.now(); setIsEditing(false) }
    }

    if (isEditing && editable) {
        return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                {label && <span className="text-muted-foreground text-sm">{label}</span>}
                <Input
                    type={type}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="h-7 text-sm w-auto"
                    autoFocus
                />
            </div>
        )
    }

    return (
        <div
            className="flex items-center gap-2 text-sm group"
            onClick={handleOpen}
        >
            {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
            {label && <span className="text-muted-foreground">{label}</span>}
            <span className={cn(editable && "group-hover:underline group-hover:decoration-dotted group-hover:underline-offset-4 group-hover:decoration-muted-foreground/50 cursor-text")}>
                {displayValue || value || placeholder || "Ej angivet"}
            </span>
        </div>
    )
}

// ============================================================================
// Step 1: Planerad
// ============================================================================

function StepPlanerad({
    meeting,
    canEdit,
    onUpdate,
    onGoToKallelse,
    isBoard = false,
}: {
    meeting: GeneralMeeting
    canEdit: boolean
    onUpdate?: (meeting: GeneralMeeting, updates: Partial<GeneralMeeting>) => Promise<void>
    onGoToKallelse: () => void
    isBoard?: boolean
}) {
    const [notes, setNotes] = useState("")
    const [isEditingNotes, setIsEditingNotes] = useState(false)
    const currentNotes = notes || (meeting as GeneralMeeting & { notes?: string }).notes || ""

    const updateField = (field: string) => async (value: string) => {
        if (!onUpdate) return
        await onUpdate(meeting, { [field]: value } as Partial<GeneralMeeting>)
    }

    const handleStatusChange = async (newStatus: GeneralMeeting['status']) => {
        if (!onUpdate) return
        await onUpdate(meeting, { status: newStatus })
    }

    const handleSaveNotes = async () => {
        if (!onUpdate) return
        await onUpdate(meeting, { notes: currentNotes } as Partial<GeneralMeeting>)
        setIsEditingNotes(false)
    }

    const hasKallelse = !!meeting.kallelseText

    const kallelseDeadline = useMemo(() => {
        const deadline = new Date(meeting.date)
        deadline.setDate(deadline.getDate() - 14)
        return deadline
    }, [meeting.date])

    const daysUntilKallelseDeadline = useMemo(() => {
        const today = new Date()
        return Math.ceil((kallelseDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }, [kallelseDeadline])

    const handleDownloadKallelse = () => {
        console.log("Downloading kallelse for meeting:", meeting.id)
    }

    const handleDownloadProtokoll = () => {
        console.log("Downloading protokoll for meeting:", meeting.id)
    }

    return (
        <div className="space-y-6">
            {/* Next Step Banner */}
            {meeting.status === 'planerad' && (isBoard || !hasKallelse) && (
                <div className={cn(
                    "p-4 rounded-lg border flex items-center justify-between gap-4",
                    "bg-amber-50/50 dark:bg-amber-950/20 border-0"
                )}>
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 mt-0.5 text-amber-600 dark:text-amber-500" />
                        <div>
                            <p className="font-medium text-foreground">
                                {isBoard ? 'Nästa steg: Genomför mötet' : 'Nästa steg: Skapa kallelse'}
                            </p>
                            <p className="text-sm mt-0.5 text-muted-foreground">
                                {isBoard
                                    ? 'När mötet är genomfört, skapa protokollet'
                                    : `Kallelse bör vara klar senast ${formatDateLong(kallelseDeadline.toISOString())} (${daysUntilKallelseDeadline > 0 ? `${daysUntilKallelseDeadline} dagar kvar` : 'försenad'})`
                                }
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-950/40"
                        onClick={onGoToKallelse}
                    >
                        {isBoard ? 'Skapa protokoll' : 'Skapa kallelse'}
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}

            {/* Two-column: Information + Dokument */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Information */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Information
                    </h3>
                    <div className="space-y-1">
                        <InlineEdit
                            value={meeting.date}
                            displayValue={formatDateLong(meeting.date)}
                            onSave={updateField('date')}
                            type="date"
                            icon={Calendar}
                            editable={canEdit}
                        />
                        <InlineEdit
                            value={meeting.time || ""}
                            onSave={updateField('time')}
                            type="time"
                            icon={Clock}
                            placeholder="Ej angiven"
                            editable={canEdit}
                        />
                        <InlineEdit
                            value={meeting.location || ""}
                            onSave={updateField('location')}
                            icon={MapPin}
                            placeholder="Ej angivet"
                            editable={canEdit}
                        />
                        <InlineEdit
                            value={meeting.chairperson || ""}
                            onSave={updateField('chairperson')}
                            icon={User}
                            label="Ordförande:"
                            placeholder="Ej angivet"
                            editable={canEdit}
                        />
                        <InlineEdit
                            value={meeting.secretary || ""}
                            onSave={updateField('secretary')}
                            icon={User}
                            label="Sekreterare:"
                            placeholder="Ej angivet"
                            editable={canEdit}
                        />
                    </div>

                    {/* Status change */}
                    {canEdit && (
                        <div className="pt-2">
                            <Select
                                value={meeting.status}
                                onValueChange={(val) => handleStatusChange(val as GeneralMeeting['status'])}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="planerad">Planerad</SelectItem>
                                    {!isBoard && <SelectItem value="kallad">Kallad</SelectItem>}
                                    <SelectItem value="genomförd">Genomförd</SelectItem>
                                    <SelectItem value="protokoll signerat">Protokoll signerat</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Right: Dokument */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Dokument
                    </h3>
                    <div className="space-y-2">
                        {/* Kallelse - only for stämma */}
                        {!isBoard && (
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <p className="text-sm font-medium">Kallelse</p>
                                    <p className="text-xs text-muted-foreground">
                                        {hasKallelse
                                            ? `Skapad ${meeting.kallelseSavedAt ? new Date(meeting.kallelseSavedAt).toLocaleDateString('sv-SE') : ''}`
                                            : "Deadline: 2 veckor innan stämman"
                                        }
                                    </p>
                                </div>
                                {hasKallelse ? (
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleDownloadKallelse}>
                                        <Download className="h-3 w-3 mr-1" />
                                        PDF
                                    </Button>
                                ) : meeting.status === 'planerad' ? (
                                    <Button size="sm" className="h-7 text-xs" onClick={onGoToKallelse}>
                                        Skapa
                                        <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                ) : null}
                            </div>
                        )}

                        {/* Dagordning */}
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-sm font-medium">Dagordning</p>
                                <p className="text-xs text-muted-foreground">
                                    {meeting.agenda?.length || 0} punkter enligt ABL
                                </p>
                            </div>
                        </div>

                        {/* Protokoll */}
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-sm font-medium">Protokoll</p>
                                <p className="text-xs text-muted-foreground">
                                    {meeting.status === 'protokoll signerat'
                                        ? "Signerat och klart"
                                        : meeting.status === 'genomförd'
                                            ? "Väntar på signering"
                                            : "Skapas efter stämman"
                                    }
                                </p>
                            </div>
                            {(meeting.status === 'genomförd' || meeting.status === 'protokoll signerat') && (
                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleDownloadProtokoll}>
                                    <Download className="h-3 w-3 mr-1" />
                                    PDF
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Sign action */}
                    {meeting.status === 'genomförd' && (
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                                    <div>
                                        <p className="font-medium text-sm">Redo för signering</p>
                                        <p className="text-xs text-muted-foreground">
                                            Signera protokollet digitalt
                                        </p>
                                    </div>
                                </div>
                                <Button size="sm" className="h-7 text-xs" onClick={() => handleStatusChange('protokoll signerat')}>
                                    Signera
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t" />

            {/* Anteckningar */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <StickyNote className="h-4 w-4" />
                        Anteckningar
                    </h3>
                    {!isEditingNotes && canEdit && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                            setNotes(currentNotes)
                            setIsEditingNotes(true)
                        }}>
                            <Edit2 className="h-3 w-3 mr-1" />
                            {currentNotes ? "Redigera" : "Lägg till"}
                        </Button>
                    )}
                </div>
                {isEditingNotes ? (
                    <div className="space-y-2">
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Skriv anteckningar om vad som ska diskuteras, förberedelser, viktiga punkter..."
                            rows={5}
                            className="text-sm"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(false)}>
                                Avbryt
                            </Button>
                            <Button size="sm" onClick={handleSaveNotes}>
                                <Save className="h-3 w-3 mr-1" />
                                Spara
                            </Button>
                        </div>
                    </div>
                ) : currentNotes ? (
                    <p className="text-sm whitespace-pre-wrap">{currentNotes}</p>
                ) : (
                    <p className="text-sm text-muted-foreground italic">
                        Inga anteckningar. Lägg till anteckningar om vad som ska diskuteras.
                    </p>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// Step 2: Kallelse
// ============================================================================

function StepKallelse({
    meeting,
    onSaveKallelse,
    onUpdate,
    onBack,
    onAdvance,
}: {
    meeting: GeneralMeeting
    onSaveKallelse?: (meetingId: string, kallelseText: string) => Promise<void>
    onUpdate?: (meeting: GeneralMeeting, updates: Partial<GeneralMeeting>) => Promise<void>
    onBack: () => void
    onAdvance: OnStepAdvance
}) {
    const [kallelseText, setKallelseText] = useState(meeting.kallelseText || "")
    const [isSaving, setIsSaving] = useState(false)

    const displayDate = formatDateLong(meeting.date)
    const agenda = meeting.agenda || FULL_ABL_AGENDA

    const handleAIGenerate = () => {
        const context: PageContext = {
            pageName: 'Kallelse',
            pageType: 'verifikation',
            initialPrompt: `Generera en formell kallelse till ${meeting.type === 'ordinarie' ? 'ordinarie' : 'extra'} bolagsstämma.

Mötesdetaljer:
- Datum: ${displayDate}
- Tid: ${meeting.time || '14:00'}
- Plats: ${meeting.location || 'Ej angiven'}
- År: ${meeting.year}

Dagordning:
${agenda.map((item, i) => `§ ${i + 1} ${item}`).join('\n')}

Skapa en formell kallelse enligt ABL (Aktiebolagslagen) med:
1. Rubrik "KALLELSE TILL ${meeting.type === 'ordinarie' ? 'ORDINARIE' : 'EXTRA'} BOLAGSSTÄMMA"
2. Inledande text med bolagsnamn och organisationsnummer (använd platshållare [BOLAGSNAMN] och [ORG.NR])
3. Datum, tid och plats för stämman
4. Fullständig dagordning med paragrafnumrering
5. Information om anmälan och rösträtt
6. Underskriftsrad för styrelsen
7. Datum för kallelsen

Formatera dokumentet professionellt och formellt.`,
            autoSend: true,
            actionTrigger: {
                title: 'Generera kallelse',
                subtitle: `${meeting.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma ${meeting.year}`,
                icon: 'document',
                meta: displayDate
            }
        }
        window.dispatchEvent(new CustomEvent(AI_CHAT_EVENT, { detail: context }))
    }

    const handleSave = async () => {
        if (!onSaveKallelse) return
        setIsSaving(true)
        try {
            await onSaveKallelse(meeting.id, kallelseText)
            // Also advance status to 'kallad' if still planerad
            if (meeting.status === 'planerad' && onUpdate) {
                await onUpdate(meeting, { status: 'kallad' })
            }
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveAndAdvance = async () => {
        if (!onSaveKallelse) return
        setIsSaving(true)
        try {
            await onSaveKallelse(meeting.id, kallelseText)
            if (onUpdate) {
                await onUpdate(meeting, { status: 'kallad' })
            }
            onAdvance('genomford')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDownloadPDF = () => {
        const content = kallelseText || generateBasicKallelse()
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `kallelse-bolagsstamma-${meeting.year}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const generateBasicKallelse = () => {
        return `KALLELSE TILL ${meeting.type === 'ordinarie' ? 'ORDINARIE' : 'EXTRA'} BOLAGSSTÄMMA

Aktieägarna i [BOLAGSNAMN] AB, org.nr [ORG.NR], kallas härmed till ${meeting.type === 'ordinarie' ? 'ordinarie' : 'extra'} bolagsstämma.

Datum: ${displayDate}
Tid: ${meeting.time || '14:00'}
Plats: ${meeting.location || '[PLATS]'}

DAGORDNING
${agenda.map((item, i) => `§ ${i + 1}  ${item}`).join('\n')}

ANMÄLAN
Aktieägare som önskar delta i stämman ska anmäla sig senast [DATUM] till [E-POST/TELEFON].

Aktieägare som företräds av ombud ska utfärda skriftlig, undertecknad och daterad fullmakt.

[ORT], den [DATUM]

Styrelsen
[BOLAGSNAMN] AB`
    }

    return (
        <div className="space-y-4">
            {/* Meeting summary card */}
            <Card className="bg-muted/30">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium">
                                {meeting.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma {meeting.year}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {displayDate}
                                </span>
                                {meeting.time && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {meeting.time}
                                    </span>
                                )}
                                {meeting.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {meeting.location}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Kallelse textarea */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Kallelse-text</Label>
                    <button
                        type="button"
                        onClick={handleAIGenerate}
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    >
                        <Sparkles className="h-3 w-3" />
                        Generera med AI
                    </button>
                </div>
                <Textarea
                    placeholder="Skriv kallelsen här eller klicka på 'Generera med AI'..."
                    value={kallelseText}
                    onChange={(e) => setKallelseText(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                    Kallelsen bör skickas minst 2 veckor innan stämman enligt ABL.
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={onBack} disabled={isSaving}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Tillbaka
                </Button>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadPDF}
                        disabled={isSaving || !kallelseText.trim()}
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Ladda ner PDF
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving || !kallelseText.trim()}
                    >
                        <Save className="h-4 w-4 mr-1" />
                        Spara utkast
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSaveAndAdvance}
                        disabled={isSaving || !kallelseText.trim()}
                    >
                        Spara & skicka kallelse
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// Step 3: Genomförd
// ============================================================================

function StepGenomford({
    meeting,
    onUpdate,
    onBookDecision,
    onAdvance,
    isBoard = false,
}: {
    meeting: GeneralMeeting
    onUpdate?: (meeting: GeneralMeeting, updates: Partial<GeneralMeeting>) => Promise<void>
    onBookDecision?: (meeting: GeneralMeeting, decision: GeneralMeetingDecision) => void
    onAdvance: OnStepAdvance
    isBoard?: boolean
}) {
    const [protokollText, setProtokollText] = useState(
        (meeting as GeneralMeeting & { protokollText?: string }).protokollText || ""
    )
    const [isSaving, setIsSaving] = useState(false)
    const existingDecisions = meeting.decisions || []
    const displayDate = formatDateLong(meeting.date)
    const agenda = meeting.agenda || FULL_ABL_AGENDA

    const handleAIGenerateProtokoll = () => {
        const decisionsText = existingDecisions.length > 0
            ? existingDecisions.map((d, i) => `§${i + 1} ${d.title}: ${d.decision}${d.amount ? ` (${d.amount.toLocaleString('sv-SE')} kr)` : ''}`).join('\n')
            : 'Inga beslut registrerade ännu'

        const meetingLabel = isBoard
            ? `styrelsemöte${meeting.meetingNumber ? ` #${meeting.meetingNumber}` : ''}`
            : `${meeting.type === 'ordinarie' ? 'ordinarie' : 'extra'} bolagsstämma`

        const initialPrompt = isBoard
            ? `Generera ett formellt styrelseprotokoll.

Mötesdetaljer:
- Datum: ${displayDate}
- Tid: ${meeting.time || '14:00'}
- Plats: ${meeting.location || 'Ej angiven'}
- Ordförande: ${meeting.chairperson || 'Ej angivet'}
- Sekreterare: ${meeting.secretary || 'Ej angivet'}
- Närvarande: ${meeting.attendees?.join(', ') || 'Ej angivet'}
- Frånvarande: ${meeting.absentees?.join(', ') || 'Inga'}

Beslut:
${decisionsText}

Skapa ett formellt styrelseprotokoll med:
1. Rubrik "PROTOKOLL FÖRT VID STYRELSEMÖTE"
2. Bolagsnamn och organisationsnummer (använd platshållare [BOLAGSNAMN] och [ORG.NR])
3. Mötesnummer, tid, plats och datum
4. Närvarande och frånvarande ledamöter
5. Val av ordförande och protokollförare
6. Varje dagordningspunkt med tillhörande beslut
7. Justerarunderskrifter

Formatera dokumentet professionellt och formellt.`
            : `Generera ett formellt protokoll för ${meeting.type === 'ordinarie' ? 'ordinarie' : 'extra'} bolagsstämma.

Mötesdetaljer:
- Datum: ${displayDate}
- Tid: ${meeting.time || '14:00'}
- Plats: ${meeting.location || 'Ej angiven'}
- Ordförande: ${meeting.chairperson || 'Ej angivet'}
- Sekreterare: ${meeting.secretary || 'Ej angivet'}
- År: ${meeting.year}

Dagordning:
${agenda.map((item, i) => `§ ${i + 1} ${item}`).join('\n')}

Beslut:
${decisionsText}

Skapa ett formellt stämmoprotokoll enligt ABL med:
1. Rubrik "PROTOKOLL FÖRT VID ${meeting.type === 'ordinarie' ? 'ORDINARIE' : 'EXTRA'} BOLAGSSTÄMMA"
2. Bolagsnamn och organisationsnummer (använd platshållare [BOLAGSNAMN] och [ORG.NR])
3. Tid, plats och datum
4. Närvaroförteckning/röstlängd
5. Val av ordförande och sekreterare
6. Varje dagordningspunkt med tillhörande beslut
7. Justerarunderskrifter
8. Protokollet justerat datum

Formatera dokumentet professionellt och formellt.`

        const context: PageContext = {
            pageName: 'Protokoll',
            pageType: 'verifikation',
            initialPrompt,
            autoSend: true,
            actionTrigger: {
                title: 'Generera protokoll',
                subtitle: isBoard ? `Styrelsemöte${meeting.meetingNumber ? ` #${meeting.meetingNumber}` : ''}` : `${meeting.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma ${meeting.year}`,
                icon: 'document',
                meta: displayDate
            }
        }
        window.dispatchEvent(new CustomEvent(AI_CHAT_EVENT, { detail: context }))
    }

    const handleSaveProtokoll = async () => {
        if (!onUpdate) return
        setIsSaving(true)
        try {
            await onUpdate(meeting, { protokollText: protokollText } as Partial<GeneralMeeting>)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDownloadProtokoll = () => {
        const content = protokollText || `Protokoll — ${meeting.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma ${meeting.year}`
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `protokoll-bolagsstamma-${meeting.year}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            {/* Next step banner */}
            <div className="p-4 rounded-lg border bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-0.5 text-green-600" />
                    <div>
                        <p className="font-medium text-green-900 dark:text-green-200">
                            Nästa steg: Skapa och signera protokollet
                        </p>
                        <p className="text-sm mt-0.5 text-green-800/80 dark:text-green-300/80">
                            Skriv protokollet manuellt eller generera med AI, ladda sedan ner för signering
                        </p>
                    </div>
                </div>
            </div>

            {/* Meeting summary */}
            <Card className="bg-muted/30">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium">
                                {isBoard
                                    ? `Styrelsemöte${meeting.meetingNumber ? ` #${meeting.meetingNumber}` : ''}`
                                    : `${meeting.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma ${meeting.year}`
                                }
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {displayDate}
                                </span>
                                {meeting.time && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {meeting.time}
                                    </span>
                                )}
                                {meeting.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {meeting.location}
                                    </span>
                                )}
                                {meeting.chairperson && (
                                    <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        Ordförande: {meeting.chairperson}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Decisions */}
            {existingDecisions.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Beslut ({existingDecisions.length})
                    </h3>
                    <div className="space-y-2">
                        {existingDecisions.map((decision, index) => (
                            <div key={decision.id || index} className="flex items-start justify-between py-2">
                                <div className="flex items-start gap-2">
                                    <span className="text-muted-foreground font-mono text-xs mt-0.5">
                                        §{index + 1}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium">{decision.title}</p>
                                        <p className="text-xs text-muted-foreground">{decision.decision}</p>
                                        {decision.amount && (
                                            <p className="text-xs font-medium mt-0.5">
                                                {decision.amount.toLocaleString('sv-SE')} kr
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="border-t" />

            {/* Protocol textarea */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Protokoll-text</Label>
                    <button
                        type="button"
                        onClick={handleAIGenerateProtokoll}
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    >
                        <Sparkles className="h-3 w-3" />
                        Generera med AI
                    </button>
                </div>
                <Textarea
                    placeholder="Skriv protokollet här eller klicka på 'Generera med AI'..."
                    value={protokollText}
                    onChange={(e) => setProtokollText(e.target.value)}
                    className="min-h-[250px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                    Protokollet ska justeras av ordföranden och minst en justeringsperson.
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveProtokoll}
                    disabled={isSaving}
                >
                    <Save className="h-4 w-4 mr-1" />
                    Spara utkast
                </Button>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadProtokoll}
                        disabled={!protokollText.trim()}
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Ladda ner PDF
                    </Button>
                    <Button
                        size="sm"
                        onClick={async () => {
                            if (onUpdate) await onUpdate(meeting, { status: 'protokoll signerat' })
                            onAdvance('signerat')
                        }}
                    >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Markera som signerat
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// Step 4: Signerat
// ============================================================================

function StepSignerat({
    meeting,
    onBookDecision,
}: {
    meeting: GeneralMeeting
    onBookDecision?: (meeting: GeneralMeeting, decision: GeneralMeetingDecision) => void
}) {
    const existingDecisions = meeting.decisions || []
    const protokollText = (meeting as GeneralMeeting & { protokollText?: string }).protokollText || ""
    const displayDate = formatDateLong(meeting.date)

    const handleDownloadProtokoll = () => {
        const content = protokollText || `Protokoll — ${meeting.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma ${meeting.year}`
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `protokoll-bolagsstamma-${meeting.year}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            {/* Signed confirmation */}
            <div className="p-4 rounded-lg border bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                <div className="flex-1">
                    <p className="font-medium text-green-900 dark:text-green-200">
                        Protokollet är signerat
                    </p>
                    <p className="text-sm mt-0.5 text-green-800/80 dark:text-green-300/80">
                        Stämman är slutförd. Bokför eventuella beslut nedan.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadProtokoll}>
                    <Download className="h-4 w-4 mr-1" />
                    Ladda ner PDF
                </Button>
            </div>

            {/* Meeting summary */}
            <Card className="bg-muted/30">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium">
                                {meeting.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma {meeting.year}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {displayDate}
                                </span>
                                {meeting.time && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {meeting.time}
                                    </span>
                                )}
                                {meeting.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {meeting.location}
                                    </span>
                                )}
                                {meeting.chairperson && (
                                    <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        Ordförande: {meeting.chairperson}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Signed protocol view */}
            {protokollText && (
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Signerat protokoll
                    </h3>
                    <div className="border rounded-lg p-4 bg-muted/20 max-h-[200px] overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap font-mono">{protokollText}</pre>
                    </div>
                </div>
            )}

            {/* Decisions with booking actions */}
            {existingDecisions.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Beslut ({existingDecisions.length})
                    </h3>
                    <div className="space-y-2">
                        {existingDecisions.map((decision, index) => (
                            <div key={decision.id || index} className="flex items-start justify-between py-2">
                                <div className="flex items-start gap-2">
                                    <span className="text-muted-foreground font-mono text-xs mt-0.5">
                                        §{index + 1}
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">{decision.title}</p>
                                            {decision.booked && (
                                                <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                    <CheckCircle className="h-2.5 w-2.5" />
                                                    Bokförd
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{decision.decision}</p>
                                        {decision.amount && (
                                            <p className="text-xs font-medium mt-0.5">
                                                {decision.amount.toLocaleString('sv-SE')} kr
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {decision.type === 'dividend' && decision.amount && !decision.booked && onBookDecision && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs shrink-0"
                                        onClick={() => onBookDecision(meeting, decision)}
                                    >
                                        <Banknote className="h-3 w-3 mr-1 text-green-600" />
                                        Bokför
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================================================
// Main Component
// ============================================================================

export function MeetingViewDialog({
    open,
    onOpenChange,
    meeting,
    onUpdate,
    onSaveKallelse,
    onBookDecision
}: MeetingViewDialogProps) {
    const [activeStep, setActiveStep] = useState<MeetingStep | null>(null)
    const isBoard = meeting?.meetingCategory === 'styrelsemote'
    const steps = getSteps(meeting)

    // Derive the "natural" step from meeting status
    const naturalStep = meeting ? statusToStep(meeting.status, isBoard) : 'planerad'
    const currentStep = activeStep || naturalStep

    // Reset active step when dialog opens/closes or meeting changes
    const prevMeetingId = useRef<string | null>(null)
    if (meeting?.id !== prevMeetingId.current) {
        prevMeetingId.current = meeting?.id ?? null
        if (activeStep !== null) setActiveStep(null)
    }

    if (!meeting) return null

    const completedUpTo = naturalStep

    const dialogTitle = isBoard
        ? `Styrelsemöte${meeting.meetingNumber ? ` #${meeting.meetingNumber}` : ''}`
        : `${meeting.type === 'ordinarie' ? 'Årsstämma' : 'Extra Bolagsstämma'} ${meeting.year}`

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) setActiveStep(null); onOpenChange(v) }}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-8">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <AppStatusBadge status={mapMeetingStatus(meeting.status)} />
                            </div>
                            <DialogTitle className="text-xl">
                                {dialogTitle}
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                {/* Step navigation */}
                <div className="border-b pb-3 -mt-1">
                    <StepNav
                        currentStep={currentStep}
                        completedUpTo={completedUpTo}
                        onStepClick={setActiveStep}
                        steps={steps}
                    />
                </div>

                <div className="mt-4">
                    {currentStep === 'planerad' && (
                        <StepPlanerad
                            meeting={meeting}
                            canEdit={meeting.status === 'planerad' || meeting.status === 'kallad'}
                            onUpdate={onUpdate}
                            onGoToKallelse={isBoard ? () => setActiveStep('genomford') : () => setActiveStep('kallelse')}
                            isBoard={isBoard}
                        />
                    )}

                    {currentStep === 'kallelse' && !isBoard && (
                        <StepKallelse
                            meeting={meeting}
                            onSaveKallelse={onSaveKallelse}
                            onUpdate={onUpdate}
                            onBack={() => setActiveStep('planerad')}
                            onAdvance={setActiveStep}
                        />
                    )}

                    {currentStep === 'genomford' && (
                        <StepGenomford
                            meeting={meeting}
                            onUpdate={onUpdate}
                            onBookDecision={onBookDecision}
                            onAdvance={setActiveStep}
                            isBoard={isBoard}
                        />
                    )}

                    {currentStep === 'signerat' && (
                        <StepSignerat
                            meeting={meeting}
                            onBookDecision={isBoard ? undefined : onBookDecision}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
