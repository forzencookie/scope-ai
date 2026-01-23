"use client"

import { useTextMode } from "@/providers/text-mode-provider"
import {
    SettingsPageHeader,
    SettingsSection,
    SettingsToggle,
} from "@/components/ui/settings-items"

export function AccessibilityTab() {
    const { text } = useTextMode()
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
                    />
                    <SettingsToggle
                        label={text.settings.highContrast}
                        description={text.settings.highContrastDesc}
                    />
                    <SettingsToggle
                        label="Större text"
                        description="Öka textstorleken för bättre läsbarhet"
                    />
                </div>
            </SettingsSection>
        </div>
    )
}
