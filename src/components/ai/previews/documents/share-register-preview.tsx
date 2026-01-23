"use client"

/**
 * ShareRegisterPreview - Document preview for Share Register (Aktiebok)
 * 
 * Shows a formal excerpt from the share register compliant with 
 * Swedish Companies Act (Aktiebolagslagen).
 */

import {
    DocumentPreview,
    DocumentSection,
    DocumentTable,
    type DocumentPreviewProps
} from "../document-preview"

// =============================================================================
// Types
// =============================================================================

export interface Shareholder {
    id: string
    name: string
    personalOrOrgNumber: string
    address?: string
    shareCount: number
    shareClass: string // e.g. "Stamaktier A", "Preferensaktier"
    votingRights: number
    acquisitionDate: string
}

export interface ShareRegisterData {
    companyName: string
    orgNumber: string
    date: string
    totalShares: number
    totalCapital: number
    shareholders: Shareholder[]
}

export interface ShareRegisterPreviewProps {
    data: ShareRegisterData
    /** Actions */
    actions?: DocumentPreviewProps['actions']
    className?: string
}

// =============================================================================
// Component
// =============================================================================

export function ShareRegisterPreview({
    data,
    actions,
    className,
}: ShareRegisterPreviewProps) {
    // Transform shareholders data for table
    const tableRows = data.shareholders.map(s => [
        s.name,
        s.personalOrOrgNumber,
        s.shareClass,
        s.shareCount.toLocaleString(),
        s.acquisitionDate
    ])

    return (
        <DocumentPreview
            title="Utdrag ur Aktiebok"
            subtitle="Enligt aktiebolagslagen (2005:551)"
            date={`Utskrivet: ${data.date}`}
            companyInfo={{
                name: data.companyName,
                orgNumber: data.orgNumber,
            }}
            recipientInfo={{
                name: "Offentligt registerutdrag",
            }}
            actions={actions}
            className={className}
        >
            <DocumentSection title="Aktiekapital & Andelar" className="mb-6">
                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
                    <div>
                        <p className="text-sm text-muted-foreground">Totalt antal aktier</p>
                        <p className="text-xl font-bold">{data.totalShares.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Totalt aktiekapital</p>
                        <p className="text-xl font-bold">{data.totalCapital.toLocaleString()} kr</p>
                    </div>
                </div>
            </DocumentSection>

            <DocumentSection title="Aktieägare">
                <DocumentTable
                    headers={["Namn", "Person/Org.nr", "Aktieslag", "Antal", "Förvärvsdatum"]}
                    rows={tableRows}
                />
            </DocumentSection>

            <div className="mt-8 pt-8 border-t text-xs text-muted-foreground text-center">
                <p>
                    Detta utdrag visar aktieinnehavet enligt bolagets aktiebok per {data.date}.
                    Aktieboken förs med automatiserad behandling.
                </p>
            </div>
        </DocumentPreview>
    )
}
