"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface FormFieldBaseProps {
    /** Field label */
    label: string
    /** Optional icon component */
    icon?: React.ComponentType<{ className?: string }>
    /** Field name/id */
    name?: string
    /** Error message */
    error?: string
    /** Helper text */
    helperText?: string
    /** Required indicator */
    required?: boolean
    /** Disabled state */
    disabled?: boolean
    /** Additional className for wrapper */
    className?: string
    /** Suffix text (e.g. "kr", "mil", "kvm") */
    suffix?: string
    /** Extra text next to label (e.g. "Max 5 000 kr/år") */
    labelExtra?: string
}

interface TextFieldProps extends FormFieldBaseProps {
    type: "text" | "email" | "password" | "number" | "date" | "month" | "tel" | "url"
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

interface TextareaFieldProps extends FormFieldBaseProps {
    type: "textarea"
    value: string
    onChange: (value: string) => void
    placeholder?: string
    rows?: number
}

interface SelectFieldProps extends FormFieldBaseProps {
    type: "select"
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    placeholder?: string
}

type FormFieldProps = TextFieldProps | TextareaFieldProps | SelectFieldProps

/**
 * Unified form field component with icon, label, and various input types.
 * Consolidates the repeated form field pattern across dialogs.
 */
export function FormField(props: FormFieldProps) {
    const {
        label,
        icon: Icon,
        name,
        error,
        helperText,
        required,
        disabled,
        className
    } = props

    const fieldId = name || label.toLowerCase().replace(/\s+/g, "-")

    return (
        <div className={cn("grid gap-2", className)}>
            <div className="flex items-center justify-between">
                <Label
                    htmlFor={fieldId}
                    className={cn(
                        "flex items-center gap-2",
                        error && "text-destructive"
                    )}
                >
                    {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                    {label}
                    {required && <span className="text-destructive">*</span>}
                </Label>
                {props.labelExtra && (
                    <span className="text-xs text-muted-foreground">{props.labelExtra}</span>
                )}
            </div>

            {props.type === "textarea" ? (
                <Textarea
                    id={fieldId}
                    value={props.value}
                    onChange={(e) => props.onChange(e.target.value)}
                    placeholder={props.placeholder}
                    disabled={disabled}
                    rows={props.rows ?? 3}
                    className={cn(error && "border-destructive")}
                />
            ) : props.type === "select" ? (
                <Select
                    value={props.value}
                    onValueChange={props.onChange}
                    disabled={disabled}
                >
                    <SelectTrigger className={cn(error && "border-destructive")}>
                        <SelectValue placeholder={props.placeholder ?? "Välj..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {props.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                <div className="relative">
                    <Input
                        id={fieldId}
                        type={props.type}
                        value={props.value}
                        onChange={(e) => props.onChange(e.target.value)}
                        placeholder={props.placeholder}
                        disabled={disabled}
                        className={cn(error && "border-destructive", props.suffix && "pr-12")}
                    />
                    {props.suffix && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            {props.suffix}
                        </span>
                    )}
                </div>
            )}

            {error && (
                <p className="text-xs text-destructive">{error}</p>
            )}
            {helperText && !error && (
                <p className="text-xs text-muted-foreground">{helperText}</p>
            )}
        </div>
    )
}

/**
 * Grid wrapper for form fields - creates responsive 2-column layout
 */
export function FormFieldRow({
    children,
    className
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn("grid grid-cols-2 gap-4", className)}>
            {children}
        </div>
    )
}
