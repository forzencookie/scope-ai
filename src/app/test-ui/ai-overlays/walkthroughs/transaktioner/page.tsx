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
        title: "Transaktioner — April 2026",
        subtitle: "Senaste 8 transaktioner · 3 obokförda",
        blocks: [
            {
                type: "heading",
                props: { text: "Transaktioner april 2026", level: 2 },
            },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Datum", icon: "calendar" },
                        { label: "Beskrivning", icon: "file-text" },
                        { label: "Belopp", icon: "banknote" },
                        { label: "Konto", icon: "hash" },
                        { label: "Ver.nr", icon: "receipt" },
                        { label: "Status", icon: "tag" },
                    ],
                    rows: [
                        { Datum: "2026-04-01", Beskrivning: "Kontorshyra", Belopp: "-8 500 kr", Konto: "5010", "Ver.nr": "A-48", Status: "Bokförd" },
                        { Datum: "2026-04-03", Beskrivning: "Svea Hosting", Belopp: "-1 499 kr", Konto: "5420", "Ver.nr": "A-49", Status: "Bokförd" },
                        { Datum: "2026-04-07", Beskrivning: "Kjell & Company", Belopp: "-2 499 kr", Konto: "—", "Ver.nr": "—", Status: "Obokförd" },
                        { Datum: "2026-04-10", Beskrivning: "Kund: Acme Corp faktura", Belopp: "+62 500 kr", Konto: "3001", "Ver.nr": "A-50", Status: "Bokförd" },
                        { Datum: "2026-04-12", Beskrivning: "Spotify Business", Belopp: "-169 kr", Konto: "—", "Ver.nr": "—", Status: "Obokförd" },
                        { Datum: "2026-04-14", Beskrivning: "Kund: Beta AB faktura", Belopp: "+125 000 kr", Konto: "3001", "Ver.nr": "A-51", Status: "Bokförd" },
                        { Datum: "2026-04-18", Beskrivning: "Clas Ohlson — material", Belopp: "-349 kr", Konto: "—", "Ver.nr": "—", Status: "Obokförd" },
                        { Datum: "2026-04-20", Beskrivning: "SJ resor Q1", Belopp: "-3 200 kr", Konto: "5800", "Ver.nr": "A-52", Status: "Bokförd" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Bokför obokförda (3)", variant: "default", actionId: "book-unbooked" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestTransaktionerPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Här är dina senaste transaktioner — 8 st, varav 3 obokförda."
                    highlights={[
                        { label: "Intäkter", value: "185 000 kr", detail: "Denna månad" },
                        { label: "Kostnader", value: "92 500 kr", detail: "Denna månad" },
                        { label: "Obokförda", value: "3 st", detail: "Väntar på bokföring" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
