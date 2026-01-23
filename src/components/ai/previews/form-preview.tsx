"use client"

/**
 * FormPreview - Base component for authority form previews
 * 
 * Used for forms submitted to Skatteverket/Bolagsverket:
 * - Momsredovisning (XML)
 * - AGI (XML)
 * - Inkomstdeklaration (SRU)
 * - K10, NE-bilaga, etc.
 */

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    FileCode,
    Download,
    Send,
    Check,
    X,
    Pencil,
    AlertCircle,
    CheckCircle2,
    Clock
} from "lucide-react"
import { forwardRef } from "react"

// =============================================================================
// Types
// =============================================================================

export type FormStatus = "complete" | "incomplete" | "warning"

export interface FormFieldValidation {
    field: string
    status: "valid" | "invalid" | "warning" | "empty"
    message?: string
}

export interface FormPreviewProps {
    /** Form title (e.g., "Momsredovisning Q4 2025") */
    title: string
    /** Target authority */
    authority: "Skatteverket" | "Bolagsverket"
    /** Form reference/type */
    formType: string
    /** Period covered */
    period?: string
    /** Submission deadline */
    deadline?: string
    /** Overall form status */
    status: FormStatus
    /** Status message */
    statusMessage?: string
    /** Field validations to show */
    validations?: FormFieldValidation[]
    /** Main form content */
    children: React.ReactNode
    /** Export format */
    exportFormat?: "XML" | "SRU" | "XBRL"
    /** Actions configuration */
    actions?: {
        onConfirm?: () => void
        onCancel?: () => void
        onEdit?: () => void
        onExport?: () => void
        onSubmit?: () => void
        isLoading?: boolean
    }
    /** Extra class names */
    className?: string
}

// =============================================================================
// Component
// =============================================================================

