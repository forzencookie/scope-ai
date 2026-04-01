"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WalkthroughRenderer } from "@/components/ai/blocks/block-renderer"
import type { WalkthroughResponse } from "@/components/ai/blocks/types"

const balansrakningScenario: WalkthroughResponse = {
    mode: "fixed",
    title: "Balansräkning",
    subtitle: "Rapport per 2026-03-31",
    blocks: [
        {
            type: "stat-cards",
            props: {
                items: [
                    { label: "Tillgångar", value: "850 000 kr", change: "Ingen märkbar förändring", trend: "neutral", icon: "plus-circle", iconColor: "emerald", valueColor: "default" },
                    { label: "Skulder", value: "350 000 kr", change: "-10% amortering lån", trend: "down", icon: "minus-circle", iconColor: "amber", valueColor: "red" },
                    { label: "Eget kapital", value: "500 000 kr", change: "+14 000 kr (Q1 vinst)", trend: "up", icon: "banknote", iconColor: "blue", valueColor: "green" },
                ]
            }
        },
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
            <div className="max-w-3xl mx-auto px-6 pt-6 flex items-center justify-between z-10 relative">
                <Link
                    href="/test-ui/walkthroughs"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Alla Walkthroughs
                </Link>
            </div>

            <WalkthroughRenderer
                response={balansrakningScenario}
                onClose={() => {}}
                embedded
            />
        </div>
    )
}
