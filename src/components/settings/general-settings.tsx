"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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
 * BorderedSection - Reusable bordered container with consistent styling
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
 */
export interface PropertyRowProps {
    icon: React.ComponentType<{ className?: string }>
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