export const FormPreview = forwardRef<HTMLDivElement, FormPreviewProps>(
    function FormPreview({
        title,
        authority,
        formType,
        period,
        deadline,
        status,
        statusMessage,
        validations,
        children,
        exportFormat = "XML",
        actions,
        className,
    }, ref) {
        const statusConfig = {
            complete: {
                icon: CheckCircle2,
                label: "Klar att skicka",
                className: "bg-green-500/10 text-green-600 dark:text-green-500",
                iconClassName: "text-green-600 dark:text-green-500",
            },
            incomplete: {
                icon: AlertCircle,
                label: "Saknar uppgifter",
                className: "bg-red-500/10 text-red-600 dark:text-red-500",
                iconClassName: "text-red-600 dark:text-red-500",
            },
            warning: {
                icon: Clock,
                label: "Behöver granskning",
                className: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
                iconClassName: "text-amber-600 dark:text-amber-500",
            },
        }

        const currentStatus = statusConfig[status]
        const StatusIcon = currentStatus.icon

        return (
            <div ref={ref} className={cn("flex flex-col gap-4", className)}>
                {/* Form Header */}
                <div className="rounded-lg border bg-card overflow-hidden">
                    {/* Title bar */}
                    <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <FileCode className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {authority} • {formType}
                                    {period && ` • ${period}`}
                                </p>
                            </div>
                        </div>

                        {/* Status badge */}
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                            currentStatus.className
                        )}>
                            <StatusIcon className={cn("h-4 w-4", currentStatus.iconClassName)} />
                            {currentStatus.label}
                        </div>
                    </div>

                    {/* Deadline warning */}
                    {deadline && (
                        <div className="px-4 py-2 bg-muted/30 border-b border-border/40 flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Förfaller:</span>
                            <span className="font-medium">{deadline}</span>
                        </div>
                    )}

                    {/* Status message */}
                    {statusMessage && (
                        <div className={cn(
                            "px-4 py-2 text-sm flex items-center gap-2",
                            status === "incomplete" && "bg-red-500/5 text-red-600 dark:text-red-500",
                            status === "warning" && "bg-amber-500/5 text-amber-600 dark:text-amber-500",
                            status === "complete" && "bg-green-500/5 text-green-600 dark:text-green-500"
                        )}>
                            <StatusIcon className="h-4 w-4 shrink-0" />
                            {statusMessage}
                        </div>
                    )}

                    {/* Form Content */}
                    <div className="p-4 space-y-4">
                        {children}
                    </div>

                    {/* Validation summary */}
                    {validations && validations.length > 0 && (
                        <div className="px-4 py-3 border-t border-border/40 bg-muted/20">
                            <h4 className="text-sm font-medium mb-2">Validering</h4>
                            <div className="space-y-1">
                                {validations.map((v, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        {v.status === "valid" && (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                        )}
                                        {v.status === "invalid" && (
                                            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                                        )}
                                        {v.status === "warning" && (
                                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                                        )}
                                        {v.status === "empty" && (
                                            <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />
                                        )}
                                        <span className={cn(
                                            v.status === "invalid" && "text-red-600",
                                            v.status === "warning" && "text-amber-600"
                                        )}>
                                            {v.field}
                                            {v.message && `: ${v.message}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Bar */}
                {actions && (
                    <div className="flex flex-wrap items-center gap-2">
                        {actions.onConfirm && (
                            <Button
                                size="sm"
                                onClick={actions.onConfirm}
                                disabled={actions.isLoading || status === "incomplete"}
                            >
                                {actions.isLoading ? (
                                    <>
                                        <span className="animate-spin mr-1">⏳</span>
                                        Sparar...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-3.5 w-3.5 mr-1" />
                                        Godkänn
                                    </>
                                )}
                            </Button>
                        )}

                        {actions.onExport && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={actions.onExport}
                                disabled={actions.isLoading}
                            >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Exportera {exportFormat}
                            </Button>
                        )}

                        {actions.onSubmit && status === "complete" && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={actions.onSubmit}
                                disabled={actions.isLoading}
                            >
                                <Send className="h-3.5 w-3.5 mr-1" />
                                Skicka till {authority}
                            </Button>
                        )}

                        {actions.onEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={actions.onEdit}
                                disabled={actions.isLoading}
                            >
                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                Redigera
                            </Button>
                        )}

                        {actions.onCancel && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={actions.onCancel}
                                disabled={actions.isLoading}
                                className="ml-auto"
                            >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Avbryt
                            </Button>
                        )}
                    </div>
                )}
            </div>
        )
    }
)

// =============================================================================
// Sub-components for building form content
// =============================================================================

interface FormSectionProps {
    title: string
    children: React.ReactNode
    className?: string
}

export function FormSection({ title, children, className }: FormSectionProps) {
    return (
        <div className={cn("space-y-3", className)}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                {title}
            </h3>
            {children}
        </div>
    )
}

interface FormFieldRowProps {
    label: string
    value: string | number
    code?: string
    status?: "valid" | "invalid" | "warning"
    className?: string
}

export function FormFieldRow({ label, value, code, status, className }: FormFieldRowProps) {
    return (
        <div className={cn(
            "flex items-center justify-between py-1.5 border-b border-dashed last:border-0",
            className
        )}>
            <div className="flex items-center gap-2">
                {code && (
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                        {code}
                    </span>
                )}
                <span className="text-sm">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className={cn(
                    "text-sm font-medium",
                    status === "invalid" && "text-red-600",
                    status === "warning" && "text-amber-600"
                )}>
                    {value}
                </span>
                {status === "valid" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                )}
                {status === "invalid" && (
                    <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                )}
            </div>
        </div>
    )
}

interface FormTotalRowProps {
    label: string
    value: string | number
    className?: string
}

export function FormTotalRow({ label, value, className }: FormTotalRowProps) {
    return (
        <div className={cn(
            "flex items-center justify-between py-2 border-t-2 font-bold",
            className
        )}>
            <span>{label}</span>
            <span className="text-lg">{value}</span>
        </div>
    )
}
