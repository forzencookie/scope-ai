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
        title: "Företagsstatistik",
        subtitle: "Scope Consulting AB · Januari–April 2026",
        blocks: [
            { type: "heading", props: { text: "Nyckeltal — 2026 hittills", level: 2 } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Omsättning YTD", value: "1 248 000 kr" },
                        { label: "Rörelsekostnader YTD", value: "742 000 kr" },
                        { label: "Rörelseresultat YTD", value: "506 000 kr" },
                        { label: "Rörelsemarginal", value: "40.5%" },
                        { label: "Likvida medel", value: "387 500 kr" },
                        { label: "Utestående fakturor", value: "187 500 kr" },
                    ],
                },
            },
            { type: "heading", props: { text: "Intäkter per månad", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Månad", icon: "calendar" },
                        { label: "Intäkter", icon: "banknote" },
                        { label: "Kostnader", icon: "banknote", color: "muted" as const },
                        { label: "Resultat", icon: "banknote" },
                        { label: "Marginal", icon: "tag" },
                    ],
                    rows: [
                        { Månad: "Januari", Intäkter: "287 500 kr", Kostnader: "181 000 kr", Resultat: "106 500 kr", Marginal: "37%" },
                        { Månad: "Februari", Intäkter: "312 500 kr", Kostnader: "190 000 kr", Resultat: "122 500 kr", Marginal: "39%" },
                        { Månad: "Mars", Intäkter: "325 000 kr", Kostnader: "178 000 kr", Resultat: "147 000 kr", Marginal: "45%" },
                        { Månad: "April", Intäkter: "323 000 kr", Kostnader: "193 000 kr", Resultat: "130 000 kr", Marginal: "40%" },
                    ],
                    totals: { Månad: "Totalt", Intäkter: "1 248 000 kr", Kostnader: "742 000 kr", Resultat: "506 000 kr", Marginal: "40.5%" },
                },
            },
            { type: "heading", props: { text: "Jämförelse med föregående år", level: 2 } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Omsättning jan–apr 2025", value: "987 500 kr" },
                        { label: "Omsättning jan–apr 2026", value: "1 248 000 kr" },
                        { label: "Tillväxt", value: "+26.4%" },
                        { label: "Marginal 2025", value: "34.2%" },
                        { label: "Marginal 2026", value: "40.5%" },
                        { label: "Marginalförbättring", value: "+6.3 pp" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Exportera rapport", variant: "default", actionId: "export-stats" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestForetagsstatistikPage() {
    const walkthrough = useMemo(() => buildWalkthrough(), [])
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link href="/test-ui/ai-overlays" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Overlays
                </Link>
                <ScoobyPresentation
                    message="Omsättning 1 248 000 kr hittills i år — upp 26% mot samma period 2025. Marginal 40.5%."
                    highlights={[
                        { label: "Omsättning YTD", value: "1 248 000 kr", detail: "Jan–Apr 2026" },
                        { label: "Rörelseresultat", value: "506 000 kr", detail: "Marginal 40.5%" },
                        { label: "Tillväxt YoY", value: "+26.4%", detail: "Vs 2025" },
                    ]}
                />
            </div>
            <WalkthroughRenderer response={walkthrough} onClose={() => {}} embedded />
        </div>
    )
}
