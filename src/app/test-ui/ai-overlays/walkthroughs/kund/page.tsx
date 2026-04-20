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
        title: "Acme Consulting AB",
        subtitle: "Kund · Org.nr 556789-1234",
        blocks: [
            { type: "heading", props: { text: "Kunduppgifter", level: 2 } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Företagsnamn", value: "Acme Consulting AB" },
                        { label: "Org.nr", value: "556789-1234" },
                        { label: "Kontaktperson", value: "Johan Persson" },
                        { label: "E-post", value: "johan.persson@acme.se" },
                        { label: "Telefon", value: "+46 70 123 45 67" },
                        { label: "Adress", value: "Storgatan 12 · 111 23 Stockholm" },
                        { label: "Kund sedan", value: "2024-01-15" },
                    ],
                },
            },
            { type: "separator", props: {} },
            { type: "heading", props: { text: "Fakturor", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Fakturanr", icon: "receipt" },
                        { label: "Datum", icon: "calendar" },
                        { label: "Belopp", icon: "banknote" },
                        { label: "Förfallodatum", icon: "calendar", color: "muted" as const },
                        { label: "Status", icon: "tag" },
                    ],
                    rows: [
                        { Fakturanr: "F-2026-02", Datum: "2026-04-01", Belopp: "62 500 kr", Förfallodatum: "2026-04-30", Status: "Utestående" },
                        { Fakturanr: "F-2026-01", Datum: "2026-01-15", Belopp: "62 500 kr", Förfallodatum: "2026-02-15", Status: "Betald" },
                        { Fakturanr: "F-2025-08", Datum: "2025-08-01", Belopp: "75 000 kr", Förfallodatum: "2025-09-01", Status: "Betald" },
                        { Fakturanr: "F-2025-03", Datum: "2025-03-15", Belopp: "107 250 kr", Förfallodatum: "2025-04-15", Status: "Betald" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Skapa faktura", variant: "default", actionId: "create-invoice" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestKundPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Acme Consulting AB — aktiv kund sedan 2024. 4 fakturor totalt, 1 utestående."
                    highlights={[
                        { label: "Fakturor totalt", value: "4 st", detail: "Sedan 2024" },
                        { label: "Utestående", value: "62 500 kr", detail: "Förfaller 30 apr" },
                        { label: "Betalt totalt", value: "244 750 kr", detail: "All tid" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
