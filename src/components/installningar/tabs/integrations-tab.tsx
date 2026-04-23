import { text } from "@/lib/translations"
import {
    SettingsPageHeader,
    IntegrationCard,
} from "@/components/ui"

export function IntegrationsTab() {
    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.integrationsSettings}
                description="Integrationer med externa tjänster lanseras efter MVP."
            />

            <div className="grid grid-cols-2 gap-3">
                <IntegrationCard
                    name="BankID"
                    description="Identifiering och signering"
                    comingSoon
                />
                <IntegrationCard
                    name="Skatteverket"
                    description="Deklarationer och skatteärenden"
                    comingSoon
                />
                <IntegrationCard
                    name="Bolagsverket"
                    description="Årsredovisning och registreringar"
                    comingSoon
                />
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
            </div>
        </div>
    )
}
