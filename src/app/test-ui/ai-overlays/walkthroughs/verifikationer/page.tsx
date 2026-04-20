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
        title: "Verifikationer — Mars 2026",
        subtitle: "51 verifikationer · A-serie",
        blocks: [
            {
                type: "heading",
                props: { text: "Verifikationer mars 2026", level: 2 },
            },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Ver.nr", icon: "receipt" },
                        { label: "Datum", icon: "calendar" },
                        { label: "Beskrivning", icon: "file-text" },
                        { label: "Debet", icon: "banknote" },
                        { label: "Kredit", icon: "banknote" },
                    ],
                    rows: [
                        { "Ver.nr": "A-42", Datum: "2026-03-01", Beskrivning: "Kontorshyra mars", Debet: "8 500 kr", Kredit: "8 500 kr" },
                        { "Ver.nr": "A-43", Datum: "2026-03-05", Beskrivning: "Svea Hosting", Debet: "1 874 kr", Kredit: "1 874 kr" },
                        { "Ver.nr": "A-44", Datum: "2026-03-08", Beskrivning: "Löneutbetalning mars", Debet: "135 000 kr", Kredit: "135 000 kr" },
                        { "Ver.nr": "A-45", Datum: "2026-03-10", Beskrivning: "Kund Acme Corp", Debet: "62 500 kr", Kredit: "62 500 kr" },
                        { "Ver.nr": "A-46", Datum: "2026-03-15", Beskrivning: "Arbetsgivaravgift", Debet: "42 418 kr", Kredit: "42 418 kr" },
                        { "Ver.nr": "A-47", Datum: "2026-03-18", Beskrivning: "Spotify Business", Debet: "211 kr", Kredit: "211 kr" },
                        { "Ver.nr": "A-48", Datum: "2026-03-20", Beskrivning: "Apple MacBook Pro", Debet: "31 250 kr", Kredit: "31 250 kr" },
                        { "Ver.nr": "A-49", Datum: "2026-03-22", Beskrivning: "Kund Beta AB", Debet: "125 000 kr", Kredit: "125 000 kr" },
                        { "Ver.nr": "A-50", Datum: "2026-03-25", Beskrivning: "SJ tjänsteresor", Debet: "4 000 kr", Kredit: "4 000 kr" },
                        { "Ver.nr": "A-51", Datum: "2026-03-31", Beskrivning: "Periodavstämning", Debet: "1 200 kr", Kredit: "1 200 kr" },
                    ],
                },
            },
            {
                type: "status-check",
                props: {
                    items: [
                        { label: "Alla verifikationer balanserar", status: "pass", detail: "Debet = Kredit på samtliga" },
                        { label: "Nummersekvens utan luckor", status: "pass", detail: "A-01 till A-51, 51 st" },
                        { label: "Momsavstämning", status: "pass", detail: "Konto 2641 stämmer" },
                    ],
                },
            },
        ],
    }
}

export default function TestVerifikationerPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Här är verifikationslistan för mars — 51 st, alla balanserade."
                    highlights={[
                        { label: "Totalt", value: "51 ver.", detail: "A-01 till A-51" },
                        { label: "Denna månad", value: "12 ver.", detail: "Mars 2026" },
                        { label: "Obalanserade", value: "0 st", detail: "Allt stämmer" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
