"use client"

import { Button } from "@/components/ui/button"
import { AppStatusBadge } from "@/components/ui/status-badge"
import {
    Download,
    Calendar,
    CreditCard,
    User,
    FileText,
    ArrowDownLeft,
    ArrowUpRight,
    Hash,
} from "lucide-react"
import { PageOverlay } from "@/components/shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn, formatCurrency } from "@/lib/utils"
import type { UnifiedInvoice } from "../types"
import { isAppStatus } from "@/lib/status-types"

interface InvoiceDetailOverlayProps {
    isOpen: boolean
    onClose: () => void
    invoice: UnifiedInvoice | null
    onDownloadPDF?: (invoice: UnifiedInvoice) => void
}

/**
 * InvoiceDetailOverlay — Immersive detail view for a customer or supplier invoice.
 */
export function InvoiceDetailOverlay({
    isOpen,
    onClose,
    invoice,
    onDownloadPDF,
}: InvoiceDetailOverlayProps) {
    if (!invoice) return null

    const isCustomer = invoice.direction === "in"
    const original = isCustomer ? invoice.originalCustomerInvoice : invoice.originalSupplierInvoice
    const items = isCustomer ? invoice.originalCustomerInvoice?.items || [] : []

    const scoobyPrompt = isCustomer
        ? `Jag vill se detaljer om kundfaktura ${invoice.number} till ${invoice.counterparty}.`
        : `Jag vill se detaljer om leverantörsfaktura ${invoice.number} från ${invoice.counterparty}.`

    return (
        <PageOverlay
            isOpen={isOpen}
            onClose={onClose}
            title={`Faktura ${invoice.number}`}
            subtitle={`${isCustomer ? "Kundfaktura" : "Leverantörsfaktura"} — ${invoice.counterparty}`}
            scoobyPrompt={scoobyPrompt}
            status={
                <div className="flex gap-2">
                    {isAppStatus(invoice.status) && (
                        <AppStatusBadge status={invoice.status} size="sm" />
                    )}
                    <span className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                        isCustomer
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                        {isCustomer
                            ? <><ArrowDownLeft className="h-3 w-3" /> Inkommande</>
                            : <><ArrowUpRight className="h-3 w-3" /> Utgående</>
                        }
                    </span>
                </div>
            }
            actions={
                isCustomer && onDownloadPDF ? (
                    <Button variant="outline" size="sm" onClick={() => onDownloadPDF(invoice)}>
                        <Download className="h-4 w-4 mr-2" />
                        Ladda ner PDF
                    </Button>
                ) : undefined
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Line Items (customer invoices) */}
                    {items.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    Fakturarader
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/50 border-b">
                                                <th className="px-4 py-2 text-left font-medium">Beskrivning</th>
                                                <th className="px-4 py-2 text-right font-medium">Antal</th>
                                                <th className="px-4 py-2 text-right font-medium">À-pris</th>
                                                <th className="px-4 py-2 text-right font-medium">Moms</th>
                                                <th className="px-4 py-2 text-right font-medium">Summa</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {items.map((item, idx) => {
                                                const lineTotal = item.quantity * item.unitPrice
                                                return (
                                                    <tr key={idx} className="hover:bg-muted/20">
                                                        <td className="px-4 py-3">{item.description}</td>
                                                        <td className="px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                                                        <td className="px-4 py-3 text-right tabular-nums">{item.vatRate}%</td>
                                                        <td className="px-4 py-3 text-right tabular-nums font-medium">{formatCurrency(lineTotal)}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t">
                                                <td colSpan={4} className="px-4 py-2 text-right text-muted-foreground">Netto</td>
                                                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(invoice.amount)}</td>
                                            </tr>
                                            {invoice.vatAmount != null && invoice.vatAmount > 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-2 text-right text-muted-foreground">Moms</td>
                                                    <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(invoice.vatAmount)}</td>
                                                </tr>
                                            )}
                                            <tr className="bg-muted/30 font-bold">
                                                <td colSpan={4} className="px-4 py-2 text-right">Totalt</td>
                                                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(invoice.totalAmount)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Amount summary for supplier invoices (no line items) */}
                    {items.length === 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    Belopp
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Nettobelopp</span>
                                    <span className="font-medium tabular-nums">{formatCurrency(invoice.amount)}</span>
                                </div>
                                {invoice.vatAmount != null && invoice.vatAmount > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span className="text-muted-foreground">Moms</span>
                                        <span className="font-medium tabular-nums">{formatCurrency(invoice.vatAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-2 font-bold text-lg">
                                    <span>Totalbelopp</span>
                                    <span className="tabular-nums">{formatCurrency(invoice.totalAmount)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Hash className="h-3.5 w-3.5" />
                                    Fakturanummer
                                </div>
                                <p className="text-sm font-semibold">{invoice.number}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-3.5 w-3.5" />
                                    {isCustomer ? "Kund" : "Leverantör"}
                                </div>
                                <p className="text-sm font-semibold">{invoice.counterparty}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Fakturadatum
                                </div>
                                <p className="text-sm font-semibold">{invoice.issueDate}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Förfallodatum
                                </div>
                                <p className={cn(
                                    "text-sm font-semibold",
                                    invoice.dueDate && new Date(invoice.dueDate) < new Date() ? "text-red-600" : ""
                                )}>
                                    {invoice.dueDate}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CreditCard className="h-3.5 w-3.5" />
                                    Totalbelopp
                                </div>
                                <p className="text-lg font-bold tabular-nums">
                                    {formatCurrency(invoice.totalAmount)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageOverlay>
    )
}
