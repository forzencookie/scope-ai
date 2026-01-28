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
import { usePreferences } from "@/hooks/use-preferences"
import { useTheme } from "next-themes"
import {
    SettingsPageHeader,
    SettingsSection,
    SettingsToggle,
    ThemeButton,
} from "@/components/ui/settings-items"

export function AppearanceTab() {
    const { text } = useTextMode()
    const { preferences, updatePreference, isLoading } = usePreferences()
    const { theme, setTheme } = useTheme()

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme)
        updatePreference('theme', newTheme)
    }

    const handleDensityChange = (density: 'compact' | 'normal' | 'comfortable') => {
        updatePreference('density', density)
    }

    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.appearanceSettings}
                description={text.settings.appearanceDesc}
            />

            <SettingsSection title={text.settings.theme}>
                <div className="grid grid-cols-3 gap-3">
                    <ThemeButton 
                        value="light" 
                        label={text.settings.themeLight} 
                        icon={Sun}
                        selected={theme === 'light'}
                        onClick={() => handleThemeChange('light')}
                    />
                    <ThemeButton 
                        value="dark" 
                        label={text.settings.themeDark} 
                        icon={Moon}
                        selected={theme === 'dark'}
                        onClick={() => handleThemeChange('dark')}
                    />
                    <ThemeButton 
                        value="system" 
                        label={text.settings.themeSystem} 
                        icon={Monitor}
                        selected={theme === 'system'}
                        onClick={() => handleThemeChange('system')}
                    />
                </div>
            </SettingsSection>

            <Separator />

            <SettingsSection title={text.settings.density}>
                <Select 
                    value={preferences.density} 
                    onValueChange={(value) => handleDensityChange(value as 'compact' | 'normal' | 'comfortable')}
                    disabled={isLoading}
                >
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
                    checked={preferences.compact_sidebar}
                    onCheckedChange={(checked) => updatePreference('compact_sidebar', checked)}
                    disabled={isLoading}
                />
            </SettingsSection>
        </div>
    )
}
