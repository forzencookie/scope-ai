"use client"

import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
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
                <div className="flex items-center justify-between rounded-lg border-2 border-border/60 p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">{text.settings.twoFactorEnabled}</p>
                            <p className="text-xs text-muted-foreground">{text.settings.twoFactorDesc}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm">{text.settings.manage}</Button>
                </div>
            </SettingsSection>

            <Separator />

            <SettingsSection title={text.settings.activeSessions}>
                <div className="space-y-3">
                    <SessionCard
                        device="MacBook Pro"
                        location="Stockholm, Sverige"
                        isCurrent
                    />
                    <SessionCard
                        device="iPhone 15 Pro"
                        location="Stockholm, Sverige"
                    />
                </div>
            </SettingsSection>

            <Separator />

            <SettingsSection title={text.settings.privacy}>
                <div className="space-y-4">
                    <SettingsToggle
                        label={text.settings.analyticsData}
                        description={text.settings.analyticsDataDesc}
                        checked
                    />
                    <SettingsToggle
                        label={text.settings.marketing}
                        description={text.settings.marketingDesc}
                    />
                </div>
            </SettingsSection>
        </div>
    )
}
