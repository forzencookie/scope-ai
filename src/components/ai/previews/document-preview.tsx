"use client"

/**
 * DocumentPreview - Base component for PDF-ready document previews
 * 
 * Used for documents that will be downloaded/sent to external parties:
 * - Fakturor (customers)
 * - Lönebesked (employees)  
 * - Styrelseprotokoll (board)
 * - Meeting minutes, etc.
 */

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Download, Send, Printer, Check, X, Pencil } from "lucide-react"
import { forwardRef } from "react"

// =============================================================================
// Types
// =============================================================================

export interface DocumentPreviewProps {
    /** Document title shown in header */
    title: string
    /** Document subtitle/type */
    subtitle?: string
    /** Document reference number */
    referenceNumber?: string
    /** Document date */
    date?: string
    /** Company info to show in header */
    companyInfo?: {
        name: string
        orgNumber?: string
        address?: string
        logo?: string
    }
    /** Recipient info (for invoices, payslips, etc.) */
    recipientInfo?: {
        name: string
        address?: string
        orgNumber?: string
        email?: string
    }
    /** Main document content */
    children: React.ReactNode
    /** Additional footer content */
    footer?: React.ReactNode
    /** Actions configuration */
    actions?: {
        onConfirm?: () => void
        onCancel?: () => void
        onEdit?: () => void
        onDownload?: () => void
        onSend?: () => void
        onPrint?: () => void
        isLoading?: boolean
        confirmLabel?: string
    }
    /** Extra class names */
    className?: string
}

// =============================================================================
// Component
// =============================================================================

export const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
    function DocumentPreview({
        title,
        subtitle,
        referenceNumber,
        date,
        companyInfo,
        recipientInfo,
        children,
        footer,
        actions,
        className,
    }, ref) {
        return (
            <div ref={ref} className={cn("flex flex-col gap-4", className)}>
                {/* Document Paper */}
                <div className="bg-white dark:bg-zinc-900 border rounded-lg shadow-sm overflow-hidden">
                    {/* Document Header */}
                    <div className="p-6 border-b border-border/40">
                        <div className="flex justify-between items-start">
                            {/* Left: Company info */}
                            <div>
                                {companyInfo?.logo ? (
                                    <img src={companyInfo.logo} alt="" className="h-10 mb-2" />
                                ) : companyInfo?.name && (
                                    <h2 className="text-xl font-bold">{companyInfo.name}</h2>
                                )}
                                {companyInfo?.orgNumber && (
                                    <p className="text-sm text-muted-foreground">
                                        Org.nr: {companyInfo.orgNumber}
                                    </p>
                                )}
                                {companyInfo?.address && (
                                    <p className="text-sm text-muted-foreground">
                                        {companyInfo.address}
                                    </p>
                                )}
                            </div>

                            {/* Right: Document info */}
                            <div className="text-right">
                                <h1 className="text-2xl font-bold">{title}</h1>
                                {subtitle && (
                                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                                )}
                                {referenceNumber && (
                                    <p className="text-sm font-mono mt-1">{referenceNumber}</p>
                                )}
                                {date && (
                                    <p className="text-sm text-muted-foreground mt-1">{date}</p>
                                )}
                            </div>
                        </div>

                        {/* Recipient info */}
                        {recipientInfo && (
                            <div className="mt-6 pt-6 border-t border-border/40">
                                <p className="text-xs font-medium text-muted-foreground mb-1">TILL</p>
                                <p className="font-medium">{recipientInfo.name}</p>
                                {recipientInfo.orgNumber && (
                                    <p className="text-sm text-muted-foreground">
                                        Org.nr: {recipientInfo.orgNumber}
                                    </p>
                                )}
                                {recipientInfo.address && (
                                    <p className="text-sm text-muted-foreground">
                                        {recipientInfo.address}
                                    </p>
                                )}
                                {recipientInfo.email && (
                                    <p className="text-sm text-muted-foreground">
                                        {recipientInfo.email}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Document Content */}
                    <div className="p-6">
                        {children}
                    </div>

                    {/* Document Footer */}
                    {footer && (
                        <div className="p-6 border-t border-border/40 bg-muted/20">
                            {footer}
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
                                disabled={actions.isLoading}
                            >
                                {actions.isLoading ? (
                                    <>
                                        <span className="animate-spin mr-1">⏳</span>
                                        Sparar...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-3.5 w-3.5 mr-1" />
                                        {actions.confirmLabel || "Godkänn"}
                                    </>
                                )}
                            </Button>
                        )}

                        {actions.onDownload && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={actions.onDownload}
                                disabled={actions.isLoading}
                            >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Ladda ner PDF
                            </Button>
                        )}

                        {actions.onSend && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={actions.onSend}
                                disabled={actions.isLoading}
                            >
                                <Send className="h-3.5 w-3.5 mr-1" />
                                Skicka
                            </Button>
                        )}

                        {actions.onPrint && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={actions.onPrint}
                                disabled={actions.isLoading}
                            >
                                <Printer className="h-3.5 w-3.5 mr-1" />
                                Skriv ut
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
// Sub-components for building document content
// =============================================================================

interface DocumentSectionProps {
    title?: string
    children: React.ReactNode
    className?: string
}

export function DocumentSection({ title, children, className }: DocumentSectionProps) {
    return (
        <div className={cn("space-y-3", className)}>
            {title && (
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {title}
                </h3>
            )}
            {children}
        </div>
    )
}

interface DocumentTableProps {
    headers: string[]
    rows: (string | number)[][]
    className?: string
}

export function DocumentTable({ headers, rows, className }: DocumentTableProps) {
    return (
        <table className={cn("w-full text-sm", className)}>
            <thead>
                <tr className="border-b">
                    {headers.map((header, i) => (
                        <th key={i} className={cn(
                            "py-2 font-medium text-left",
                            i > 0 && "text-right"
                        )}>
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, i) => (
                    <tr key={i} className="border-b border-dashed last:border-0">
                        {row.map((cell, j) => (
                            <td key={j} className={cn(
                                "py-2",
                                j > 0 && "text-right"
                            )}>
                                {cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

interface DocumentSummaryRowProps {
    label: string
    value: string | number
    highlight?: boolean
    className?: string
}

export function DocumentSummaryRow({ label, value, highlight, className }: DocumentSummaryRowProps) {
    return (
        <div className={cn(
            "flex justify-between",
            highlight ? "font-bold text-lg pt-2 border-t" : "text-sm",
            className
        )}>
            <span className={!highlight ? "text-muted-foreground" : undefined}>{label}</span>
            <span>{value}</span>
        </div>
    )
}
