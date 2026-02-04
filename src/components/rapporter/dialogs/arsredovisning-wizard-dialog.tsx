"use client"

import { AIWizardDialog } from "./ai-wizard-dialog"
import { formatNumber } from "@/lib/utils"

export interface ArsredovisningWizardData {
    fiscalYear: number
    fiscalYearRange: string
    deadline: string
    companyType: string
    financials: {
        revenue: number
        netIncome: number
        totalAssets: number
    }
}

interface ArsredovisningWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm?: () => void
    data?: ArsredovisningWizardData
}

// Default data when none provided
function getDefaultData(): ArsredovisningWizardData {
    const currentYear = new Date().getFullYear()
    const fiscalYear = currentYear - 1
    return {
        fiscalYear,
        fiscalYearRange: `${fiscalYear}-01-01 – ${fiscalYear}-12-31`,
        deadline: `30 jun ${currentYear}`,
        companyType: "Aktiebolag",
        financials: {
            revenue: 0,
            netIncome: 0,
            totalAssets: 0,
        },
    }
}

export function ArsredovisningWizardDialog({ open, onOpenChange, onConfirm, data }: ArsredovisningWizardDialogProps) {
    const reportData = data || getDefaultData()

    const handleConfirm = async () => {
        try {
            const response = await fetch('/api/reports/annual-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fiscalYear: reportData.fiscalYear,
                    data: reportData,
                    status: 'draft',
                }),
            })

            if (response.ok) {
                onConfirm?.()
            }
        } catch (err) {
            console.error("Failed to save annual report:", err)
        }
    }

    return (
        <AIWizardDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={handleConfirm}
            step1={{
                title: "Välj räkenskapsår",
                periodLabel: `Räkenskapsår ${reportData.fiscalYear}`,
                periodSubtitle: reportData.fiscalYearRange,
                deadlineLabel: "Deadline",
                deadline: reportData.deadline,
                icon: <span className="text-primary">🏢</span>,
                summaryItems: [
                    { label: "Nettoomsättning", value: `${formatNumber(reportData.financials.revenue)} kr` },
                    { label: "Årets resultat", value: `${formatNumber(reportData.financials.netIncome)} kr` },
                    { label: "Balansomslutning", value: `${formatNumber(reportData.financials.totalAssets)} kr` },
                ],
            }}
            step2={{
                initialPrompt: "Finns det något speciellt som ska med i årsredovisningen?",
                promptHint: "T.ex. väsentliga händelser, personalförändringar, framtidsutsikter",
                responseHandler: (msg) => {
                    const lower = msg.toLowerCase()
                    if (lower.includes("händelse") || lower.includes("väsentlig")) {
                        return "Förstått! Jag lägger till detta under Väsentliga händelser i förvaltningsberättelsen."
                    }
                    if (lower.includes("personal") || lower.includes("anställd")) {
                        return "Noterat! Jag uppdaterar personalnoten med den informationen."
                    }
                    return "Jag har noterat det. Finns det något mer att ta med i förvaltningsberättelsen?"
                },
            }}
            step3={{
                title: `Årsredovisning ${reportData.fiscalYear}`,
                subtitle: "K2-regelverk",
                icon: <span>🏢</span>,
                summaryRows: [
                    { label: "Nettoomsättning", value: `${formatNumber(reportData.financials.revenue)} kr` },
                    { label: "Årets resultat", value: `${formatNumber(reportData.financials.netIncome)} kr` },
                    { label: "Balansomslutning", value: `${formatNumber(reportData.financials.totalAssets)} kr` },
                ],
                resultLabel: "Årets resultat",
                resultValue: `${formatNumber(reportData.financials.netIncome)} kr`,
                generatedParts: ["Förvaltningsberättelse", "Resultaträkning", "Balansräkning", "Noter"],
            }}
        />
    )
}
