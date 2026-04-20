"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WalkthroughRenderer } from "@/components/ai/overlays/blocks/block-renderer"
import { ScoobyPresentation } from "@/components/ai/scooby-presentation"
import type { WalkthroughResponse } from "@/components/ai/overlays/blocks/types"

const balansrakningScenario: WalkthroughResponse = {
    mode: "fixed",
    title: "Balansräkning",
    subtitle: "Rapport per 2026-03-31",
    blocks: [
        {
            type: "heading",
            props: {
                text: "Summering av Tillgångar",
                level: 2,
            }
        },
        {
            type: "key-value",
            props: {
                items: [
                    { label: "Kassa och Bank", value: "650 000 kr" },
                    { label: "Kundfordringar", value: "100 000 kr" },
                    { label: "Inventarier", value: "100 000 kr" },
                ]
            }
        },
        {
            type: "heading",
            props: {
                text: "Summering av Skulder och Eget Kapital",
                level: 2,
            }
        },
        {
            type: "key-value",
            props: {
                items: [
                    { label: "Kortfristiga skulder", value: "150 000 kr" },
                    { label: "Långfristiga skulder", value: "200 000 kr" },
                    { label: "Aktiekapital", value: "25 000 kr" },
                    { label: "Balanserat resultat", value: "475 000 kr" },
                ]
            }
        },
        {
            type: "action-bar",
            props: {
                actions: [
                    { label: "Bokför som PDF", variant: "default" },
                    { label: "Stäng", variant: "outline" }
                ]
            }
        }
    ]
}

export default function TestBalansrakningWalkthroughPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link
                    href="/test-ui/ai-overlays"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Alla Walkthroughs
                </Link>

                <ScoobyPresentation
                    message="Här är balansräkningen per 2026-03-31. Skulder minskade 10% efter amortering."
                    highlights={[
                        { label: "Tillgångar", value: "850 000 kr", detail: "Ingen märkbar förändring" },
                        { label: "Skulder", value: "350 000 kr", detail: "-10% amortering lån" },
                        { label: "Eget kapital", value: "500 000 kr", detail: "+14 000 kr (Q1 vinst)" },
                    ]}
                />
            </div>

            <WalkthroughRenderer
                response={balansrakningScenario}
                onClose={() => {}}
                embedded
            />
        </div>
    )
}
