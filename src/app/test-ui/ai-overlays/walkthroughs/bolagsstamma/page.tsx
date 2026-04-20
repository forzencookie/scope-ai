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
        title: "Möten & Beslut",
        subtitle: "Bolagsstämmor och styrelsemöten 2026",
        blocks: [
            { type: "heading", props: { text: "Genomförda möten", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Datum", icon: "calendar" },
                        { label: "Typ", icon: "tag" },
                        { label: "Deltagare", icon: "user" },
                        { label: "Status", icon: "tag", color: "muted" as const },
                    ],
                    rows: [
                        { Datum: "2026-04-15", Typ: "Ordinarie bolagsstämma", Deltagare: "Erik Svensson, Anna Lindberg", Status: "Genomfört" },
                        { Datum: "2026-03-10", Typ: "Styrelsemöte Q1", Deltagare: "Erik Svensson, Anna Lindberg", Status: "Genomfört" },
                        { Datum: "2026-02-05", Typ: "Extra bolagsstämma", Deltagare: "Erik Svensson", Status: "Genomfört" },
                        { Datum: "2026-01-15", Typ: "Styrelsemöte jan", Deltagare: "Erik Svensson, Anna Lindberg", Status: "Genomfört" },
                    ],
                },
            },
            { type: "heading", props: { text: "Planerade möten", level: 2 } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "2026-06-10", value: "Styrelsemöte Q2 — Agenda ej fastställd" },
                        { label: "2026-09-15", value: "Extra bolagsstämma — Utdelning" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Skapa protokoll", variant: "default", actionId: "create-minutes" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestBolagsstammaPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="4 genomförda möten och 2 planerade. Protokoll skapade för alla genomförda."
                    highlights={[
                        { label: "Genomförda möten", value: "4 st", detail: "2026" },
                        { label: "Kommande", value: "2 st", detail: "Planerade" },
                        { label: "Protokoll", value: "4 st", detail: "PDF skapade" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
