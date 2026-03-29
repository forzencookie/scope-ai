"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { text } from "@/lib/translations"
import { useToast } from "@/components/ui/toast"
import { Loader2 } from "lucide-react"
import {
    SettingsPageHeader,
    SettingsFormField,
    SettingsSaveButton,
} from "@/components/ui/settings-items"

interface ProfileData {
    name: string
    email: string
    avatarUrl: string
}

function useProfile() {
    const [profile, setProfile] = useState<ProfileData>({ name: "", email: "", avatarUrl: "" })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        const controller = new AbortController()

        async function fetchProfile() {
            try {
                const res = await fetch("/api/user/profile", { signal: controller.signal })
                if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`)
                const data = await res.json()
                if (!cancelled) {
                    setProfile({
                        name: data.full_name || "",
                        email: data.email || "",
                        avatarUrl: data.avatar_url || "",
                    })
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("[AccountTab] Failed to load profile:", error)
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false)
                }
            }
        }
        fetchProfile()
        return () => { cancelled = true; controller.abort() }
    }, [])

    const updateField = useCallback(<K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
        setProfile(prev => ({ ...prev, [key]: value }))
    }, [])

    return { profile, isLoading, updateField }
}

export function AccountTab() {
    const { profile, isLoading, updateField } = useProfile()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const { addToast } = useToast()

    const initials = profile.name
        ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U'

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            addToast({
                title: "Filen är för stor",
                description: "Max 5 MB för profilbilder.",
                variant: "destructive",
            })
            return
        }

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
                updateField("avatarUrl", avatar_url)
                addToast({ title: "Profilbild uppdaterad" })
            } else {
                let message = "Försök igen."
                try { const err = await response.json(); message = err.message || message } catch { /* non-JSON response */ }
                addToast({
                    title: "Kunde inte ladda upp",
                    description: message,
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error('[Avatar] Upload error:', error)
            addToast({
                title: "Uppladdning misslyckades",
                description: "Ett oväntat fel uppstod.",
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleProfileSave = async () => {
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: profile.name }),
            })
            if (response.ok) {
                addToast({
                    title: "Profil sparad",
                    description: "Dina uppgifter har uppdaterats.",
                })
            } else {
                addToast({
                    title: "Kunde inte spara",
                    description: "Försök igen senare.",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error('[Profile] Save error:', error)
            addToast({
                title: "Kunde inte spara",
                description: "Ett oväntat fel uppstod.",
                variant: "destructive",
            })
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <SettingsPageHeader
                    title={text.settings.accountSettings}
                    description={text.settings.accountDesc}
                />
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Laddar profil...
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.accountSettings}
                description={text.settings.accountDesc}
            />

            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.avatarUrl || ""} alt={text.settings.profilePicture} />
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
                    value={profile.name}
                    onChange={(e) => updateField("name", e.target.value)}
                />
                <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm font-medium">{text.labels.email}</label>
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 border">
                        {profile.email || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        E-postadressen är kopplad till ditt inloggningskonto och kan inte ändras här.
                    </p>
                </div>
            </div>

            <SettingsSaveButton onClick={handleProfileSave} />
        </div>
    )
}
