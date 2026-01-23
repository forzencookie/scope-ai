"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTextMode } from "@/providers/text-mode-provider"
import {
    SettingsPageHeader,
    SettingsFormField,
    SettingsSaveButton,
} from "@/components/ui/settings-items"

export interface SettingsFormData {
    name: string
    email: string
    orgNumber: string
    vatNumber: string
    address: string
    phone: string
    contactPerson: string
}

interface AccountTabProps {
    formData: SettingsFormData
    setFormData: React.Dispatch<React.SetStateAction<SettingsFormData>>
    onSave: () => void
}

export function AccountTab({ formData, setFormData, onSave }: AccountTabProps) {
    const { text } = useTextMode()
    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.accountSettings}
                description={text.settings.accountDesc}
            />

            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src="" alt={text.settings.profilePicture} />
                    <AvatarFallback className="text-lg">JS</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <Button variant="outline" size="sm">{text.settings.changePicture}</Button>
                    <p className="text-xs text-muted-foreground">{text.settings.pictureHint}</p>
                </div>
            </div>

            <Separator />

            <div className="grid gap-4">
                <SettingsFormField
                    id="name"
                    label={text.labels.name}
                    placeholder="Johan Svensson"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <SettingsFormField
                    id="email"
                    label={text.labels.email}
                    type="email"
                    placeholder="johan@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
            </div>

            <SettingsSaveButton onClick={onSave} />
        </div>
    )
}
