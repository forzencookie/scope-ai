"use client"

import { useTextMode } from "@/providers/text-mode-provider"
import {
    SettingsPageHeader,
    IntegrationCard,
} from "@/components/ui/settings-items"

export function IntegrationsTab() {
    const { text } = useTextMode()
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
                    name="Google Kalender"
                    description="Synkronisera viktiga datum"
                />
            </div>
        </div>
    )
}
