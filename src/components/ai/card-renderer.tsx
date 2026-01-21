"use client"

/**
 * CardRenderer - Renders structured card output in the AI dialog
 * Maps display types to their corresponding components
 */

import { ActivityCard, type ActivityCardProps } from "./activity-card"
import { cn, formatCurrency } from "@/lib/utils"
import { Receipt, FileText, CreditCard, Calculator } from "lucide-react"

// ============================================================================
// Types
// ============================================================================

export interface CardRendererProps {
    display: {
        type: string
        data?: unknown
        title?: string
        component?: string
        props?: Record<string, unknown>
    }
    className?: string
}

// ============================================================================
// Simple Card Components for Display
// ============================================================================

interface ReceiptCardProps {
    receipt: {
        id?: string
        vendor?: string
        amount?: number
        date?: string
        category?: string
        description?: string
    }
}

function ReceiptCard({ receipt }: ReceiptCardProps) {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Receipt className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold">{receipt.vendor || "Nytt kvitto"}</h4>
                        <p className="text-sm text-muted-foreground">{receipt.date}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(receipt.amount || 0)}</p>
                    <p className="text-xs text-muted-foreground">{receipt.category}</p>
                </div>
            </div>
            {receipt.description && (
                <p className="text-sm text-muted-foreground border-t pt-3">{receipt.description}</p>
            )}
        </div>
    )
}

interface TransactionCardProps {
    transaction: {
        id?: string
        description?: string
        amount?: number
        date?: string
        account?: string
        type?: "income" | "expense"
    }
}

function TransactionCard({ transaction }: TransactionCardProps) {
    const isIncome = transaction.type === "income" || (transaction.amount && transaction.amount > 0)
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isIncome ? "bg-green-500/10" : "bg-red-500/10"
                    )}>
                        <CreditCard className={cn("h-5 w-5", isIncome ? "text-green-600" : "text-red-600")} />
                    </div>
                    <div>
                        <h4 className="font-semibold">{transaction.description || "Ny transaktion"}</h4>
                        <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={cn("font-bold text-lg", isIncome ? "text-green-600" : "text-red-600")}>
                        {isIncome ? "+" : ""}{formatCurrency(transaction.amount || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">{transaction.account}</p>
                </div>
            </div>
        </div>
    )
}

interface InvoiceCardProps {
    invoice: {
        id?: string
        customer?: string
        amount?: number
        dueDate?: string
        status?: string
        invoiceNumber?: string
    }
}

function InvoiceCard({ invoice }: InvoiceCardProps) {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold">{invoice.customer || "Ny faktura"}</h4>
                        <p className="text-sm text-muted-foreground">
                            {invoice.invoiceNumber && `#${invoice.invoiceNumber} • `}
                            Förfaller {invoice.dueDate}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(invoice.amount || 0)}</p>
                    <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        invoice.status === "paid" ? "bg-green-500/10 text-green-600" :
                        invoice.status === "overdue" ? "bg-red-500/10 text-red-600" :
                        "bg-yellow-500/10 text-yellow-600"
                    )}>
                        {invoice.status === "paid" ? "Betald" :
                         invoice.status === "overdue" ? "Förfallen" : "Väntar"}
                    </span>
                </div>
            </div>
        </div>
    )
}

interface TaskChecklistProps {
    title?: string
    tasks: Array<{
        id?: string
        label: string
        completed?: boolean
    }>
}

function TaskChecklist({ title, tasks }: TaskChecklistProps) {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
            {title && <h4 className="font-semibold">{title}</h4>}
            <ul className="space-y-2">
                {tasks.map((task, index) => (
                    <li key={task.id || index} className="flex items-center gap-2 text-sm">
                        <div className={cn(
                            "h-4 w-4 rounded border flex items-center justify-center",
                            task.completed ? "bg-primary border-primary" : "border-muted-foreground/30"
                        )}>
                            {task.completed && (
                                <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                            {task.label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

interface SummaryCardProps {
    title: string
    items: Array<{
        label: string
        value: string | number
        highlight?: boolean
    }>
}

function SummaryCard({ title, items }: SummaryCardProps) {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                {title}
            </h4>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={cn("font-medium", item.highlight && "text-primary font-bold")}>
                            {typeof item.value === "number" ? formatCurrency(item.value) : item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

interface GenericListCardProps {
    title: string
    icon?: string
    items: Array<{
        primary: string
        secondary?: string
        value?: string | number
    }>
}

function GenericListCard({ title, items }: GenericListCardProps) {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
            <h4 className="font-semibold">{title}</h4>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-1.5 border-b last:border-0">
                        <div>
                            <p className="text-sm font-medium">{item.primary}</p>
                            {item.secondary && (
                                <p className="text-xs text-muted-foreground">{item.secondary}</p>
                            )}
                        </div>
                        {item.value !== undefined && (
                            <span className="text-sm font-medium">
                                {typeof item.value === "number" ? formatCurrency(item.value) : item.value}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ============================================================================
// Main CardRenderer
// ============================================================================

export function CardRenderer({ display, className }: CardRendererProps) {
    const { type, data, component, props, title } = display

    // Determine which card to render based on type or component
    const cardType = type || component || ""

    switch (cardType.toLowerCase()) {
        case "receiptcard":
        case "receipt":
            return <ReceiptCard receipt={(data || props) as ReceiptCardProps["receipt"]} />

        case "transactioncard":
        case "transaction":
            return <TransactionCard transaction={(data || props) as TransactionCardProps["transaction"]} />

        case "invoicecard":
        case "invoice":
            return <InvoiceCard invoice={(data || props) as InvoiceCardProps["invoice"]} />

        case "taskchecklist":
        case "checklist":
            return <TaskChecklist {...((data || props) as TaskChecklistProps)} />

        case "activitycard":
        case "activity":
            return <ActivityCard {...((data || props) as ActivityCardProps)} />

        case "summarycard":
        case "summary":
        case "calculation":
        case "salarycalculation":
        case "k10summary":
            return <SummaryCard {...((data || props) as SummaryCardProps)} title={title || "Sammanfattning"} />

        case "genericlist":
        case "list":
        case "transactionstable":
        case "receiptstable":
        case "invoicestable":
        case "employeelist":
        case "payslipstable":
        case "shareholderlist":
        case "partnerlist":
        case "memberlist":
        case "deadlineslist":
        case "benefitstable":
        case "vatsummary":
            // For table-like data, render as a generic list
            if (props && typeof props === "object") {
                const dataArray = Object.values(props).find(v => Array.isArray(v)) as unknown[] | undefined
                if (dataArray && dataArray.length > 0) {
                    return (
                        <GenericListCard
                            title={title || cardType}
                            items={dataArray.slice(0, 5).map((item: unknown) => {
                                const obj = item as Record<string, unknown>
                                return {
                                    primary: String(obj.description || obj.vendor || obj.name || obj.customer || obj.title || ""),
                                    secondary: String(obj.date || obj.period || obj.dueDate || ""),
                                    value: (obj.amount || obj.value || obj.total) as number | undefined,
                                }
                            })}
                        />
                    )
                }
            }
            return (
                <div className={cn("rounded-lg border bg-card p-4", className)}>
                    <p className="text-muted-foreground text-sm">Data visas i {title || cardType}</p>
                </div>
            )

        default:
            // Fallback: render as JSON preview or simple text
            if (data) {
                return (
                    <div className={cn("rounded-lg border bg-card p-4 space-y-2", className)}>
                        {title && <h4 className="font-semibold">{title}</h4>}
                        <pre className="text-xs overflow-auto max-h-32 text-muted-foreground">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                )
            }
            return null
    }
}
