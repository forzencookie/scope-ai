"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { LogOut, Laptop, Smartphone, CreditCard, Download, Eye } from "lucide-react"

/**
 * SettingsPageHeader - Page header with title and description
 */
export interface SettingsPageHeaderProps {
    title: string
    description: string
}

export function SettingsPageHeader({ title, description }: SettingsPageHeaderProps) {
    return (
        <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    )
}

/**
 * SettingsFormField - Reusable form field with label and input
 */
export interface SettingsFormFieldProps {
    id: string
    label: string
    type?: string
    placeholder?: string
    defaultValue?: string
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    className?: string
}

export function SettingsFormField({
    id,
    label,
    type = "text",
    placeholder,
    defaultValue,
    value,
    onChange,
    className,
}: SettingsFormFieldProps) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type={type}
                placeholder={placeholder}
                defaultValue={defaultValue}
                value={value}
                onChange={onChange}
            />
        </div>
    )
}

/**
 * SettingsSaveButton - Save button aligned to the right
 */
export interface SettingsSaveButtonProps {
    label?: string
    onClick?: () => void
    disabled?: boolean
}

export function SettingsSaveButton({
    label = "Spara ändringar",
    onClick,
    disabled,
}: SettingsSaveButtonProps) {
    return (
        <div className="flex justify-end">
            <Button size="sm" onClick={onClick} disabled={disabled}>
                {label}
            </Button>
        </div>
    )
}

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
 * IntegrationCard - Card for showing integration status
 */
export interface IntegrationCardProps {
    name: string
    description: string
    connected?: boolean
    comingSoon?: boolean
    onConnect?: () => void
    onDisconnect?: () => void
}

export function IntegrationCard({
    name,
    description,
    connected = false,
    comingSoon = false,
    onConnect,
    onDisconnect,
}: IntegrationCardProps) {
    return (
        <div className="flex items-center justify-between rounded-lg border-2 border-border/60 p-4">
            <div>
                <p className="font-medium text-sm">{name}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
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
 * BillingHistoryRow - Row for billing history table
 */
export interface BillingHistoryRowProps {
    date: string
    id: string
    paymentMethod: string
    cardLastFour?: string
    amount: string
    status: "Betald" | "Obetald" | "Väntande"
    onDownloadReceipt?: () => void
    onViewInvoice?: () => void
}

export function BillingHistoryRow({
    date,
    paymentMethod,
    cardLastFour,
    amount,
    status,
    onDownloadReceipt,
    onViewInvoice,
}: BillingHistoryRowProps) {
    const statusColors = {
        "Betald": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        "Obetald": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        "Väntande": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    }

    return (
        <div className="grid grid-cols-[80px_1fr_80px_70px_50px] gap-2 items-center text-sm py-2 border-b last:border-0">
            <span className="text-muted-foreground text-xs">{date}</span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CreditCard className="h-3 w-3 shrink-0" />
                <span className="truncate">{paymentMethod}{cardLastFour && ` ·${cardLastFour}`}</span>
            </span>
            <span className="text-right text-xs font-medium">{amount}</span>
            <span className={cn("text-xs px-1.5 py-0.5 rounded text-center", statusColors[status])}>
                {status}
            </span>
            <div className="flex items-center justify-end gap-0.5">
                {onDownloadReceipt && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDownloadReceipt}>
                        <Download className="h-3 w-3 text-muted-foreground" />
                    </Button>
                )}
                {onViewInvoice && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onViewInvoice}>
                        <Eye className="h-3 w-3 text-muted-foreground" />
                    </Button>
                )}
            </div>
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

/**
 * SettingsSection - Section wrapper with title and description
 */
export interface SettingsSectionProps {
    title: string
    description?: string
    children: React.ReactNode
    className?: string
}

export function SettingsSection({
    title,
    description,
    children,
    className,
}: SettingsSectionProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {(title || description) && (
                <div>
                    {title && <h4 className="text-sm font-medium">{title}</h4>}
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
            )}
            {children}
        </div>
    )
}

