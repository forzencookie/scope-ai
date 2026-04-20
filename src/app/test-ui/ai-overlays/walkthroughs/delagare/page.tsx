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
        title: "Delägare",
        subtitle: "Handelsbolag / Kommanditbolag",
        blocks: [
            { type: "heading", props: { text: "Delägare", level: 2 } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Namn", value: "Erik Svensson" },
                        { label: "Personnr", value: "850101-****" },
                        { label: "Andel", value: "50%" },
                        { label: "Typ", value: "Komplementär" },
                        { label: "Kapitalkonto", value: "280 000 kr" },
                        { label: "Status", value: "Aktiv" },
                    ],
                },
            },
            { type: "separator", props: {} },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Namn", value: "Anna Lindberg" },
                        { label: "Personnr", value: "920315-****" },
                        { label: "Andel", value: "50%" },
                        { label: "Typ", value: "Komplementär" },
                        { label: "Kapitalkonto", value: "170 000 kr" },
                        { label: "Status", value: "Aktiv" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Uppdatera andelar", variant: "default", actionId: "update-shares" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestDelagarePage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Bolaget har 2 delägare med ett totalt kapitalkonto på 450 000 kr."
                    highlights={[
                        { label: "Antal delägare", value: "2 st", detail: "Komplementärer" },
                        { label: "Totalt kapital", value: "450 000 kr", detail: "Kapitalkonton" },
                        { label: "Vinstandel max", value: "50%", detail: "Per delägare" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
