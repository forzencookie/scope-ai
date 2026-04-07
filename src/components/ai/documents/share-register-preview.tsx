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
    type DocumentPreviewProps
} from "./document-preview"

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
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-50 p-4 rounded-lg">
                        <p className="text-sm text-neutral-500">Totalt antal aktier</p>
                        <p className="text-xl font-bold">{data.totalShares.toLocaleString()}</p>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-lg">
                        <p className="text-sm text-neutral-500">Totalt aktiekapital</p>
                        <p className="text-xl font-bold">{data.totalCapital.toLocaleString()} kr</p>
                    </div>
                </div>
            </DocumentSection>

            <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Aktieägare
                </h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-xs text-neutral-500">
                            <th className="text-left py-1.5 font-medium">Namn</th>
                            <th className="text-left py-1.5 font-medium">Person/Org.nr</th>
                            <th className="text-left py-1.5 font-medium">Aktieslag</th>
                            <th className="text-right py-1.5 font-medium">Antal</th>
                            <th className="text-right py-1.5 font-medium">Förvärvsdatum</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.shareholders.map((s) => (
                            <tr key={s.id} className="border-b border-dashed border-neutral-200">
                                <td className="py-1.5 font-medium">{s.name}</td>
                                <td className="py-1.5 text-neutral-500">{s.personalOrOrgNumber}</td>
                                <td className="py-1.5 text-neutral-500">{s.shareClass}</td>
                                <td className="py-1.5 text-right">{s.shareCount.toLocaleString()}</td>
                                <td className="py-1.5 text-right text-neutral-500">{s.acquisitionDate}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 pt-8 border-t text-xs text-neutral-500 text-center">
                <p>
                    Detta utdrag visar aktieinnehavet enligt bolagets aktiebok per {data.date}.
                    Aktieboken förs med automatiserad behandling.
                </p>
            </div>
        </DocumentPreview>
    )
}
