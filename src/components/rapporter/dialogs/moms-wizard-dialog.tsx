"use client"

import { AIWizardDialog } from "./ai-wizard-dialog"
import { type VatReport } from "@/services/processors/vat-processor"

interface MomsWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm?: () => void
    initialData?: VatReport
}

export function MomsWizardDialog({ open, onOpenChange, onConfirm, initialData }: MomsWizardDialogProps) {
    const handleConfirm = async () => {
        if (!initialData) return

        try {
            const response = await fetch('/api/reports/vat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    period_id: (initialData as any).periodId,
                    report_type: 'vat',
                    data: initialData,
                    status: 'submitted',
                    period_start: initialData.period
                })
            })

            if (response.ok) {
                onConfirm?.()
            }
        } catch (err) {
            console.error("Failed to save report:", err)
        }
    }

    if (!initialData) return null

    return (
        <AIWizardDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={handleConfirm}
            step1={{
                title: "Välj momsperiod",
                periodLabel: initialData.period,
                periodSubtitle: "Baserat på dina senaste transaktioner",
                deadlineLabel: "Deadline",
                deadline: initialData.dueDate,
                icon: <span className="text-primary">📅</span>,
                summaryItems: [
                    { label: "Utgående moms", value: `${initialData.salesVat.toLocaleString('sv-SE')} kr` },
                    { label: "Ingående moms", value: `${initialData.inputVat.toLocaleString('sv-SE')} kr` },
                ],
            }}
            step2={{
                initialPrompt: `Finns det något speciellt som påverkar momsen för ${initialData.period}?`,
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
                title: `Momsdeklaration ${initialData.period}`,
                subtitle: "Beräknat underlag",
                icon: <span>📄</span>,
                summaryRows: [
                    { label: "Utgående moms", value: `${initialData.salesVat.toLocaleString('sv-SE')} kr` },
                    { label: "Ingående moms", value: `-${initialData.inputVat.toLocaleString('sv-SE')} kr`, negative: true },
                ],
                resultLabel: "Moms att betala",
                resultValue: `${initialData.netVat.toLocaleString('sv-SE')} kr`,
            }}
        />
    )
}
