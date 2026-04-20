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
        title: "Delägaruttag & Insättningar",
        subtitle: "Uttag och insättningar per delägare · 2026",
        blocks: [
            { type: "heading", props: { text: "Transaktioner 2026", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Delägare", icon: "user" },
                        { label: "Datum", icon: "calendar" },
                        { label: "Typ", icon: "tag" },
                        { label: "Belopp", icon: "banknote" },
                        { label: "Konto", icon: "hash", color: "muted" as const },
                    ],
                    rows: [
                        { Delägare: "Erik Svensson", Datum: "2026-01-31", Typ: "Uttag", Belopp: "-20 000 kr", Konto: "2010" },
                        { Delägare: "Anna Lindberg", Datum: "2026-01-31", Typ: "Uttag", Belopp: "-15 000 kr", Konto: "2020" },
                        { Delägare: "Erik Svensson", Datum: "2026-02-28", Typ: "Uttag", Belopp: "-25 000 kr", Konto: "2010" },
                        { Delägare: "Anna Lindberg", Datum: "2026-02-28", Typ: "Insättning", Belopp: "+30 000 kr", Konto: "2020" },
                        { Delägare: "Erik Svensson", Datum: "2026-03-31", Typ: "Uttag", Belopp: "-25 000 kr", Konto: "2010" },
                        { Delägare: "Anna Lindberg", Datum: "2026-03-31", Typ: "Uttag", Belopp: "-20 000 kr", Konto: "2020" },
                    ],
                    totals: { Delägare: "Totalt", Datum: "", Typ: "", Belopp: "-75 000 kr", Konto: "" },
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Registrera uttag", variant: "default", actionId: "register-withdrawal" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestDelagaruttagPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Totalt 85 000 kr i uttag och 30 000 kr insättningar hittills 2026."
                    highlights={[
                        { label: "Totalt uttag", value: "85 000 kr", detail: "2026 hittills" },
                        { label: "Totalt insättning", value: "30 000 kr", detail: "2026 hittills" },
                        { label: "Netto", value: "-55 000 kr", detail: "Per idag" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
