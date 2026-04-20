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
        title: "Medlemsregister",
        subtitle: "Förening · 48 totalt registrerade",
        blocks: [
            { type: "heading", props: { text: "Aktiva medlemmar (urval)", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Namn", icon: "user" },
                        { label: "E-post", icon: "file-text", color: "muted" as const },
                        { label: "Startdatum", icon: "calendar", color: "muted" as const },
                        { label: "Årsavgift", icon: "banknote" },
                        { label: "Status", icon: "tag" },
                    ],
                    rows: [
                        { Namn: "Anna Svensson", "E-post": "anna@example.com", Startdatum: "2022-01-01", Årsavgift: "500 kr", Status: "Aktiv" },
                        { Namn: "Erik Larsson", "E-post": "erik@example.com", Startdatum: "2021-06-15", Årsavgift: "500 kr", Status: "Aktiv" },
                        { Namn: "Maria Johansson", "E-post": "maria@example.com", Startdatum: "2023-03-01", Årsavgift: "500 kr", Status: "Aktiv" },
                        { Namn: "Lars Persson", "E-post": "lars@example.com", Startdatum: "2020-09-01", Årsavgift: "500 kr", Status: "Aktiv" },
                        { Namn: "Sara Nilsson", "E-post": "sara@example.com", Startdatum: "2024-01-15", Årsavgift: "500 kr", Status: "Väntande" },
                        { Namn: "Johan Berg", "E-post": "johan@example.com", Startdatum: "2019-04-01", Årsavgift: "500 kr", Status: "Inaktiv" },
                        { Namn: "Emma Carlsson", "E-post": "emma@example.com", Startdatum: "2023-11-01", Årsavgift: "500 kr", Status: "Aktiv" },
                        { Namn: "Mikael Holm", "E-post": "mikael@example.com", Startdatum: "2022-08-15", Årsavgift: "500 kr", Status: "Aktiv" },
                    ],
                },
            },
            {
                type: "info-card",
                props: {
                    title: "3 medlemmar med utestående avgift",
                    content: "Sara Nilsson (väntande), Erik Karlsson, Petra Lindström. Total utestående: 1 500 kr.",
                    variant: "warning",
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Exportera register", variant: "default", actionId: "export-members" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestMedlemsregisterPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Föreningen har 48 registrerade medlemmar — 41 aktiva, 38 med betalda avgifter."
                    highlights={[
                        { label: "Totalt", value: "48 st", detail: "Registrerade" },
                        { label: "Aktiva", value: "41 st", detail: "Betalande" },
                        { label: "Avgifter inbetalda", value: "38 st", detail: "Av 41 aktiva" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
