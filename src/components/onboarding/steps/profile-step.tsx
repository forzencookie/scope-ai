"use client"

import { useState, useRef, useEffect } from "react"
import { useTheme } from "next-themes"
import { Camera, Loader2, Sun, Moon, Monitor } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui"
import { cn } from "@/lib/utils"

// ============================================================================
// ProfileStep - Avatar upload + dark/light mode preference
// ============================================================================

const EMOJI_OPTIONS = ["👤", "🧑‍💼", "👩‍💻", "🧑‍🔧", "🦊", "🐱", "🌟", "🚀"]

interface ProfileStepProps {
    onAvatarChange?: (url: string) => void
}

export function ProfileStep({ onAvatarChange }: ProfileStepProps) {
    const { theme, setTheme } = useTheme()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState("")
    const [selectedEmoji, setSelectedEmoji] = useState("")

    // Load saved emoji from profile on mount
    useEffect(() => {
        fetch("/api/user/profile")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.avatar_emoji) setSelectedEmoji(data.avatar_emoji)
                if (data?.avatar_url) setAvatarUrl(data.avatar_url)
            })
            .catch(() => {})
    }, [])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const form = new FormData()
            form.append("file", file)

            const response = await fetch("/api/user/avatar", {
                method: "POST",
                body: form,
            })

            if (response.ok) {
                const { avatar_url } = await response.json()
                setAvatarUrl(avatar_url)
                setSelectedEmoji("")
                onAvatarChange?.(avatar_url)
                // Clear emoji when photo uploaded
                persistEmoji("")
            }
        } catch (error) {
            console.error("[Profile] Avatar upload error:", error)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const persistEmoji = async (emoji: string) => {
        try {
            await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatar_emoji: emoji }),
            })
        } catch {}
    }

    const handleEmojiSelect = (emoji: string) => {
        setSelectedEmoji(emoji)
        setAvatarUrl("")
        persistEmoji(emoji)
    }

    const handleThemeChange = (value: string) => {
        setTheme(value)
        // Persist to user_preferences
        fetch("/api/user/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme: value }),
        }).catch(() => {})
    }

    const themeOptions = [
        { value: "light", label: "Ljust", icon: Sun },
        { value: "dark", label: "Mörkt", icon: Moon },
        { value: "system", label: "System", icon: Monitor },
    ] as const

    return (
        <div className="max-w-sm mx-auto space-y-8">
            {/* Avatar section */}
            <div>
                <p className="text-sm font-medium mb-4 text-left text-white/70">Profilbild</p>
                <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-20 w-20 border-2 border-white/10">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="text-2xl bg-white/5 text-white/60">
                            {selectedEmoji || "👤"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Laddar upp...
                                </>
                            ) : (
                                <>
                                    <Camera className="h-4 w-4" />
                                    Ladda upp foto
                                </>
                            )}
                        </button>
                        <p className="text-xs text-white/30">eller välj en emoji nedan</p>
                    </div>
                </div>

                {/* Emoji grid */}
                <div className="grid grid-cols-8 gap-2">
                    {EMOJI_OPTIONS.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => handleEmojiSelect(emoji)}
                            className={cn(
                                "h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all",
                                "hover:bg-white/10 hover:scale-110",
                                selectedEmoji === emoji
                                    ? "bg-white/15 ring-2 ring-white/30"
                                    : "bg-white/[0.04]"
                            )}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            {/* Theme section */}
            <div>
                <p className="text-sm font-medium mb-4 text-left text-white/70">Utseende</p>
                <div className="grid grid-cols-3 gap-3">
                    {themeOptions.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => handleThemeChange(value)}
                            className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                theme === value
                                    ? "border-white/30 bg-white/[0.08]"
                                    : "border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                            )}
                        >
                            <Icon className="h-6 w-6 text-white/60" />
                            <span className="text-sm font-medium text-white/70">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
