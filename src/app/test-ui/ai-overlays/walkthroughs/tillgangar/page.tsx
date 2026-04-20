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
        title: "Inventarier & Tillgångar",
        subtitle: "Avskrivningsplan 2026",
        blocks: [
            {
                type: "heading",
                props: { text: "Inventarier", level: 2 },
            },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Benämning", icon: "tag" },
                        { label: "Anskaffningsvärde", icon: "banknote" },
                        { label: "Bokfört värde", icon: "banknote" },
                        { label: "Avskrivning/mån", icon: "banknote" },
                        { label: "Restvärde", icon: "banknote" },
                    ],
                    rows: [
                        { Benämning: "MacBook Pro (2024)", Anskaffningsvärde: "31 250 kr", "Bokfört värde": "18 750 kr", "Avskrivning/mån": "521 kr", Restvärde: "0 kr" },
                        { Benämning: "Dell-skärmar ×2", Anskaffningsvärde: "12 000 kr", "Bokfört värde": "8 000 kr", "Avskrivning/mån": "333 kr", Restvärde: "2 000 kr" },
                        { Benämning: "Kontorsmöbler", Anskaffningsvärde: "45 000 kr", "Bokfört värde": "36 000 kr", "Avskrivning/mån": "750 kr", Restvärde: "9 000 kr" },
                        { Benämning: "iPhone 15 Pro", Anskaffningsvärde: "14 990 kr", "Bokfört värde": "8 745 kr", "Avskrivning/mån": "416 kr", Restvärde: "0 kr" },
                    ],
                    totals: {
                        Benämning: "Totalt",
                        Anskaffningsvärde: "103 240 kr",
                        "Bokfört värde": "71 495 kr",
                        "Avskrivning/mån": "2 020 kr",
                        Restvärde: "11 000 kr",
                    },
                },
            },
        ],
    }
}

export default function TestTillgangarPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Här är dina inventarier — 4 st med ett totalt bokfört värde på 71 495 kr."
                    highlights={[
                        { label: "Antal inventarier", value: "4 st", detail: "Aktiva" },
                        { label: "Bokfört värde", value: "71 495 kr", detail: "Per idag" },
                        { label: "Årets avskrivningar", value: "24 000 kr", detail: "2026 hittills" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
