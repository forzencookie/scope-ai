"use client"

import * as React from "react"
import { ArrowLeft, Sparkles, Save, Download, Calendar, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
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
import { type MeetingFormData, FULL_ABL_AGENDA } from "./mote"

interface CreateKallelseDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    meetingData: MeetingFormData | null
    onSave?: (kallelseText: string) => Promise<void> | void
    onBack?: () => void
}

export function CreateKallelseDialog({
    open,
    onOpenChange,
    meetingData,
    onSave,
    onBack
}: CreateKallelseDialogProps) {
    const [kallelseText, setKallelseText] = React.useState("")
    const [isSaving, setIsSaving] = React.useState(false)

    // Reset when dialog opens
    React.useEffect(() => {
        if (open && meetingData) {
            // Pre-fill with a basic template
            setKallelseText("")
        }
    }, [open, meetingData])

    if (!meetingData) return null

    const displayDate = meetingData.date 
        ? formatDateLong(meetingData.date) 
        : `År ${meetingData.year}`
    
    const agenda = meetingData.agenda || FULL_ABL_AGENDA

    // Generate kallelse with AI
    const handleAIGenerate = () => {
        const context: PageContext = {
            pageName: 'Kallelse',
            pageType: 'verifikation',
            initialPrompt: `Generera en formell kallelse till ${meetingData.type === 'ordinarie' ? 'ordinarie' : 'extra'} bolagsstämma.

Mötesdetaljer:
- Datum: ${displayDate}
- Tid: ${meetingData.time || '14:00'}
- Plats: ${meetingData.location || 'Ej angiven'}
- År: ${meetingData.year}

Dagordning:
${agenda.map((item, i) => `§ ${i + 1} ${item}`).join('\n')}

Skapa en formell kallelse enligt ABL (Aktiebolagslagen) med:
1. Rubrik "KALLELSE TILL ${meetingData.type === 'ordinarie' ? 'ORDINARIE' : 'EXTRA'} BOLAGSSTÄMMA"
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
                subtitle: `${meetingData.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma ${meetingData.year}`,
                icon: 'document',
                meta: displayDate
            }
        }
        window.dispatchEvent(new CustomEvent(AI_CHAT_EVENT, { detail: context }))
    }

    // Save the kallelse draft
    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave?.(kallelseText)
            onOpenChange(false)
        } finally {
            setIsSaving(false)
        }
    }

    // Download as PDF
    const handleDownloadPDF = () => {
        // For now, create a simple text download
        // In production, this would use a proper PDF generator
        const content = kallelseText || generateBasicKallelse()
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `kallelse-bolagsstamma-${meetingData.year}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Generate a basic kallelse template
    const generateBasicKallelse = () => {
        return `KALLELSE TILL ${meetingData.type === 'ordinarie' ? 'ORDINARIE' : 'EXTRA'} BOLAGSSTÄMMA

Aktieägarna i [BOLAGSNAMN] AB, org.nr [ORG.NR], kallas härmed till ${meetingData.type === 'ordinarie' ? 'ordinarie' : 'extra'} bolagsstämma.

Datum: ${displayDate}
Tid: ${meetingData.time || '14:00'}
Plats: ${meetingData.location || '[PLATS]'}

DAGORDNING
${agenda.map((item, i) => `§ ${i + 1}  ${item}`).join('\n')}

ANMÄLAN
Aktieägare som önskar delta i stämman ska anmäla sig senast [DATUM] till [E-POST/TELEFON].

Aktieägare som företräds av ombud ska utfärda skriftlig, undertecknad och daterad fullmakt.

[ORT], den [DATUM]

Styrelsen
[BOLAGSNAMN] AB`
    }

    const handleBack = () => {
        onBack?.()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" expandable>
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <DialogTitle>Skapa kallelse</DialogTitle>
                            <DialogDescription>
                                Skriv kallelsen manuellt eller generera med AI
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Meeting summary card */}
                    <Card className="bg-muted/30">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-md bg-primary/10">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">
                                        {meetingData.type === 'ordinarie' ? 'Ordinarie' : 'Extra'} bolagsstämma {meetingData.year}
                                    </p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {displayDate}
                                        </span>
                                        {meetingData.time && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {meetingData.time}
                                            </span>
                                        )}
                                        {meetingData.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {meetingData.location}
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
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="ghost" onClick={handleBack} disabled={isSaving}>
                        Tillbaka
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                            variant="outline" 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="flex-1 sm:flex-initial"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Spara utkast
                        </Button>
                        <Button 
                            onClick={handleDownloadPDF} 
                            disabled={isSaving || !kallelseText.trim()}
                            className="flex-1 sm:flex-initial"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Ladda ner PDF
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
