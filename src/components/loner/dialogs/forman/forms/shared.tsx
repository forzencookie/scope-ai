"use client"

import { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FormFieldProps {
    label: string
    children: ReactNode
    className?: string
}

/**
 * FormField - Standard form field wrapper with label
 */
export function FormField({ label, children, className }: FormFieldProps) {
    return (
        <div className={cn("space-y-2", className)}>
            <Label>{label}</Label>
            {children}
        </div>
    )
}

interface TextInputFieldProps {
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    type?: string
    suffix?: string
    className?: string
}

/**
 * TextInputField - Text input with label and optional suffix
 */
export function TextInputField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    suffix,
    className
}: TextInputFieldProps) {
    return (
        <FormField label={label} className={className}>
            <div className="relative">
                <Input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={suffix ? "pr-10" : ""}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {suffix}
                    </span>
                )}
            </div>
        </FormField>
    )
}

interface EmployeeInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

/**
 * EmployeeInput - Standard employee name input
 */
export function EmployeeInput({ value, onChange, placeholder = "Namn på anställd..." }: EmployeeInputProps) {
    return (
        <TextInputField
            label="Anställd"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
        />
    )
}

interface PeriodInputProps {
    value: string
    onChange: (value: string) => void
}

/**
 * PeriodInput - Month period input
 */
export function PeriodInput({ value, onChange }: PeriodInputProps) {
    return (
        <FormField label="Period">
            <Input
                type="month"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </FormField>
    )
}

interface CurrencyInputProps {
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

/**
 * CurrencyInput - Number input with kr suffix
 */
export function CurrencyInput({ label, value, onChange, placeholder = "0" }: CurrencyInputProps) {
    return (
        <TextInputField
            label={label}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            type="number"
            suffix="kr"
        />
    )
}

interface DateInputProps {
    label: string
    value: string
    onChange: (value: string) => void
}

/**
 * DateInput - Date input with label
 */
export function DateInput({ label, value, onChange }: DateInputProps) {
    return (
        <FormField label={label}>
            <Input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </FormField>
    )
}

interface SubmitButtonProps {
    label: string
    onClick: () => void
    disabled?: boolean
    className?: string
}

/**
 * SubmitButton - Full-width submit button
 */
export function SubmitButton({ label, onClick, disabled, className }: SubmitButtonProps) {
    return (
        <Button
            className={cn("w-full", className)}
            onClick={onClick}
            disabled={disabled}
        >
            {label}
        </Button>
    )
}

interface ModeSwitchProps {
    mode: string
    options: Array<{ value: string; label: string }>
    onChange: (value: string) => void
}

/**
 * ModeSwitch - Tab-like mode switcher
 */
export function ModeSwitch({ mode, options, onChange }: ModeSwitchProps) {
    return (
        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        mode === opt.value
                            ? "bg-background shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}
