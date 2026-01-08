"use client"

import { FileText, Link2, Clock, Banknote, Building2, Calendar, Tag, CheckCircle2, Paperclip } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { GridTableHeader, GridTableRow, GridTableRows } from "@/components/ui/grid-table"
import { ScaledPreview, PreviewStatusBadge } from "./shared"

export function ReceiptsPreview() {
    // Mock data matching what the real component displays
    const mockReceipts = [
        { id: 1, supplier: "Taxi Stockholm AB", date: "2026-01-03", category: "Resekostnad", amount: "495 kr", status: "Bokförd" },
        { id: 2, supplier: "Kontorsmaterial AB", date: "2026-01-02", category: "Förbrukning", amount: "1 250 kr", status: "Att bokföra" },
        { id: 3, supplier: "Amazon Web Services", date: "2026-01-01", category: "IT & Licenser", amount: "2 340 kr", status: "Väntar" },
        { id: 4, supplier: "Telia AB", date: "2025-12-28", category: "Telefoni", amount: "899 kr", status: "Bokförd" },
        { id: 5, supplier: "Swish Företag", date: "2025-12-27", category: "Bankavgifter", amount: "49 kr", status: "Bokförd" }
    ]

    return (
        <ScaledPreview scale={0.65} extendToBottom>
            <div className="p-6 space-y-6 max-w-6xl">
                {/* Page Heading - matches real component */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Kvitton & underlag</h2>
                        <p className="text-muted-foreground">Hantera kvitton och underlag för bokföring.</p>
                    </div>
                </div>

                {/* Stats Cards - 3 cols on mobile, 4 on larger */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    <StatCard
                        label="Totalt antal"
                        value="24"
                        subtitle="Alla underlag"
                        headerIcon={FileText}
                    />
                    <StatCard
                        label="Matchade"
                        value="18"
                        subtitle="Kopplade till transaktion"
                        headerIcon={Link2}
                        changeType="positive"
                    />
                    <StatCard
                        label="Omatchade"
                        value="6"
                        subtitle="Kräver uppmärksamhet"
                        headerIcon={Clock}
                        changeType="negative"
                    />
                    {/* Hide last card on very small screens, show on sm+ */}
                    <div className="hidden sm:block">
                        <StatCard
                            label="Totalt belopp"
                            value="45 230 kr"
                            headerIcon={Banknote}
                        />
                    </div>
                </div>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                {/* Sub-header with title */}
                <div className="flex items-center justify-between py-1">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Alla underlag</h3>
                </div>

                {/* GridTable Header - exact match */}
                <GridTableHeader
                    columns={[
                        { label: "Leverantör", icon: Building2, span: 3 },
                        { label: "Datum", icon: Calendar, span: 2 },
                        { label: "Kategori", icon: Tag, span: 2 },
                        { label: "Belopp", icon: Banknote, span: 2, align: "right" },
                        { label: "Status", icon: CheckCircle2, span: 2, align: "center" },
                    ]}
                    trailing={
                        <div className="flex items-center justify-end gap-3">
                            <Paperclip className="h-3 w-3" />
                        </div>
                    }
                />

                {/* GridTable Rows - exact structure */}
                <GridTableRows>
                    {mockReceipts.map((receipt) => (
                        <GridTableRow key={receipt.id}>
                            <div style={{ gridColumn: 'span 3' }} className="font-medium truncate">
                                {receipt.supplier}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground text-sm">
                                {receipt.date}
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-muted/50 text-foreground">
                                    {receipt.category}
                                </span>
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-right tabular-nums font-medium">
                                {receipt.amount}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="flex justify-center">
                                <PreviewStatusBadge
                                    status={receipt.status}
                                    variant={receipt.status === "Bokförd" ? "success" : receipt.status === "Att bokföra" ? "warning" : "neutral"}
                                />
                            </div>
                            <div style={{ gridColumn: 'span 1' }} className="flex items-center justify-end gap-2">
                                <div className="text-muted-foreground bg-muted p-1 rounded-sm">
                                    <Paperclip className="h-3 w-3" />
                                </div>
                            </div>
                        </GridTableRow>
                    ))}
                </GridTableRows>
            </div>
        </ScaledPreview>
    )
}
