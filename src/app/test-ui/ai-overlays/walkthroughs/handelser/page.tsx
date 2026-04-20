"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WalkthroughRenderer } from "@/components/ai/overlays/blocks/block-renderer"
import { ScoobyPresentation } from "@/components/ai/scooby-presentation"
import type { WalkthroughResponse } from "@/components/ai/overlays/blocks/types"

function buildWalkthrough(): WalkthroughResponse {
    return {
        mode: "fixed",
        title: "Händelser & Deadlines",
        subtitle: "Bokslut, stängda perioder, kommande deadlines",
        blocks: [
            {
                type: "heading",
                props: { text: "Senaste händelser", level: 2 },
            },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Datum", icon: "calendar" },
                        { label: "Händelse", icon: "file-text" },
                        { label: "Typ", icon: "tag" },
                        { label: "Status", icon: "tag" },
                    ],
                    rows: [
                        { Datum: "2026-04-12", Händelse: "AGI mars — skickad", Typ: "Deklaration", Status: "Klar" },
                        { Datum: "2026-04-10", Händelse: "Månadsavslut mars", Typ: "Bokslut", Status: "Klar" },
                        { Datum: "2026-04-05", Händelse: "Momsdeklaration Q1", Typ: "Deklaration", Status: "Öppen" },
                        { Datum: "2026-03-31", Händelse: "Periodstängning mars", Typ: "Period", Status: "Stängd" },
                        { Datum: "2026-03-25", Händelse: "Löneutbetalning mars", Typ: "Lön", Status: "Klar" },
                        { Datum: "2026-02-28", Händelse: "Periodstängning feb", Typ: "Period", Status: "Stängd" },
                    ],
                },
            },
            {
                type: "heading",
                props: { text: "Kommande deadlines", level: 2 },
            },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "12 maj 2026", value: "Momsdeklaration Q1 — 25 000 kr att betala" },
                        { label: "12 maj 2026", value: "AGI april — löneutbetalning april" },
                        { label: "2 juni 2026", value: "Bolagsstämma — kallelsetid 4–6 veckor" },
                    ],
                },
            },
        ],
    }
}

export default function TestHandelserPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Här är händelseloggen — 3 öppna uppgifter och 2 kommande deadlines."
                    highlights={[
                        { label: "Öppna uppgifter", value: "3 st", detail: "Kräver åtgärd" },
                        { label: "Kommande deadlines", value: "2 st", detail: "Nästa 30 dagarna" },
                        { label: "Stängda perioder", value: "6 st", detail: "Jan–Jun 2025" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
