"use client"

import { useState } from "react"
import { Mail, Globe, Send, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { Separator } from "@/components/ui/separator"
import { useTextMode } from "@/providers/text-mode-provider"
import { usePreferences } from "@/hooks/use-preferences"
import {
    SettingsPageHeader,
    SettingsSection,
    SettingsToggleItem,
    KeyboardShortcut,
} from "@/components/ui/settings-items"

export function EmailTab() {
    const { text } = useTextMode()
    const { preferences, updatePreference, isLoading } = usePreferences()

    // Test Email State
    const [testEmail, setTestEmail] = useState("")
    const [isSending, setIsSending] = useState(false)
    const { success, error: toastError } = useToast()

    const handleSendTest = async () => {
        if (!testEmail) return

        setIsSending(true)
        try {
            const res = await fetch('/api/email/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail })
            })

            if (!res.ok) throw new Error('Failed to send')

            success("Mail skickat!", `Ett testmail har skickats till ${testEmail}`)
            setTestEmail("")
        } catch (error) {
            toastError("Kunde inte skicka", "Kontrollera att API-nyckeln är korrekt konfigurerad.")
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.emailSettings}
                description={text.settings.emailDesc}
            />

            <SettingsSection title="E-postinställningar">
                <div className="space-y-3">
                    <SettingsToggleItem
                        icon={Mail}
                        label="Dagligt sammandrag"
                        description="Få en sammanfattning av dagens aktiviteter via e-post"
                        checked={preferences.daily_summary}
                        onCheckedChange={(checked) => updatePreference('daily_summary', checked)}
                        disabled={isLoading}
                    />
                    <SettingsToggleItem
                        icon={Globe}
                        label="Marknadsföringsmail"
                        description="Ta emot nyheter och erbjudanden"
                        checked={preferences.marketing_emails}
                        onCheckedChange={(checked) => updatePreference('marketing_emails', checked)}
                        disabled={isLoading}
                    />
                </div>
            </SettingsSection>

            <Separator />

            <SettingsSection title="Testa integration">
                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        Skicka ett testmail för att verifiera att din e-posttjänst (Resend) fungerar som den ska.
                    </div>
                    <div className="flex gap-3 max-w-md">
                        <Input
                            placeholder="namn@foretag.se"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                        />
                        <Button
                            onClick={handleSendTest}
                            disabled={!testEmail || isSending}
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Skickar...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Skicka test
                                </>
                            )}
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Mottagaren ser &quot;Scope AI&quot; som avsändare, men du kan ändra detta till ditt företagsnamn via DNS-inställningar i Resend-panelen.
                        För att göra detta: Gå till &quot;Domains&quot; i Resend och följ instruktionerna för att verifiera din domän.
                    </div>
                </div>
            </SettingsSection>

            <Separator />

            <SettingsSection title="Tangentbordsgenvägar">
                <div className="space-y-1">
                    <KeyboardShortcut action="Ny faktura" keys="⌘ + N" />
                    <KeyboardShortcut action="Sök" keys="⌘ + K" />
                    <KeyboardShortcut action="Inställningar" keys="⌘ + ," />
                    <KeyboardShortcut action="Hjälp" keys="⌘ + ?" />
                </div>
            </SettingsSection>
        </div>
    )
}