/**
 * ModeButton - Selectable mode button (for Enkel/Avancerad mode)
 */
export interface ModeButtonProps {
    label: string
    description: string
    selected?: boolean
    onClick?: () => void
}

export function ModeButton({
    label,
    description,
    selected = false,
    onClick,
}: ModeButtonProps) {
    return (
        <Button
            variant="outline"
            className={cn(
                "h-auto py-4 flex flex-col items-center gap-2 transition-all",
                selected && "border-primary bg-primary/5 ring-2 ring-primary"
            )}
            onClick={onClick}
        >
            <span className="text-base font-medium">{label}</span>
            <span className="text-xs text-muted-foreground text-center">{description}</span>
            {selected && <Check className="h-4 w-4 text-primary" />}
        </Button>
    )
}

/**
 * BorderedSection - Reusable bordered container with consistent styling
 * Use this for any section that needs the standard border treatment
 */
export interface BorderedSectionProps {
    children: React.ReactNode
    className?: string
}

export function BorderedSection({ children, className }: BorderedSectionProps) {
    return (
        <div className={cn("rounded-lg border-2 border-border/60 p-3", className)}>
            {children}
        </div>
    )
}

/**
 * PropertyRow - A row displaying a label with icon and value
 * Commonly used in detail dialogs and summary panels
 */
export interface PropertyRowProps {
    icon: LucideIcon
    label: string
    children: React.ReactNode
    showBorder?: boolean
}

export function PropertyRow({
    icon: Icon,
    label,
    children,
    showBorder = true,
}: PropertyRowProps) {
    return (
        <div className={cn(
            "flex items-center justify-between py-2",
            showBorder && "border-b border-border/40 last:border-0"
        )}>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
            </div>
            <div>
                {children}
            </div>
        </div>
    )
}

/**
 * SettingsActionCard - Card for critical actions (Export/Delete) with consistent styling
 */
export interface SettingsActionCardProps {
    title: string
    description: string
    actionLabel: string
    onAction: () => void
    variant?: "info" | "destructive"
    icon: LucideIcon
}

export function SettingsActionCard({
    title,
    description,
    actionLabel,
    onAction,
    variant = "info",
    icon: Icon,
}: SettingsActionCardProps) {
    const isDestructive = variant === "destructive"

    const containerClass = isDestructive
        ? "bg-red-50 dark:bg-red-900/10"
        : "bg-blue-50 dark:bg-blue-900/10"

    const titleClass = isDestructive
        ? "text-red-900 dark:text-red-100"
        : "text-blue-900 dark:text-blue-100"

    const descClass = isDestructive
        ? "text-red-700/80 dark:text-red-200/70"
        : "text-blue-700/80 dark:text-blue-200/70"

    const buttonClass = isDestructive
        ? "text-red-600 hover:bg-red-600/20 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-400/20"
        : "text-blue-600 hover:bg-blue-600/20 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-400/20"

    return (
        <div className={cn("flex items-center justify-between rounded-lg p-4", containerClass)}>
            <div>
                <p className={cn("font-medium", titleClass)}>{title}</p>
                <p className={cn("text-sm", descClass)}>{description}</p>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className={buttonClass}
                onClick={onAction}
            >
                {actionLabel}
                <Icon className="ml-2 h-4 w-4" />
            </Button>
        </div>
    )
}

/**
 * SettingsSelectField - A select dropdown with label for settings pages
 */
export interface SettingsSelectFieldProps {
    label: string
    placeholder?: string
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
    options: { value: string; label: string }[]
    className?: string
}

export function SettingsSelectField({
    label,
    placeholder,
    defaultValue,
    value,
    onValueChange,
    options,
    className,
}: SettingsSelectFieldProps) {
    // Need to import Select components - they should be passed or we need to handle this
    // For now, we'll return a simple structure that can be composed
    return (
        <div className={cn("grid gap-2", className)}>
            <Label>{label}</Label>
            <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue={defaultValue}
                value={value}
                onChange={(e) => onValueChange?.(e.target.value)}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
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

