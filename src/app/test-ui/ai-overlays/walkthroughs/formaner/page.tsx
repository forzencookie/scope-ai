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
        title: "Förmåner",
        subtitle: "4 aktiva förmåner · 2026",
        blocks: [
            {
                type: "heading",
                props: { text: "Förmåner per anställd", level: 2 },
            },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Förmån", icon: "tag" },
                        { label: "Anställd", icon: "user" },
                        { label: "Belopp/år", icon: "banknote" },
                        { label: "Skattepliktig", icon: "tag" },
                        { label: "Startdatum", icon: "calendar" },
                    ],
                    rows: [
                        { Förmån: "Friskvårdsbidrag", Anställd: "Anna Lindberg", "Belopp/år": "5 000 kr", Skattepliktig: "Nej", Startdatum: "2024-01-01" },
                        { Förmån: "Friskvårdsbidrag", Anställd: "Erik Svensson", "Belopp/år": "5 000 kr", Skattepliktig: "Nej", Startdatum: "2024-01-01" },
                        { Förmån: "Bilförmån", Anställd: "Erik Svensson", "Belopp/år": "28 800 kr", Skattepliktig: "Ja", Startdatum: "2025-03-01" },
                        { Förmån: "Friskvårdsbidrag", Anställd: "Maria Johansson", "Belopp/år": "5 000 kr", Skattepliktig: "Nej", Startdatum: "2024-06-01" },
                    ],
                    totals: {
                        Förmån: "Totalt",
                        Anställd: "",
                        "Belopp/år": "43 800 kr",
                        Skattepliktig: "",
                        Startdatum: "",
                    },
                },
            },
            {
                type: "info-card",
                props: {
                    title: "Friskvårdsbidrag 2026",
                    content: "Skattefritt friskvårdsbidrag är max 5 000 kr per anställd och år (IL 11 kap 28§). Bilförmån beräknas enligt Skatteverkets fordonslista.",
                    variant: "info",
                },
            },
        ],
    }
}

export default function TestFormanerPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Ditt team har 4 aktiva förmåner med ett totalt värde på 43 800 kr per år."
                    highlights={[
                        { label: "Aktiva förmåner", value: "4 st", detail: "Pågående" },
                        { label: "Totalt värde", value: "43 800 kr/år", detail: "Alla anställda" },
                        { label: "Skattepliktiga", value: "1 st", detail: "Bilförmån" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
