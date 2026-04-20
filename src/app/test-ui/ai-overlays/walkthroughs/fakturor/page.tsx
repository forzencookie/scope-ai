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
        title: "Fakturor",
        subtitle: "Kundfakturor & leverantörsfakturor",
        blocks: [
            {
                type: "heading",
                props: { text: "Kundfakturor", level: 2 },
            },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Fakturanr", icon: "receipt" },
                        { label: "Kund", icon: "user" },
                        { label: "Belopp", icon: "banknote" },
                        { label: "Förfallodatum", icon: "calendar" },
                        { label: "Status", icon: "tag" },
                    ],
                    rows: [
                        { Fakturanr: "F-2026-01", Kund: "Acme Consulting AB", Belopp: "62 500 kr", Förfallodatum: "2026-04-15", Status: "Betald" },
                        { Fakturanr: "F-2026-02", Kund: "Beta AB", Belopp: "125 000 kr", Förfallodatum: "2026-04-30", Status: "Utestående" },
                        { Fakturanr: "F-2026-03", Kund: "Gamma Tech", Belopp: "37 500 kr", Förfallodatum: "2026-03-31", Status: "Förfallen" },
                        { Fakturanr: "F-2026-04", Kund: "Delta Partners", Belopp: "18 750 kr", Förfallodatum: "2026-05-15", Status: "Utestående" },
                        { Fakturanr: "F-2026-05", Kund: "Epsilon AB", Belopp: "56 250 kr", Förfallodatum: "2026-04-22", Status: "Betald" },
                    ],
                },
            },
            {
                type: "separator",
                props: { label: "Leverantörsfakturor" },
            },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Fakturanr", icon: "receipt" },
                        { label: "Leverantör", icon: "user" },
                        { label: "Belopp", icon: "banknote" },
                        { label: "Förfallodatum", icon: "calendar" },
                        { label: "Status", icon: "tag" },
                    ],
                    rows: [
                        { Fakturanr: "LF-2026-01", Leverantör: "Visma Software", Belopp: "12 800 kr", Förfallodatum: "2026-04-10", Status: "Betald" },
                        { Fakturanr: "LF-2026-02", Leverantör: "SJ AB", Belopp: "8 400 kr", Förfallodatum: "2026-04-20", Status: "Betald" },
                        { Fakturanr: "LF-2026-03", Leverantör: "Apple Store", Belopp: "25 000 kr", Förfallodatum: "2026-03-28", Status: "Förfallen" },
                        { Fakturanr: "LF-2026-04", Leverantör: "Office Depot", Belopp: "4 200 kr", Förfallodatum: "2026-05-01", Status: "Obetald" },
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

export default function TestFakturorPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Här är dina fakturor — 5 kundfakturor och 4 leverantörsfakturor. 2 förfallna."
                    highlights={[
                        { label: "Utestående", value: "125 000 kr", detail: "Ej betalda kundfakturor" },
                        { label: "Betalt", value: "340 000 kr", detail: "Denna månad" },
                        { label: "Antal", value: "9 fakturor", detail: "5 kund · 4 leverantör" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
