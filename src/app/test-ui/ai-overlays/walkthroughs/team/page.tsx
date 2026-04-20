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
        title: "Team — Anställda",
        subtitle: "3 aktiva anställda · April 2026",
        blocks: [
            {
                type: "heading",
                props: { text: "Anställda", level: 2 },
            },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Namn", value: "Anna Lindberg" },
                        { label: "Roll", value: "Produktchef" },
                        { label: "Månads­lön", value: "42 000 kr" },
                        { label: "Kommun", value: "Stockholm" },
                        { label: "Status", value: "Aktiv" },
                    ],
                },
            },
            {
                type: "separator",
                props: {},
            },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Namn", value: "Erik Svensson" },
                        { label: "Roll", value: "VD / Grundare" },
                        { label: "Månads­lön", value: "55 000 kr" },
                        { label: "Kommun", value: "Stockholm" },
                        { label: "Status", value: "Aktiv" },
                    ],
                },
            },
            {
                type: "separator",
                props: {},
            },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Namn", value: "Maria Johansson" },
                        { label: "Roll", value: "Säljare" },
                        { label: "Månads­lön", value: "38 000 kr" },
                        { label: "Kommun", value: "Göteborg" },
                        { label: "Status", value: "Aktiv" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Lägg till anställd", variant: "default", actionId: "add-employee" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestTeamPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Ditt team har 3 aktiva anställda med en total månadslönekostnad på 135 000 kr."
                    highlights={[
                        { label: "Aktiva anställda", value: "3 st", detail: "Tillsvidare" },
                        { label: "Total månads­lön", value: "135 000 kr", detail: "Bruttolön" },
                        { label: "Kostnad/anst.", value: "45 000 kr", detail: "Snitt inkl. avgifter" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
