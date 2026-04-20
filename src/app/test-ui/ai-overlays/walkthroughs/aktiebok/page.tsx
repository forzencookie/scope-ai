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
        title: "Aktiebok & Styrning",
        subtitle: "Acme Tech AB · Org.nr 556901-2345",
        blocks: [
            {
                type: "heading",
                props: { text: "Aktiebok", level: 2 },
            },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Ägare", icon: "user" },
                        { label: "Personnr", icon: "hash" },
                        { label: "Antal aktier", icon: "hash" },
                        { label: "Andel %", icon: "percent" },
                        { label: "Röster", icon: "hash" },
                        { label: "Aktienummer", icon: "hash" },
                    ],
                    rows: [
                        { Ägare: "Erik Svensson", Personnr: "850101-****", "Antal aktier": "600", "Andel %": "60,0%", Röster: "600", Aktienummer: "1–600" },
                        { Ägare: "Anna Lindberg", Personnr: "920315-****", "Antal aktier": "400", "Andel %": "40,0%", Röster: "400", Aktienummer: "601–1000" },
                    ],
                    totals: {
                        Ägare: "Totalt",
                        Personnr: "",
                        "Antal aktier": "1 000",
                        "Andel %": "100%",
                        Röster: "1 000",
                        Aktienummer: "",
                    },
                },
            },
            {
                type: "heading",
                props: { text: "Aktiehistorik", level: 2 },
            },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Datum", icon: "calendar" },
                        { label: "Händelse", icon: "file-text" },
                        { label: "Aktier", icon: "hash" },
                        { label: "Ägare", icon: "user" },
                        { label: "Belopp/aktie", icon: "banknote" },
                    ],
                    rows: [
                        { Datum: "2022-01-10", Händelse: "Bolagsbildning", Aktier: "1 000", Ägare: "Erik Svensson", "Belopp/aktie": "100 kr" },
                        { Datum: "2023-06-15", Händelse: "Överlåtelse", Aktier: "400", Ägare: "Anna Lindberg", "Belopp/aktie": "150 kr" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Exportera aktiebok", variant: "default", actionId: "export-share-register" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestAktiebokPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Aktieboken visar 1 000 aktier fördelade på 2 ägare med ett aktiekapital på 100 000 kr."
                    highlights={[
                        { label: "Antal aktier", value: "1 000 st", detail: "Stamaktier A" },
                        { label: "Antal ägare", value: "2 st", detail: "Aktiva delägare" },
                        { label: "Aktiekapital", value: "100 000 kr", detail: "Registrerat" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
