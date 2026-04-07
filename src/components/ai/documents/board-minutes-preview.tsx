"use client"

/**
 * BoardMinutesPreview - Swedish Styrelseprotokoll
 *
 * Formal board meeting minutes following Swedish corporate law (ABL).
 * White background throughout — this is a legal document meant for
 * print, PDF download, and archiving.
 *
 * Roles use Swedish labels (Ordförande, Ledamot, Suppleant, etc.)
 * not English ones.
 */

import { cn } from "@/lib/utils"
import {
    DocumentPreview,
    type DocumentPreviewProps
} from "./document-preview"

// =============================================================================
// Types
// =============================================================================

export interface MeetingDecision {
    id: string
    paragraph: string
    title: string
    description: string
    decision: string
    type: "decision" | "info" | "election"
}

export interface BoardMinutesData {
    companyName: string
    orgNumber?: string
    meetingType: string
    meetingNumber?: string
    date: string
    time?: string
    location: string

    attendees: Array<{
        name: string
        role: "Chairman" | "Member" | "Deputy" | "Secretary" | "Adjunct"
        present: boolean
    }>

    agenda: string[]
    decisions: MeetingDecision[]
    nextMeeting?: string

    signatures: Array<{
        role: string
        name: string
    }>
}

export interface BoardMinutesPreviewProps {
    data: BoardMinutesData
    actions?: DocumentPreviewProps["actions"]
    className?: string
}

// =============================================================================
// Helpers
// =============================================================================

const ROLE_LABELS: Record<string, string> = {
    Chairman: "Ordförande",
    Member: "Ledamot",
    Deputy: "Suppleant",
    Secretary: "Sekreterare",
    Adjunct: "Adjungerad",
}

// =============================================================================
// Component
// =============================================================================

export function BoardMinutesPreview({
    data,
    actions,
    className,
}: BoardMinutesPreviewProps) {
    return (
        <DocumentPreview
            title={data.meetingType}
            subtitle={data.meetingNumber ? `Nr ${data.meetingNumber}` : undefined}
            date={data.date}
            companyInfo={{
                name: data.companyName,
                orgNumber: data.orgNumber,
            }}
            actions={actions}
            className={className}
        >
            {/* Meeting metadata — place and time in a clean row */}
            <div className="grid grid-cols-2 gap-4 text-sm pb-5 border-b border-neutral-200">
                <div>
                    <span className="text-xs text-neutral-500 block">Plats</span>
                    <span>{data.location}</span>
                </div>
                {data.time && (
                    <div>
                        <span className="text-xs text-neutral-500 block">Tid</span>
                        <span>{data.time}</span>
                    </div>
                )}
            </div>

            {/* Attendees — table format, cleaner than icon grid */}
            <div className="pt-5">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Närvarande
                </h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-xs text-neutral-500">
                            <th className="text-left py-1.5 font-medium">Namn</th>
                            <th className="text-left py-1.5 font-medium">Roll</th>
                            <th className="text-right py-1.5 font-medium w-24">Närvaro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.attendees.map((person, i) => (
                            <tr key={i} className="border-b border-dashed border-neutral-200">
                                <td className={cn("py-1.5", !person.present && "text-neutral-500 line-through")}>
                                    {person.name}
                                </td>
                                <td className="py-1.5 text-neutral-500">
                                    {ROLE_LABELS[person.role] ?? person.role}
                                </td>
                                <td className="py-1.5 text-right text-xs">
                                    {person.present ? (
                                        <span className="text-neutral-900">Ja</span>
                                    ) : (
                                        <span className="text-neutral-500">Frånvarande</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Dagordning */}
            <div className="pt-5">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Dagordning
                </h3>
                <ol className="list-decimal list-inside text-sm space-y-1 text-neutral-500">
                    {data.agenda.map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ol>
            </div>

            {/* Decisions — the core of the protocol */}
            <div className="pt-5 space-y-6">
                {data.decisions.map((decision) => (
                    <div key={decision.id}>
                        {/* Paragraph header */}
                        <div className="flex items-baseline gap-3 mb-2">
                            <span className="text-xl font-bold">{decision.paragraph}</span>
                            <h4 className="font-semibold text-sm">{decision.title}</h4>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-neutral-500 mb-3 leading-relaxed">
                            {decision.description}
                        </p>

                        {/* Decision box — white bg, only a left border for emphasis */}
                        <div className="pl-4 border-l-2 border-neutral-400/20">
                            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                                Beslut
                            </p>
                            <p className="text-sm font-medium italic">
                                {decision.decision}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Next meeting */}
            {data.nextMeeting && (
                <div className="pt-4">
                    <p className="text-sm text-neutral-500">
                        <span className="font-medium text-neutral-900">Nästa sammanträde:</span>{" "}
                        {data.nextMeeting}
                    </p>
                </div>
            )}

            {/* Signatures — formal, clean lines */}
            <div className="mt-10 pt-6 border-t border-neutral-200 space-y-8 break-inside-avoid">
                <p className="text-sm text-center text-neutral-500 italic">
                    Vid protokollet
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                    {data.signatures.map((sig, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-px border-b border-neutral-400/30 w-full mt-6" />
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{sig.name}</span>
                                <span className="text-neutral-500 text-xs">{sig.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DocumentPreview>
    )
}
