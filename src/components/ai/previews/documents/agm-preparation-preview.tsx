"use client"

/**
 * AgmPreparationPreview - Document preview for Annual General Meeting preparation
 * 
 * Shows the status of AGM preparation including agenda and required documents.
 */

import { cn } from "@/lib/utils"
import {
    DocumentPreview,
    DocumentSection,
    type DocumentPreviewProps
} from "../document-preview"
import { 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Calendar,
    FileText,
    Users,
    Banknote
} from "lucide-react"

// =============================================================================
// Types
// =============================================================================

export interface AgmDocumentStatus {
    name: string
    status: 'ready' | 'pending' | 'missing'
}

export interface AgmPreparationData {
    fiscalYear: number
    suggestedDate: string
    proposedDividend?: number
    agenda: string[]
    requiredDocuments: AgmDocumentStatus[]
}

export interface AgmPreparationPreviewProps {
    data: AgmPreparationData
    actions?: DocumentPreviewProps['actions']
    className?: string
}

// =============================================================================
// Component
// =============================================================================

const statusConfig = {
    ready: {
        icon: CheckCircle2,
        className: "text-green-600 dark:text-green-400",
        label: "Klar",
    },
    pending: {
        icon: Clock,
        className: "text-amber-600 dark:text-amber-400",
        label: "Pågår",
    },
    missing: {
        icon: AlertCircle,
        className: "text-red-600 dark:text-red-400",
        label: "Saknas",
    },
}

export function AgmPreparationPreview({
    data,
    actions,
    className,
}: AgmPreparationPreviewProps) {
    const readyCount = data.requiredDocuments.filter(d => d.status === 'ready').length
    const totalCount = data.requiredDocuments.length
    const progressPercent = Math.round((readyCount / totalCount) * 100)

    return (
        <DocumentPreview
            title={`Årsstämma ${data.fiscalYear}`}
            subtitle="Förberedelse och checklista"
            date={`Planerat datum: ${data.suggestedDate}`}
            companyInfo={{
                name: "Din Företag AB",
            }}
            actions={actions}
            className={className}
        >
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xs text-muted-foreground">Räkenskapsår</p>
                    <p className="font-semibold">{data.fiscalYear}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xs text-muted-foreground">Dokument</p>
                    <p className="font-semibold">{readyCount}/{totalCount} klara</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-semibold">{progressPercent}%</p>
                </div>
                {data.proposedDividend !== undefined && (
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <Banknote className="h-5 w-5 mx-auto mb-1 text-green-600" />
                        <p className="text-xs text-muted-foreground">Föreslagen utdelning</p>
                        <p className="font-semibold">{data.proposedDividend.toLocaleString('sv-SE')} kr</p>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Förberedelsestatus</span>
                    <span className="font-medium">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                        className={cn(
                            "h-full transition-all duration-500",
                            progressPercent === 100 
                                ? "bg-green-500" 
                                : progressPercent >= 50 
                                    ? "bg-amber-500" 
                                    : "bg-red-500"
                        )}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Required Documents */}
            <DocumentSection title="Checklista dokument" className="mb-6">
                <div className="space-y-2">
                    {data.requiredDocuments.map((doc, i) => {
                        const config = statusConfig[doc.status]
                        const Icon = config.icon
                        return (
                            <div 
                                key={i}
                                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={cn("h-4 w-4", config.className)} />
                                    <span className="text-sm font-medium">{doc.name}</span>
                                </div>
                                <span className={cn("text-xs font-medium", config.className)}>
                                    {config.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </DocumentSection>

            {/* Agenda */}
            <DocumentSection title="Dagordning">
                <ol className="space-y-1.5 text-sm">
                    {data.agenda.map((item, i) => (
                        <li 
                            key={i}
                            className="flex items-start gap-2 py-1"
                        >
                            <span className="text-muted-foreground font-mono text-xs mt-0.5 min-w-[1.5rem]">
                                {item.split('.')[0]}.
                            </span>
                            <span>{item.split('. ').slice(1).join('. ')}</span>
                        </li>
                    ))}
                </ol>
            </DocumentSection>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center">
                <p>
                    Årsstämma ska hållas inom 6 månader från räkenskapsårets slut enligt Aktiebolagslagen (2005:551).
                </p>
            </div>
        </DocumentPreview>
    )
}
