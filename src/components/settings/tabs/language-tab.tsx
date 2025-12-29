"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
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
    ModeButton,
} from "@/components/ui/settings-items"

export function LanguageTab() {
    const { text } = useTextMode()
    const [mode, setMode] = React.useState("easy")

    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.languageSettings}
                description={text.settings.languageDesc}
            />

            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label>Språk</Label>
                    <Select defaultValue="sv">
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
                    <Select defaultValue="sek">
                        <SelectTrigger>
                            <SelectValue placeholder="Välj valuta" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sek">SEK - Svenska kronor</SelectItem>
                            <SelectItem value="eur">EUR - Euro</SelectItem>
                            <SelectItem value="usd">USD - US Dollar</SelectItem>
                            <SelectItem value="nok">NOK - Norska kronor</SelectItem>
                            <SelectItem value="dkk">DKK - Danska kronor</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>Datumformat</Label>
                    <Select defaultValue="sv">
                        <SelectTrigger>
                            <SelectValue placeholder="Välj datumformat" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sv">2024-01-15 (ÅÅÅÅ-MM-DD)</SelectItem>
                            <SelectItem value="eu">15/01/2024 (DD/MM/ÅÅÅÅ)</SelectItem>
                            <SelectItem value="us">01/15/2024 (MM/DD/ÅÅÅÅ)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>Första dag i veckan</Label>
                    <Select defaultValue="monday">
                        <SelectTrigger>
                            <SelectValue placeholder="Välj första dag" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monday">Måndag</SelectItem>
                            <SelectItem value="sunday">Söndag</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator />

            <SettingsSection
                title={text.settings.textModeSection}
                description={text.settings.textModeDesc}
            >
                <div className="grid grid-cols-2 gap-3 mt-2">
                    <ModeButton
                        label="Enkel"
                        description="Förenklad terminologi för nybörjare"
                        selected={mode === "easy"}
                        onClick={() => setMode("easy")}
                    />
                    <ModeButton
                        label="Expert"
                        description="Standard bokföringstermer"
                        selected={mode === "expert"}
                        onClick={() => setMode("expert")}
                    />
                </div>
            </SettingsSection>
        </div>
    )
}
