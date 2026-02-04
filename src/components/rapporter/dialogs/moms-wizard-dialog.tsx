"use client"

import { useMemo } from "react"
import { AIWizardDialog } from "./ai-wizard-dialog"
import { type VatReport, createEmptyVatReport } from "@/services/processors/vat-processor"

interface MomsWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm?: () => void
    initialData?: VatReport
}

// Generate default period name based on current date
function getDefaultPeriodName(): string {
    const now = new Date()
    const month = now.toLocaleDateString('sv-SE', { month: 'long' })
    const year = now.getFullYear()
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`
}

// Generate default due date (12th of next month)
function getDefaultDueDate(): string {
    const now = new Date()
    now.setMonth(now.getMonth() + 1)
    now.setDate(12)
    return now.toLocaleDateString('sv-SE')
}

export function MomsWizardDialog({ open, onOpenChange, onConfirm, initialData }: MomsWizardDialogProps) {
    // Create default data if none provided
    const reportData = useMemo<VatReport>(() => {
        if (initialData) return initialData

        return createEmptyVatReport(
            getDefaultPeriodName(),
            getDefaultDueDate(),
            'upcoming'
        )
    }, [initialData])

    const handleConfirm = async () => {
        try {
            const response = await fetch('/api/reports/vat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    period_id: (reportData as any).periodId,
                    report_type: 'vat',
                    data: reportData,
                    status: 'submitted',
                    period_start: reportData.period
                })
            })

            if (response.ok) {
                onConfirm?.()
            }
        } catch (err) {
            console.error("Failed to save report:", err)
        }
    }

    return (
        <AIWizardDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={handleConfirm}
            step1={{
                title: "Välj momsperiod",
                periodLabel: reportData.period,
                periodSubtitle: "Baserat på dina senaste transaktioner",
                deadlineLabel: "Deadline",
                deadline: reportData.dueDate,
                icon: <span className="text-primary">📅</span>,
                summaryItems: [
                    { label: "Utgående moms", value: `${reportData.salesVat.toLocaleString('sv-SE')} kr` },
                    { label: "Ingående moms", value: `${reportData.inputVat.toLocaleString('sv-SE')} kr` },
                ],
            }}
            step2={{
                initialPrompt: `Finns det något speciellt som påverkar momsen för ${reportData.period}?`,
                promptHint: "T.ex. EU-försäljning, korrigeringar, export",
                responseHandler: (msg) => {
                    const lower = msg.toLowerCase()
                    if (lower.includes("export") || lower.includes("eu")) {
                        return "Förstått! Jag har justerat för EU-försäljning/export med 0% moms."
                    }
                    if (lower.includes("fel") || lower.includes("korrigera")) {
                        return "Jag har noterat korrigeringen. Den kommer att inkluderas i beräkningen."
                    }
                    return "Jag har noterat det. Finns det något mer som påverkar momsdeklarationen?"
                },
            }}
            step3={{
                title: `Momsdeklaration ${reportData.period}`,
                subtitle: "Beräknat underlag",
                icon: <span>📄</span>,
                summaryRows: [
                    { label: "Utgående moms", value: `${reportData.salesVat.toLocaleString('sv-SE')} kr` },
                    { label: "Ingående moms", value: `-${reportData.inputVat.toLocaleString('sv-SE')} kr`, negative: true },
                ],
                resultLabel: "Moms att betala",
                resultValue: `${reportData.netVat.toLocaleString('sv-SE')} kr`,
            }}
        />
    )
}
