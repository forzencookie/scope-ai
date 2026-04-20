"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WalkthroughRenderer } from "@/components/ai/overlays/blocks/block-renderer"
import { ScoobyPresentation } from "@/components/ai/scooby-presentation"
import type { WalkthroughResponse } from "@/components/ai/overlays/blocks/types"

/**
 * Test page: Momsdeklaration as a walkthrough
 *
 * Rebuilt to use WalkthroughRenderer (block-based) instead of the old
 * WalkthroughOverlay. Matches the standard set by AGI, K10, INK2, etc.
 *
 * Shows provenance: each VAT field traces back to invoices/purchases
 * in the bookkeeping. The user sees exactly which transactions produced
 * each number on the declaration.
 */

function fmt(n: number): string {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr"
}

const momsWalkthrough: WalkthroughResponse = {
    mode: "fixed",
    title: "Momsdeklaration Q1 2026",
    subtitle: "Redovisningsperiod jan–mar · Skatteverket",
    blocks: [
        // === MOMSPLIKTIG FÖRSÄLJNING ===
        {
            type: "heading",
            props: {
                text: "Momspliktig försäljning (Ruta 05)",
                level: 2,
                subtitle: `Försäljning inom Sverige exklusive moms — ${fmt(150000)}`,
            },
        },
        {
            type: "collapsed-group",
            props: {
                label: "Kundfakturor — konto 3001",
                count: 2,
                defaultOpen: false,
                children: [
                    {
                        type: "financial-table",
                        props: {
                            columns: [
                                { label: "Verifikation", icon: "hash", width: 0.6 },
                                { label: "Kund", icon: "user", width: 1.2 },
                                { label: "Datum", icon: "calendar", color: "muted" as const, width: 0.8 },
                                { label: "Belopp (exkl. moms)", icon: "banknote", width: 1 },
                            ],
                            variant: "compact",
                            rows: [
                                { Verifikation: "A03", Kund: "Acme Corp", Datum: "2026-01-15", "Belopp (exkl. moms)": fmt(50000) },
                                { Verifikation: "A09", Kund: "Beta AB", Datum: "2026-02-20", "Belopp (exkl. moms)": fmt(100000) },
                            ],
                            rowMeta: [
                                { href: "/dashboard/bokforing?verifikation=A03" },
                                { href: "/dashboard/bokforing?verifikation=A09" },
                            ],
                            totals: {
                                Verifikation: "",
                                Kund: "Ruta 05",
                                Datum: "",
                                "Belopp (exkl. moms)": fmt(150000),
                            },
                        },
                    },
                ],
            },
        },

        // === UTGÅENDE MOMS ===
        {
            type: "heading",
            props: {
                text: "Utgående moms 25% (Ruta 10)",
                level: 2,
                subtitle: "Moms att betala på din försäljning",
            },
        },
        {
            type: "key-value",
            props: {
                items: [
                    { label: "Momspliktig försäljning (Ruta 05)", value: fmt(150000) },
                    { label: "Momssats", value: "25%" },
                    { label: "Utgående moms (Ruta 10)", value: fmt(37500) },
                ],
            },
        },

        // === INGÅENDE MOMS ===
        {
            type: "heading",
            props: {
                text: "Ingående moms (Ruta 48)",
                level: 2,
                subtitle: `Moms att dra av från dina inköp — ${fmt(12500)}`,
            },
        },
        {
            type: "collapsed-group",
            props: {
                label: "Leverantörsfakturor — konto 2641",
                count: 3,
                defaultOpen: false,
                children: [
                    {
                        type: "financial-table",
                        props: {
                            columns: [
                                { label: "Verifikation", icon: "hash", width: 0.6 },
                                { label: "Leverantör", icon: "user", width: 1.2 },
                                { label: "Beskrivning", icon: "file-text", color: "muted" as const, width: 1.2 },
                                { label: "Moms", icon: "banknote", color: "green" as const, width: 0.8 },
                            ],
                            variant: "compact",
                            rows: [
                                { Verifikation: "A05", Leverantör: "Apple Store", Beskrivning: "MacBook Pro", Moms: fmt(5000) },
                                { Verifikation: "A11", Leverantör: "Office Depot", Beskrivning: "Kontorsmaterial", Moms: fmt(1500) },
                                { Verifikation: "A14", Leverantör: "SJ", Beskrivning: "Tjänsteresor Q1", Moms: fmt(6000) },
                            ],
                            rowMeta: [
                                { href: "/dashboard/bokforing?verifikation=A05" },
                                { href: "/dashboard/bokforing?verifikation=A11" },
                                { href: "/dashboard/bokforing?verifikation=A14" },
                            ],
                            totals: {
                                Verifikation: "",
                                Leverantör: "Ruta 48",
                                Beskrivning: "",
                                Moms: fmt(12500),
                            },
                        },
                    },
                ],
            },
        },

        // === SLUTBERÄKNING ===
        {
            type: "separator",
            props: { label: "Slutberäkning" },
        },
        {
            type: "key-value",
            props: {
                items: [
                    { label: "Utgående moms (Ruta 10)", value: fmt(37500) },
                    { label: "Ingående moms (Ruta 48)", value: `−${fmt(12500)}` },
                    { label: "Moms att betala (Ruta 49)", value: fmt(25000) },
                ],
            },
        },

        // === VALIDATION ===
        {
            type: "status-check",
            props: {
                items: [
                    { label: "Försäljning stämd mot konto 3001", status: "pass", detail: "2 fakturor, totalt 150 000 kr" },
                    { label: "Ingående moms stämd mot konto 2641", status: "pass", detail: "3 verifikationer, totalt 12 500 kr" },
                    { label: "Momsavstämning balanserar", status: "pass", detail: "Utgående − ingående = 25 000 kr" },
                    { label: "Klart för inlämning", status: "pass", detail: "Alla rutor ifyllda" },
                ],
            },
        },

        {
            type: "info-card",
            props: {
                title: "Inlämning & betalning",
                content: "Momsdeklarationen ska lämnas in senast den 12 maj 2026 (kvartalsmoms). Betalning sker till Skatteverkets bankgiro samma dag. Vid sen inlämning tillkommer förseningsavgift.",
                variant: "info",
            },
        },

        {
            type: "action-bar",
            props: {
                actions: [
                    { label: "Godkänn & skicka", variant: "default", actionId: "submit-moms" },
                    { label: "Exportera XML", variant: "outline", actionId: "export-moms-xml" },
                    { label: "Stäng", variant: "outline" },
                ],
            },
        },
    ],
}

export default function TestMomsdeklarationWalkthroughPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link
                    href="/test-ui/ai-overlays"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Walkthroughs & Overlays
                </Link>

                <ScoobyPresentation
                    message="Momsdeklarationen för Q1 är klar. Alla belopp härledda från bokföringens verifikationer."
                    highlights={[
                        { label: "Utgående moms", value: "37 500 kr", detail: "25% på 150 000 kr" },
                        { label: "Ingående moms", value: "12 500 kr", detail: "3 leverantörsfakturor" },
                        { label: "Att betala", value: "25 000 kr", detail: "Senast 12 maj 2026" },
                    ]}
                />
            </div>

            <WalkthroughRenderer
                response={momsWalkthrough}
                onClose={() => {}}
                embedded
            />
        </div>
    )
}
