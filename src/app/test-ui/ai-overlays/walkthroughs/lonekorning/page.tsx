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
        title: "Lönekörning — Mars 2026",
        subtitle: "3 anställda · LK-2026-03-01",
        blocks: [
            {
                type: "heading",
                props: { text: "Lönekörning LK-2026-03-01", level: 2 },
            },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Anställd", icon: "user" },
                        { label: "Bruttolön", icon: "banknote" },
                        { label: "Nettolön", icon: "banknote" },
                        { label: "Arbetsgivaravgift", icon: "banknote" },
                        { label: "Status", icon: "tag" },
                    ],
                    rows: [
                        { Anställd: "Anna Lindberg", Bruttolön: "42 000 kr", Nettolön: "29 525 kr", Arbetsgivaravgift: "13 191 kr", Status: "Godkänd" },
                        { Anställd: "Erik Svensson", Bruttolön: "55 000 kr", Nettolön: "36 410 kr", Arbetsgivaravgift: "17 281 kr", Status: "Godkänd" },
                        { Anställd: "Maria Johansson", Bruttolön: "38 000 kr", Nettolön: "25 446 kr", Arbetsgivaravgift: "11 946 kr", Status: "Godkänd" },
                    ],
                    totals: {
                        Anställd: "Totalt",
                        Bruttolön: "135 000 kr",
                        Nettolön: "91 381 kr",
                        Arbetsgivaravgift: "42 418 kr",
                        Status: "",
                    },
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Exportera lönebesked", variant: "default", actionId: "export-payslips" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestLonekorningPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Lönekörning mars är klar — 3 anställda, total lönekostnad 177 418 kr inkl. arbetsgivaravgift."
                    highlights={[
                        { label: "Total lönekostnad", value: "177 418 kr", detail: "Inkl. arbetsgivaravgift" },
                        { label: "Antal löner", value: "3 st", detail: "Utbetalade mars" },
                        { label: "Status", value: "Godkänd", detail: "Klart för utbetalning" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
