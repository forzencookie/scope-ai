"use client"

import { AIWizardDialog } from "./ai-wizard-dialog"
import { formatNumber } from "@/lib/utils"

export interface InkomstWizardData {
    taxYear: number
    deadline: string
    incomeStatement: {
        revenue: number
        expenses: number
        netIncome: number
    }
    taxAdjustments: {
        adjustments: number
        taxableIncome: number
        estimatedTax: number
    }
}

interface InkomstWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm?: () => void
    data?: InkomstWizardData
}

// Default data when none provided
function getDefaultData(): InkomstWizardData {
    const currentYear = new Date().getFullYear()
    return {
        taxYear: currentYear - 1,
        deadline: `1 jul ${currentYear}`,
        incomeStatement: {
            revenue: 0,
            expenses: 0,
            netIncome: 0,
        },
        taxAdjustments: {
            adjustments: 0,
            taxableIncome: 0,
            estimatedTax: 0,
        },
    }
}

export function InkomstWizardDialog({ open, onOpenChange, onConfirm, data }: InkomstWizardDialogProps) {
    const reportData = data || getDefaultData()

    const handleConfirm = async () => {
        try {
            const response = await fetch('/api/reports/income-declaration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taxYear: reportData.taxYear,
                    data: reportData,
                    status: 'draft',
                }),
            })

            if (response.ok) {
                onConfirm?.()
            }
        } catch (err) {
            console.error("Failed to save income declaration:", err)
        }
    }

    return (
        <AIWizardDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={handleConfirm}
            step1={{
                title: "Välj beskattningsår",
                periodLabel: `Inkomstår ${reportData.taxYear}`,
                periodSubtitle: "INK2 - Aktiebolag",
                deadlineLabel: "Deadline",
                deadline: reportData.deadline,
                icon: <span className="text-primary">📅</span>,
                summaryItems: [
                    { label: "Rörelseintäkter", value: `${formatNumber(reportData.incomeStatement.revenue)} kr` },
                    { label: "Rörelsekostnader", value: `${formatNumber(-reportData.incomeStatement.expenses)} kr` },
                    { label: "Bokfört resultat", value: `${formatNumber(reportData.incomeStatement.netIncome)} kr` },
                ],
            }}
            step2={{
                initialPrompt: "Finns det något speciellt som påverkar inkomstdeklarationen?",
                promptHint: "T.ex. skattemässiga justeringar, underskott att rulla, särskilda avdrag",
                responseHandler: (msg) => {
                    const lower = msg.toLowerCase()
                    if (lower.includes("avskrivning") || lower.includes("inventarier")) {
                        return "Förstått! Jag har justerat avskrivningar enligt bokföringen."
                    }
                    if (lower.includes("underskott") || lower.includes("förlust")) {
                        return "Noterat! Underskottet kommer att rullas framåt enligt reglerna."
                    }
                    return "Jag har noterat det. Finns det något mer som påverkar deklarationen?"
                },
            }}
            step3={{
                title: `INK2 - Inkomstår ${reportData.taxYear}`,
                subtitle: "Aktiebolag",
                icon: <span>📄</span>,
                summaryRows: [
                    { label: "Rörelseresultat", value: `${formatNumber(reportData.incomeStatement.netIncome)} kr` },
                    { label: "Skattemässiga justeringar", value: `${formatNumber(reportData.taxAdjustments.adjustments)} kr` },
                    { label: "Beräknad skatt (20,6%)", value: `${formatNumber(reportData.taxAdjustments.estimatedTax)} kr` },
                ],
                resultLabel: "Skattemässigt resultat",
                resultValue: `${formatNumber(reportData.taxAdjustments.taxableIncome)} kr`,
            }}
        />
    )
}
