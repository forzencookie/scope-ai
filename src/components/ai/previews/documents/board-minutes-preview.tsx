"use client"

/**
 * BoardMinutesPreview - Document preview for AI-generated Board Minutes
 * 
 * Shows a formal Swedish "Styrelseprotokoll" layout.
 */

import { cn } from "@/lib/utils"
import {
    DocumentPreview,
    DocumentSection,
    type DocumentPreviewProps
} from "../document-preview"
import { User } from "lucide-react"

// =============================================================================
// Types
// =============================================================================

export interface MeetingDecision {
    id: string
    paragraph: string // e.g., "§1"
    title: string
    description: string
    decision: string
    type: "decision" | "info" | "election"
}

export interface BoardMinutesData {
    companyName: string
    meetingType: string // e.g., "Styrelsemöte", "Konstituerande styrelsemöte"
    meetingNumber?: string // e.g., "1/2026"
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
    /** Actions */
    actions?: DocumentPreviewProps['actions']
    className?: string
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
            subtitle={data.meetingNumber}
            date={data.date}
            companyInfo={{
                name: data.companyName,
            }}
            // Legal documents often don't have a specific "To" address, 
            // but we can use this space for meeting metadata
            recipientInfo={{
                name: `Plats: ${data.location}`,
                address: data.time ? `Tid: ${data.time}` : undefined
            }}
            actions={actions}
            className={className}
        >
            {/* Attendees Section */}
            <DocumentSection title="Närvarande">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {data.attendees.map((person, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <User className={cn("h-3.5 w-3.5", person.present ? "text-primary" : "text-muted-foreground")} />
                            <span className={person.present ? "font-medium" : "text-muted-foreground line-through"}>
                                {person.name}
                            </span>
                            <span className="text-muted-foreground text-xs">({person.role})</span>
                        </div>
                    ))}
                </div>
            </DocumentSection>

            {/* Agenda */}
            <DocumentSection title="Dagordning" className="pt-4 border-t border-dashed">
                <ol className="list-decimal list-inside text-sm space-y-1 ml-1 text-muted-foreground">
                    {data.agenda.map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ol>
            </DocumentSection>

            {/* Decisions / Minutes */}
            <div className="space-y-6 pt-6 pb-4">
                {data.decisions.map((decision) => (
                    <div key={decision.id} className="space-y-2">
                        <div className="flex items-baseline gap-2 border-b pb-1 mb-2">
                            <span className="font-bold text-lg">{decision.paragraph}</span>
                            <h4 className="font-semibold">{decision.title}</h4>
                        </div>

                        <div className="text-sm space-y-3">
                            <p>{decision.description}</p>

                            <div className="bg-muted/30 p-3 rounded-md border-l-2 border-primary">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                    Beslut
                                </p>
                                <p className="font-medium italic">
                                    {decision.decision}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Signatures Placeholder */}
            <div className="mt-8 pt-8 border-t space-y-8 break-inside-avoid">
                <p className="text-sm text-center italic text-muted-foreground">
                    Att protokollet stämmer intygar:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {data.signatures.map((sig, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-0 border-b-2 border-muted-foreground/30 w-full" />
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{sig.name}</span>
                                <span className="text-muted-foreground">{sig.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DocumentPreview>
    )
}
