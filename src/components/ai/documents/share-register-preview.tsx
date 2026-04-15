"use client"

/**
 * ShareRegisterPreview - Document preview for Share Register (Aktiebok)
 *
 * Compliant with Swedish Companies Act (ABL 5 kap. 8§).
 * Required fields: aktienummer per holder, aktieslag, rösträtter,
 * kvotvärde, förvärvsdatum, restrictions (if any).
 */

import {
    DocumentPreview,
    DocumentSection,
    type DocumentPreviewProps
} from "./document-preview"

// =============================================================================
// Types
// =============================================================================

export type ShareRestrictionType = "förköp" | "hembud" | "samtycke"

export interface ShareRestriction {
    /** förköp = pre-emption between shareholders, hembud = right of first offer back to company, samtycke = board consent required */
    type: ShareRestrictionType
    description?: string
}

export interface Shareholder {
    id: string
    name: string
    personalOrOrgNumber: string
    address?: string
    /** The specific share number range this holder owns, e.g. { from: 1, to: 600 } */
    shareNumbers: { from: number; to: number }
    shareCount: number
    shareClass: string // e.g. "Stamaktier A", "Preferensaktier"
    /** Total voting rights for this holder's entire holding */
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
    /** Optional restrictions registered in the articles of association */
    restrictions?: ShareRestriction[]
}

export interface ShareRegisterPreviewProps {
    data: ShareRegisterData
    actions?: DocumentPreviewProps['actions']
    className?: string
}

// =============================================================================
// Helpers
// =============================================================================

const RESTRICTION_LABELS: Record<ShareRestrictionType, string> = {
    förköp: "Förköpsförbehåll",
    hembud: "Hembudsförbehåll",
    samtycke: "Samtyckesförbehåll",
}

// =============================================================================
// Component
// =============================================================================

export function ShareRegisterPreview({
    data,
    actions,
    className,
}: ShareRegisterPreviewProps) {
    const kvotvärde = data.totalShares > 0
        ? (data.totalCapital / data.totalShares).toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "–"

    return (
        <DocumentPreview
            title="Utdrag ur Aktiebok"
            subtitle="Enligt aktiebolagslagen (2005:551)"
            date={`Utskrivet: ${data.date}`}
            companyInfo={{
                name: data.companyName,
                orgNumber: data.orgNumber,
            }}
            actions={actions}
            className={className}
        >
            {/* Summary: total shares, capital, quota value */}
            <DocumentSection title="Aktiekapital" className="mb-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-neutral-50 p-4 rounded-lg">
                        <p className="text-xs text-neutral-500">Antal aktier</p>
                        <p className="text-lg font-bold">{data.totalShares.toLocaleString("sv-SE")}</p>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-lg">
                        <p className="text-xs text-neutral-500">Aktiekapital</p>
                        <p className="text-lg font-bold">{data.totalCapital.toLocaleString("sv-SE")} kr</p>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-lg">
                        <p className="text-xs text-neutral-500">Kvotvärde</p>
                        <p className="text-lg font-bold">{kvotvärde} kr</p>
                    </div>
                </div>
            </DocumentSection>

            {/* Shareholders table — aktienr, namn, id, aktieslag, antal, röster, datum */}
            <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Aktieägare
                </h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-xs text-neutral-500">
                            <th className="text-left py-1.5 font-medium">Aktienr</th>
                            <th className="text-left py-1.5 font-medium">Namn</th>
                            <th className="text-left py-1.5 font-medium">Person/Org.nr</th>
                            <th className="text-left py-1.5 font-medium">Aktieslag</th>
                            <th className="text-right py-1.5 font-medium">Antal</th>
                            <th className="text-right py-1.5 font-medium">Röster</th>
                            <th className="text-right py-1.5 font-medium">Förvärvsdatum</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.shareholders.map((s) => (
                            <tr key={s.id} className="border-b border-dashed border-neutral-200">
                                <td className="py-1.5 font-mono text-xs text-neutral-500">
                                    {s.shareNumbers.from}–{s.shareNumbers.to}
                                </td>
                                <td className="py-1.5 font-medium">{s.name}</td>
                                <td className="py-1.5 text-neutral-500 font-mono text-xs">{s.personalOrOrgNumber}</td>
                                <td className="py-1.5 text-neutral-500">{s.shareClass}</td>
                                <td className="py-1.5 text-right">{s.shareCount.toLocaleString("sv-SE")}</td>
                                <td className="py-1.5 text-right text-neutral-500">{s.votingRights.toLocaleString("sv-SE")}</td>
                                <td className="py-1.5 text-right text-neutral-500">{s.acquisitionDate}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Restrictions — only shown if registered in articles of association */}
            {data.restrictions && data.restrictions.length > 0 && (
                <div className="pt-5 mt-5 border-t border-dashed border-neutral-200">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                        Förbehåll i bolagsordningen
                    </h3>
                    <ul className="space-y-1.5">
                        {data.restrictions.map((r, i) => (
                            <li key={i} className="text-sm">
                                <span className="font-medium">{RESTRICTION_LABELS[r.type]}</span>
                                {r.description && (
                                    <span className="text-neutral-500"> — {r.description}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-8 pt-8 border-t text-xs text-neutral-500 text-center">
                <p>
                    Detta utdrag visar aktieinnehavet enligt bolagets aktiebok per {data.date}.
                    Aktieboken förs med automatiserad behandling enligt ABL 5 kap.
                </p>
            </div>
        </DocumentPreview>
    )
}
