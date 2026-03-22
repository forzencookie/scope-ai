"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import type { LucideIcon } from "lucide-react"

/**
 * SettingsToggle - Simple toggle without icon (for accessibility settings etc)
 */
export interface SettingsToggleProps {
    label: string
    description?: string
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
}

export function SettingsToggle({
    label,
    description,
    checked,
    onCheckedChange,
    disabled,
}: SettingsToggleProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium">{label}</p>
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
            />
        </div>
    )
}

/**
 * SettingsToggleItem - A toggle row for settings with icon, label, description
 */
export interface SettingsToggleItemProps {
    icon: LucideIcon
    label: string
    description?: string
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
}

export function SettingsToggleItem({
    icon: Icon,
    label,
    description,
    checked,
    onCheckedChange,
    disabled,
}: SettingsToggleItemProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium">{label}</p>
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
            />
        </div>
    )
}

/**
 * KeyboardShortcut - Display a keyboard shortcut
 */
export interface KeyboardShortcutProps {
    action: string
    keys: string
}

export function KeyboardShortcut({
    action,
    keys,
}: KeyboardShortcutProps) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground">{action}</span>
            <kbd className="bg-muted px-2 py-1 rounded text-xs tabular-nums">{keys}</kbd>
        </div>
    )
}
