"use client"

import { Sun, Moon, Monitor } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useTextMode } from "@/providers/text-mode-provider"
import {
    SettingsPageHeader,
    SettingsSection,
    SettingsToggle,
    ThemeButton,
} from "@/components/ui/settings-items"

export function AppearanceTab() {
    const { text } = useTextMode()
    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.appearanceSettings}
                description={text.settings.appearanceDesc}
            />

            <SettingsSection title={text.settings.theme}>
                <div className="grid grid-cols-3 gap-3">
                    <ThemeButton value="light" label={text.settings.themeLight} icon={Sun} />
                    <ThemeButton value="dark" label={text.settings.themeDark} icon={Moon} />
                    <ThemeButton value="system" label={text.settings.themeSystem} icon={Monitor} />
                </div>
            </SettingsSection>

            <Separator />

            <SettingsSection title={text.settings.density}>
                <Select defaultValue="normal">
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={text.settings.density} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="compact">{text.settings.densityCompact}</SelectItem>
                        <SelectItem value="normal">{text.settings.densityNormal}</SelectItem>
                        <SelectItem value="comfortable">{text.settings.densityComfortable}</SelectItem>
                    </SelectContent>
                </Select>
            </SettingsSection>

            <SettingsSection title={text.settings.sidebar}>
                <SettingsToggle
                    label={text.settings.compactSidebar}
                    description={text.settings.compactSidebarDesc}
                />
            </SettingsSection>
        </div>
    )
}
