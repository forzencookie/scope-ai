"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WalkthroughRenderer } from "@/components/ai/blocks/block-renderer"
import type { WalkthroughResponse } from "@/components/ai/blocks/types"

const resultatrakningScenario: WalkthroughResponse = {
    mode: "fixed",
    title: "Resultaträkning",
    subtitle: "Rapport för Q1 2026",
    blocks: [
        {
            type: "stat-cards",
            props: {
                items: [
                    { label: "Intäkter", value: "450 000 kr", change: "+15% från Q4", trend: "up", icon: "wallet", iconColor: "emerald", valueColor: "default" },
                    { label: "Kostnader", value: "210 000 kr", change: "+2% från Q4", trend: "up", icon: "receipt", iconColor: "red", valueColor: "red" },
                    { label: "Rörelseresultat", value: "240 000 kr", change: "+29% från Q4", trend: "up", icon: "banknote", iconColor: "blue", valueColor: "green" },
                ]
            }
        },
        {
            type: "financial-table",
            props: {
                columns: [
                    { label: "Konto", icon: "file-text" },
                    { label: "Benämning", icon: "tag", color: "muted" },
                    { label: "Belopp", icon: "banknote", color: "default" },
                ],
                rows: [
                    { Konto: "3001", Benämning: "Försäljning tjänster (inom SE)", Belopp: "350 000 kr" },
                    { Konto: "3002", Benämning: "Försäljning varor (inom SE)", Belopp: "100 000 kr" },
                    { Konto: "5010", Benämning: "Lokalhyra", Belopp: "-60 000 kr" },
                    { Konto: "5420", Benämning: "Programvaror", Belopp: "-20 000 kr" },
                    { Konto: "7010", Benämning: "Löner", Belopp: "-130 000 kr" },
                ],
                totals: { Konto: "Resultat", Benämning: "", Belopp: "240 000 kr" }
            }
        },
        {
            type: "action-bar",
            props: {
                actions: [
                    { label: "Bokför som PDF i Arkiv", variant: "default" },
                    { label: "Stäng", variant: "outline" }
                ]
            }
        }
    ]
}

export default function TestResultatrakningWalkthroughPage() {
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
                response={resultatrakningScenario}
                onClose={() => {}}
                embedded
            />
        </div>
    )
}
