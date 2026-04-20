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
        title: "Utdelning 2026",
        subtitle: "Gränsbelopp och skatteberäkning",
        blocks: [
            {
                type: "heading",
                props: { text: "Utdelning per ägare", level: 2 },
            },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Ägare", icon: "user" },
                        { label: "Andel", icon: "percent" },
                        { label: "Belopp", icon: "banknote" },
                        { label: "Skatt 20%", icon: "banknote" },
                        { label: "Netto", icon: "banknote" },
                    ],
                    rows: [
                        { Ägare: "Erik Svensson", Andel: "60%", Belopp: "240 000 kr", "Skatt 20%": "48 000 kr", Netto: "192 000 kr" },
                        { Ägare: "Anna Lindberg", Andel: "40%", Belopp: "160 000 kr", "Skatt 20%": "32 000 kr", Netto: "128 000 kr" },
                    ],
                    totals: {
                        Ägare: "Totalt",
                        Andel: "100%",
                        Belopp: "400 000 kr",
                        "Skatt 20%": "80 000 kr",
                        Netto: "320 000 kr",
                    },
                },
            },
            {
                type: "annotation",
                props: {
                    text: "Försiktighetsregeln: Bolagets egna kapital 500 000 kr. Utdelning 400 000 kr. Kontrollera med revisor.",
                    variant: "muted",
                },
            },
            {
                type: "info-card",
                props: {
                    title: "Utdelning inom gränsbelopp",
                    content: "400 000 kr ≤ 619 054 kr — hela utdelningen beskattas med 20% kapitalskatt.",
                    variant: "success",
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Exportera utdelningsdokument", variant: "default", actionId: "export-dividend" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestUtdelningPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Föreslagen utdelning 400 000 kr ryms inom gränsbeloppet på 619 054 kr — beskattas med 20%."
                    highlights={[
                        { label: "Gränsbelopp", value: "619 054 kr", detail: "Totalt utrymme" },
                        { label: "Beslutad utdelning", value: "400 000 kr", detail: "Förslag bolagsstämma" },
                        { label: "Återstående", value: "219 054 kr", detail: "Kan sparas till nästa år" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
