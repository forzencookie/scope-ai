"use client"

import * as React from "react"
import { useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTextMode } from "@/providers/text-mode-provider"
import { Loader2 } from "lucide-react"
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
    bankgiro: string
    plusgiro: string
}

interface AccountTabProps {
    formData: SettingsFormData
    setFormData: React.Dispatch<React.SetStateAction<SettingsFormData>>
    onSave: () => void
    avatarUrl?: string
    onAvatarChange?: (url: string) => void
}

export function AccountTab({ formData, setFormData, onSave, avatarUrl, onAvatarChange }: AccountTabProps) {
    const { text } = useTextMode()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)

    const initials = formData.name
        ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U'

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const form = new FormData()
            form.append('file', file)

            const response = await fetch('/api/user/avatar', {
                method: 'POST',
                body: form,
            })

            if (response.ok) {
                const { avatar_url } = await response.json()
                onAvatarChange?.(avatar_url)
            } else {
                const err = await response.json()
                console.error('[Avatar] Upload failed:', err)
            }
        } catch (error) {
            console.error('[Avatar] Upload error:', error)
        } finally {
            setIsUploading(false)
            // Reset input so the same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.accountSettings}
                description={text.settings.accountDesc}
            />

            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={avatarUrl || ""} alt={text.settings.profilePicture} />
                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleAvatarUpload}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Laddar upp...
                            </>
                        ) : (
                            text.settings.changePicture
                        )}
                    </Button>
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
