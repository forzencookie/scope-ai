"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LogOut, Laptop, Smartphone } from "lucide-react"
import type { LucideIcon } from "lucide-react"

/**
 * IntegrationCard - Card for showing integration status
 */
export interface IntegrationCardProps {
    name: string
    description: string
    icon?: LucideIcon
    connected?: boolean
    comingSoon?: boolean
    onConnect?: () => void
    onDisconnect?: () => void
}

export function IntegrationCard({
    name,
    description,
    icon: Icon,
    connected = false,
    comingSoon = false,
    onConnect,
    onDisconnect,
}: IntegrationCardProps) {
    return (
        <div className="flex items-center justify-between rounded-lg border-2 border-border/60 p-4">
            <div className="flex items-center gap-3">
                {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                <div>
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
            {comingSoon ? (
                <span className="text-xs text-muted-foreground text-left whitespace-nowrap">
                    Kommer<br />snart
                </span>
            ) : (
                <Button
                    variant={connected ? "outline" : "default"}
                    size="sm"
                    onClick={connected ? onDisconnect : onConnect}
                >
                    {connected ? "Ansluten" : "Anslut"}
                </Button>
            )}
        </div>
    )
}

/**
 * ThemeButton - Button for theme selection
 */
export interface ThemeButtonProps {
    value: string
    label: string
    icon: LucideIcon
    selected?: boolean
    onClick?: () => void
}

export function ThemeButton({
    label,
    icon: Icon,
    selected = false,
    onClick,
}: ThemeButtonProps) {
    return (
        <Button
            variant="outline"
            className={cn(
                "h-auto py-4 flex flex-col items-center gap-2",
                selected && "border-primary bg-primary/5 ring-2 ring-primary"
            )}
            onClick={onClick}
        >
            <Icon className="h-5 w-5" />
            <span className="text-sm">{label}</span>
        </Button>
    )
}

/**
 * SessionCard - Card showing active session
 */
export interface SessionCardProps {
    device: string
    location: string
    isCurrent?: boolean
    deviceType?: "desktop" | "mobile"
    onLogout?: () => void
}

export function SessionCard({
    device,
    location,
    isCurrent = false,
    deviceType = "desktop",
    onLogout,
}: SessionCardProps) {
    const DeviceIcon = deviceType === "mobile" ? Smartphone : Laptop

    return (
        <div className="flex items-center justify-between rounded-lg border-2 border-border/60 p-3">
            <div className="flex items-center gap-3">
                <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium">
                        {device}
                        {isCurrent && (
                            <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                (denna enhet)
                            </span>
                        )}
                    </p>
                    <p className="text-xs text-muted-foreground">{location}</p>
                </div>
            </div>
            {!isCurrent && onLogout && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={onLogout}
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}

/**
 * SettingsListCard - Generic card for list items with icon, content, and action
 */
export interface SettingsListCardProps {
    icon?: LucideIcon
    iconClassName?: string
    title: string
    description?: string
    badge?: React.ReactNode
    action?: React.ReactNode
    className?: string
}

export function SettingsListCard({
    icon: Icon,
    iconClassName,
    title,
    description,
    badge,
    action,
    className,
}: SettingsListCardProps) {
    return (
        <div className={cn("flex items-center justify-between rounded-lg border-2 border-border/60 p-4", className)}>
            <div className="flex items-center gap-3">
                {Icon && <Icon className={cn("h-5 w-5 text-muted-foreground", iconClassName)} />}
                <div>
                    <p className="text-sm font-medium">{title}</p>
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {badge}
                {action}
            </div>
        </div>
    )
}
