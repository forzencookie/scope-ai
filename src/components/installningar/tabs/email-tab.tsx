"use client"

import { Mail, Globe } from "lucide-react"
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
