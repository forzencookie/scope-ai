"use client"

import { Lock } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useTextMode } from "@/providers/text-mode-provider"
import {
    SettingsPageHeader,
    SettingsSection,
    SettingsToggle,
    SessionCard,
} from "@/components/ui/settings-items"

export function SecurityTab() {
    const { text } = useTextMode()
    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.securitySettings}
                description={text.settings.securityDesc}
            />

            <SettingsSection title={text.settings.twoFactor}>
                <div className="flex items-center justify-between rounded-lg border-2 border-dashed border-muted-foreground/25 p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Kommer snart</p>
                            <p className="text-xs text-muted-foreground">Tvåfaktorsautentisering via app eller SMS</p>
                        </div>
                    </div>
                </div>
            </SettingsSection>

            <Separator />

            <SettingsSection title={text.settings.activeSessions}>
                <div className="space-y-3">
                    <SessionCard
                        device="Nuvarande session"
                        location=""
                        isCurrent
                    />
                </div>
            </SettingsSection>

            <Separator />

            <SettingsSection title={text.settings.privacy}>
                <div className="space-y-4">
                    <SettingsToggle
                        label={text.settings.analyticsData}
                        description="Kommer snart"
                        disabled
                    />
                    <SettingsToggle
                        label={text.settings.marketing}
                        description="Kommer snart"
                        disabled
                    />
                </div>
            </SettingsSection>
        </div>
    )
}
