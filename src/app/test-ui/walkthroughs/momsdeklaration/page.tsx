"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WalkthroughOverlay } from "@/components/ai/walkthrough-overlay"
import type { WalkthroughContent } from "@/components/ai/walkthrough-overlay"

const documentScenario: WalkthroughContent = {
    title: "Momsdeklaration Q1 2026",
    summary: "Baserat på dina transaktioner verkar allt stämma. Jag har fyllt i de relevanta fälten.",
    sections: [
        {
            heading: "Momspliktig försäljning (Ruta 05)",
            description: "Försäljning inom Sverige exklusive moms.",
            amount: "150 000 kr",
            sourceRows: [
                { label: "Faktura 1001 - Acme Corp", value: "50 000 kr" },
                { label: "Faktura 1002 - Beta AB", value: "100 000 kr" }
            ]
        },
        {
            heading: "Utgående moms (Ruta 10)",
            description: "Moms att betala på din försäljning (25%).",
            amount: "37 500 kr",
            amountColor: "red",
        },
        {
            heading: "Ingående moms (Ruta 48)",
            description: "Moms att få tillbaka från dina inköp.",
            amount: "12 500 kr",
            amountColor: "green",
            sourceRows: [
                { label: "Apple Store - Dator", value: "5 000 kr" },
                { label: "Office Depot - Kontorsmaterial", value: "1 500 kr" },
                { label: "SJ - Resor", value: "6 000 kr" }
            ]
        }
    ],
    result: {
        heading: "Moms att betala (Ruta 49)",
        amount: "25 000 kr",
        amountColor: "red",
        breakdown: [
            "Utgående moms: 37 500 kr",
            "Ingående moms: -12 500 kr",
            "Att betala: 25 000 kr"
        ]
    }
}

export default function TestMomsdeklarationWalkthroughPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 flex items-center justify-between">
                <Link
                    href="/test-ui/walkthroughs"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Alla Walkthroughs
                </Link>
            </div>

            <WalkthroughOverlay
                content={documentScenario}
                onClose={() => {}}
                embedded
            />
        </div>
    )
}
