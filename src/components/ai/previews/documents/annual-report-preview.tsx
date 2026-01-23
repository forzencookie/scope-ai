"use client"

/**
 * AnnualReportPreview - Document/Form preview for Annual Report (Årsredovisning)
 * 
 * This is a hybrid - it functions like a Document Preview (layout) but 
 * is technically an authority submission to Bolagsverket.
 */

import {
    DocumentPreview,
    DocumentSection,
    type DocumentPreviewProps
} from "../document-preview"
import { CheckCircle2, History } from "lucide-react"

// =============================================================================
// Types
// =============================================================================

export interface AnnualReportData {
    companyName: string
    orgNumber: string
    period: string
    fiscalYearStart: string
    fiscalYearEnd: string

    sections: {
        managementReport: boolean // Förvaltningsberättelse
        incomeStatement: boolean
        balanceSheet: boolean
        notes: boolean           // Noter
        signatures: boolean
    }

    keyFigures: Array<{
        label: string
        currentYear: string | number
        previousYear: string | number
    }>

    status: "draft" | "signed" | "submitted"
}

export interface AnnualReportPreviewProps {
    data: AnnualReportData
    actions?: DocumentPreviewProps['actions']
    className?: string
}

// =============================================================================
// Component
// =============================================================================

export function AnnualReportPreview({
    data,
    actions,
    className,
}: AnnualReportPreviewProps) {
    return (
        <DocumentPreview
            title="Årsredovisning"
            subtitle={`Räkenskapsår: ${data.fiscalYearStart} - ${data.fiscalYearEnd}`}
            companyInfo={{
                name: data.companyName,
                orgNumber: data.orgNumber,
            }}
            recipientInfo={{
                name: "Bolagsverket",
            }}
            actions={{
                ...actions,
                onSend: actions?.onSend ? () => actions.onSend!() : undefined, // Override label if needed
            }}
            className={className}
        >
            <DocumentSection title="Innehåll">
                <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Förvaltningsberättelse</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Resultaträkning</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Balansräkning</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Tilläggsupplysningar (Noter)</span>
                    </div>
                </div>
            </DocumentSection>

            <DocumentSection title="Flerårsöversikt (Nyckeltal)" className="mt-6">
                <div className="text-sm">
                    <div className="grid grid-cols-3 py-2 border-b font-medium text-muted-foreground uppercase tracking-wide text-xs">
                        <span>Nyckeltal</span>
                        <span className="text-right">{data.fiscalYearEnd.split('-')[0]}</span>
                        <span className="text-right">Föreg. år</span>
                    </div>
                    {data.keyFigures.map((fig, i) => (
                        <div key={i} className="grid grid-cols-3 py-2 border-b border-dashed last:border-0">
                            <span>{fig.label}</span>
                            <span className="text-right font-medium">{fig.currentYear}</span>
                            <span className="text-right text-muted-foreground">{fig.previousYear}</span>
                        </div>
                    ))}
                </div>
            </DocumentSection>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/50 flex items-start gap-3">
                <History className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold text-blue-900 dark:text-blue-200">Digital inlämning</p>
                    <p className="text-blue-800 dark:text-blue-300 mt-1">
                        Denna årsredovisning är förberedd för digital inlämning (K2/K3) enligt Bolagsverkets specifikation för XBRL.
                    </p>
                </div>
            </div>
        </DocumentPreview>
    )
}
