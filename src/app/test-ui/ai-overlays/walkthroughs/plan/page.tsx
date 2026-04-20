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
        title: "Q2 2026 — Tillväxtplan",
        subtitle: "Skapad av Scooby · 2026-04-01",
        blocks: [
            { type: "heading", props: { text: "Q2 2026 — Tillväxtplan", level: 2 } },
            { type: "annotation", props: { text: "Skapad 2026-04-01 · Senast uppdaterad 2026-04-18", variant: "muted" } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Mål", value: "Öka MRR med 40% och anställa en säljare" },
                        { label: "Tidsperiod", value: "April–Juni 2026" },
                        { label: "Ansvarig", value: "Erik Svensson" },
                    ],
                },
            },
            { type: "heading", props: { text: "Uppgifter", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Status", icon: "tag" },
                        { label: "Uppgift", icon: "file-text" },
                        { label: "Deadline", icon: "calendar", color: "muted" as const },
                    ],
                    rows: [
                        { Status: "✓", Uppgift: "Stäng bokslut Q1", Deadline: "2026-04-15" },
                        { Status: "✓", Uppgift: "Skicka momsdeklaration Q1", Deadline: "2026-05-12" },
                        { Status: "✓", Uppgift: "Betala AGI mars", Deadline: "2026-04-12" },
                        { Status: "○", Uppgift: "Publicera ny prissättning", Deadline: "2026-04-30" },
                        { Status: "○", Uppgift: "Rekrytera säljare", Deadline: "2026-05-15" },
                        { Status: "○", Uppgift: "Bolagsstämma — utdelningsbeslut", Deadline: "2026-05-20" },
                        { Status: "○", Uppgift: "Planera sommarstängt (jul)", Deadline: "2026-05-31" },
                        { Status: "○", Uppgift: "Utvärdera nya kunder Q2", Deadline: "2026-06-30" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Uppdatera plan", variant: "default", actionId: "update-plan" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestPlanPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Din Q2-plan har 8 uppgifter — 3 klara, 5 kvar."
                    highlights={[
                        { label: "Uppgifter totalt", value: "8 st", detail: "Q2 2026" },
                        { label: "Klara", value: "3 st", detail: "Slutförda" },
                        { label: "Kvar", value: "5 st", detail: "Att göra" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
