"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WalkthroughOverlay } from "@/components/ai/walkthrough-overlay"
import type { WalkthroughContent } from "@/components/ai/walkthrough-overlay"

const auditScenario: WalkthroughContent = {
    title: "Balans- och Rimlighetskontroll",
    date: "1 april 2026",
    aiComment: "Jag har granskat din bokföring inför bokslutet. Det finns ett par avvikelser du bör kika på. Kassakontot lyser rött eftersom det är negativt, vilket i teorin är omöjligt.",
    sections: [
        {
            heading: "Debet och Kredit balanserar",
            description: "Summan av debet är lika med summan av kredit i huvudboken.",
            status: "pass",
            details: "Total debet: 1 250 000 kr = Total kredit: 1 250 000 kr"
        },
        {
            heading: "Bankkonto (1930) stäms av",
            description: "Saldot på bankkontot matchar senaste tillgängliga kontoutdrag, med en liten tidsmässig diskrepans.",
            status: "warning",
            details: "Bokfört: 540 200 kr | Saldo: 540 800 kr"
        },
        {
            heading: "Kassakonto (1910) är positivt",
            description: "Ett kassakonto kan inte ha ett negativt saldo (kredit).",
            status: "fail",
            details: "Nuvarande saldo: -4 500 kr"
        }
    ],
    actions: [
        { label: "Låt Scooby föreslå rättelser", variant: "default" },
        { label: "Åtgärda manuellt", variant: "outline" }
    ]
}

export default function TestBalanskontrollWalkthroughPage() {
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
                content={auditScenario}
                onClose={() => {}}
                embedded
            />
        </div>
    )
}
