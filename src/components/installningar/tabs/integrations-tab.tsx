import { useState } from "react"
import { Check, Copy, Calendar } from "lucide-react"
import { useTextMode } from "@/providers/text-mode-provider"
import {
    SettingsPageHeader,
    IntegrationCard,
} from "@/components/ui/settings-items"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"

export function IntegrationsTab() {
    const { text } = useTextMode()
    const { toast } = useToast()
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [hasCopied, setHasCopied] = useState(false)

    // In production, this would be dynamic based on the user's ID/Token
    const calendarUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/calendar/feed`
        : 'https://scope-ai.se/api/calendar/feed'

    const handleCopy = () => {
        navigator.clipboard.writeText(calendarUrl)
        setHasCopied(true)
        toast({
            title: "Länk kopierad!",
            description: "Klistra in länken i din kalender-app för att prenumerera.",
        })
        setTimeout(() => setHasCopied(false), 2000)
    }

    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.integrationsSettings}
                description={text.settings.integrationsDesc}
            />

            <div className="grid grid-cols-2 gap-3">
                <IntegrationCard
                    name="Bankkonto"
                    description="Anslut ditt företagskonto"
                    comingSoon
                />
                <IntegrationCard
                    name="Bankgirot"
                    description="Automatisk betalningshantering"
                    comingSoon
                />
                <IntegrationCard
                    name="Swish"
                    description="Ta emot betalningar via Swish"
                    comingSoon
                />
                <IntegrationCard
                    name="Kalender"
                    description="Synkronisera viktiga datum (Google/Apple/Outlook)"
                    icon={Calendar}
                    isConnected={false}
                    onClick={() => setCalendarOpen(true)}
                />
            </div>

            <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Anslut Kalender</DialogTitle>
                        <DialogDescription>
                            Få alla viktiga datum (skatter, löner, möten) direkt i din kalender genom att prenumerera på denna länk.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Din unika prenumerationslänk</Label>
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    value={calendarUrl}
                                    className="font-mono text-sm"
                                />
                                <Button size="icon" variant="outline" onClick={handleCopy}>
                                    {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md space-y-2">
                            <p className="font-medium text-foreground">Instruktioner:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li><strong>Google:</strong> Välj "Lägg till kalender" &rarr; "Från URL"</li>
                                <li><strong>Apple:</strong> Arkiv &rarr; "Ny kalenderprenumeration"</li>
                                <li><strong>Outlook:</strong> "Lägg till kalender" &rarr; "Prenumerera från webben"</li>
                            </ul>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setCalendarOpen(false)}>Klar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
