"use client"

import * as React from "react"
import {
    Users,
    FileText,
    Megaphone,
    Send,
    Sparkles,
    Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { generateAnnualMeetingNoticePDF, type MeetingData } from "@/lib/generators/pdf-generator"
import { useToast } from "@/components/ui/toast"
import { AI_CHAT_EVENT, type PageContext } from "@/lib/ai/context"
import { formatDateLong } from "@/lib/utils"

export type NoticeVariant = "association" | "corporate"

export interface NoticeRecipient {
    name: string
    shares: number
    shareClass: string
    ownershipPercentage: number
}

interface SendNoticeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    variant: NoticeVariant
    recipientCount: number
    recipients?: NoticeRecipient[]
    meeting?: MeetingData
    onSubmit?: () => void
}

export function SendNoticeDialog({
    open,
    onOpenChange,
    variant,
    recipientCount,
    recipients = [],
    meeting,
    onSubmit
}: SendNoticeDialogProps) {
    const isAssociation = variant === "association"
    const title = isAssociation ? "Skicka kallelse till årsmöte" : "Skicka kallelse till bolagsstämma"
    const recipientType = isAssociation ? "aktiva medlemmar" : "aktieägare"
    const toast = useToast()

    const [isSending, setIsSending] = React.useState(false)
    const [sendMethod, setSendMethod] = React.useState<'email' | 'post' | 'both'>('email')

    const handleSend = async () => {
        if (isSending) return
        setIsSending(true)
        
        try {
            const response = await fetch('/api/notices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    meetingId: meeting?.id || 'new',
                    meetingType: isAssociation ? 'annual' : 'general',
                    recipients: recipients.map(r => ({ name: r.name, shares: r.shares })),
                    method: sendMethod,
                })
            })

            if (!response.ok) throw new Error('Failed to send')

            toast.success("Kallelse skickad", `Kallelse har skickats till ${recipientCount} ${recipientType}.`)
            onSubmit?.()
            onOpenChange(false)
        } catch (error) {
            console.error('Send notice error:', error)
            toast.error("Fel", "Kunde inte skicka kallelsen")
        } finally {
            setIsSending(false)
        }
    }

    const handleDownloadPDF = () => {
        if (!meeting) return
        generateAnnualMeetingNoticePDF(meeting)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg" expandable>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Skicka ut kallelse till alla {isAssociation ? "medlemmar" : "aktieägare"}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Mottagare</p>
                                <p className="text-sm text-muted-foreground">
                                    {recipientCount} {recipientType} kommer få kallelse
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                        {recipients.length > 0 && (
                            <div className="border-t pt-2 space-y-1">
                                {recipients.map((r, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span>{r.name}</span>
                                        <span className="text-muted-foreground">
                                            {r.shares.toLocaleString('sv-SE')} {r.shareClass}-aktier ({r.ownershipPercentage}%)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Skicka via</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="justify-start">
                                <FileText className="h-4 w-4 mr-2" />
                                E-post
                            </Button>
                            {isAssociation ? (
                                <Button variant="outline" className="justify-start">
                                    <Megaphone className="h-4 w-4 mr-2" />
                                    Nyhetsbrev
                                </Button>
                            ) : (
                                <Button variant="outline" className="justify-start">
                                    <Send className="h-4 w-4 mr-2" />
                                    Rekommenderat brev
                                </Button>
                            )}
                        </div>
                    </div>

                    {isAssociation && (
                        <div className="space-y-2">
                            <Label>Bifoga</Label>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="attach-agenda" defaultChecked />
                                    <label htmlFor="attach-agenda" className="text-sm">Dagordning</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="attach-motions" defaultChecked />
                                    <label htmlFor="attach-motions" className="text-sm">Motioner med styrelsens yttranden</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="attach-report" />
                                    <label htmlFor="attach-report" className="text-sm">Verksamhetsberättelse</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="attach-economy" />
                                    <label htmlFor="attach-economy" className="text-sm">Ekonomisk rapport</label>
                                </div>
                            </div>
                        </div>
                    )}

                    <Card 
                        className="bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => {
                            // Close dialog
                            onOpenChange(false)
                            
                            // Build the prompt for AI
                            const meetingType = isAssociation ? 'årsmöte' : 'bolagsstämma'
                            const meetingDate = meeting?.date ? formatDateLong(meeting.date) : 'kommande datum'
                            const meetingLocation = meeting?.location || 'plats ej angiven'
                            
                            const prompt = `Generera en professionell kallelse till ${meeting?.type || 'ordinarie'} ${meetingType}:

• Datum: ${meetingDate}
• Plats: ${meetingLocation}
• År: ${meeting?.year || new Date().getFullYear()}

Inkludera:
1. Korrekt juridisk formulering enligt ${isAssociation ? 'föreningens stadgar' : 'ABL'}
2. Standard dagordning med alla obligatoriska punkter
3. Information om anmälan och fullmakt
4. Välformulerat avslut med styrelsens signatur

Formatera kallelsen så den är redo att skickas ut.`

                            // Dispatch event to open AI sidebar with action trigger
                            const context: PageContext = {
                                pageName: 'Kallelse',
                                pageType: 'kvitto' as const, // Using existing type
                                initialPrompt: prompt,
                                autoSend: true,
                                actionTrigger: {
                                    icon: 'document',
                                    title: 'Generera kallelse',
                                    subtitle: `${meeting?.type === 'extra' ? 'Extra' : 'Ordinarie'} ${meetingType} • ${meeting?.year || new Date().getFullYear()}`,
                                    meta: meetingLocation
                                }
                            }
                            
                            window.dispatchEvent(new CustomEvent(AI_CHAT_EVENT, { detail: context }))
                        }}
                    >
                        <CardContent className="pt-4">
                            <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 mt-0.5 text-primary" />
                                <div className="text-sm">
                                    <p className="font-medium">Förbättra med AI</p>
                                    <p className="text-muted-foreground">
                                        {isAssociation
                                            ? "Låt AI skapa kallelse med tydlig information om tid, plats och dagordning."
                                            : "Låt AI skapa kallelse baserat på bolagets data, inklusive årsredovisning och förslag till beslut."}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {meeting && (
                        <Button variant="secondary" onClick={handleDownloadPDF} className="sm:mr-auto">
                            <Download className="h-4 w-4 mr-2" />
                            Ladda ner PDF
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Avbryt
                        </Button>
                        <Button onClick={handleSend} disabled={isSending}>
                            <Send className="h-4 w-4 mr-2" />
                            {isSending ? "Skickar..." : "Skicka"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
