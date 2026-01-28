"use client"

import * as React from "react"
import { Sparkles, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AI_CHAT_EVENT, type PageContext } from "@/lib/ai/context"
import { formatDateLong } from "@/lib/utils"

export type MeetingType = "annual" | "general" | "board"

interface PlanMeetingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    type: MeetingType
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit?: (data: any) => Promise<void> | void
    defaultAgenda: string[]
}

// Full ABL-compliant agenda for bolagsstämma
const FULL_ABL_AGENDA = [
    "Stämmans öppnande",
    "Val av ordförande vid stämman",
    "Upprättande och godkännande av röstlängd",
    "Val av en eller två justeringspersoner",
    "Prövning av om stämman blivit behörigen sammankallad",
    "Godkännande av dagordning",
    "Framläggande av årsredovisningen och revisionsberättelsen",
    "Fastställande av resultaträkning och balansräkning",
    "Beslut om disposition av vinst eller förlust enligt fastställd balansräkning",
    "Beslut om ansvarsfrihet för styrelseledamöter",
    "Fastställande av arvoden till styrelsen",
    "Val av styrelse och eventuell revisor",
    "Övriga ärenden",
    "Stämmans avslutande"
]

export function PlanMeetingDialog({
    open,
    onOpenChange,
    type,
    onSubmit,
    defaultAgenda
}: PlanMeetingDialogProps) {
    const isAnnual = type === "annual"
    const title = isAnnual ? "Planera årsmöte" : "Planera bolagsstämma"
    const description = isAnnual
        ? "Skapa ett nytt årsmöte och förbereda dagordning"
        : "Skapa en ny bolagsstämma och förbereda dagordning"

    const [date, setDate] = React.useState("")
    const [year, setYear] = React.useState("")
    const [time, setTime] = React.useState("14:00")
    const [location, setLocation] = React.useState("")
    const [meetingType, setMeetingType] = React.useState<"ordinarie" | "extra">("ordinarie")
    const [isSaving, setIsSaving] = React.useState(false)

    // Use full ABL agenda for corporate meetings
    const agenda = isAnnual ? defaultAgenda : FULL_ABL_AGENDA

    // Reset state when dialog opens
    React.useEffect(() => {
        if (open) {
            setDate("")
            setYear(new Date().getFullYear().toString())
            setTime("14:00")
            setLocation("")
            setMeetingType("ordinarie")
            setIsSaving(false)
        }
    }, [open])

    const getMeetingData = () => ({
        date,
        year,
        time,
        location,
        type: meetingType
    })

    // Just save the meeting
    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSubmit?.(getMeetingData())
            onOpenChange(false)
        } finally {
            setIsSaving(false)
        }
    }

    // Save the meeting AND open AI to generate kallelse
    const handleAIGenerate = async () => {
        setIsSaving(true)
        try {
            // First save the meeting
            await onSubmit?.(getMeetingData())
            
            // Then open AI sidebar with context to generate kallelse
            const meetingDate = date || new Date().toISOString().split('T')[0]
            const displayDate = formatDateLong(meetingDate)
            
            const context: PageContext = {
                pageName: 'Bolagsstämma',
                pageType: 'verifikation', // Using verifikation as closest match for corporate docs
                initialPrompt: `Generera en formell kallelse till ${meetingType === 'ordinarie' ? 'ordinarie' : 'extra'} bolagsstämma.

Mötesdetaljer:
- Datum: ${displayDate}
- Tid: ${time}
- Plats: ${location || 'Ej angiven'}
- År: ${year}

Dagordning:
${agenda.map((item, i) => `§ ${i + 1} ${item}`).join('\n')}

Skapa en formell kallelse enligt ABL (Aktiebolagslagen) med:
1. Rubrik med bolagsnamn och organisationsnummer
2. Kallelse-text med datum, tid och plats
3. Fullständig dagordning
4. Information om anmälan och rösträtt
5. Underskriftsrad för styrelsen

Formatera dokumentet snyggt med tydlig struktur.`,
                autoSend: true,
                actionTrigger: {
                    title: 'Generera kallelse',
                    subtitle: `${meetingType === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma ${year}`,
                    icon: 'meeting',
                    meta: `${displayDate}${location ? ` • ${location}` : ''}`
                }
            }

            window.dispatchEvent(new CustomEvent(AI_CHAT_EVENT, { detail: context }))
            onOpenChange(false)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg" expandable>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Datum</Label>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Tid</Label>
                            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>År</Label>
                            <Input type="number" placeholder="2026" value={year} onChange={(e) => setYear(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Plats</Label>
                            <Input
                                placeholder="Kontoret, Digitalt via Teams..."
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>{isAnnual ? "Mötestyp" : "Stämmotyp"}</Label>
                        <div className="flex gap-2">
                            <Button
                                variant={meetingType === "ordinarie" ? "default" : "outline"}
                                size="sm"
                                className="flex-1"
                                onClick={() => setMeetingType("ordinarie")}
                                type="button"
                            >
                                {isAnnual ? "Ordinarie årsmöte" : "Ordinarie årsstämma"}
                            </Button>
                            <Button
                                variant={meetingType === "extra" ? "default" : "outline"}
                                size="sm"
                                className="flex-1"
                                onClick={() => setMeetingType("extra")}
                                type="button"
                            >
                                {isAnnual ? "Extra årsmöte" : "Extra bolagsstämma"}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Dagordning (enligt ABL)</Label>
                        <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-1 bg-muted/30">
                            {agenda.map((item, index) => (
                                <div key={index} className="text-sm flex items-start gap-2">
                                    <span className="text-muted-foreground font-mono text-xs">§{index + 1}</span>
                                    <span className="text-muted-foreground">{item}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Standarddagordning enligt Aktiebolagslagen (ABL).
                        </p>
                    </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Avbryt
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                            variant="outline" 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="flex-1 sm:flex-initial"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Spara
                        </Button>
                        <Button 
                            onClick={handleAIGenerate} 
                            disabled={isSaving}
                            className="flex-1 sm:flex-initial"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            AI förslag
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
