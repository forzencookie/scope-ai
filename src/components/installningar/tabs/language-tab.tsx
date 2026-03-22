"use client"

import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { usePreferences } from "@/hooks/use-preferences"
import { text } from "@/lib/translations"
import {
    SettingsPageHeader,
} from "@/components/ui/settings-items"

export function LanguageTab() {
    const { preferences, updatePreference, isLoading } = usePreferences()

    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.languageSettings}
                description={text.settings.languageDesc}
            />

            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label>Språk</Label>
                    <Select 
                        value={preferences.language} 
                        onValueChange={(value) => updatePreference('language', value)}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Välj språk" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sv">🇸🇪 Svenska</SelectItem>
                            <SelectItem value="en">🇬🇧 English</SelectItem>
                            <SelectItem value="no">🇳🇴 Norsk</SelectItem>
                            <SelectItem value="da">🇩🇰 Dansk</SelectItem>
                            <SelectItem value="fi">🇫🇮 Suomi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>Valuta</Label>
                    <Select 
                        value={preferences.currency} 
                        onValueChange={(value) => updatePreference('currency', value)}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Välj valuta" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="SEK">SEK - Svenska kronor</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="NOK">NOK - Norska kronor</SelectItem>
                            <SelectItem value="DKK">DKK - Danska kronor</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>Datumformat</Label>
                    <Select 
                        value={preferences.date_format} 
                        onValueChange={(value) => updatePreference('date_format', value)}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Välj datumformat" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="YYYY-MM-DD">2024-01-15 (ÅÅÅÅ-MM-DD)</SelectItem>
                            <SelectItem value="DD/MM/YYYY">15/01/2024 (DD/MM/ÅÅÅÅ)</SelectItem>
                            <SelectItem value="MM/DD/YYYY">01/15/2024 (MM/DD/ÅÅÅÅ)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>Första dag i veckan</Label>
                    <Select 
                        value={preferences.first_day_of_week.toString()} 
                        onValueChange={(value) => updatePreference('first_day_of_week', parseInt(value))}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Välj första dag" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Måndag</SelectItem>
                            <SelectItem value="0">Söndag</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
