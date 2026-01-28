"use client"

import { useTextMode } from "@/providers/text-mode-provider"
import { usePreferences } from "@/hooks/use-preferences"
import {
    SettingsPageHeader,
    SettingsSection,
    SettingsToggle,
} from "@/components/ui/settings-items"

export function AccessibilityTab() {
    const { text } = useTextMode()
    const { preferences, updatePreference, isLoading } = usePreferences()

    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.accessibilitySettings}
                description={text.settings.accessibilityDesc}
            />

            <SettingsSection title="Visuella inställningar">
                <div className="space-y-4">
                    <SettingsToggle
                        label={text.settings.reduceMotion}
                        description={text.settings.reduceMotionDesc}
                        checked={preferences.reduce_motion}
                        onCheckedChange={(checked) => updatePreference('reduce_motion', checked)}
                        disabled={isLoading}
                    />
                    <SettingsToggle
                        label={text.settings.highContrast}
                        description={text.settings.highContrastDesc}
                        checked={preferences.high_contrast}
                        onCheckedChange={(checked) => updatePreference('high_contrast', checked)}
                        disabled={isLoading}
                    />
                    <SettingsToggle
                        label="Större text"
                        description="Öka textstorleken för bättre läsbarhet"
                        checked={preferences.larger_text}
                        onCheckedChange={(checked) => updatePreference('larger_text', checked)}
                        disabled={isLoading}
                    />
                </div>
            </SettingsSection>
        </div>
    )
}
