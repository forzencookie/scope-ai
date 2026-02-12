"use client"

import { useState, useRef } from "react"
import { useTheme } from "next-themes"
import { Camera, Loader2, Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
            }
        } catch (error) {
            console.error("[Profile] Avatar upload error:", error)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleEmojiSelect = (emoji: string) => {
        setSelectedEmoji(emoji)
        setAvatarUrl("")
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
                <p className="text-sm font-medium mb-4 text-left">Profilbild</p>
                <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="text-2xl">
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
                                <>
                                    <Camera className="h-4 w-4 mr-1" />
                                    Ladda upp foto
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-muted-foreground">eller välj en emoji nedan</p>
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
                                "hover:bg-primary/10 hover:scale-110",
                                selectedEmoji === emoji
                                    ? "bg-primary/20 ring-2 ring-primary"
                                    : "bg-muted/50"
                            )}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            {/* Theme section */}
            <div>
                <p className="text-sm font-medium mb-4 text-left">Utseende</p>
                <div className="grid grid-cols-3 gap-3">
                    {themeOptions.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => setTheme(value)}
                            className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                                theme === value
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                            )}
                        >
                            <Icon className="h-6 w-6" />
                            <span className="text-sm font-medium">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
