"use client"

import { useState } from "react"
import { PageHeader } from "@/components/shared"
import { useDividendLogic } from "./use-dividend-logic"
import type { DividendDecision } from "./types"
import { UtdelningStats } from "./utdelning-stats"
import { RulesCard } from "./rules-card"
import { DividendCalculator } from "./dividend-calculator"
import { UtdelningsTable } from "./dividend-table"
import { UtdelningsaviPreviewDialog } from "../dialogs/utdelningsavi-preview"

export function UtdelningContent() {
    const {
        stats,
        k10Data,
        realDividendHistory,
        bookDividend,
    } = useDividendLogic()
    const [previewDividend, setPreviewDividend] = useState<DividendDecision | null>(null)

    return (
        <div className="space-y-6">
            <PageHeader
                title="Utdelning"
                subtitle="Planera, besluta och bokför utdelning till aktieägare."
            />

            <UtdelningStats stats={stats} />

            <RulesCard />

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <h2 className="font-medium mb-3">Utdelningshistorik</h2>
                    <UtdelningsTable
                        data={realDividendHistory}
                        onBook={(div) => bookDividend(div.meetingId, div.decisionId)}
                        onDownloadReceipt={setPreviewDividend}
                    />
                </div>
                <div className="shrink-0 lg:w-72">
                    <DividendCalculator k10Data={k10Data} />
                </div>
            </div>

            <UtdelningsaviPreviewDialog
                open={!!previewDividend}
                onOpenChange={(open) => { if (!open) setPreviewDividend(null) }}
                dividend={previewDividend}
            />
        </div>
    )
}
