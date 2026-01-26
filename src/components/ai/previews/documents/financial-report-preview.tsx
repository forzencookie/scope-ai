"use client"

/**
 * FinancialReportPreview - Document preview for AI-generated Financial Reports
 * 
 * Shows a structured Income Statement (Resultaträkning) and 
 * Balance Sheet (Balansräkning) in a readable format.
 */

import { cn, formatCurrency } from "@/lib/utils"
import {
    DocumentPreview,
    DocumentSection,
    type DocumentPreviewProps
} from "../document-preview"

// =============================================================================
// Types
// =============================================================================

export interface FinancialRow {
    id: string
    label: string
    code?: string
    amount: number
    previousAmount?: number
    type: "header" | "row" | "sum" | "total"
    level?: number // 0 = main header, 1 = sub header, 2 = row
}

export interface FinancialReportData {
    companyName: string
    reportType: "Resultaträkning" | "Balansräkning" | "Resultat & Balans"
    period: string
    comparisonPeriod?: string
    currency: string

    // Resultaträkning rows
    incomeStatement?: FinancialRow[]

    // Balansräkning rows
    balanceSheetAssets?: FinancialRow[]
    balanceSheetEquityLiability?: FinancialRow[]

    // Key results
    resultBeforeTax?: number
    netResult?: number
}

export interface FinancialReportPreviewProps {
    data: FinancialReportData
    /** Actions */
    actions?: DocumentPreviewProps['actions']
    className?: string
}

// =============================================================================
// Helper Component
// =============================================================================

function FinancialTable({ rows, comparisonLabel }: { rows: FinancialRow[], comparisonLabel?: string }) {
    return (
        <div className="text-sm">
            {/* Header */}
            <div className="grid grid-cols-[1fr,100px,100px] gap-4 py-2 text-xs font-semibold text-muted-foreground border-b uppercase tracking-wide">
                <div>Post</div>
                <div className="text-right">Period</div>
                <div className="text-right">{comparisonLabel || "Föreg. år"}</div>
            </div>

            {/* Rows */}
            <div className="space-y-0.5 pt-2">
                {rows.map((row) => (
                    <div
                        key={row.id}
                        className={cn(
                            "grid grid-cols-[1fr,100px,100px] gap-4 py-1",
                            row.type === "header" && "font-semibold text-foreground pt-4 pb-1 border-b first:pt-0",
                            row.type === "sum" && "font-semibold border-t border-dashed mt-1 pt-1",
                            row.type === "total" && "font-bold border-t border-double mt-2 pt-2 text-lg",
                            row.type === "row" && "text-muted-foreground hover:text-foreground transition-colors"
                        )}
                        style={{ paddingLeft: row.level ? `${row.level * 12}px` : 0 }}
                    >
                        <div className="flex items-baseline gap-2 truncate">
                            {row.code && <span className="text-[10px] font-mono opacity-50">{row.code}</span>}
                            <span className="truncate">{row.label}</span>
                        </div>
                        <div className="text-right tabular-nums">
                            {row.type !== "header" ? formatCurrency(row.amount) : ""}
                        </div>
                        <div className="text-right tabular-nums text-muted-foreground">
                            {row.type !== "header" && row.previousAmount !== undefined ? formatCurrency(row.previousAmount) : ""}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// =============================================================================
// Component
// =============================================================================

export function FinancialReportPreview({
    data,
    actions,
    className,
}: FinancialReportPreviewProps) {
    return (
        <DocumentPreview
            title={data.reportType}
            subtitle={`Period: ${data.period}`}
            date={data.comparisonPeriod ? `Jämförelse: ${data.comparisonPeriod}` : undefined}
            companyInfo={{
                name: data.companyName,
            }}
            recipientInfo={{
                name: "Rapporter",
                address: `Valuta: ${data.currency}`
            }}
            actions={actions}
            className={className}
        >
            {/* Income Statement */}
            {data.incomeStatement && (
                <DocumentSection title="Resultaträkning" className="mb-8">
                    <FinancialTable
                        rows={data.incomeStatement}
                        comparisonLabel={data.comparisonPeriod}
                    />
                </DocumentSection>
            )}

            {/* Comparison Divider if both exist */}
            {data.incomeStatement && (data.balanceSheetAssets || data.balanceSheetEquityLiability) && (
                <div className="my-8 border-t-2 border-dashed" />
            )}

            {/* Balance Sheet */}
            {(data.balanceSheetAssets || data.balanceSheetEquityLiability) && (
                <div className="space-y-8">
                    {data.balanceSheetAssets && (
                        <DocumentSection title="Balansräkning - Tillgångar">
                            <FinancialTable
                                rows={data.balanceSheetAssets}
                                comparisonLabel={data.comparisonPeriod}
                            />
                        </DocumentSection>
                    )}

                    {data.balanceSheetEquityLiability && (
                        <DocumentSection title="Balansräkning - Eget Kapital & Skulder">
                            <FinancialTable
                                rows={data.balanceSheetEquityLiability}
                                comparisonLabel={data.comparisonPeriod}
                            />
                        </DocumentSection>
                    )}
                </div>
            )}

            {/* Summary Footer */}
            {data.resultBeforeTax !== undefined && (
                <div className="mt-8 pt-4 border-t-2 flex flex-col items-end gap-1">
                    <div className="flex justify-between w-full max-w-xs text-sm">
                        <span className="text-muted-foreground">Resultat före skatt</span>
                        <span className="font-medium">{formatCurrency(data.resultBeforeTax)}</span>
                    </div>
                    {data.netResult !== undefined && (
                        <div className="flex justify-between w-full max-w-xs text-lg font-bold">
                            <span>Årets resultat</span>
                            <span>{formatCurrency(data.netResult)}</span>
                        </div>
                    )}
                </div>
            )}
        </DocumentPreview>
    )
}
